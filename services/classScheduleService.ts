import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { ClassScheduleEvent } from '../types/schedule';

export const classScheduleService = {
  saveScheduleEvents: async (classId: string, events: ClassScheduleEvent[]): Promise<void> => {
    try {
      const batch = writeBatch(db);
      const scheduleRef = collection(db, 'class_schedules');

      events.forEach(event => {
        const docRef =  doc(scheduleRef); // Create new doc ref with auto ID
        // Or if event.id exists and we are updating: const docRef = doc(db, 'class_schedules', event.id);
        batch.set(docRef, event);
      });

      await batch.commit();
      console.log(`Saved ${events.length} schedule events for class ${classId}`);
    } catch (error) {
      console.error("Error saving schedule events:", error);
      throw error;
    }
  },

  getScheduleEventsByClass: async (classId: string): Promise<ClassScheduleEvent[]> => {
    try {
      const q = query(collection(db, 'class_schedules'), where('classId', '==', classId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassScheduleEvent));
    } catch (error) {
      console.error("Error fetching schedule events:", error);
      return [];
    }
  }
};
