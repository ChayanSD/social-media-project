"use client";

import React, { useState } from 'react';
import { IoCheckmarkDoneOutline, IoCheckmarkOutline } from 'react-icons/io5';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  isRead: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
  isEditing?: boolean;
  isDeleting?: boolean;
}

const MessageBubble = ({ message, isCurrentUser, onEdit, onDelete, isEditing = false, isDeleting = false }: MessageBubbleProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [textareaDimensions, setTextareaDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  const handleEdit = () => {
    if (editText.trim() && editText !== message.text && onEdit) {
      onEdit(message.id, editText.trim());
      setEditMode(false);
    } else {
      setEditMode(false);
      setEditText(message.text);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditText(message.text);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.(message.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleMouseEnter = () => {
    if (isCurrentUser && !editMode) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    // Add a small delay before closing to allow moving to the menu
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMenuMouseLeave = () => {
    setIsHovered(false);
  };

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Set cursor to end and match dimensions when entering edit mode
  React.useEffect(() => {
    if (editMode && textareaRef.current && textareaDimensions) {
      const textarea = textareaRef.current;
      
      // Match the exact dimensions of the original text
      textarea.style.width = `${textareaDimensions.width}px`;
      textarea.style.height = `${textareaDimensions.height}px`;
      
      // Set cursor to end of text
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, [editMode, textareaDimensions]);

  return (
    <div 
      className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isCurrentUser && isHovered && !editMode && (
        <div 
          className="flex items-center gap-1 rounded-lg pt-2 z-10 order-1"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <button
            onClick={() => {
              setIsHovered(false);
              // Measure text element dimensions before switching to edit mode
              if (textRef.current) {
                const textElement = textRef.current;
                setTextareaDimensions({
                  width: textElement.offsetWidth,
                  height: textElement.offsetHeight,
                });
              }
              setEditMode(true);
            }}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Edit message"
          >
            <FiEdit2 size={14} className="text-white" />
          </button>
          <button
            onClick={() => {
              setIsHovered(false);
              handleDelete();
            }}
            disabled={isDeleting}
            className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            title="Delete message"
          >
            <FiTrash2 size={14} className="text-red-400" />
          </button>
        </div>
      )}
      <div className={`max-w-[80%] ${isCurrentUser ? 'order-2' : 'order-1'} relative`}>
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete Message"
          description="Are you sure you want to delete this message? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
        <div
          className={`px-4 py-2 rounded-2xl ${
            isCurrentUser
              ? 'bg-[#0059ff] text-white rounded-br-md'
              : 'bg-gray-200 text-gray-900 rounded-bl-md'
          }`}
        >
          {editMode ? (
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEdit}
              className="bg-transparent text-white text-sm leading-relaxed resize-none focus:outline-none overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            />
          ) : (
            <p ref={textRef} className="text-sm leading-relaxed">{message.text}</p>
          )}
        </div>
        <div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {message.timestamp}
          </span>
          {isCurrentUser && (
            <div className="ml-1">
              {message.isRead ? (
                <span className="text-blue-500 text-xs"><IoCheckmarkDoneOutline size={16} /></span>
              ) : (
                <span className="text-gray-400 text-xs"><IoCheckmarkOutline size={16} /></span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
