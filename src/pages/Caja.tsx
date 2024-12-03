import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCajaStore } from '../store/useCajaStore';
import { useBalanceStore } from '../store/useBalanceStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useAuthStore } from '../store/useAuthStore';
import { BalanceForm } from '../components/BalanceForm';
import { Plus, History, Edit2 } from 'lucide-react';

export function Caja() {
  const [showForm, setShowForm] = useState(false);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const { isOpen, openCaja, closeCaja } = useCajaStore();
  const { balances, editBalance } = useBalanceStore();
  const { currencies, cryptos } = useCurrencyStore();
  const { user: operator } = useAuthStore();

  const activeCurrencies = currencies.filter((c) => c.active);
  const activeCryptos = cryptos.filter((c) => c.active);
  const allCurrencies = [...activeCurrencies, ...activeCryptos];

  const handleOpenCaja = async () => {
    if (!operator) {
      console.error('No operator logged in');
      return;
    }

    try {
      await openCaja();
      setShowForm(false);
    } catch (error) {
      console.error('Error opening caja:', error);
    }
  };

  const handleCloseCaja = async () => {
    if (!operator) {
      console.error('No operator logged in');
      return;
    }

    try {
      await closeCaja();
    } catch (error) {
      console.error('Error closing caja:', error);
    }
  };

  const handleEditBalance = (balanceId: string) => {
    setEditingBalance(balanceId);
    setShowForm(true);
  };

  if (!operator) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Debe iniciar sesión para acceder a la caja</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Caja</h1>
        <div className="flex space-x-4">
          <Link
            to="/caja/history"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <History className="h-4 w-4 mr-2" />
            Ver Historial
          </Link>
          {!isOpen ? (
            <button
              onClick={handleOpenCaja}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Abrir Caja
            </button>
          ) : (
            <button
              onClick={handleCloseCaja}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Cerrar Caja
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Balances</h2>
            <button
              onClick={() => {
                setEditingBalance(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Balance
            </button>
          </div>

          {showForm && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <BalanceForm
                currencies={allCurrencies}
                onSubmit={() => {
                  setShowForm(false);
                  setEditingBalance(null);
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingBalance(null);
                }}
                cajaStatusId={operator.id}
                initialBalance={editingBalance ? balances.find(b => b.id === editingBalance) : undefined}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map((balance) => (
              <div
                key={balance.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{balance.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{balance.currency_code}</span>
                    <button
                      onClick={() => handleEditBalance(balance.id)}
                      className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {balance.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}