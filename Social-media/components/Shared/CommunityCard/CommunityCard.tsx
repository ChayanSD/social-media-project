"use client";

import React from 'react';
import Image from 'next/image';
import { CommunityItem } from '@/store/communityApi';
import { FiUsers, FiMessageCircle, FiGlobe, FiEye, FiLock } from 'react-icons/fi';

interface CommunityCardProps {
  community: CommunityItem;
  variant?: 'grid' | 'list';
  onCardClick?: () => void;
  actions?: React.ReactNode;
  showCreatedBy?: boolean;
  formatDate?: (dateString?: string) => string;
}

const getVisibilityIcon = (visibility?: string) => {
  switch (visibility) {
    case "public":
      return <FiGlobe className="text-green-400" size={16} />;
    case "restricted":
      return <FiEye className="text-yellow-400" size={16} />;
    case "private":
      return <FiLock className="text-red-400" size={16} />;
    default:
      return <FiGlobe className="text-green-400" size={16} />;
  }
};

const getVisibilityLabel = (visibility?: string) => {
  switch (visibility) {
    case "public":
      return "Public";
    case "restricted":
      return "Restricted";
    case "private":
      return "Private";
    default:
      return "Public";
  }
};

const defaultFormatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  variant = 'grid',
  onCardClick,
  actions,
  showCreatedBy = true,
  formatDate = defaultFormatDate,
}) => {
  const iconUrl = community.icon || community.profile_image
    ? `${(community.icon || community.profile_image)?.startsWith("/") ? (community.icon || community.profile_image)?.slice(1) : (community.icon || community.profile_image)}`
    : null;
  const bannerUrl = community.banner || community.cover_image
    ? `${(community.banner || community.cover_image)?.startsWith("/") ? (community.banner || community.cover_image)?.slice(1) : (community.banner || community.cover_image)}`
    : null;

  const cardClasses = variant === 'grid'
    ? `bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-all duration-300 ${onCardClick ? 'hover:bg-white/10 hover:border-white/30 cursor-pointer' : 'cursor-default'}`
    : `bg-[#06133FBF] backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden transition-all duration-300 ${onCardClick ? 'hover:border-white/30 cursor-pointer' : 'cursor-default'}`;

  if (variant === 'list') {
    return (
      <div className={cardClasses} onClick={onCardClick || undefined}>
        {/* Banner */}
        {bannerUrl ? (
          <div className="relative w-full h-32">
            <Image
              src={bannerUrl}
              alt={`${community.name || community.title} banner`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600" />
        )}

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            {iconUrl ? (
              <div className="relative h-16 w-16 rounded-full border-2 border-white/20 flex-shrink-0 overflow-hidden">
                <Image
                  src={iconUrl}
                  alt={community.name || community.title || "Community icon"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 border-2 border-white/20">
                {(community.name || community.title)?.charAt(0).toUpperCase() || "C"}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-white mb-1 truncate">
                    {community.title || community.name || "Unnamed Community"}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getVisibilityIcon(community.visibility)}
                    <span className="text-sm text-white/60">
                      {getVisibilityLabel(community.visibility)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {community.description && (
                <p className="text-sm text-white/80 mb-4 line-clamp-2">
                  {community.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-white/60 mb-4">
                <div className="flex items-center gap-2">
                  <FiUsers size={14} />
                  <span>
                    {Math.max(community.members_count || 0)} member
                    {Math.max(community.members_count || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMessageCircle size={14} />
                  <span>
                    {community.posts_count || 0} post
                    {(community.posts_count || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                {community.created_at && (
                  <div className="text-xs text-white/50">
                    Created {formatDate(community.created_at)}
                  </div>
                )}
              </div>

              {/* Actions */}
              {actions && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div className={`${cardClasses} flex flex-col h-full`} onClick={onCardClick || undefined}>
      {/* Banner */}
      {bannerUrl ? (
        <div className="relative w-full h-32 flex-shrink-0">
          <Image
            src={bannerUrl}
            alt={`${community.name || community.title} banner`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full h-32 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600" />
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Community Icon and Info */}
        <div className="flex items-start gap-4 mb-4">
          {iconUrl ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
              <Image
                src={iconUrl}
                alt={`${community.name || community.title} icon`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 border-2 border-white/20">
              <FiUsers className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1 truncate">
              {community.title || community.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/60">
              {getVisibilityIcon(community.visibility)}
              <span>{getVisibilityLabel(community.visibility)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-white/70 text-sm mb-4 line-clamp-2">
            {community.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-white/60">
            <FiUsers className="w-4 h-4" />
            <span>{Math.max(community.members_count || 0)} members</span>
          </div>
          <div className="flex items-center gap-1 text-white/60">
            <FiMessageCircle className="w-4 h-4" />
            <span>{community.posts_count || 0} posts</span>
          </div>
        </div>

        {/* Created Info */}
        {showCreatedBy && community.created_by_username && (
          <p className="text-white/40 text-xs mb-4">
            Created by {community.created_by_username} • {formatDate(community.created_at)}
          </p>
        )}

        {/* Actions - Pushed to bottom */}
        {actions && (
          <div className="mt-auto pt-4 border-t border-white/10">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityCard;

