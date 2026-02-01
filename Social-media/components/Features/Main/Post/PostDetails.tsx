"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGetPostByIdQuery } from '@/store/postApi';
import Post from './Post';
import { useGetCurrentUserProfileQuery } from '@/store/authApi';
import { IoArrowBack } from 'react-icons/io5';

interface PostDetailsProps {
  postId: string | number;
}

const PostDetails: React.FC<PostDetailsProps> = ({ postId }) => {
  const router = useRouter();
  const { data: postResponse, isLoading, isError } = useGetPostByIdQuery(postId);
  const { data: profileResponse } = useGetCurrentUserProfileQuery();
  const profile = profileResponse?.data;

  const post = postResponse?.data;

  if (isLoading) {
    return (
      <div className="page-container">
        {/* Back Button Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-5 w-5 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Post Skeleton */}
        <div className="max-w-4xl mx-auto">
          <div className="border border-slate-600 md:p-6 p-4 w-full rounded">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-[7px]">
                <div className="h-[30px] w-[30px] md:h-[32px] md:w-[32px] rounded-full bg-white/10 animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-20 bg-white/10 rounded-full animate-pulse" />
            </div>

            {/* Title Skeleton */}
            <div className="mb-4 space-y-2">
              <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-1/2 bg-white/10 rounded animate-pulse" />
            </div>

            {/* Content Skeleton */}
            <div className="mb-4 space-y-2">
              <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
            </div>

            {/* Media Skeleton */}
            <div className="mb-4">
              <div className="w-full h-[50vh] bg-white/10 rounded-lg animate-pulse" />
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
              <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-red-400 text-lg mb-4">Post not found or failed to load.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
      >
        <IoArrowBack className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Post Details */}
      <div className="max-w-4xl mx-auto">
        <Post post={post} profile={profile} />
      </div>
    </div>
  );
};

export default PostDetails;

