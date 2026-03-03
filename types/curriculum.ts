export interface Module {
  id: string;
  name: string;
  classesCount: number;
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  color: string;
  defaultTeacherId?: string;
  order?: number;
  createdAt?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  classId: string;
  name: string;
  teacherId?: string;
  requiredClasses: number;
  isSelected: boolean;
  modules?: Module[];
  order?: number;
  createdAt?: string;
}
