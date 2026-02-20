
import { 
  collection, 
  doc, 
  writeBatch, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  Timestamp, 
  addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { getLocalISODate } from './scheduleService';

export interface CourseReview {
  id: string;
  userId: string;
  courseId: string;
  disciplineId: string;
  topicId: string;
  topicName: string;
  scheduledDate: string; // Formato YYYY-MM-DD
  status: 'pending' | 'completed' | 'missed';
  reviewIndex: number;
  intervalDays: number;
  label: string;
  isLastOfCycle: boolean;
  repeatInterval: number | null;
  createdAt: any; // Timestamp
  completedAt?: any; // Timestamp
}

export const courseReviewService = {
  /**
   * 1. Agenda as revisões com base nos intervalos
   * Calcula as datas de forma cumulativa (Data Rev 2 = Data Rev 1 + Intervalo 2)
   */
  scheduleReviews: async (
    userId: string, 
    courseId: string, 
    disciplineId: string, 
    topicId: string, 
    topicName: string, 
    intervals: number[], 
    repeatLast: boolean
  ) => {
    const batch = writeBatch(db);
    const reviewsRef = collection(db, 'users', userId, 'course_reviews');

    // Começa a contar a partir de "Hoje"
    let currentDateCalculation = new Date();

    intervals.forEach((interval, index) => {
      // Lógica de Acumulação: A próxima revisão é X dias APÓS a anterior
      currentDateCalculation.setDate(currentDateCalculation.getDate() + interval);
      
      // Usa helper para garantir string YYYY-MM-DD correta no fuso local
      const scheduledDateStr = getLocalISODate(currentDateCalculation);
      
      const isLast = index === intervals.length - 1;
      const newReviewRef = doc(reviewsRef); // Gera ID automaticamente

      const reviewData: CourseReview = {
        id: newReviewRef.id,
        userId,
        courseId,
        disciplineId,
        topicId,
        topicName,
        scheduledDate: scheduledDateStr,
        status: 'pending',
        reviewIndex: index + 1,
        intervalDays: interval,
        label: `REV. ${index + 1} - ${interval} DIA${interval > 1 ? 'S' : ''}`,
        isLastOfCycle: isLast,
        repeatInterval: isLast && repeatLast ? interval : null,
        createdAt: Timestamp.now()
      };

      batch.set(newReviewRef, reviewData);
    });

    await batch.commit();
  },

  /**
   * 2. Busca revisões pendentes ou atrasadas de um curso específico
   */
  getPendingReviews: async (userId: string, courseId: string) => {
    const reviewsRef = collection(db, 'users', userId, 'course_reviews');
    
    // Busca tudo que não está concluído para este curso
    const q = query(
        reviewsRef, 
        where('courseId', '==', courseId), 
        where('status', '!=', 'completed')
    );
    
    const snapshot = await getDocs(q);
    
    const reviews = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
    } as CourseReview));

    // Ordena pela data mais antiga primeiro (Client-side sort para evitar índice complexo composto)
    return reviews.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  },

  /**
   * 3. Busca revisões específicas de um Tópico (Para exibir no Edital)
   */
  getReviewsByTopic: async (userId: string, topicId: string) => {
    const reviewsRef = collection(db, 'users', userId, 'course_reviews');
    
    const q = query(
        reviewsRef, 
        where('topicId', '==', topicId)
    );
    
    const snapshot = await getDocs(q);
    
    const reviews = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
    } as CourseReview));

    // Ordena pelo índice da revisão (REV 1, REV 2...)
    return reviews.sort((a, b) => a.reviewIndex - b.reviewIndex);
  },

  /**
   * 4. Deleta todas as revisões de um tópico (Quando o aluno desmarca conclusão)
   */
  deleteReviewsByTopic: async (userId: string, topicId: string) => {
    const reviewsRef = collection(db, 'users', userId, 'course_reviews');
    const q = query(reviewsRef, where('topicId', '==', topicId));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
  },

  /**
   * 5. Conclui uma revisão e verifica se deve gerar a próxima (Loop Infinito)
   */
  completeReview: async (userId: string, review: CourseReview) => {
    const batch = writeBatch(db);
    
    // A. Atualiza o status da revisão atual
    const currentReviewRef = doc(db, 'users', userId, 'course_reviews', review.id);
    batch.update(currentReviewRef, { 
        status: 'completed',
        completedAt: Timestamp.now()
    });

    // B. Se for a última do ciclo e tiver repetição ativada, cria a próxima
    if (review.isLastOfCycle && review.repeatInterval) {
        const nextDate = new Date(); // Data base é hoje (data da conclusão)
        nextDate.setDate(nextDate.getDate() + review.repeatInterval);
        
        const nextDateStr = getLocalISODate(nextDate);
        const newReviewRef = doc(collection(db, 'users', userId, 'course_reviews'));
        
        const newReviewData: CourseReview = {
            ...review,
            id: newReviewRef.id,
            scheduledDate: nextDateStr,
            status: 'pending',
            reviewIndex: review.reviewIndex + 1,
            label: `REV. ${review.reviewIndex + 1} - ${review.repeatInterval} DIAS`,
            createdAt: Timestamp.now(),
            completedAt: undefined // Limpa o campo de conclusão
        };

        batch.set(newReviewRef, newReviewData);
    }

    await batch.commit();
  }
};
