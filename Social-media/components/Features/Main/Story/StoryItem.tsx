"use client";
import React from "react";
import Image from "next/image";
import { StoryType } from "../../../types/types";

interface StoryItemProps {
  story: StoryType;
  onClick: () => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ story, onClick }) => {
  return (
    <div className="flex-shrink-0 cursor-pointer" onClick={onClick}>
      <div className="relative w-20 h-30 sm:w-30 sm:h-51 rounded-[20px] overflow-hidden border-2 border-slate-600 hover:border-slate-400 transition-colors">
        <div className="absolute h-[22px] w-[22px] top-3 left-3 rounded-full z-10 border-2 border-blue-400">
          <Image
            src={story.storyImage}
            alt={story.author}
            width={100}
            height={100}
            className="object-cover h-full w-full rounded-full"
          />
        </div>
        <Image
          src={story.storyImage}
          alt={story.author}
          fill
          className="object-cover"
        />
        {!story.isViewed && (
          <div className="absolute inset-0  rounded-full p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden">
              <Image
                src={story.storyImage}
                alt={story.author}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-white text-center mt-1 truncate w-20">
        {story.author}
      </p>
    </div>
  );
};

export default StoryItem;
