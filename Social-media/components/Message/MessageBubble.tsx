"use client";

import React, { useState } from 'react';
import { IoCheckmarkDoneOutline, IoCheckmarkOutline, IoHappyOutline } from 'react-icons/io5';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  isRead: boolean;
  reactions?: Record<string, number>;
  user_reaction?: string | null;
}

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, reactionType: string) => void;
  isEditing?: boolean;
  isDeleting?: boolean;
  isReacting?: boolean;
}

const REACTION_MAP: Record<string, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

const MessageBubble = ({
  message,
  isCurrentUser,
  onEdit,
  onDelete,
  onReact,
  isEditing = false,
  isDeleting = false,
  isReacting = false
}: MessageBubbleProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
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
    if (!editMode) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (showReactionPicker) return;
    // Add a small delay before closing to allow moving to the menu
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMenuMouseLeave = () => {
    if (!showReactionPicker) {
      setIsHovered(false);
    }
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

  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;

  return (
    <div
      className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'} group mb-4`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isHovered && !editMode && (
        <div
          className={`flex items-center gap-1 rounded-lg pt-1 z-10 ${isCurrentUser ? 'order-1' : 'order-2'}`}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
              title="React to message"
            >
              <IoHappyOutline size={18} />
            </button>

            {showReactionPicker && (
              <div className="absolute bottom-full mb-2 -left-13 bg-gray-800 border border-gray-700 rounded-full shadow-xl p-1 flex items-center gap-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                {Object.entries(REACTION_MAP).map(([type, emoji]) => (
                  <button
                    key={type}
                    onClick={() => {
                      onReact?.(message.id, type);
                      setShowReactionPicker(false);
                    }}
                    className={`p-1.5 hover:bg-gray-700 rounded-full transition-all hover:scale-125 ${message.user_reaction === type ? 'bg-blue-500/30' : ''}`}
                    title={type}
                  >
                    <span className="text-lg">{emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isCurrentUser && (
            <>
              <button
                onClick={() => {
                  setIsHovered(false);
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
                <FiEdit2 size={14} className="text-gray-400 hover:text-white" />
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
                <FiTrash2 size={14} className="text-red-400/70 hover:text-red-400" />
              </button>
            </>
          )}
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
          onClick={(e) => {
            if (!editMode) {
              e.stopPropagation();
              setIsHovered(!isHovered);
            }
          }}
          className={`px-4 py-2 rounded-2xl shadow-sm cursor-pointer transition-all active:scale-[0.98] ${isCurrentUser
            ? 'bg-[#0059ff] text-white rounded-br-md shadow-blue-500/10'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-gray-700 shadow-gray-200/50'
            }`}
        >
          {editMode ? (
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEdit}
              className="bg-transparent text-current text-sm leading-relaxed resize-none focus:outline-none overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            />
          ) : (
            <p ref={textRef} className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
          )}
        </div>

        {/* Reactions Display */}
        {hasReactions && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm">
              {Object.entries(message.reactions || {}).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => onReact?.(message.id, type)}
                  className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${message.user_reaction === type ? 'text-blue-500 font-medium' : ''}`}
                >
                  <span className="text-xs">{REACTION_MAP[type]}</span>
                  <span className="text-[10px]">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'} px-1`}>
          <span className="text-[10px] text-gray-400 font-medium">
            {message.timestamp}
          </span>
          {isCurrentUser && (
            <div className="ml-1 opacity-70">
              {message.isRead ? (
                <span className="text-blue-400"><IoCheckmarkDoneOutline size={14} /></span>
              ) : (
                <span className="text-gray-400"><IoCheckmarkOutline size={14} /></span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
