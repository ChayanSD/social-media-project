import Image from 'next/image';
import React, { useState } from 'react';
import { useGetUserProfileByIdQuery } from '@/store/authApi';
import { IoPersonAddOutline, IoPersonRemoveOutline, IoChatbubbleOutline } from 'react-icons/io5';
import { FiFlag } from 'react-icons/fi';
import ReportUserModal from '../../../Message/ReportUserModal';

interface UserProfileSidebarProps {
    userId: string | number;
    userProfile: {
        user_id?: number | string;
        username?: string;
        followers_count?: number;
        following_count?: number;
        posts_count?: number;
        is_following?: boolean;
    };
    isOwnProfile: boolean;
    onFollowToggle: () => void;
    onSendMessage: () => void;
    isFollowing: boolean;
    isTogglingFollow: boolean;
}

const UserProfileSidebar = ({
    userId,
    userProfile,
    isOwnProfile,
    onFollowToggle,
    onSendMessage,
    isFollowing,
    isTogglingFollow
}: UserProfileSidebarProps) => {
    const [showReportModal, setShowReportModal] = useState(false);
    const { data: fullProfileResponse } = useGetUserProfileByIdQuery(userId, {
        skip: !userId,
    });

    const fullProfile = fullProfileResponse?.data;
    const displayName = fullProfile?.display_name || fullProfile?.username || userProfile.username;
    const coverPhoto = fullProfileResponse?.cover_photo;

    return (
        <div className='space-y-4'>
            <div className='bg-[#06133F]/75 backdrop-blur-[17.5px] rounded-2xl'>
                <div className='relative'>
                    {coverPhoto ? (
                        <Image src={coverPhoto} alt="Cover Image" width={500} height={500} className='rounded-t-2xl h-32 object-cover w-full' />
                    ) : (
                        <div className=' rounded-t-2xl h-32 bg-gradient-to-br from-[#6c3f79] from-10% via-[#081a55] via-99% to-[#995a98] to-100%' />
                    )}
                </div>
                <div className='p-4'>
                    <div className='mb-4'>
                        <h3 className='font-semibold text-white'>{displayName}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className='text-xs text-gray-400'>Total Posts</p>
                            <p className='text-xs font-bold text-white'>{userProfile.posts_count || 0}</p>
                        </div>
                        <div>
                            <p className='text-xs text-gray-400'>Followers</p>
                            <p className='text-xs font-bold text-white'>{userProfile.followers_count || 0}</p>
                        </div>
                        <div>
                            <p className='text-xs text-gray-400'>Following</p>
                            <p className='text-xs font-bold text-white'>{userProfile.following_count || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {!isOwnProfile && (
                <div className='bg-[#06133F]/75 backdrop-blur-[17.5px] rounded-2xl p-4'>
                    <h3 className='text-white text-lg font-semibold mb-4'>Actions</h3>
                    <div className='space-y-3'>
                        <button
                            onClick={onFollowToggle}
                            disabled={isTogglingFollow}
                            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${isFollowing
                                ? "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                }`}
                        >
                            {isTogglingFollow ? (
                                "Loading..."
                            ) : isFollowing ? (
                                <>
                                    <IoPersonRemoveOutline size={18} />
                                    Unfollow
                                </>
                            ) : (
                                <>
                                    <IoPersonAddOutline size={18} />
                                    Follow
                                </>
                            )}
                        </button>

                        <button
                            onClick={onSendMessage}
                            className="w-full px-4 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer bg-white/10 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center gap-2"
                        >
                            <IoChatbubbleOutline size={18} />
                            Send Message
                        </button>

                        <button
                            onClick={() => setShowReportModal(true)}
                            className="w-full px-4 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 flex items-center justify-center gap-2"
                        >
                            <FiFlag size={18} />
                            Report User
                        </button>
                    </div>
                </div>
            )}

            <ReportUserModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                userId={String(userId)}
                username={userProfile.username || String(userId)}
            />
        </div>
    );
};

export default UserProfileSidebar;

