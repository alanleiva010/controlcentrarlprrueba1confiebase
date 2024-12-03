import { ref, set, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { formatISO } from 'date-fns';

export interface ProjectState {
  balances: any[];
  transactions: any[];
  settings: {
    currencies: any[];
    cryptos: any[];
    operationTypes: any[];
  };
  lastUpdated: string;
}

const getFormattedDate = () => {
  try {
    return formatISO(new Date());
  } catch (error) {
    console.error('Error formatting date:', error);
    return formatISO(new Date(0)); // Fallback to Unix epoch
  }
};

export const saveProjectState = async (projectState: ProjectState) => {
  try {
    const dbRef = ref(database, 'projectState');
    const stateWithTimestamp = {
      ...projectState,
      lastUpdated: getFormattedDate()
    };
    await set(dbRef, stateWithTimestamp);
    console.log('Project state saved to Firebase');
  } catch (error) {
    console.error('Error saving project state:', error);
    throw error;
  }
};

export const subscribeToProjectState = (callback: (state: ProjectState) => void) => {
  const dbRef = ref(database, 'projectState');
  
  const handleSnapshot = (snapshot: any) => {
    try {
      const data = snapshot.val();
      if (data) {
        // Validate and transform dates if needed
        const transformedData = {
          ...data,
          transactions: data.transactions?.map((t: any) => ({
            ...t,
            date: t.date ? new Date(t.date) : new Date(),
            createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
          })) || [],
        };
        callback(transformedData);
      }
    } catch (error) {
      console.error('Error processing Firebase data:', error);
    }
  };
  
  onValue(dbRef, handleSnapshot);
  return () => off(dbRef);
};

export const saveBalances = async (balances: any[]) => {
  try {
    const dbRef = ref(database, 'projectState/balances');
    await set(dbRef, balances);
  } catch (error) {
    console.error('Error saving balances:', error);
    throw error;
  }
};

export const saveTransactions = async (transactions: any[]) => {
  try {
    const dbRef = ref(database, 'projectState/transactions');
    const processedTransactions = transactions.map(t => ({
      ...t,
      date: t.date?.toISOString() || getFormattedDate(),
      createdAt: t.createdAt?.toISOString(),
      updatedAt: t.updatedAt?.toISOString(),
    }));
    await set(dbRef, processedTransactions);
  } catch (error) {
    console.error('Error saving transactions:', error);
    throw error;
  }
};

export const saveSettings = async (settings: ProjectState['settings']) => {
  try {
    const dbRef = ref(database, 'projectState/settings');
    await set(dbRef, settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};