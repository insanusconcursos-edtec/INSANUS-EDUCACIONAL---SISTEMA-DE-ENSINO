export interface ScheduleGap {
  date: string;
  startTime?: string;
  endTime?: string;
  reason: 'HOLIDAY' | 'NO_TEACHER' | 'NO_CLASS_DAY';
  description: string;
}

export interface ClassScheduleEvent {
  id: string;
  classId: string;
  date: string; // Formato YYYY-MM-DD
  startTime: string; // Formato HH:mm
  endTime: string; // Formato HH:mm
  
  // Relacionamentos de Currículo
  subjectId: string;
  topicId: string;
  moduleId: string;
  
  // Relacionamentos de Pessoal
  teacherId: string;
  isSubstitute: boolean; // Flag para indicar se o professor foi alterado manualmente
  
  // Controle de Estado
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED' | 'RESCHEDULED';
  
  // Metadados para Lógica de Empuxo
  meetingNumber: number; // Ex: Encontro 1, Encontro 2
  classOrderIndex: number; // A ordem matemática desta aula dentro do currículo
}
