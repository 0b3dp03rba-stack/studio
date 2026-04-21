
"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// File ini dikosongkan karena aplikasi sekarang 100% menggunakan Firestore Hooks
// untuk manajemen data real-time, menghilangkan kebutuhan akan state lokal manual.

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>{children}</>
  );
};

export const useApp = () => {
  return {
    state: {
      users: [],
      messages: [],
      currentUser: null,
    },
    dispatch: () => {}
  }; 
};
