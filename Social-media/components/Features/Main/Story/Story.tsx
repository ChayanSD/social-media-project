"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { FiPlus } from 'react-icons/fi';
import { StoryType } from '../../../types/types';
import StoryItem from './StoryItem';
import StoryModal from './StoryModal';
import AddStoryModal from './AddStoryModal';

const Story = () => {
  const [stories, setStories] = useState<StoryType[]>([
    {
      id: 1,
      author: "John Doe",
      authorAvatar: "/profile.jpg",
      storyImage: "/post.jpg",
      timestamp: "2 hours ago",
      isViewed: false,
    },
    {
      id: 2,
      author: "Jane Smith",
      authorAvatar: "/profile.jpg",
      storyImage: "/post.jpg",
      timestamp: "4 hours ago",
      isViewed: false,
    },
    {
      id: 3,
      author: "Mike Johnson",
      authorAvatar: "/profile.jpg",
      storyImage: "/post.jpg",
      timestamp: "6 hours ago",
      isViewed: true,
    },
    {
      id: 4,
      author: "Sarah Wilson",
      authorAvatar: "/profile.jpg",
      storyImage: "/post.jpg",
      timestamp: "8 hours ago",
      isViewed: false,
    },
    {
      id: 5,
      author: "David Brown",
      authorAvatar: "/profile.jpg",
      storyImage: "/post.jpg",
      timestamp: "10 hours ago",
      isViewed: true,
    },
    {
      id: 6,
      author: "Mike Johnson",
      authorAvatar: "/profile.jpg",
      storyImage: "/post.jpg",
      timestamp: "6 hours ago",
      isViewed: true,
    },
    {
      id: 7,
      author: "Sarah Wilson",
      authorAvatar: "/profile.jpg",
      storyImage: "/post.jpg",
      timestamp: "8 hours ago",
      isViewed: false,
    },
    {
      id: 8,
      author: "David Brown",
      authorAvatar: "/profile.jpg",
      storyImage: "/post.jpg",
      timestamp: "10 hours ago",
      isViewed: true,
    },
  ]);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isAddStoryModalOpen, setIsAddStoryModalOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const handleStoryClick = (storyIndex: number) => {
    setCurrentStoryIndex(storyIndex);
    setIsStoryModalOpen(true);
  };

  const handleAddStory = (image: string) => {
    const newStory: StoryType = {
      id: Date.now(),
      author: "You",
      authorAvatar: "/profile.jpg",
      storyImage: image,
      timestamp: "now",
      isViewed: false,
      isOwnStory: true,
    };
    setStories(prev => [newStory, ...prev]);
  };

  const handleStoryViewed = (storyId: number) => {
    setStories(prev => 
      prev.map(story => 
        story.id === storyId ? { ...story, isViewed: true } : story
      )
    );
  };

  return (
    <div className="rounded-lg mb-6 md:mb-16">
      <div className="flex gap-5 overflow-x-auto scrollbar-hide">
        {/* Add Story Button */}
        <div className="flex-shrink-0 cursor-pointer" onClick={() => setIsAddStoryModalOpen(true)}>
          <div className="bg-slate-900 backdrop-blur-sm relative w-20 h-30 sm:w-30 sm:h-51 rounded-[20px] overflow-hidden border-2 border-slate-600 hover:border-slate-400 transition-colors">
            <Image
              src="/profile.jpg"
              alt="Your story"
              width={500}
              height={500}
              className="object-cover h-20 sm:h-36 rounded-b-[20px] opacity-50"
            />
            <div className="absolute -bottom-11 sm:-bottom-22 inset-0 flex items-center justify-center ">
              <div className="bg-blue-600 rounded-full sm:p-2 border-3 border-slate-900">
                <FiPlus size={20} className="text-white" />
              </div>
            </div>
          </div>
          <p className="text-xs text-white text-center mt-1">Your Story</p>
        </div>

        {/* Story Items */}
        {stories.map((story, index) => (
          <StoryItem
            key={story.id}
            story={story}
            onClick={() => handleStoryClick(index)}
          />
        ))}
      </div>

      {/* Story Modal */}
      <StoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        stories={stories}
        currentStoryIndex={currentStoryIndex}
        onStoryChange={setCurrentStoryIndex}
        onStoryViewed={handleStoryViewed}
      />

      {/* Add Story Modal */}
      <AddStoryModal
        isOpen={isAddStoryModalOpen}
        onClose={() => setIsAddStoryModalOpen(false)}
        onAddStory={handleAddStory}
      />
    </div>
  );
};

export default Story;