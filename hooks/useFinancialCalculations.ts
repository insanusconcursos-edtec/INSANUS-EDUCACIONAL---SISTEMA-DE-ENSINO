import { Class } from '../types/class';
import { Topic, Subject } from '../types/curriculum';
import { Teacher } from '../types/teacher';

export const useFinancialCalculations = (
  cls: Class,
  topics: Topic[],
  subjects: Subject[],
  teachers: Teacher[]
) => {
  const calculateProjectedCost = () => {
    const safeConfig = cls.remunerationConfig || {
      mode: 'DYNAMIC',
      fixedHourlyRate: 0,
      recordingCommission: 0,
      substitutionCommission: 0,
      weekendCommission: 0
    };

    const selectedTopics = topics.filter(t => t.isSelected);
    let totalCost = 0;

    selectedTopics.forEach(topic => {
      const modules = topic.modules || [];
      
      modules.forEach(module => {
        // a) Determine duration in hours
        // classesPerMeeting is how many classes fit in one meetingDuration
        // So duration of one class = meetingDuration / classesPerMeeting
        // Total duration = classesCount * (meetingDuration / classesPerMeeting)
        const durationInHours = (module.classesCount / (cls.classesPerMeeting || 1)) * cls.meetingDuration;

        // b) Identify responsible teacher
        let teacherId = topic.teacherId;
        if (!teacherId) {
          const subject = subjects.find(s => s.id === topic.subjectId);
          teacherId = subject?.defaultTeacherId;
        }

        // c) Define Base Hourly Rate
        let baseHourlyRate = 0;
        if (safeConfig.mode === 'FIXED') {
          baseHourlyRate = safeConfig.fixedHourlyRate || 0;
        } else {
          // DYNAMIC
          const teacher = teachers.find(t => t.id === teacherId);
          baseHourlyRate = teacher?.hourlyRate || 0;
        }

        // d) Apply Recording Commission
        let finalHourlyRate = baseHourlyRate;
        if (cls.hasRecordings && safeConfig.recordingCommission) {
          const commission = baseHourlyRate * (safeConfig.recordingCommission / 100);
          finalHourlyRate += commission;
        }

        // e) Multiply Rate by Duration
        totalCost += finalHourlyRate * durationInHours;
      });
    });

    return totalCost;
  };

  return { calculateProjectedCost };
};
