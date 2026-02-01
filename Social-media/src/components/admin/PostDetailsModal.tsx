"use client";
import Image from "next/image";
import { PostItem } from "@/store/postApi";
import { getApiBaseUrl } from "@/lib/utils";
import CustomDialog from "@/components/ui/CustomDialog";

interface PostDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostItem | null;
}

export default function PostDetailsModal({
  isOpen,
  onClose,
  post,
}: PostDetailsModalProps) {
  if (!post) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "approved":
        return "bg-green-500/20 text-green-300";
      case "rejected":
        return "bg-red-500/20 text-red-300";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300";
      case "draft":
        return "bg-gray-500/20 text-gray-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const postTitle = post.title || "Untitled Post";
  const userName = post.user_name || post.author?.username || post.username || "Unknown User";
  const avatar = post.avatar || post.author?.avatar;
  const status = (post as { status?: string }).status || "N/A";
  const postType = (post as { post_type?: string }).post_type || "N/A";
  const content = post.content || "";
  const mediaFiles = (post as { media_file?: string[] }).media_file || post.media || [];
  const tags = post.tags || [];
  const link = (post as { link?: string }).link;
  const community = (post as { community?: string | number | { name?: string } }).community;
  const likesCount = post.likes_count || 0;
  const commentsCount = post.comments_count || 0;
  const sharesCount = (post as { shares_count?: number }).shares_count || 0;
  const createdAt = post.created_at;
  const updatedAt = (post as { updated_at?: string }).updated_at;
  const canEdit = (post as { can_edit?: boolean }).can_edit || false;
  const canDelete = (post as { can_delete?: boolean }).can_delete || false;
  const isLiked = post.is_liked || false;

  // Parse community name
  const communityName = typeof community === "object" && community !== null
    ? (community as { name?: string }).name
    : typeof community === "string"
    ? community
    : null;

  // Determine grid columns based on media file count
  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-3";
    if (count === 4) return "grid-cols-4";
    if (count >= 5) return "grid-cols-5";
    return "grid-cols-1";
  };

  // Get link URL - handle both full URLs and relative paths
  const getLinkUrl = (linkUrl: string | undefined) => {
    if (!linkUrl) return "";
    if (linkUrl.startsWith("http")) return linkUrl;
    const baseUrl = getApiBaseUrl();
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = linkUrl.startsWith("/") ? linkUrl.slice(1) : linkUrl;
    return `${cleanBase}/${cleanPath}`;
  };

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Post Details"
      maxWidth="4xl"
      maxHeight="85vh"
      contentClassName="overflow-y-auto custom-scroll"
    >
      <div className="space-y-6">
          {/* Post Media/Image - Dynamic Grid */}
          {mediaFiles.length > 0 && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-2">
                Media Files {mediaFiles.length > 1 && `(${mediaFiles.length})`}
              </h3>
              <div className={`grid ${getGridCols(mediaFiles.length)} gap-4`}>
                {mediaFiles.map((media, index) => (
                  <div
                    key={index}
                    className={`relative rounded-lg overflow-hidden border border-white/10 ${
                      mediaFiles.length === 1 ? "w-full h-96" : "w-full aspect-square"
                    }`}
                  >
                    <Image
                      src={
                        !media 
                          ? "/sheep.jpg"
                          : media.startsWith("http")
                          ? media
                          : (() => {
                              const baseUrl = getApiBaseUrl();
                              const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
                              const cleanPath = media.startsWith("/") ? media.slice(1) : media;
                              return `${cleanBase}/media/${cleanPath}`;
                            })()
                      }
                      alt=""
                      fill
                      className="object-contain bg-black/20"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Post Title</h3>
                <p className="text-lg font-semibold text-white">{postTitle}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Author</h3>
                <div className="flex items-center gap-2">
                  {avatar && typeof avatar === 'string' && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={
                          !avatar
                            ? "/sheep.jpg"
                            : avatar.startsWith("http")
                            ? avatar
                            : `${getApiBaseUrl()}${avatar.startsWith("/") ? avatar.slice(1) : avatar}`
                        }
                        alt={userName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <p className="text-lg font-medium text-white">{userName}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Post Type</h3>
                <p className="text-lg font-medium text-white capitalize">{postType}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Status</h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {communityName && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-1">Community</h3>
                  <p className="text-lg font-medium text-white">{communityName}</p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Likes</h3>
                <p className="text-xl font-bold text-white">{likesCount}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Comments</h3>
                <p className="text-xl font-bold text-white">{commentsCount}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Shares</h3>
                <p className="text-xl font-bold text-white">{sharesCount}</p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          {content && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-2">Content</h3>
              <div 
                className="text-white/80 leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Post Link */}
          {link && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-2">Link</h3>
              <a
                href={getLinkUrl(link)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
              >
                {link}
              </a>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Post ID</h3>
              <p className="text-white/80">#{post.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Created At</h3>
              <p className="text-white/80">{formatDate(createdAt)}</p>
            </div>
            {updatedAt && (
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">Last Updated</h3>
                <p className="text-white/80">{formatDate(updatedAt)}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Permissions</h3>
              <div className="flex gap-2">
                {canEdit && (
                  <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                    Can Edit
                  </span>
                )}
                {canDelete && (
                  <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">
                    Can Delete
                  </span>
                )}
                {isLiked && (
                  <span className="px-2 py-1 rounded text-xs bg-pink-500/20 text-pink-300">
                    Liked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
    </CustomDialog>
  );
}

