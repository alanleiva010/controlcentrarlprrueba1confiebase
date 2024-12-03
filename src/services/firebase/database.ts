import { ref, set, get, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '../../config/firebase';
import { validateProjectState } from '../../utils/validation';
import { formatDate } from '../../utils/date';
import type { ProjectState } from '../../types/firebase';

export const saveData = async (path: string, data: any): Promise<boolean> => {
  if (!path || !data) {
    console.error('Invalid path or data provided to saveData');
    return false;
  }

  try {
    const dbRef = ref(database, path);
    await set(dbRef, JSON.parse(JSON.stringify(data))); // Ensure data is serializable
    return true;
  } catch (error) {
    console.error(`Error saving data to ${path}:`, error);
    return false;
  }
};

export const getData = async <T>(path: string): Promise<T | null> => {
  if (!path) {
    console.error('Invalid path provided to getData');
    return null;
  }

  try {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Error getting data from ${path}:`, error);
    return null;
  }
};

export const getLatestTransactions = async (limit: number = 10): Promise<any[]> => {
  try {
    const transactionsRef = ref(database, 'projectState/transactions');
    const transactionsQuery = query(
      transactionsRef,
      orderByChild('date'),
      limitToLast(limit)
    );
    const snapshot = await get(transactionsQuery);
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  } catch (error) {
    console.error('Error getting latest transactions:', error);
    return [];
  }
};

export const saveProjectState = async (state: ProjectState): Promise<boolean> => {
  if (!state) {
    console.error('Invalid project state provided');
    return false;
  }

  try {
    // Validate state structure
    validateProjectState(state);
    
    // Clean and prepare data for Firebase
    const cleanState = {
      balances: state.balances || [],
      transactions: state.transactions || [],
      settings: {
        currencies: state.settings?.currencies || [],
        cryptos: state.settings?.cryptos || [],
        operationTypes: state.settings?.operationTypes || [],
      },
      lastUpdated: formatDate(new Date())
    };

    // Ensure data is serializable
    const serializedState = JSON.parse(JSON.stringify(cleanState));
    
    return await saveData('projectState', serializedState);
  } catch (error) {
    console.error('Error saving project state:', error);
    return false;
  }
};