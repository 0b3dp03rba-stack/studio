
"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Simplified Store as data now comes from Firestore hooks
export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>{children}</>
  );
};

export const useApp = () => {
  return {}; // Legacy support for any lingering calls
};
