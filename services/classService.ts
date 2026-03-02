import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc } from 'firebase/firestore';
import { Class } from '../types/class';

const CLASSES_COLLECTION = 'classes';

export const classService = {
  createClass: async (classData: Omit<Class, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, CLASSES_COLLECTION), {
        ...classData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating class: ", error);
      throw error;
    }
  },

  updateClass: async (id: string, classData: Partial<Class>): Promise<void> => {
    try {
      const classRef = doc(db, CLASSES_COLLECTION, id);
      await updateDoc(classRef, {
        ...classData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating class: ", error);
      throw error;
    }
  },

  deleteClass: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, CLASSES_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting class: ", error);
      throw error;
    }
  },

  getClasses: async (): Promise<Class[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, CLASSES_COLLECTION));
      const classes: Class[] = [];
      querySnapshot.forEach((doc) => {
        classes.push({ id: doc.id, ...doc.data() } as Class);
      });
      return classes;
    } catch (error) {
      console.error("Error fetching classes: ", error);
      throw error;
    }
  },

  getClassById: async (id: string): Promise<Class | null> => {
    try {
      const docRef = doc(db, CLASSES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Class;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching class: ", error);
      throw error;
    }
  }
};
