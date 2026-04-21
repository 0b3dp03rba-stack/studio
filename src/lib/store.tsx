
"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// --- Types ---

export type Role = 'User' | 'Admin';

export type User = {
  id: string;
  email: string;
  password?: string;
  role: Role;
  balance: number;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
};

export type SubmissionStatus = 'Pending' | 'Proses' | 'Disetujui' | 'Ditolak';

export type GmailItem = {
  id: string;
  email: string;
  pass: string;
  status: SubmissionStatus;
  adminNote?: string;
};

export type Batch = {
  id: string;
  userId: string;
  items: GmailItem[];
  createdAt: string;
  status: 'Pending' | 'Selesai';
};

export type WithdrawStatus = 'Pending' | 'Disetujui' | 'Ditolak';

export type WithdrawalRequest = {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  totalDeduction: number;
  method: string;
  status: WithdrawStatus;
  createdAt: string;
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
};

export type AppSettings = {
  gmailRate: number;
  minWithdraw: number;
  adminFee: number;
  paymentMethods: { name: string; enabled: boolean }[];
  floatingBtnLink: string;
  rules: string[];
  announcements: string[];
};

export type AppState = {
  currentUser: User | null;
  users: User[];
  batches: Batch[];
  withdrawals: WithdrawalRequest[];
  messages: Message[];
  settings: AppSettings;
};

// --- Initial Data ---

const initialSettings: AppSettings = {
  gmailRate: 6000,
  minWithdraw: 10000,
  adminFee: 500,
  paymentMethods: [
    { name: 'DANA', enabled: true },
    { name: 'OVO', enabled: true },
    { name: 'GoPay', enabled: true },
    { name: 'BCA', enabled: true },
  ],
  floatingBtnLink: 'https://t.me/your_telegram',
  rules: [
    'Format pengiriman: email|password (satu akun per baris)',
    'Hanya menerima akun Gmail fresh atau umur tertentu sesuai instruksi admin',
    'Dilarang mengirimkan data yang sudah pernah disetorkan sebelumnya',
    'Admin berhak menolak akun yang tidak valid atau bermasalah'
  ],
  announcements: [
    'Selamat datang di GmailKu! Platform setoran gmail terpercaya dengan sistem otomatis.',
    'Pencairan dana diproses maksimal 1x24 jam pada hari kerja.'
  ],
};

const initialUsers: User[] = [
  {
    id: 'admin-1',
    email: 'creeppermoment@gmail.com',
    password: 'obed12',
    role: 'Admin',
    balance: 0,
  },
  {
    id: 'user-1',
    email: 'user@example.com',
    password: 'password123',
    role: 'User',
    balance: 0,
    bankName: 'DANA',
    bankAccount: '08123456789',
    bankAccountName: 'User Tester'
  }
];

const initialState: AppState = {
  currentUser: null,
  users: initialUsers,
  batches: [],
  withdrawals: [],
  messages: [],
  settings: initialSettings,
};

// --- Actions ---

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER'; payload: User }
  | { type: 'UPDATE_PROFILE'; payload: { bankName: string; bankAccount: string; bankAccountName: string } }
  | { type: 'SUBMIT_BATCH'; payload: Batch }
  | { type: 'PROCESS_GMAIL'; payload: { batchId: string; gmailId: string; status: SubmissionStatus } }
  | { type: 'CREATE_WITHDRAWAL'; payload: WithdrawalRequest }
  | { type: 'PROCESS_WITHDRAWAL'; payload: { withdrawalId: string; status: WithdrawStatus } }
  | { type: 'SEND_MESSAGE'; payload: Message }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_PAYMENT_METHOD'; payload: string }
  | { type: 'DELETE_PAYMENT_METHOD'; payload: string }
  | { type: 'TOGGLE_PAYMENT_METHOD'; payload: string }
  | { type: 'ADD_RULE'; payload: string }
  | { type: 'DELETE_RULE'; payload: number }
  | { type: 'ADD_ANNOUNCEMENT'; payload: string }
  | { type: 'DELETE_ANNOUNCEMENT'; payload: number };

// --- Reducer ---

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };
    case 'REGISTER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_PROFILE': {
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, ...action.payload };
      return {
        ...state,
        currentUser: updatedUser,
        users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
      };
    }
    case 'SUBMIT_BATCH':
      return { ...state, batches: [action.payload, ...state.batches] };
    case 'PROCESS_GMAIL': {
      const updatedBatches = state.batches.map(batch => {
        if (batch.id === action.payload.batchId) {
          const updatedItems = batch.items.map(item =>
            item.id === action.payload.gmailId ? { ...item, status: action.payload.status } : item
          );
          const isSelesai = updatedItems.every(i => i.status === 'Disetujui' || i.status === 'Ditolak');
          return { ...batch, items: updatedItems, status: isSelesai ? 'Selesai' : 'Pending' };
        }
        return batch;
      });

      const targetBatch = state.batches.find(b => b.id === action.payload.batchId);
      if (!targetBatch) return { ...state, batches: updatedBatches };

      const userId = targetBatch.userId;
      const totalApprovedGmails = updatedBatches
        .filter(b => b.userId === userId)
        .flatMap(b => b.items)
        .filter(i => i.status === 'Disetujui').length;

      const totalWithdrawalsApproved = state.withdrawals
        .filter(w => w.userId === userId && w.status === 'Disetujui')
        .reduce((sum, w) => sum + w.totalDeduction, 0);

      const newBalance = (totalApprovedGmails * state.settings.gmailRate) - totalWithdrawalsApproved;

      const updatedUsers = state.users.map(u =>
        u.id === userId ? { ...u, balance: newBalance } : u
      );

      const newState = { ...state, batches: updatedBatches, users: updatedUsers };
      if (state.currentUser?.id === userId) {
        newState.currentUser = { ...state.currentUser, balance: newBalance };
      }
      return newState;
    }
    case 'CREATE_WITHDRAWAL':
      return { ...state, withdrawals: [action.payload, ...state.withdrawals] };
    case 'PROCESS_WITHDRAWAL': {
      const withdrawal = state.withdrawals.find(w => w.id === action.payload.withdrawalId);
      if (!withdrawal) return state;

      const updatedWithdrawals = state.withdrawals.map(w =>
        w.id === action.payload.withdrawalId ? { ...w, status: action.payload.status } : w
      );

      const userId = withdrawal.userId;
      const totalApprovedGmails = state.batches
        .filter(b => b.userId === userId)
        .flatMap(b => b.items)
        .filter(i => i.status === 'Disetujui').length;

      const totalWithdrawalsApproved = updatedWithdrawals
        .filter(w => w.userId === userId && w.status === 'Disetujui')
        .reduce((sum, w) => sum + w.totalDeduction, 0);

      const newBalance = (totalApprovedGmails * state.settings.gmailRate) - totalWithdrawalsApproved;

      const updatedUsers = state.users.map(u =>
        u.id === userId ? { ...u, balance: newBalance } : u
      );

      const newState = { ...state, withdrawals: updatedWithdrawals, users: updatedUsers };
      if (state.currentUser?.id === userId) {
        newState.currentUser = { ...state.currentUser, balance: newBalance };
      }
      return newState;
    }
    case 'SEND_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_PAYMENT_METHOD':
      return {
        ...state,
        settings: {
          ...state.settings,
          paymentMethods: [...state.settings.paymentMethods, { name: action.payload, enabled: true }]
        }
      };
    case 'DELETE_PAYMENT_METHOD':
      return {
        ...state,
        settings: {
          ...state.settings,
          paymentMethods: state.settings.paymentMethods.filter(m => m.name !== action.payload)
        }
      };
    case 'TOGGLE_PAYMENT_METHOD':
      return {
        ...state,
        settings: {
          ...state.settings,
          paymentMethods: state.settings.paymentMethods.map(m =>
            m.name === action.payload ? { ...m, enabled: !m.enabled } : m
          )
        }
      };
    case 'ADD_RULE':
      return { ...state, settings: { ...state.settings, rules: [...state.settings.rules, action.payload] } };
    case 'DELETE_RULE':
      return { ...state, settings: { ...state.settings, rules: state.settings.rules.filter((_, i) => i !== action.payload) } };
    case 'ADD_ANNOUNCEMENT':
      return { ...state, settings: { ...state.settings, announcements: [action.payload, ...state.settings.announcements] } };
    case 'DELETE_ANNOUNCEMENT':
      return { ...state, settings: { ...state.settings, announcements: state.settings.announcements.filter((_, i) => i !== action.payload) } };
    default:
      return state;
  }
}

// --- Context ---

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
