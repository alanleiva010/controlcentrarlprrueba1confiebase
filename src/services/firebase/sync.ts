import { ref, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';
import { parseDate } from '../../utils/date';
import type { ProjectState } from '../../types/firebase';

export const subscribeToProjectState = (callback: (state: ProjectState) => void): (() => void) => {
  const dbRef = ref(database, 'projectState');
  
  const handleSnapshot = (snapshot: any) => {
    try {
      const data = snapshot.val();
      if (!data) return;

      // Transform dates in transactions
      const transformedData = {
        ...data,
        transactions: (data.transactions || []).map((t: any) => ({
          ...t,
          date: parseDate(t.date),
          createdAt: t.createdAt ? parseDate(t.createdAt) : undefined,
          updatedAt: t.updatedAt ? parseDate(t.updatedAt) : undefined,
        })),
        lastUpdated: parseDate(data.lastUpdated)
      };

      callback(transformedData);
    } catch (error) {
      console.error('Error processing Firebase data:', error);
    }
  };
  
  onValue(dbRef, handleSnapshot);
  return () => off(dbRef);
};