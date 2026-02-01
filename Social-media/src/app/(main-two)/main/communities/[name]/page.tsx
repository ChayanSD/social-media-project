"use client";

import React from 'react';
import CommunityDetails from '../../../../../../components/Features/Communities/CommunityDetails';
import { useParams } from 'next/navigation';

export default function CommunityPage() {
  const params = useParams();
  const communityName = params?.name ? decodeURIComponent(params.name as string) : "";

  if (!communityName) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <CommunityDetails communityName={communityName} />
    </div>
  );
}

