import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Transactions } from './pages/Transactions';
import { Caja } from './pages/Caja';
import { CajaHistory } from './pages/CajaHistory';
import { ClientSettings } from './pages/settings/ClientSettings';
import { BalanceSettings } from './pages/settings/BalanceSettings';
import { CryptoSettings } from './pages/settings/CryptoSettings';
import { CurrencySettings } from './pages/settings/CurrencySettings';
import { OperatorSettings } from './pages/settings/OperatorSettings';
import { OperationTypeSettings } from './pages/settings/OperationTypeSettings';
import { useAuthStore } from './store/useAuthStore';
import { useSupabaseSync } from './store/useSupabaseSync';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { supabase } from './config/supabase';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  
  if (!user || !session) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  const syncData = useSupabaseSync((state) => state.syncData);
  const setSession = useAuthStore((state) => state.setSession);

  // Use Firebase sync
  useFirebaseSync();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  useEffect(() => {
    // Initial sync when app loads
    syncData();

    // Set up periodic sync every 5 minutes
    const syncInterval = setInterval(syncData, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [syncData]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/caja" />} />
          <Route path="caja" element={<Caja />} />
          <Route path="caja/history" element={<CajaHistory />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings">
            <Route path="clients" element={<ClientSettings />} />
            <Route path="balances" element={<BalanceSettings />} />
            <Route path="cryptos" element={<CryptoSettings />} />
            <Route path="currencies" element={<CurrencySettings />} />
            <Route path="operators" element={<OperatorSettings />} />
            <Route path="operation-types" element={<OperationTypeSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}