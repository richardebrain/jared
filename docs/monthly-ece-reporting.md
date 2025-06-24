# Monthly ECE Reporting System

## Overview

The Monthly ECE Reporting System automatically generates and sends email reports of all ECE (Early Childhood Education) hours and trainings completed by teachers each month. This allows schools to easily track and report continuing education hours to state licensing authorities.

## Features

### 📧 Automated Email Reports
- **Monthly Reports**: Automatically sent on the 1st and 15th of each month
- **Customizable Recipients**: Multiple email addresses can receive reports
- **Professional Formatting**: Clean, readable HTML email format
- **Test Mode**: Send test reports to verify configuration

### 📊 Comprehensive Data Tracking
- **Individual Teacher Reports**: Shows each teacher's hours by category
- **Monthly Summary**: Total hours completed this month
- **Year-to-Date Totals**: Cumulative hours for the reporting period
- **Category Breakdown**: Hours organized by ECE categories (health & safety, classroom management, etc.)

### ⚙️ Flexible Configuration
- **Email Settings**: Configure recipient emails and frequency
- **School-Specific**: Each school can have its own reporting settings
- **Active/Inactive Toggle**: Enable or disable automatic reporting
- **Manual Triggers**: Send reports on-demand for testing

## Email Report Format

The monthly reports include:

### Summary Statistics
- Total teachers with training this month
- Total hours completed this month
- Year-to-date total hours

### Individual Teacher Reports
Each teacher's section shows:
```
Emma Boyajian
This month: 0.5 hours in Health & Safety, 1.5 hours in Classroom Management
Total this month: 2.0 hours | YTD Total: 15.5 hours
```

### ECE Categories Tracked
- Social-Emotional Development
- Cognitive Development
- Physical Development
- Communication
- Adaptive Skills
- Health & Safety
- Family Engagement
- Professional Development

## Setup Instructions

### 1. Configure Email Settings

1. Navigate to **ECE Hours Tracker** → **Email Settings** tab
2. Add recipient email addresses (state licensing authorities, directors, etc.)
3. Choose report frequency (monthly/quarterly)
4. Enable email reports
5. Save settings

### 2. Configure SendGrid (Email Service)

Add your SendGrid API key to environment variables:
```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### 3. Test the System

1. Click **"Send Test Report"** to verify email configuration
2. Click **"Send Monthly Report"** to send a real report with current data
3. Verify emails are received by all configured recipients

## API Endpoints

### Send Monthly Report
```http
POST /api/school/ece-monthly-report
```
Sends the monthly ECE report to configured recipients.

### Send Test Report
```http
POST /api/school/ece-test-report
```
Sends a test email to verify configuration.

### Manual Trigger (Admin Only)
```http
POST /api/school/ece-trigger-monthly-report
```
Manually triggers the monthly report task (admin access required).

### Update Email Settings
```http
POST /api/school/ece-reporting-settings
```
Updates the email configuration for the school.

## Scheduled Tasks

The system automatically runs monthly reports on:
- **1st of each month at 9:00 AM** (primary)
- **15th of each month at 9:00 AM** (backup)

Timezone: America/New_York (configurable)

## Data Sources

The system aggregates ECE hours from:
- **Module Completions**: Automatic tracking when teachers complete ECE-eligible modules
- **Manual Entries**: Hours added by administrators for in-person training
- **Bulk Entries**: Group training sessions added for multiple teachers

## Error Handling

The system includes comprehensive error handling:
- **Missing Settings**: Guides users to configure email settings
- **No Recipients**: Prompts to add email addresses
- **Email Service Issues**: Graceful handling of SendGrid failures
- **Data Validation**: Ensures all required fields are present

## Testing

Use the provided test scripts to verify functionality:

```bash
# Test the complete system
node test-monthly-ece-system.js

# Test just the monthly report endpoint
node test-monthly-ece-report.js
```

## Troubleshooting

### Common Issues

1. **"Email service not configured"**
   - Add SendGrid API key to environment variables

2. **"No ECE reporting settings found"**
   - Configure email settings in the ECE Hours Tracker

3. **"No email recipients configured"**
   - Add recipient email addresses in settings

4. **Reports not being sent automatically**
   - Check if scheduled tasks are running
   - Verify timezone settings
   - Check server logs for errors

### Logs

Monitor server logs for:
- `🕐 Initializing scheduled tasks...`
- `📅 Running scheduled monthly ECE report task...`
- `📧 Processing school [ID]...`
- `✅ Monthly report sent for [School] to [X] recipient(s)`

## Security

- **Authentication Required**: All endpoints require valid user session
- **School Isolation**: Users can only access their own school's data
- **Admin Controls**: Manual triggers restricted to admin users
- **Email Validation**: Recipient emails are validated before sending

## Future Enhancements

- **PDF Reports**: Generate downloadable PDF versions
- **Custom Templates**: Allow schools to customize report formatting
- **Advanced Filtering**: Filter reports by date ranges or categories
- **Integration**: Connect with state licensing systems
- **Analytics Dashboard**: Visual reporting and trend analysis 