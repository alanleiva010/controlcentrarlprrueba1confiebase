export interface NamedBalance {
  id: string;
  name: string;
  currency_code: string;
  amount: number;
  active: boolean;
  caja_status_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  clientId: string;
  operatorId: string;
  operationType: string;
  currencyOperation: string;
  amount: number;
  netAmount?: number;
  exchangeRate?: number;
  calculatedAmount?: number;
  description?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  date: Date;
  balanceId?: string;
  deductions?: {
    iibb: boolean;
    debCred: boolean;
    copter: boolean;
    custom: boolean;
    customValue?: number;
  };
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  buyRate: number;
  sellRate: number;
  active: boolean;
}

export interface Crypto {
  id: string;
  code: string;
  name: string;
  network: string;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  kycStatus?: 'NOT_COMPLETED' | 'BRIDGE_APPROVED' | 'PAYPAL_APPROVED';
  active?: boolean;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'operator' | 'cashier';
  permissions: {
    clients: boolean;
    providers: boolean;
    banks: boolean;
    cryptos: boolean;
    currencies: boolean;
    operators: boolean;
    transactions: boolean;
    reports: boolean;
  };
  active: boolean;
}

export interface OperationType {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
}