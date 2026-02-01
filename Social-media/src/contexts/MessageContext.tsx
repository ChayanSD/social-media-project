"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  isOnline?: boolean;
  lastSeen?: string;
  timestamp?: string;
  roomId?: number | string;
  isGroup?: boolean;
}

interface MessageContextType {
  isOpen: boolean;
  selectedUser: User | null;
  openMessagePopup: (user?: User) => void;
  closeMessagePopup: () => void;
  selectUser: (user: User | null) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const openMessagePopup = useCallback((user?: User) => {
    setIsOpen(true);
    if (user) {
      setSelectedUser(user);
    }
  }, []);

  const closeMessagePopup = useCallback(() => {
    setIsOpen(false);
    setSelectedUser(null);
  }, []);

  const selectUser = useCallback((user: User | null) => {
    setSelectedUser(user);
  }, []);

  return (
    <MessageContext.Provider
      value={{
        isOpen,
        selectedUser,
        openMessagePopup,
        closeMessagePopup,
        selectUser,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

