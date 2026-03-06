import { Teacher } from '../../types/teacher';
import { ClassScheduleEvent } from '../../types/schedule';

export interface AvailabilityResult {
  isAvailable: boolean;
  reason?: 'BLOCK_DATE' | 'WEEKEND_UNAVAILABLE' | 'WEEKDAY_UNAVAILABLE' | 'NO_PREFERENCE';
  details?: string;
}

export const checkTeacherAvailability = (teacher: Teacher, date: string): AvailabilityResult => {
  // 1. Check Unavailabilities (Block dates)
  if (teacher.unavailabilities && teacher.unavailabilities.length > 0) {
    const targetDate = new Date(date + 'T00:00:00');
    
    const unavailability = teacher.unavailabilities.find(u => {
      const start = new Date(u.startDate);
      const end = new Date(u.endDate);
      
      // Normalize dates to ignore time components for day-level blocking
      const targetTime = targetDate.getTime();
      const startTime = new Date(start.toISOString().split('T')[0] + 'T00:00:00').getTime();
      const endTime = new Date(end.toISOString().split('T')[0] + 'T00:00:00').getTime();

      return targetTime >= startTime && targetTime <= endTime;
    });

    if (unavailability) {
      return {
        isAvailable: false,
        reason: 'BLOCK_DATE',
        details: `Bloqueio de agenda (${unavailability.type}${unavailability.reason ? ': ' + unavailability.reason : ''})`
      };
    }
  }

  // 2. Check Day of Week Availability
  // Use T12:00:00 to avoid timezone issues shifting the day
  const dateObj = new Date(date + 'T12:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Check Weekends
  if (dayOfWeek === 6) { // Saturday
    // If availableWeekends is undefined, assume false (unavailable)
    if (!teacher.availableWeekends?.saturday) {
      return {
        isAvailable: false,
        reason: 'WEEKEND_UNAVAILABLE',
        details: 'Não ministra aulas aos finais de semana'
      };
    }
  } else if (dayOfWeek === 0) { // Sunday
    // If availableWeekends is undefined, assume false (unavailable)
    if (!teacher.availableWeekends?.sunday) {
      return {
        isAvailable: false,
        reason: 'WEEKEND_UNAVAILABLE',
        details: 'Não ministra aulas aos finais de semana'
      };
    }
  } else {
    // Check Weekdays (1-5)
    const dayMap: { [key: number]: string } = {
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY'
    };
    
    const dayString = dayMap[dayOfWeek];
    
    // Check if the teacher has any schedule preference for this day
    // We assume that if the day is present in schedulePreferences, they are available for at least one shift.
    // If the array is empty or the day is missing, they are unavailable.
    const hasPreference = teacher.schedulePreferences?.some(pref => pref.day === dayString);
    
    if (!hasPreference) {
      return {
        isAvailable: false,
        reason: 'WEEKDAY_UNAVAILABLE',
        details: 'Fora do dia/turno de preferência'
      };
    }
  }

  return { isAvailable: true };
};

export const checkGeographicLock = (
  teacher: Teacher, 
  targetDate: string, 
  targetStartTime: string,
  targetCity: string, 
  lastEvent: ClassScheduleEvent, 
  lastCity: string
): boolean => {
  if (targetCity === lastCity) {
    return true;
  }

  if (!teacher.blockTime) {
    return true; // No block time configured, assume no restriction or handle elsewhere
  }

  const lastEventEnd = new Date(`${lastEvent.date}T${lastEvent.endTime}`);
  const targetEventStart = new Date(`${targetDate}T${targetStartTime}`);

  const diffInMs = targetEventStart.getTime() - lastEventEnd.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  return diffInHours >= teacher.blockTime;
};

export const checkClassConflict = (
  teacherId: string, 
  date: string, 
  startTime: string, 
  endTime: string,
  existingSchedules: ClassScheduleEvent[]
): boolean => {
  const teacherEventsOnDate = existingSchedules.filter(
    event => event.teacherId === teacherId && event.date === date && event.status !== 'CANCELED'
  );

  if (teacherEventsOnDate.length === 0) {
    return true;
  }

  const newStart = new Date(`${date}T${startTime}`);
  const newEnd = new Date(`${date}T${endTime}`);

  return !teacherEventsOnDate.some(event => {
    const existingStart = new Date(`${event.date}T${event.startTime}`);
    const existingEnd = new Date(`${event.date}T${event.endTime}`);

    // Check for overlap
    // (StartA < EndB) and (EndA > StartB)
    return newStart < existingEnd && newEnd > existingStart;
  });
};
