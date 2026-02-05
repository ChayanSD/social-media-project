"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import {
  FiImage,
  FiLink,
  FiSave,
  FiSend,
  FiType,
} from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import CustomDialog from "@/components/ui/CustomDialog";
import {
  type CreatePostRequest,
  useCreatePostMutation,
} from "@/store/postApi";
import { toast } from "@/components/ui/sonner";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import { useRouter } from "next/navigation";

interface FormData {
  title: string;
  content: string;
  tags: string[];
  postType: "text" | "image" | "link";
  linkUrl?: string;
  files?: File[];
}

type MediaPreview = {
  id: string;
  file: File;
  url: string;
};

interface SharedPostData {
  content?: string;
  title?: string;
  mediaUrls?: string[];
}

const CreatePost = ({
  isProfile = false,
  communityId,
  onSuccess,
  sharedPostData
}: {
  isProfile?: boolean;
  communityId?: number | string;
  onSuccess?: () => void;
  sharedPostData?: SharedPostData;
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"text" | "image" | "link">("text");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<MediaPreview[]>([]);
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const { data: profileData } = useGetCurrentUserProfileQuery();

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((media) => URL.revokeObjectURL(media.url));
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      title: sharedPostData?.title || "",
      content: sharedPostData?.content || "",
      tags: [],
      postType: sharedPostData?.mediaUrls && sharedPostData.mediaUrls.length > 0 ? "image" : "text",
      linkUrl: "",
      files: [],
    },
  });

  const updateFormFiles = (items: MediaPreview[]) => {
    previewsRef.current = items;
    setValue("files", items.length ? items.map((item) => item.file) : undefined);
  };

  // Pre-fill form when sharedPostData is provided
  useEffect(() => {
    if (sharedPostData) {
      if (sharedPostData.title) {
        setValue("title", sharedPostData.title);
      }
      if (sharedPostData.content) {
        setValue("content", sharedPostData.content);
      }
      if (sharedPostData.mediaUrls && sharedPostData.mediaUrls.length > 0) {
        setActiveTab("image");
        setValue("postType", "image");

        // Convert URLs to File objects for preview
        const loadMediaFromUrls = async () => {
          const mediaPreviews: MediaPreview[] = [];

          for (let i = 0; i < sharedPostData.mediaUrls!.length; i++) {
            const url = sharedPostData.mediaUrls![i];
            try {
              const response = await fetch(url);
              const blob = await response.blob();
              const fileName = url.split('/').pop() || `image-${i}.jpg`;
              const file = new File([blob], fileName, { type: blob.type });

              mediaPreviews.push({
                id: `shared-${i}-${Date.now()}`,
                file: file,
                url: URL.createObjectURL(blob),
              });
            } catch (error) {
              console.error(`Failed to load media from ${url}:`, error);
            }
          }

          if (mediaPreviews.length > 0) {
            setMediaPreviews(mediaPreviews);
            updateFormFiles(mediaPreviews);
          }
        };

        loadMediaFromUrls();
      }
    }
  }, [sharedPostData, setValue]);

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

  const createPreviewEntry = (file: File): MediaPreview => ({
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${file.name}-${file.lastModified}-${Math.random()}`,
    file,
    url: URL.createObjectURL(file),
  });

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
      if (target) {
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

  const derivePostType = (): CreatePostRequest["post_type"] => {
    if (activeTab === "image") return "media";
    if (activeTab === "link") return "link";
    return "text";
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createPost({
        title: data.title,
        content: data.content ?? "",
        link: data.linkUrl ?? "",
        tags: data.tags ?? [],
        media_files: data.files ?? [],
        post_type: derivePostType(),
        ...(communityId && { community: communityId }),
        ...(isDraft && { status: "draft" }),
      }).unwrap();

      toast.success(
        isDraft ? "Draft saved successfully!" : "Post published successfully!"
      );
      setIsMediaModalOpen(false);
      setIsDraft(false); // Reset draft state
      reset();
      setTags([]);
      setTagInput("");
      mediaPreviews.forEach((media) => URL.revokeObjectURL(media.url));
      setMediaPreviews([]);
      updateFormFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onSuccess) {
        onSuccess();
      } else if (!isProfile) {
        // Redirect to profile page if not embedded and success
        router.push("/main/profile");
      }
    } catch (error: unknown) {
      console.error("Error submitting form:", error);

      // Handle media limit error specifically
      const apiError = error as { data?: { media_limit?: string; content_moderation?: string; non_field_errors?: string | string[];[key: string]: unknown } };

      if (apiError?.data?.media_limit) {
        toast.error(apiError.data.media_limit);
      } else if (apiError?.data?.content_moderation) {
        toast.error(apiError.data.content_moderation);
      } else if (apiError?.data?.non_field_errors) {
        // Handle non-field errors
        const errorMessage = Array.isArray(apiError.data.non_field_errors)
          ? apiError.data.non_field_errors[0]
          : apiError.data.non_field_errors;
        toast.error(errorMessage || "Failed to submit post. Please try again.");
      } else if (apiError?.data) {
        // Handle field-specific errors
        const errorMessages = Object.values(apiError.data).flat() as string[];
        toast.error(errorMessages[0] || "Failed to submit post. Please try again.");
      } else {
        toast.error("Failed to submit post. Please try again.");
      }
    }
  };

  const handleDraft = () => {
    setIsDraft(true);
    handleSubmit(onSubmit)();
  };

  const handlePublish = () => {
    setIsDraft(false);
    handleSubmit(onSubmit)();
  };

  const tabs = [
    { id: "text", label: "Text", icon: FiType },
    { id: "image", label: "Image & Videos", icon: FiImage },
    { id: "link", label: "Link", icon: FiLink },
  ] as const;

  return (
    <div
      className=" bg-cover bg-center bg-no-repeat p-4 pb-[calc(100vh-880px)]"
    >
      <div className="bg-[#06133FBF] max-w-[1220px] backdrop-blur-[17.5px] mx-auto border border-white/10 rounded-2xl ">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Post Type Tabs */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between">
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
              {!isProfile && <div className="mb-6 md:mb-0 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white  mb-2">
                  Create New Post
                </h1>
                <p className="text-gray-300">
                  Share your thoughts with the community
                </p>
              </div>}
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
              {allInterests.length > 0 && (
                <div className=" mb-6 mx-1">
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map((interest, index) => {
                      const isSelected = tags.includes(interest.name);
                      const isDisabled = tags.length >= 5 && !isSelected;
                      return (
                        <button
                          key={`${interest.category}-${interest.name}-${index}`}
                          type="button"
                          onClick={() => handleInterestClick(interest.name)}
                          disabled={isDisabled}
                          className={`px-3 py-1 rounded-full text-xs transition-all ${isSelected
                            ? "bg-purple-500/30 text-purple-300 border border-purple-400/50"
                            : isDisabled
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
                  Upload Images & Videos
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400/50 hover:bg-purple-500/5 transition-all duration-300"
                >
                  <FiImage size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-white mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-gray-400 text-sm">
                    Images and videos up to 10MB each
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Supported: JPG, PNG, GIF, MP4, MOV, WEBM
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {mediaPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {mediaPreviews.slice(0, 5).map((media, idx) => {
                      const isOverflowTile =
                        idx === 4 && mediaPreviews.length > 5;
                      const isVideo = media.file?.type?.startsWith('video/') ?? false;
                      const isImage = media.file?.type?.startsWith('image/') ?? false;

                      return (
                        <button
                          type="button"
                          key={media.id}
                          onClick={() => setIsMediaModalOpen(true)}
                          className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10 group cursor-pointer"
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
                                  // Ensure video loads properly
                                  const video = e.currentTarget;
                                  video.currentTime = 0.1; // Set to first frame for thumbnail
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia(media.id);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
                          >
                            <IoMdClose size={14} />
                          </button>
                        </button>
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
                onClick={handleDraft}
                disabled={isSubmitting || isCreating || !titleValue?.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <FiSave size={18} />
                {isSubmitting || isCreating
                  ? "Saving..."
                  : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting || isCreating || !titleValue?.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
              >
                <FiSend size={18} />
                {isSubmitting || isCreating
                  ? "Publishing..."
                  : "Publish Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Character Count for Content */}
        {activeTab === "text" && contentValue && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Content length: {contentValue.length} characters
            </p>
          </div>
        )}
      </div>
      <CustomDialog
        open={isMediaModalOpen}
        onOpenChange={setIsMediaModalOpen}
        title={`Uploaded media (${mediaPreviews.length})`}
        maxWidth="4xl"
      >
        {mediaPreviews.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No media selected yet. Upload images or videos to preview them here.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {mediaPreviews.map((media) => {
              const isVideo = media.file?.type?.startsWith('video/') ?? false;
              const isImage = media.file?.type?.startsWith('image/') ?? false;

              return (
                <div
                  key={media.id}
                  className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 group"
                >
                  {isImage ? (
                    <Image
                      src={media.url}
                      alt="Uploaded image"
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        src={media.url}
                        className="w-full h-full object-cover rounded-xl"
                        controls
                        muted
                        preload="metadata"
                        playsInline
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium">
                        Video
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <p className="text-white/60 text-sm">Unsupported file type</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(media.id)}
                    className="absolute top-2 right-2 rounded-full bg-black/70 p-2 text-white hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    <IoMdClose size={16} />
                    <span className="sr-only">Remove media</span>
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {media.file.name.length > 20
                      ? `${media.file.name.substring(0, 20)}...`
                      : media.file.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CustomDialog>
    </div>
  );
};

export default CreatePost;
