export type ClassType = 'PRE_EDITAL' | 'POS_EDITAL';
export type ClassModality = 'REGULAR' | 'INTENSIVO';
export type ClassShift = 'MORNING' | 'AFTERNOON' | 'NIGHT';
export type ClassStatus = 'SALES_OPEN' | 'SALES_CLOSED' | 'SOLD_OUT' | 'FINISHED';

export interface Class {
  id: string;
  name: string;
  coverImage: string;
  type: ClassType;
  modality: ClassModality;
  hasRecordings: boolean;
  totalMeetings: number;
  meetingDuration: number; // em horas
  classesPerMeeting: number;
  hasBreak: boolean;
  breakDuration: number; // em minutos
  shift: ClassShift;
  startTime: string;
  daysOfWeek: number[];
  allowWeekend: boolean;
  weekendDays?: number[];
  weekendShift?: ClassShift;
  startDate: string;
  endDate?: string;
  hardDeadline?: string;
  softDeadlineMargin?: number;
  holidaysOff: boolean;
  classroomId: string;
  category: string;
  subcategory?: string;
  organization?: string;
  status: ClassStatus;
  createdAt?: string;
  updatedAt?: string;
  remunerationConfig?: {
    mode: 'DYNAMIC' | 'FIXED';
    fixedHourlyRate?: number;
    recordingCommission: number;
    substitutionCommission: number;
    weekendCommission: number;
  };
}
