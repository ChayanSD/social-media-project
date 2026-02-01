"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostDetails from '../../../../../../components/Features/Main/Post/PostDetails';

export default function PostDetailsPage() {
  const params = useParams();
  const postId = params?.id ? String(params.id) : "";

  if (!postId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <PostDetails postId={postId} />
  );
}

