import { useEffect, useCallback, useRef } from 'react';
import { useBalanceStore } from '../store/useBalanceStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useOperationTypeStore } from '../store/useOperationTypeStore';
import { subscribeToProjectState } from '../services/firebase/sync';
import { saveProjectState } from '../services/firebase/database';
import { isSerializable } from '../utils/validation';
import type { ProjectState } from '../types/firebase';

export function useFirebaseSync() {
  const balances = useBalanceStore((state) => state.balances);
  const transactions = useTransactionStore((state) => state.transactions);
  const currencies = useCurrencyStore((state) => state.currencies);
  const cryptos = useCurrencyStore((state) => state.cryptos);
  const operationTypes = useOperationTypeStore((state) => state.operationTypes);
  
  const timeoutRef = useRef<number>();

  const handleStateUpdate = useCallback((state: ProjectState) => {
    if (!state) return;

    try {
      if (Array.isArray(state.balances)) {
        useBalanceStore.setState({ balances: state.balances });
      }
      if (Array.isArray(state.transactions)) {
        useTransactionStore.setState({ transactions: state.transactions });
      }
      if (state.settings) {
        const { currencies, cryptos, operationTypes } = state.settings;
        if (Array.isArray(currencies)) useCurrencyStore.setState({ currencies });
        if (Array.isArray(cryptos)) useCurrencyStore.setState({ cryptos });
        if (Array.isArray(operationTypes)) useOperationTypeStore.setState({ operationTypes });
      }
    } catch (error) {
      console.error('Error updating state from Firebase:', error);
    }
  }, []);

  // Subscribe to Firebase changes
  useEffect(() => {
    const unsubscribe = subscribeToProjectState(handleStateUpdate);
    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleStateUpdate]);

  // Save changes to Firebase with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      // Prepare state and verify it's serializable
      const projectState: ProjectState = {
        balances: balances.filter(b => isSerializable(b)),
        transactions: transactions.filter(t => isSerializable(t)),
        settings: {
          currencies: currencies.filter(c => isSerializable(c)),
          cryptos: cryptos.filter(c => isSerializable(c)),
          operationTypes: operationTypes.filter(o => isSerializable(o)),
        },
        lastUpdated: new Date().toISOString(),
      };

      saveProjectState(projectState).catch(error => {
        console.error('Error saving project state:', error);
      });
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [balances, transactions, currencies, cryptos, operationTypes]);
}