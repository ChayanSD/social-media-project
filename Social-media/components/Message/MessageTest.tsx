"use client";

import React, { useState } from 'react';
import MessagePopup from './MessagePopup';

const MessageTest = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Toggle Message Popup
      </button>
      
      <MessagePopup 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </div>
  );
};

export default MessageTest;
