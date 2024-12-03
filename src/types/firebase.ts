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

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}