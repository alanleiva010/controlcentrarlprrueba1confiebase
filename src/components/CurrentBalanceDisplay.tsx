import React from 'react';
import { Calculator } from 'lucide-react';
import { DailyBalance, Currency, Crypto } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface CurrentBalanceDisplayProps {
  currentBalance: DailyBalance;
  currencies: (Currency | Crypto)[];
}

export function CurrentBalanceDisplay({ 
  currentBalance, 
  currencies
}: CurrentBalanceDisplayProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Saldos de Caja</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currencies.map((currency) => {
            const amounts = currentBalance.balances[currency.code];
            if (!amounts) return null;

            return (
              <div
                key={`${currency.code}-${currency.id}`}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Calculator className="h-5 w-5 text-gray-400" />
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {currency.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {currency.code}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Inicial</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(amounts.initialAmount, `${currency.code}_IN`)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Actual</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(amounts.currentAmount, `${currency.code}_IN`)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Diferencia</p>
                    <p
                      className={`text-sm font-medium ${
                        amounts.currentAmount - amounts.initialAmount >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(
                        amounts.currentAmount - amounts.initialAmount,
                        `${currency.code}_IN`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}