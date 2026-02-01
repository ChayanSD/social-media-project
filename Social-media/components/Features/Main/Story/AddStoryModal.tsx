"use client";
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { FiX, FiCamera, FiImage } from 'react-icons/fi';

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStory: (image: string, text?: string) => void;
}

const AddStoryModal: React.FC<AddStoryModalProps> = ({ isOpen, onClose, onAddStory }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (selectedImage) {
      onAddStory(selectedImage, storyText);
      setSelectedImage(null);
      setStoryText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Create Story</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            <FiX size={24} />
          </button>
        </div>

        {!selectedImage ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <FiImage size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-white mb-4">Add a photo or video to your story</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiCamera className="inline mr-2" />
                Choose Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <Image
                src={selectedImage}
                alt="Story preview"
                fill
                className="object-cover"
              />
            </div>
            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="Add a caption..."
              className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedImage(null)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Share Story
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStoryModal;
