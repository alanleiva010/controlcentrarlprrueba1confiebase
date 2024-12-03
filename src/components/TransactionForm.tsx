import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Client } from '../types';
import { useOperationTypeStore } from '../store/useOperationTypeStore';
import { useBalanceStore } from '../store/useBalanceStore';
import { Upload, X } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const NO_BALANCE_OPERATIONS = [
  'USDT_IN',
  'USDT_OUT',
  'USD_IN',
  'USD_OUT',
];

const transactionSchema = z.object({
  clientId: z.string().min(1, 'Cliente es requerido'),
  operationType: z.string().min(1, 'Tipo de operación es requerido'),
  currencyOperation: z.string().min(1, 'Operación es requerida'),
  balanceId: z.string().optional(),
  amount: z.number().min(0, 'El monto debe ser positivo'),
  exchangeRate: z.number().optional(),
  calculatedAmount: z.number().optional(),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  clients: Client[];
  onSubmit: (data: TransactionFormData & { 
    attachmentUrl?: string;
    attachmentName?: string;
    netAmount?: number;
    deductions?: {
      iibb: boolean;
      debCred: boolean;
      copter: boolean;
      custom: boolean;
      customValue?: number;
    };
  }) => void;
  onCancel: () => void;
}

export function TransactionForm({ clients, onSubmit, onCancel }: TransactionFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { operationTypes } = useOperationTypeStore();
  const { balances } = useBalanceStore();
  const activeOperationTypes = operationTypes.filter(t => t.active);
  const activeBalances = balances.filter(b => b.active);

  const [deductions, setDeductions] = useState({
    iibb: false,
    debCred: false,
    copter: false,
    custom: false,
    customValue: 0,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

  const currencyOperation = watch('currencyOperation');
  const amount = watch('amount');
  const exchangeRate = watch('exchangeRate');

  const calculateNetAmount = (originalAmount: number): number => {
    let totalDeductionPercentage = 0;
    if (deductions.iibb) totalDeductionPercentage += 3;
    if (deductions.debCred) totalDeductionPercentage += 0.6;
    if (deductions.copter) totalDeductionPercentage += 0.3;
    if (deductions.custom) totalDeductionPercentage += deductions.customValue;

    return originalAmount * (1 - totalDeductionPercentage / 100);
  };

  const shouldShowDeductionsAfterCalculatedAmount = (operation: string) => {
    return ['USDT_SELL', 'USD_SELL'].includes(operation);
  };

  const shouldShowDeductionsBeforeCalculatedAmount = (operation: string) => {
    return ['ARS_IN', 'ARS_OUT', 'USDT_BUY', 'USD_BUY'].includes(operation);
  };

  useEffect(() => {
    if (amount && exchangeRate && (currencyOperation?.includes('BUY') || currencyOperation?.includes('SELL'))) {
      let calculatedValue;
      
      if (currencyOperation?.includes('BUY')) {
        const netArsAmount = calculateNetAmount(amount);
        calculatedValue = netArsAmount / exchangeRate;
      } else {
        calculatedValue = amount * exchangeRate;
      }
      
      setValue('calculatedAmount', calculatedValue);
    }
  }, [amount, exchangeRate, currencyOperation, deductions, setValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('El archivo es demasiado grande. El tamaño máximo es 5MB.');
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      alert('Tipo de archivo no soportado. Use PDF, JPG o PNG.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFormSubmit = async (data: TransactionFormData) => {
    let attachmentUrl = '';
    let attachmentName = '';
    let netAmount = undefined;

    if (selectedFile) {
      attachmentUrl = URL.createObjectURL(selectedFile);
      attachmentName = selectedFile.name;
    }

    if (shouldShowDeductionsBeforeCalculatedAmount(data.currencyOperation)) {
      netAmount = calculateNetAmount(data.amount);
    } else if (shouldShowDeductionsAfterCalculatedAmount(data.currencyOperation)) {
      netAmount = data.calculatedAmount ? calculateNetAmount(data.calculatedAmount) : undefined;
    }

    onSubmit({
      ...data,
      attachmentUrl,
      attachmentName,
      netAmount,
      deductions: (shouldShowDeductionsBeforeCalculatedAmount(data.currencyOperation) || 
                  shouldShowDeductionsAfterCalculatedAmount(data.currencyOperation)) ? {
        ...deductions,
        customValue: deductions.custom ? deductions.customValue : undefined,
      } : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Cliente</label>
        <select
          {...register('clientId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Seleccionar cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        {errors.clientId && (
          <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Operación
        </label>
        <select
          {...register('currencyOperation')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Seleccionar operación</option>
          <option value="ARS_IN">Entrada de ARS</option>
          <option value="ARS_OUT">Salida de ARS</option>
          <option value="USDT_BUY">Compra de USDT</option>
          <option value="USDT_SELL">Venta de USDT</option>
          <option value="USDT_IN">Entrada de USDT</option>
          <option value="USDT_OUT">Salida de USDT</option>
          <option value="USD_IN">Entrada de USD</option>
          <option value="USD_OUT">Salida de USD</option>
          <option value="USD_BUY">Compra de USD</option>
          <option value="USD_SELL">Venta de USD</option>
        </select>
        {errors.currencyOperation && (
          <p className="mt-1 text-sm text-red-600">{errors.currencyOperation.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo de operación
        </label>
        <select
          {...register('operationType')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Seleccionar tipo</option>
          {activeOperationTypes.map((type) => (
            <option key={type.id} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
        {errors.operationType && (
          <p className="mt-1 text-sm text-red-600">{errors.operationType.message}</p>
        )}
      </div>

      {!NO_BALANCE_OPERATIONS.includes(currencyOperation || '') && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Balance</label>
          <select
            {...register('balanceId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Seleccionar balance</option>
            {activeBalances
              .filter(b => {
                const currency = currencyOperation?.split('_')[0];
                return b.currency === currency;
              })
              .map((balance) => (
                <option key={balance.id} value={balance.id}>
                  {balance.name} ({balance.amount.toFixed(2)} {balance.currency})
                </option>
              ))}
          </select>
          {errors.balanceId && (
            <p className="mt-1 text-sm text-red-600">{errors.balanceId.message}</p>
          )}
        </div>
      )}

      {currencyOperation && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {currencyOperation.includes('BUY') ? 'Monto en ARS a entregar' : 'Monto'}
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {shouldShowDeductionsBeforeCalculatedAmount(currencyOperation) && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Deducciones</h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deductions.iibb}
                  onChange={(e) => setDeductions({ ...deductions, iibb: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">IIBB 3%</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deductions.debCred}
                  onChange={(e) => setDeductions({ ...deductions, debCred: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">DEB/CRED 0.6%</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deductions.copter}
                  onChange={(e) => setDeductions({ ...deductions, copter: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">COPTER 0.3%</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deductions.custom}
                  onChange={(e) => setDeductions({ ...deductions, custom: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">Personalizado</span>
              </label>
              {deductions.custom && (
                <input
                  type="number"
                  step="0.01"
                  value={deductions.customValue}
                  onChange={(e) => setDeductions({ ...deductions, customValue: parseFloat(e.target.value) || 0 })}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Porcentaje personalizado"
                />
              )}
              {amount > 0 && (
                <div className="mt-4 p-2 bg-white rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    Monto Neto ARS: ${calculateNetAmount(amount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {(currencyOperation === 'USDT_BUY' || 
            currencyOperation === 'USDT_SELL' || 
            currencyOperation === 'USD_BUY' || 
            currencyOperation === 'USD_SELL') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cotización
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('exchangeRate', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {currencyOperation.includes('BUY') 
                    ? `Cantidad de ${currencyOperation.includes('USDT') ? 'USDT' : 'USD'} a recibir`
                    : `Cantidad de ARS a recibir`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount && exchangeRate ? (
                    currencyOperation.includes('BUY') 
                      ? (calculateNetAmount(amount) / exchangeRate).toFixed(2)
                      : (amount * exchangeRate).toFixed(2)
                  ) : ''}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {shouldShowDeductionsAfterCalculatedAmount(currencyOperation) && amount && exchangeRate && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700">Deducciones sobre ARS a recibir</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deductions.iibb}
                      onChange={(e) => setDeductions({ ...deductions, iibb: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">IIBB 3%</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deductions.debCred}
                      onChange={(e) => setDeductions({ ...deductions, debCred: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">DEB/CRED 0.6%</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deductions.copter}
                      onChange={(e) => setDeductions({ ...deductions, copter: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">COPTER 0.3%</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deductions.custom}
                      onChange={(e) => setDeductions({ ...deductions, custom: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Personalizado</span>
                  </label>
                  {deductions.custom && (
                    <input
                      type="number"
                      step="0.01"
                      value={deductions.customValue}
                      onChange={(e) => setDeductions({ ...deductions, customValue: parseFloat(e.target.value) || 0 })}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Porcentaje personalizado"
                    />
                  )}
                  {amount > 0 && exchangeRate > 0 && (
                    <div className="mt-4 p-2 bg-white rounded border border-gray-200">
                      <p className="text-sm font-medium text-gray-700">
                        Monto Neto ARS: ${calculateNetAmount(amount * exchangeRate).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Documentación (opcional)
        </label>
        <div className="mt-1 flex items-center">
          <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
            <div className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile ? selectedFile.name : 'Subir archivo'}
            </div>
            <input
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              accept={ACCEPTED_FILE_TYPES.join(',')}
            />
          </label>
          {selectedFile && (
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="ml-2 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          PDF, JPG o PNG. Máximo 5MB.
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}