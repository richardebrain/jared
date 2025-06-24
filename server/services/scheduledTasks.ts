import cron from 'node-cron';
import { db } from '../db';
import { eceReportingSettings, eceHours, users, schools } from '@shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { sendEceMonthlyReport } from '../routes.js';

export class ScheduledTaskService {
  private static instance: ScheduledTaskService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ScheduledTaskService {
    if (!ScheduledTaskService.instance) {
      ScheduledTaskService.instance = new ScheduledTaskService();
    }
    return ScheduledTaskService.instance;
  }

  public async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('🕐 Initializing scheduled tasks...');

    // Schedule monthly ECE reports - run on the 1st of each month at 9:00 AM
    cron.schedule('0 9 1 * *', async () => {
      console.log('📅 Running scheduled monthly ECE report task...');
      await this.sendMonthlyEceReports();
    }, {
      timezone: "America/New_York" // Adjust timezone as needed
    });

    // Also schedule for the 15th of each month as a backup
    cron.schedule('0 9 15 * *', async () => {
      console.log('📅 Running backup monthly ECE report task...');
      await this.sendMonthlyEceReports();
    }, {
      timezone: "America/New_York"
    });

    this.isInitialized = true;
    console.log('✅ Scheduled tasks initialized');
  }

  private async sendMonthlyEceReports() {
    try {
      console.log('📊 Starting monthly ECE report generation...');

      // Get all schools with active ECE reporting settings
      const activeSettings = await db.select().from(eceReportingSettings)
        .where(eq(eceReportingSettings.isActive, true));

      console.log(`Found ${activeSettings.length} schools with active ECE reporting`);

      for (const settings of activeSettings) {
        try {
          await this.sendReportForSchool(settings);
        } catch (error) {
          console.error(`❌ Failed to send report for school ${settings.schoolId}:`, error);
          // Continue with other schools even if one fails
        }
      }

      console.log('✅ Monthly ECE report task completed');
    } catch (error) {
      console.error('❌ Error in monthly ECE report task:', error);
    }
  }

  private async sendReportForSchool(settings: any) {
    console.log(`📧 Processing school ${settings.schoolId}...`);

    // Get school name
    const [school] = await db.select().from(schools)
      .where(eq(schools.id, settings.schoolId));

    if (!school) {
      console.log(`⚠️  School ${settings.schoolId} not found, skipping...`);
      return;
    }

    // Calculate date range for previous month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59);

    // Get all employees in the school
    const employees = await db.select().from(users)
      .where(eq(users.schoolId, settings.schoolId))
      .orderBy(users.firstName, users.lastName);

    console.log(`Found ${employees.length} employees in school ${school.name}`);

    // Get ECE hours for each employee for the previous month
    const employeeTrainingData = await Promise.all(employees.map(async (employee) => {
      // Get ECE hours for the previous month
      const monthlyHours = await db.select().from(eceHours)
        .where(
          and(
            eq(eceHours.userId, employee.id),
            sql`${eceHours.completedAt} >= ${startOfMonth.toISOString()}`,
            sql`${eceHours.completedAt} <= ${endOfMonth.toISOString()}`
          )
        )
        .orderBy(desc(eceHours.completedAt));

      // Group hours by category
      const hoursByCategory = monthlyHours.reduce((acc, hour) => {
        const category = hour.category;
        const durationHours = hour.duration / 60; // Convert minutes to hours
        acc[category] = (acc[category] || 0) + durationHours;
        return acc;
      }, {} as Record<string, number>);

      // Calculate total hours this month
      const totalHoursThisMonth = monthlyHours.reduce((sum, h) => sum + (h.duration / 60), 0);

      // Get total hours for the year (from employee's renewal period)
      const renewalDate = employee.eceHoursRenewalDate || employee.lastActive || employee.createdAt;
      const renewalYear = new Date(renewalDate);
      let periodStart = new Date(renewalYear);
      let periodEnd = new Date(renewalYear);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);

      // If we're past the renewal date, move to current cycle
      while (periodEnd < currentDate) {
        periodStart.setFullYear(periodStart.getFullYear() + 1);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const yearlyHours = await db.select().from(eceHours)
        .where(
          and(
            eq(eceHours.userId, employee.id),
            sql`${eceHours.completedAt} >= ${periodStart.toISOString()}`,
            sql`${eceHours.completedAt} <= ${periodEnd.toISOString()}`
          )
        );

      const totalYearlyHours = yearlyHours.reduce((sum, h) => sum + (h.duration / 60), 0);

      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        hoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
        totalHours: Math.round(totalYearlyHours * 10) / 10,
        categories: Object.keys(hoursByCategory),
        hoursByCategory,
        monthlyTrainings: monthlyHours.map(h => ({
          title: h.trainingTitle,
          category: h.category,
          hours: Math.round((h.duration / 60) * 10) / 10,
          completedAt: h.completedAt?.toISOString().split('T')[0]
        }))
      };
    }));

    // Filter out employees with no training this month
    const employeesWithTraining = employeeTrainingData.filter(emp => emp.hoursThisMonth > 0);

    console.log(`${employeesWithTraining.length} employees had training in the previous month`);

    // Generate report period string
    const reportPeriod = startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Send the monthly report
    const emailSent = await sendEceMonthlyReport(
      settings.reportingEmails,
      school.name,
      reportPeriod,
      employeesWithTraining,
      false // Not a test email
    );

    if (emailSent) {
      // Update last report sent timestamp
      await db.update(eceReportingSettings)
        .set({ lastReportSent: new Date() } as any)
        .where(eq(eceReportingSettings.id, settings.id));

      console.log(`✅ Monthly report sent for ${school.name} to ${settings.reportingEmails.length} recipient(s)`);
    } else {
      console.error(`❌ Failed to send monthly report for ${school.name}`);
    }
  }

  // Manual trigger for testing
  public async triggerMonthlyReport() {
    console.log('🔧 Manually triggering monthly ECE report...');
    await this.sendMonthlyEceReports();
  }
}

// Export singleton instance
export const scheduledTaskService = ScheduledTaskService.getInstance(); 