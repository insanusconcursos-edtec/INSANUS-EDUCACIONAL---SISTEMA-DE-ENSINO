import { Class } from '../../types/class';
import { Topic, Module } from '../../types/curriculum';
import { Teacher } from '../../types/teacher';
import { ClassScheduleEvent, ScheduleGap } from '../../types/schedule';
import { checkTeacherAvailability, checkGeographicLock, checkClassConflict } from './ResourceValidator';
import { generateEmptySlots, TimeSlot } from './TimeSlotGenerator';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface TopicPoolItem {
  topic: Topic;
  remainingModules: {
    module: Module;
    partIndex: number;
    totalParts: number;
  }[];
  lastScheduledDate: string | null;
}

export const buildSchedule = (
  classData: Class,
  selectedTopics: Topic[],
  teachers: Teacher[],
  holidays: string[]
): { events: ClassScheduleEvent[], gaps: ScheduleGap[] } => {
  const schedule: ClassScheduleEvent[] = [];
  const gaps: ScheduleGap[] = [];

  // 1. Initialize Pool
  // Inject holidays immediately
  holidays.forEach(h => gaps.push({ date: h, reason: 'HOLIDAY', description: 'Feriado / Recesso' }));

  const pool: TopicPoolItem[] = selectedTopics.map(topic => {
    const remainingModules: { module: Module; partIndex: number; totalParts: number }[] = [];
    
    if (topic.modules && topic.modules.length > 0) {
      topic.modules.forEach(module => {
        if (module.isSelected !== false) {
          for (let i = 0; i < module.classesCount; i++) {
            remainingModules.push({ module, partIndex: i + 1, totalParts: module.classesCount });
          }
        }
      });
    } else if (topic.requiredClasses > 0) {
      const dummyModule: Module = {
        id: `topic-${topic.id}-general`,
        name: topic.name,
        classesCount: topic.requiredClasses,
        isSelected: true
      };
      for (let i = 0; i < topic.requiredClasses; i++) {
        remainingModules.push({ module: dummyModule, partIndex: i + 1, totalParts: topic.requiredClasses });
      }
    }

    return {
      topic,
      remainingModules,
      lastScheduledDate: null
    };
  });

  // Helper function to select best topic
  const selectBestTopicForDate = (
    dateString: string,
    startTime: string,
    endTime: string,
    previousDaySubjectId: string | null,
    currentMeetingSubjectId: string | null
  ): TopicPoolItem | null => {
    // Filter candidates with remaining modules
    let candidates = pool.filter(p => p.remainingModules.length > 0);

    // Filter by availability
    candidates = candidates.filter(candidate => {
      const teacherId = candidate.topic.teacherId;
      if (!teacherId) return false; // No teacher assigned

      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) return false;

      // Check basic availability (holidays, blocks)
      if (!checkTeacherAvailability(teacher, dateString)) return false;

      // Check geographic lock
      // Assuming default city RIO_BRANCO for now as per original code
      const currentCity = 'RIO_BRANCO'; 
      const lastCity = 'RIO_BRANCO'; 
      // We need to check against the last event of THIS teacher in the GLOBAL schedule
      const teacherEvents = schedule.filter(e => e.teacherId === teacher.id);
      const lastTeacherEvent = teacherEvents[teacherEvents.length - 1];
      
      if (lastTeacherEvent) {
         if (!checkGeographicLock(teacher, dateString, startTime, currentCity, lastTeacherEvent, lastCity)) {
           return false;
         }
      }

      // Check class conflict (is teacher teaching another class at this time?)
      if (!checkClassConflict(teacher.id, dateString, startTime, endTime, schedule)) {
        return false;
      }

      return true;
    });

    if (candidates.length === 0) return null;

    // RULE: CONTINUITY (Force same subject if already scheduled in this meeting)
    if (currentMeetingSubjectId) {
        const continuityCandidate = candidates.find(c => c.topic.subjectId === currentMeetingSubjectId);
        if (continuityCandidate) {
            return continuityCandidate;
        }
        // If we are here, it means the current subject has NO more modules available (Exception case).
        // We fall through to the standard selection logic below.
    }

    // COOLDOWN LOGIC: Penalize subject if it was scheduled previously (yesterday)
    let preferredCandidates = candidates;
    if (previousDaySubjectId) {
        const nonPenalized = candidates.filter(c => c.topic.subjectId !== previousDaySubjectId);
        // Only switch to non-penalized list if it has items. 
        // If ONLY penalized items are available, we must use them (don't leave gap).
        if (nonPenalized.length > 0) {
            preferredCandidates = nonPenalized;
        }
    }

    // Sort by Equity (LRU - Least Recently Used)
    preferredCandidates.sort((a, b) => {
      if (a.lastScheduledDate === null && b.lastScheduledDate === null) return 0;
      if (a.lastScheduledDate === null) return -1; // a comes first (never scheduled)
      if (b.lastScheduledDate === null) return 1; // b comes first
      
      // Both have dates, pick the older one (smaller string value YYYY-MM-DD)
      if (a.lastScheduledDate < b.lastScheduledDate) return -1;
      if (a.lastScheduledDate > b.lastScheduledDate) return 1;
      return 0;
    });

    return preferredCandidates[0];
  };

  // 2. Generate Slots
  const slots = generateEmptySlots(classData, holidays);

  // 3. Allocation Loop
  let meetingCounter = 0;
  let previousDaySubjectId: string | null = null;
  
  // Group slots by date
  const slotsByDate: Record<string, TimeSlot[]> = {};
  slots.forEach(slot => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  });

  // Iterate chronologically
  const sortedDates = Object.keys(slotsByDate).sort();

  for (const dateString of sortedDates) {
    // Check if we still have content to schedule
    if (!pool.some(p => p.remainingModules.length > 0)) break;

    const daySlots = slotsByDate[dateString];
    const dayEvents: ClassScheduleEvent[] = [];
    const topicsToUpdate = new Set<TopicPoolItem>();
    let currentMeetingSubjectId: string | null = null;

    for (const slot of daySlots) {
       // Check pool again inside slot loop (for optimization exception)
       if (!pool.some(p => p.remainingModules.length > 0)) break;

       const bestTopic = selectBestTopicForDate(
           dateString, 
           slot.startTime, 
           slot.endTime, 
           previousDaySubjectId,
           currentMeetingSubjectId
       );

       if (bestTopic) {
          const moduleItem = bestTopic.remainingModules.shift()!;
          topicsToUpdate.add(bestTopic);

          // Update current meeting subject for continuity in next slot
          currentMeetingSubjectId = bestTopic.topic.subjectId;

          dayEvents.push({
            id: generateId(),
            classId: classData.id,
            date: dateString,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subjectId: bestTopic.topic.subjectId,
            topicId: bestTopic.topic.id,
            moduleId: moduleItem.module.id,
            teacherId: bestTopic.topic.teacherId!,
            isSubstitute: false,
            status: 'SCHEDULED',
            meetingNumber: 0, // Will be set later
            classOrderIndex: 0 // Will be set later
          });
       } else {
          // If failed for this specific slot, generate a gap
          gaps.push({ 
            date: slot.date, 
            startTime: slot.startTime, 
            endTime: slot.endTime, 
            reason: 'NO_TEACHER', 
            description: 'Nenhum professor titular disponível para este horário' 
          });
       }
    }

    if (dayEvents.length > 0) {
       meetingCounter++;
       // Finalize events
       dayEvents.forEach((event, index) => {
         event.meetingNumber = meetingCounter;
         event.classOrderIndex = schedule.length + index + 1;
       });
       schedule.push(...dayEvents);

       // Update LRU dates
       topicsToUpdate.forEach(topic => {
         topic.lastScheduledDate = dateString;
       });

       // Update previousDaySubjectId for the NEXT day based on the LAST event of TODAY
       if (currentMeetingSubjectId) {
           previousDaySubjectId = currentMeetingSubjectId;
       }
    }
  }

  return { events: schedule, gaps };
};
