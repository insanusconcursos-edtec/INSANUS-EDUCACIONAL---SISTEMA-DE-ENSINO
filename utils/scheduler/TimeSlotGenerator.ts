import { Class } from '../../types/class';

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  meetingNumber: number;
  slotIndex: number;
}

const addMinutes = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

const getDayName = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

export const generateEmptySlots = (classData: Class, holidays: string[]): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startDate = new Date(classData.startDate + 'T00:00:00'); // Ensure local time interpretation
  const endDate = classData.endDate ? new Date(classData.endDate + 'T00:00:00') : null;
  const totalMeetings = classData.totalMeetings;
  
  // Convert meeting duration from hours to minutes
  const meetingDurationMinutes = classData.meetingDuration * 60;
  const slotDuration = meetingDurationMinutes / classData.classesPerMeeting;

  let currentDate = new Date(startDate);
  let meetingsCount = 0;

  // Loop until we reach the total number of meetings or the end date
  while (meetingsCount < totalMeetings) {
    // Check if we passed the end date
    if (endDate && currentDate > endDate) {
      break;
    }

    const dateString = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay(); // 0-6
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.includes(dateString);

    // Check if the current day is a valid class day
    // The Class interface uses numbers for daysOfWeek (0-6)
    const isClassDay = classData.daysOfWeek.includes(dayOfWeek);

    // Check if we should skip this day based on rules
    let skipDay = false;

    if (!isClassDay) {
        // If not a regular class day, check if it's a weekend allowed day
        if (isWeekend && classData.allowWeekend) {
            // If weekends are allowed, check if this specific weekend day is allowed
            // If weekendDays is not defined, assume all weekend days are allowed if allowWeekend is true
            if (classData.weekendDays && !classData.weekendDays.includes(dayOfWeek)) {
                skipDay = true;
            }
        } else {
            skipDay = true;
        }
    }

    // Check holidays
    if (isHoliday) {
        // If holidaysOff is true, we skip holidays (no class on holidays)
        // If holidaysOff is false, we have class on holidays
        if (classData.holidaysOff) {
            skipDay = true;
        }
    }

    if (!skipDay) {
      meetingsCount++;
      let currentStartTime = classData.startTime;

      for (let i = 0; i < classData.classesPerMeeting; i++) {
        const endTime = addMinutes(currentStartTime, slotDuration);
        
        slots.push({
          date: dateString,
          startTime: currentStartTime,
          endTime: endTime,
          meetingNumber: meetingsCount,
          slotIndex: i + 1,
        });

        currentStartTime = endTime;
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
};
