"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaGlobe, FaEyeSlash, FaLock } from "react-icons/fa";
import { useUpdateCommunityMutation, useGetMyCommunitiesQuery, type CommunityItem } from "@/store/communityApi";
import { toast } from "sonner";

type FormValues = {
  title: string;
  description: string;
  profile_image?: FileList;
  cover_image?: FileList;
  visibility: "public" | "restricted" | "private";
};

interface EditCommunityFormProps {
  communityName: string;
}

const EditCommunityForm = ({ communityName }: EditCommunityFormProps) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState({ cover_image: false, profile_image: false });
  const [community, setCommunity] = useState<CommunityItem | null>(null);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
  
  const { data: communitiesResponse } = useGetMyCommunitiesQuery();
  const [updateCommunity, { isLoading: isUpdating }] = useUpdateCommunityMutation();

  const { register, handleSubmit, watch, reset, setValue } = useForm<FormValues>({
    defaultValues: { visibility: "public" },
  });

  // Find and load community data
  useEffect(() => {
    if (communitiesResponse) {
      const communities = 
        communitiesResponse.data ??
        communitiesResponse.results?.data ??
        communitiesResponse.communities ??
        [];
      
      const foundCommunity = communities.find(
        (c) => c.name === communityName || c.id?.toString() === communityName
      );
      
      if (foundCommunity) {
        setCommunity(foundCommunity);
        reset({
          title: foundCommunity.title || "",
          description: foundCommunity.description || "",
          visibility: foundCommunity.visibility || "public",
        });
        
        // Set preview images from existing community
        if (foundCommunity.cover_image) {
          const coverImagePath = foundCommunity.cover_image.startsWith("/") 
            ? foundCommunity.cover_image.slice(1) 
            : foundCommunity.cover_image;
          setCoverImagePreview(`${coverImagePath}`);
        } else if (foundCommunity.banner) {
          // Fallback to banner if cover_image doesn't exist
          const bannerPath = foundCommunity.banner.startsWith("/") 
            ? foundCommunity.banner.slice(1) 
            : foundCommunity.banner;
          setCoverImagePreview(`${bannerPath}`);
        }
        if (foundCommunity.profile_image) {
          const profileImagePath = foundCommunity.profile_image.startsWith("/") 
            ? foundCommunity.profile_image.slice(1) 
            : foundCommunity.profile_image;
          setProfileImagePreview(`${profileImagePath}`);
        } else if (foundCommunity.icon) {
          // Fallback to icon if profile_image doesn't exist
          const iconPath = foundCommunity.icon.startsWith("/") 
            ? foundCommunity.icon.slice(1) 
            : foundCommunity.icon;
          setProfileImagePreview(`${iconPath}`);
        }
      }
      setIsLoadingCommunity(false);
    }
  }, [communitiesResponse, communityName, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const profileImageFile = data.profile_image && data.profile_image.length > 0 ? data.profile_image[0] : undefined;
      const coverImageFile = data.cover_image && data.cover_image.length > 0 ? data.cover_image[0] : undefined;

      console.log("Submitting form with files:", {
        profile_image: profileImageFile ? { name: profileImageFile.name, size: profileImageFile.size } : undefined,
        cover_image: coverImageFile ? { name: coverImageFile.name, size: coverImageFile.size } : undefined,
      });

      await updateCommunity({
        communityName: communityName,
        data: {
          title: data.title as string,
          description: data.description,
          visibility: data.visibility,
          profile_image: profileImageFile,
          cover_image: coverImageFile,
        },
      }).unwrap();

      toast.success("Community updated successfully!", {
        description: `Your community "${data.title as string}" has been updated.`,
      });

      router.push("/main/manage-communities");
    } catch (error: unknown) {
      console.error('Error updating community:', error);
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 
         ('message' in error.data || 'detail' in error.data))
          ? (error.data as { message?: string; detail?: string }).message || 
            (error.data as { message?: string; detail?: string }).detail
          : "Failed to update community. Please try again.";
      
      toast.error("Error updating community", {
        description: errorMessage || "Failed to update community. Please try again.",
      });
    }
  };

  const title = watch("title") || "Community Name";
  const description = watch("description") || "Your community description";

  const handleFileChange = (file: File | null, type: 'cover_image' | 'profile_image') => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Create a FileList-like object to set in the form
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;
      
      // Update form value
      setValue(type, fileList);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'cover_image') {
          setCoverImagePreview(result);
        } else {
          setProfileImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (type === 'cover_image') {
        setCoverImagePreview(null);
      } else {
        setProfileImagePreview(null);
      }
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent, type: 'cover_image' | 'profile_image') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'cover_image' | 'profile_image') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0], type);
    }
  };

  if (isLoadingCommunity) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white">Loading community data...</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Community not found</p>
          <p className="text-white/60 text-sm mb-4">
            The community you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.
          </p>
          <button
            onClick={() => router.push("/main/manage-communities")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium transition-colors"
          >
            Back to Manage Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative w-full bg-[#06133FBF] backdrop-blur-md rounded-2xl border border-white/20 shadow-lg flex flex-col md:flex-row p-6 md:p-10 gap-8"
      >
        {/* Left Section */}
        <div className="flex-1 space-y-6">
          {step === 1 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Edit Community Details
                </h2>
                <p className="text-sm text-gray-300">
                  Update your community name and description
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Community Name
                  </label>
                  <input
                    {...register("title", { required: true })}
                    className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    {...register("description", { required: true })}
                    className="w-full p-2.5 rounded-lg bg-white/10 border border-white/20 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/main/manage-communities")}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-full"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Update Community Style
                </h2>
                <p className="text-sm text-gray-300">
                  Update your community&apos;s visual appearance
                </p>
              </div>

              <div className="space-y-6">
                {/* Cover Image Upload */}
                <div>
                  <label className="block mb-3 font-medium">Cover Image</label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                      dragActive.cover_image
                        ? 'border-purple-400 bg-purple-500/20 scale-105'
                        : 'border-white/30 hover:border-purple-400 hover:bg-white/5'
                    }`}
                    onDragEnter={(e) => handleDrag(e, 'cover_image')}
                    onDragLeave={(e) => handleDrag(e, 'cover_image')}
                    onDragOver={(e) => handleDrag(e, 'cover_image')}
                    onDrop={(e) => handleDrop(e, 'cover_image')}
                    onClick={() => document.getElementById('cover-image-upload')?.click()}
                  >
                    <input
                      id="cover-image-upload"
                      type="file"
                      accept="image/*"
                      {...register("cover_image")}
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'cover_image')}
                      className="hidden"
                    />
                    
                    {coverImagePreview ? (
                      <div className="relative w-full h-40">
                        <Image
                          src={coverImagePreview}
                          alt="Cover image preview"
                          fill
                          className="object-cover rounded-lg border border-white/20"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-sm text-white">Click to change</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-white">Upload Cover Image</p>
                          <p className="text-sm text-gray-300">Drag & drop or click to browse</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Image Upload */}
                <div>
                  <label className="block mb-3 font-medium">Profile Image</label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${
                      dragActive.profile_image
                        ? 'border-purple-400 bg-purple-500/20 scale-105'
                        : 'border-white/30 hover:border-purple-400 hover:bg-white/5'
                    }`}
                    onDragEnter={(e) => handleDrag(e, 'profile_image')}
                    onDragLeave={(e) => handleDrag(e, 'profile_image')}
                    onDragOver={(e) => handleDrag(e, 'profile_image')}
                    onDrop={(e) => handleDrop(e, 'profile_image')}
                    onClick={() => document.getElementById('profile-image-upload')?.click()}
                  >
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      {...register("profile_image")}
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'profile_image')}
                      className="hidden"
                    />
                    
                    {profileImagePreview ? (
                      <div className="relative w-20 h-20 mx-auto">
                        <Image
                          src={profileImagePreview}
                          alt="Profile image preview"
                          fill
                          className="object-cover rounded-full border-2 border-white/20"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-center">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-xs text-white">Change</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Upload Profile Image</p>
                          <p className="text-xs text-gray-300">Drag & drop or click to browse</p>
                          <p className="text-xs text-gray-400 mt-1">Square image recommended</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-full"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-[#104F01] hover:bg-[#104F01]/90 rounded-full"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Update Community Visibility
                </h2>
                <p className="text-sm text-gray-300">
                  Decide who can view and contribute in your community.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 cursor-pointer">
                  <input
                    type="radio"
                    value="public"
                    {...register("visibility")}
                    className="accent-purple-500"
                  />
                  <FaGlobe className="text-lg" />
                  <div>
                    <p className="font-medium">Public</p>
                    <p className="text-sm text-gray-300">
                      Anyone can view, post, and comment.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 cursor-pointer">
                  <input
                    type="radio"
                    value="restricted"
                    {...register("visibility")}
                    className="accent-purple-500"
                  />
                  <FaEyeSlash className="text-lg" />
                  <div>
                    <p className="font-medium">Restricted</p>
                    <p className="text-sm text-gray-300">
                      Anyone can view, but only approved users can contribute.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 cursor-pointer">
                  <input
                    type="radio"
                    value="private"
                    {...register("visibility")}
                    className="accent-purple-500"
                  />
                  <FaLock className="text-lg" />
                  <div>
                    <p className="font-medium">Private</p>
                    <p className="text-sm text-gray-300">
                      Only approved users can view and contribute.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Preview */}
        <div className="hidden md:flex flex-col justify-center w-72 h-fit bg-white/10 border border-white/20 rounded-xl p-4 text-center backdrop-blur-sm">
          {coverImagePreview && (
            <div className="mb-4 relative w-full h-24">
              <Image
                src={coverImagePreview}
                alt="Community cover image"
                fill
                className="object-cover rounded-lg"
                unoptimized
              />
            </div>
          )}
          <div className="flex items-center justify-center mb-3">
            {profileImagePreview ? (
              <div className="relative w-12 h-12">
                <Image
                  src={profileImagePreview}
                  alt="Community profile image"
                  fill
                  className="object-cover rounded-full border-2 border-white/20"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-gray-300 mt-1">{description}</p>
          <div className="flex justify-center gap-2 mt-4 text-xs text-gray-400">
            <span>{community.members_count || 0} member{(community.members_count || 0) !== 1 ? "s" : ""}</span>•<span>{community.posts_count || 0} post{(community.posts_count || 0) !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditCommunityForm;

