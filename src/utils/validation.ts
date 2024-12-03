import type { ProjectState } from '../types/firebase';

export const validateProjectState = (state: any): boolean => {
  if (!state || typeof state !== 'object') {
    throw new Error('Invalid project state: must be an object');
  }

  // Ensure required properties exist
  const requiredProps = ['balances', 'transactions', 'settings'];
  for (const prop of requiredProps) {
    if (!(prop in state)) {
      throw new Error(`Invalid project state: missing ${prop} property`);
    }
  }

  // Validate arrays
  if (!Array.isArray(state.balances)) {
    throw new Error('Invalid project state: balances must be an array');
  }

  if (!Array.isArray(state.transactions)) {
    throw new Error('Invalid project state: transactions must be an array');
  }

  // Validate settings object
  if (!state.settings || typeof state.settings !== 'object') {
    throw new Error('Invalid project state: settings must be an object');
  }

  const requiredSettings = ['currencies', 'cryptos', 'operationTypes'];
  for (const prop of requiredSettings) {
    if (!(prop in state.settings)) {
      throw new Error(`Invalid project state: missing settings.${prop} property`);
    }
    if (!Array.isArray(state.settings[prop])) {
      throw new Error(`Invalid project state: settings.${prop} must be an array`);
    }
  }

  return true;
};

export const validateTransaction = (transaction: any): boolean => {
  if (!transaction || typeof transaction !== 'object') {
    throw new Error('Invalid transaction: must be an object');
  }

  const requiredProps = ['id', 'date', 'amount'];
  for (const prop of requiredProps) {
    if (!(prop in transaction)) {
      throw new Error(`Invalid transaction: missing ${prop} property`);
    }
  }

  if (typeof transaction.amount !== 'number') {
    throw new Error('Invalid transaction: amount must be a number');
  }

  if (!(transaction.date instanceof Date) && !Date.parse(transaction.date)) {
    throw new Error('Invalid transaction: invalid date format');
  }

  return true;
};

export const isSerializable = (obj: any): boolean => {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    return false;
  }
};