"use client";

import React, { useState } from 'react';
import MessagePopup from './MessagePopup';

interface MessageProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Message = ({ isOpen = false, onClose }: MessageProps) => {
  const [isPopupOpen, setIsPopupOpen] = useState(isOpen);

  const handleClose = () => {
    setIsPopupOpen(false);
    onClose?.();
  };

  return (
    <MessagePopup 
      isOpen={isPopupOpen} 
      onClose={handleClose} 
    />
  );
};

export default Message;