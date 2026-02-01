"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiX, FiChevronLeft, FiChevronRight, FiHeart, FiMessageCircle, FiSend } from 'react-icons/fi';
import { StoryType } from '../../../types/types';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryType[];
  currentStoryIndex: number;
  onStoryChange: (index: number) => void;
  onStoryViewed: (storyId: number) => void;
}

const StoryModal: React.FC<StoryModalProps> = ({
  isOpen,
  onClose,
  stories,
  currentStoryIndex,
  onStoryChange,
  onStoryViewed
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    if (!isOpen || !currentStory) return;

    // Mark story as viewed
    onStoryViewed(currentStory.id);

    // Reset progress when story changes
    setProgress(0);

    // Progress animation
    const interval = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev >= 100) {
            // Move to next story
            if (currentStoryIndex < stories.length - 1) {
              onStoryChange(currentStoryIndex + 1);
            } else {
              onClose();
            }
            return 0;
          }
          return prev + 2; // 5 seconds total (100/2 = 50 intervals of 100ms)
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentStoryIndex, currentStory, isPaused, onStoryChange, onStoryViewed, onClose, stories.length]);

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      onStoryChange(currentStoryIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      onStoryChange(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all duration-100 ${
                index < currentStoryIndex ? 'w-full' : 
                index === currentStoryIndex ? 'w-full' : 'w-0'
              }`}
              style={{
                width: index === currentStoryIndex ? `${progress}%` : 
                       index < currentStoryIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-10 hover:bg-white/20 rounded-full p-2"
      >
        <FiX size={24} />
      </button>

      {/* Story content */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={currentStory.storyImage}
          alt={currentStory.author}
          fill
          className="object-contain"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        />

        {/* Navigation arrows */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 z-10"
          disabled={currentStoryIndex === 0}
        >
          <FiChevronLeft size={24} />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 z-10"
        >
          <FiChevronRight size={24} />
        </button>

        {/* Story info */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src={currentStory.authorAvatar}
              alt={currentStory.author}
              width={40}
              height={40}
              className="rounded-full border-2 border-white"
            />
            <div>
              <p className="text-white font-semibold">{currentStory.author}</p>
              <p className="text-white/70 text-sm">{currentStory.timestamp}</p>
            </div>
          </div>

          {/* Story actions */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-black/50 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Send message"
                className="w-full bg-transparent text-white placeholder-white/70 focus:outline-none"
              />
            </div>
            <button className="text-white hover:bg-white/20 rounded-full p-2">
              <FiHeart size={20} />
            </button>
            <button className="text-white hover:bg-white/20 rounded-full p-2">
              <FiMessageCircle size={20} />
            </button>
            <button className="text-white hover:bg-white/20 rounded-full p-2">
              <FiSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryModal;
