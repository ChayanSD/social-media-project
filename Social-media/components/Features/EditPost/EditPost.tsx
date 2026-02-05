"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import {
  FiImage,
  FiLink,
  FiSave,
  FiType,
} from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import CustomDialog from "@/components/ui/CustomDialog";
import {
  type UpdatePostRequest,
  useUpdatePostMutation,
  type PostItem,
} from "@/store/postApi";
import { toast } from "@/components/ui/sonner";
import { getApiBaseUrl } from "@/lib/utils";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";

interface FormData {
  title: string;
  content: string;
  tags: string[];
  postType: "text" | "image" | "link";
  linkUrl?: string;
  videoUrl?: string;
  files?: File[];
}

type MediaPreview = {
  id: string;
  file?: File;
  url: string;
  isExisting?: boolean;
  existingPath?: string;
};

interface EditPostProps {
  post: PostItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditPost: React.FC<EditPostProps> = ({ post, isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<"text" | "image" | "link">("text");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<MediaPreview[]>([]);
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const { data: profileData } = useGetCurrentUserProfileQuery();

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((media) => {
        if (media.url && !media.isExisting) {
          URL.revokeObjectURL(media.url);
        }
      });
    };
  }, []);

  // Initialize form with post data
  useEffect(() => {
    if (post && isOpen) {
      setValue("title", post.title || "");
      setValue("content", post.content || "");
      setTags(post.tags || []);
      setValue("tags", post.tags || []);

      // Determine post type
      if (post.media_file && post.media_file.length > 0) {
        setActiveTab("image");
        setValue("postType", "image");
        // Load existing media
        const apiBase = getApiBaseUrl();
        const baseUrl = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
        const existingMedia: MediaPreview[] = (post.media_file || []).map((path: string) => ({
          id: `existing-${path}`,
          url: `${baseUrl}media/${path.startsWith("/") ? path.slice(1) : path}`,
          isExisting: true,
          existingPath: path,
        }));
        setMediaPreviews(existingMedia);
        previewsRef.current = existingMedia;
      } else if (post.link && typeof post.link === 'string') {
        setActiveTab("link");
        setValue("postType", "link");
        setValue("linkUrl", post.link);
      } else {
        setActiveTab("text");
        setValue("postType", "text");
      }

      if (post.video_url) {
        setValue("videoUrl", post.video_url);
        // If it's only a video URL, we should switch to the image/video tab
        if (!post.media_file || post.media_file.length === 0) {
          setActiveTab("image");
          setValue("postType", "image");
        }
      }
    }
  }, [post, isOpen]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      content: "",
      tags: [],
      postType: "text",
      linkUrl: "",
      videoUrl: "",
      files: [],
    },
  });

  const titleValue = watch("title");
  const contentValue = watch("content");

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag) && tags.length < 5) {
        const updatedTags = [...tags, newTag];
        setTags(updatedTags);
        setValue("tags", updatedTags);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    setValue("tags", updatedTags);
  };

  const handleInterestClick = (interestName: string) => {
    if (!tags.includes(interestName) && tags.length < 5) {
      const updatedTags = [...tags, interestName];
      setTags(updatedTags);
      setValue("tags", updatedTags);
    }
  };

  // Get user interests from profile
  const userInterests = profileData?.data?.interests || {};
  const allInterests: Array<{ name: string; category: string }> = [];
  Object.entries(userInterests).forEach(([category, interests]) => {
    if (Array.isArray(interests)) {
      interests.forEach((interest: { id: number; name: string }) => {
        allInterests.push({ name: interest.name, category });
      });
    }
  });

  // Filter out interests that are already added as tags
  const availableInterests = allInterests.filter(
    (interest) => !tags.includes(interest.name)
  );

  const createPreviewEntry = (file: File): MediaPreview => ({
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${file.name}-${file.lastModified}-${Math.random()}`,
    file,
    url: URL.createObjectURL(file),
    isExisting: false,
  });

  const updateFormFiles = (items: MediaPreview[]) => {
    previewsRef.current = items;
    const newFiles = items.filter((item) => !item.isExisting && item.file).map((item) => item.file!);
    setValue("files", newFiles.length ? newFiles : undefined);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newEntries = Array.from(files).map(createPreviewEntry);
      setMediaPreviews((prev) => {
        const updated = [...prev, ...newEntries];
        updateFormFiles(updated);
        return updated;
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaPreviews((prev) => {
      const target = prev.find((media) => media.id === id);
      if (target && !target.isExisting) {
        URL.revokeObjectURL(target.url);
      }
      const updated = prev.filter((media) => media.id !== id);
      updateFormFiles(updated);

      if (updated.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return updated;
    });
  };

  const derivePostType = (): UpdatePostRequest["post_type"] => {
    if (activeTab === "image") return "media";
    if (activeTab === "link") return "link";
    return "text";
  };

  const onSubmit = async (data: FormData) => {
    try {
      const updateData: UpdatePostRequest = {
        title: data.title,
        post_type: derivePostType(),
      };

      if (data.content) {
        updateData.content = data.content;
      }

      if (activeTab === "link" && data.linkUrl) {
        updateData.link = data.linkUrl;
      }

      if (data.videoUrl) {
        updateData.video_url = data.videoUrl;
        updateData.post_type = "media";
      }

      if (tags.length > 0) {
        updateData.tags = tags;
      }

      // Only include new files, not existing ones
      const newFiles = data.files?.filter(Boolean);
      if (newFiles && newFiles.length > 0) {
        updateData.media_files = newFiles;
      }

      await updatePost({
        postId: post.id,
        data: updateData,
      }).unwrap();

      toast.success("Post updated successfully!");
      onClose();
      reset();
      setTags([]);
      setTagInput("");
      mediaPreviews.forEach((media) => {
        if (!media.isExisting) {
          URL.revokeObjectURL(media.url);
        }
      });
      setMediaPreviews([]);
      updateFormFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post. Please try again.");
    }
  };

  const tabs = [
    { id: "text", label: "Text", icon: FiType },
    { id: "image", label: "Image & Videos", icon: FiImage },
    { id: "link", label: "Link", icon: FiLink },
  ] as const;

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Edit Post"
      maxWidth="4xl"
      maxHeight="90vh"
      contentClassName="overflow-y-auto"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Post Type Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setValue("postType", tab.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${activeTab === tab.id
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                    }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-white font-medium">Title</label>
            <div className="relative">
              <input
                {...register("title", {
                  required: "Title is required",
                  maxLength: {
                    value: 300,
                    message: "Title must be less than 300 characters",
                  },
                })}
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                placeholder="Enter your post title..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {titleValue?.length || 0}/300
              </div>
            </div>
            {errors.title && (
              <p className="text-red-400 text-sm">{errors.title.message}</p>
            )}
          </div>

          {/* Tags Section */}
          <div className="space-y-3">
            <label className="block text-white font-medium">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-400/30"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <IoMdClose size={14} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add tags (press Enter to add, max 5)"
              className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
              disabled={tags.length >= 5}
            />
            {tags.length >= 5 && (
              <p className="text-yellow-400 text-sm">
                Maximum 5 tags allowed
              </p>
            )}
            {availableInterests.length > 0 && (
              <div className="mb-6 mx-1">
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map((interest, index) => {
                    const isDisabled = tags.length >= 5;
                    return (
                      <button
                        key={`${interest.category}-${interest.name}-${index}`}
                        type="button"
                        onClick={() => handleInterestClick(interest.name)}
                        disabled={isDisabled}
                        className={`px-3 py-1 rounded-full text-xs transition-all ${isDisabled
                          ? "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                          : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 hover:text-white cursor-pointer"
                          }`}
                      >
                        {interest.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Content based on post type */}
          {activeTab === "text" && (
            <div className="space-y-2">
              <label className="block text-white font-medium">
                Body Text (optional)
              </label>
              <textarea
                {...register("content")}
                rows={8}
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 resize-none"
                placeholder="Write your post content here..."
              />
            </div>
          )}

          {activeTab === "image" && (
            <div className="space-y-4">
              <label className="block text-white font-medium">
                Upload Images
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400/50 hover:bg-purple-500/5 transition-all duration-300"
              >
                <FiImage size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-white mb-2">
                  Click to upload Image
                </p>
                <p className="text-gray-400 text-sm">
                  Images up to 3MB each
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="space-y-2 mt-4">
                <label className="block text-white text-sm font-medium">Or paste a video link (YouTube, Vimeo, etc.)</label>
                <input
                  {...register("videoUrl")}
                  type="url"
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {mediaPreviews.slice(0, 5).map((media, idx) => {
                    const isOverflowTile =
                      idx === 4 && mediaPreviews.length > 5;
                    const isVideo = media.file
                      ? media.file.type.startsWith('video/')
                      : media.url && (media.url.includes('.mp4') || media.url.includes('.mov') || media.url.includes('.webm') || media.url.includes('video'));
                    const isImage = media.file
                      ? media.file.type.startsWith('image/')
                      : !isVideo;

                    return (
                      <div
                        key={media.id}
                        className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10 group"
                      >
                        {isImage ? (
                          <Image
                            src={media.url}
                            alt={`Preview ${idx + 1}`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 50vw, 20vw"
                            className="object-cover"
                          />
                        ) : isVideo ? (
                          <div className="relative w-full h-full">
                            <video
                              src={media.url}
                              className="absolute inset-0 w-full h-full object-cover"
                              muted
                              preload="metadata"
                              playsInline
                              onLoadedMetadata={(e) => {
                                const video = e.currentTarget;
                                video.currentTime = 0.1;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none z-10">
                              <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
                                <svg
                                  className="w-6 h-6 text-white ml-1"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {isOverflowTile && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-lg font-semibold z-10">
                            +{mediaPreviews.length - 4} more
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(media.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
                        >
                          <IoMdClose size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "link" && (
            <div className="space-y-2">
              <label className="block text-white font-medium">Link URL</label>
              <input
                {...register("linkUrl", {
                  required:
                    activeTab === "link" ? "Link URL is required" : false,
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: "Please enter a valid URL",
                  },
                })}
                type="url"
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                placeholder="https://example.com"
              />
              {errors.linkUrl && (
                <p className="text-red-400 text-sm">
                  {errors.linkUrl.message}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all duration-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUpdating || !titleValue?.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              <FiSave size={18} />
              {isSubmitting || isUpdating
                ? "Updating..."
                : "Update Post"}
            </button>
          </div>
        </form>
      </div>
    </CustomDialog>
  );
};

export default EditPost;

