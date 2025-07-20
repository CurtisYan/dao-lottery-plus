'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AccountModalContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const AccountModalContext = createContext<AccountModalContextType | undefined>(undefined);

export const AccountModalProvider = ({ children }: { children: ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <AccountModalContext.Provider value={{ isModalOpen, openModal, closeModal }}>
      {children}
    </AccountModalContext.Provider>
  );
};

export const useAppAccountModal = () => {
  const context = useContext(AccountModalContext);
  if (context === undefined) {
    throw new Error('useAppAccountModal must be used within an AccountModalProvider');
  }
  return context;
}; 