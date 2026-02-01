export interface CommentType {
  id: number;
  text: string;
  author: string;
  parentId: number | null;
  children: CommentType[];
}

export interface StoryType {
  id: number;
  author: string;
  authorAvatar: string;
  storyImage: string;
  timestamp: string;
  isViewed: boolean;
  isOwnStory?: boolean;
}

export interface StoryViewerType {
  id: number;
  name: string;
  avatar: string;
  viewedAt: string;
}