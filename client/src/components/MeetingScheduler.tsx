import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getDaysInMonth, formatTimeToUserFriendly, convertTime } from "@/lib/time-utils";

interface MeetingSchedulerProps {
  timeZone: string;
}

interface AvailableSlot {
  time: string; // ISO string
  isAvailable: boolean;
}

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export function MeetingScheduler({ timeZone }: MeetingSchedulerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  
  // Fetch all users for potential practice partners
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"]
  });
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get days in current month
    const daysInMonth = getDaysInMonth(year, month);
    
    // Get day of week of the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Get days in previous month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    const days = [];
    
    // Add days from previous month
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      days.push({
        day: i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
        isToday: false,
        isPast: true
      });
    }
    
    // Add days from current month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();
      const isPast = date < new Date(today.setHours(0, 0, 0, 0));
      
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
        isToday,
        isPast
      });
    }
    
    // Fill in days from next month if needed to complete the grid (6 rows)
    const totalDaysToShow = 42; // 6 rows x 7 days
    const remainingDays = totalDaysToShow - days.length;
    
    if (remainingDays > 0) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextMonthYear = month === 11 ? year + 1 : year;
      
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          day: i,
          month: nextMonth,
          year: nextMonthYear,
          isCurrentMonth: false,
          isToday: false,
          isPast: false
        });
      }
    }
    
    return days;
  };
  
  // Generate time slots based on selected date
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }
    
    // Generate slots for the selected date
    const slots: AvailableSlot[] = [];
    const today = new Date();
    const isToday = selectedDate.getDate() === today.getDate() && 
                    selectedDate.getMonth() === today.getMonth() && 
                    selectedDate.getFullYear() === today.getFullYear();
    
    // Get current hour if it's today
    const currentHour = isToday ? today.getHours() : 0;
    
    for (const hour of HOURS) {
      // Skip past hours if it's today
      if (isToday && hour <= currentHour) continue;
      
      const date = new Date(selectedDate);
      date.setHours(hour, 0, 0, 0);
      
      // Generate a random availability, more slots available in morning and evening
      // In a real app, this would come from API
      const randomAvailability = Math.random() < (hour < 12 || hour > 17 ? 0.8 : 0.4);
      
      slots.push({
        time: date.toISOString(),
        isAvailable: randomAvailability
      });
    }
    
    setAvailableSlots(slots);
  }, [selectedDate]);
  
  // Handle date navigation
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const prevMonth = prev.getMonth() === 0 ? 11 : prev.getMonth() - 1;
      const prevYear = prev.getMonth() === 0 ? prev.getFullYear() - 1 : prev.getFullYear();
      return new Date(prevYear, prevMonth, 1);
    });
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const nextMonth = prev.getMonth() === 11 ? 0 : prev.getMonth() + 1;
      const nextYear = prev.getMonth() === 11 ? prev.getFullYear() + 1 : prev.getFullYear();
      return new Date(nextYear, nextMonth, 1);
    });
  };
  
  // Handle date selection
  const handleDateSelect = (day: number, month: number, year: number) => {
    setSelectedDate(new Date(year, month, day));
  };
  
  // Format month and year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Calendar days
  const calendarDays = generateCalendarDays();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <i className="ri-arrow-left-s-line"></i>
          </Button>
          <span>{formatMonthYear(currentDate)}</span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <i className="ri-arrow-right-s-line"></i>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center font-medium text-sm py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-6">
          {calendarDays.map((day, index) => {
            const isSelected = selectedDate && 
                              day.day === selectedDate.getDate() && 
                              day.month === selectedDate.getMonth() && 
                              day.year === selectedDate.getFullYear();
            
            return (
              <Button
                key={index}
                variant="ghost"
                className={`
                  h-10 p-0 
                  ${!day.isCurrentMonth ? 'text-neutral-400' : ''} 
                  ${day.isToday ? 'bg-primary/10 text-primary font-bold' : ''} 
                  ${isSelected ? 'bg-primary text-white' : ''} 
                  ${day.isPast ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={day.isPast}
                onClick={() => handleDateSelect(day.day, day.month, day.year)}
              >
                {day.day}
              </Button>
            );
          })}
        </div>
        
        {selectedDate && (
          <div>
            <h3 className="font-heading font-semibold mb-4">
              Available Times for {selectedDate.toLocaleDateString()}
            </h3>
            
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={slot.isAvailable ? "outline" : "ghost"}
                    className={`text-sm ${!slot.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!slot.isAvailable}
                    onClick={() => {
                      if (slot.isAvailable) {
                        // In a real app, this would open a modal or form to schedule the meeting
                        const date = new Date(slot.time);
                        const formattedTime = formatTimeToUserFriendly(date, timeZone);
                        
                        // Set the form values
                        const startTimeInput = document.querySelector('input[name="startTime"]') as HTMLInputElement;
                        if (startTimeInput) {
                          startTimeInput.value = date.toISOString().slice(0, 16);
                          
                          // Also set the end time to an hour later
                          const endTime = new Date(date);
                          endTime.setHours(endTime.getHours() + 1);
                          
                          const endTimeInput = document.querySelector('input[name="endTime"]') as HTMLInputElement;
                          if (endTimeInput) {
                            endTimeInput.value = endTime.toISOString().slice(0, 16);
                          }
                        }
                      }
                    }}
                  >
                    {formatTimeToUserFriendly(new Date(slot.time), timeZone)}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No available slots for this date. Please select another date.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
