"use client";
import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import { IoPersonOutline, IoPersonAddOutline, IoPersonRemoveOutline, IoChatbubbleOutline } from 'react-icons/io5';
import { FiFlag } from 'react-icons/fi';
import { useGetUserProfileByIdQuery, useGetPublicUsersQuery } from '@/store/authApi';
import ReportUserModal from '../../../Message/ReportUserModal';

interface UserProfileHeaderProps {
    userId: string | number;
    username: string;
    isFollowing: boolean;
    isOwnProfile: boolean;
    onFollowToggle: () => void;
    onSendMessage: () => void;
    isTogglingFollow: boolean;
}

const UserProfileHeader = ({ 
    userId, 
    username, 
    isFollowing, 
    isOwnProfile,
    onFollowToggle, 
    onSendMessage,
    isTogglingFollow 
}: UserProfileHeaderProps) => {
    const [showReportModal, setShowReportModal] = useState(false);
    const { data: usersResponse } = useGetPublicUsersQuery();
    
    // Check if userId is a valid number, otherwise skip the API call
    const isValidUserId = useMemo(() => {
        return userId && !isNaN(Number(userId)) && Number(userId) > 0;
    }, [userId]);
    
    const { data: fullProfileResponse } = useGetUserProfileByIdQuery(userId, {
        skip: !userId || !isValidUserId,
    });
    
    // Get user from users list as fallback
    const userFromList = useMemo(() => {
        if (!usersResponse?.data) return null;
        return usersResponse.data.find((u: { id?: string | number; username?: string }) => 
            String(u.id) === String(userId) || u.username === username
        );
    }, [usersResponse, userId, username]);
    
    const fullProfile = fullProfileResponse?.data;
    const displayName = fullProfile?.display_name || fullProfile?.username || userFromList?.display_name || userFromList?.username || username;
    const email = fullProfile?.email || userFromList?.email;
    const avatar = fullProfile?.avatar || fullProfile?.profile_image || userFromList?.avatar || userFromList?.profile_image;

    return (
        <div>
            {/* Header */}
            <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
                {/* Profile Photo and Name Section */}
                <div className='flex items-center gap-4 flex-1'>
                    <div className='relative'>
                        {avatar ? (
                            <Image src={avatar} alt="profile" width={60} height={60} className='rounded-full object-cover h-12 w-12' />
                        ) : (
                            <div className='h-12 w-12 rounded-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center'>
                                <IoPersonOutline className='text-white' size={28} />
                            </div>
                        )}
                    </div>
                    <div className='flex-1'>
                        <h1 className='text-2xl font-bold text-white'>{displayName}</h1>
                        <p className='text-sm text-gray-400 font-semibold'>{email || `@${username}`}</p>
                    </div>
                </div>
                
                {/* Action Buttons - Desktop: same row, Mobile: below */}
                {!isOwnProfile && (
                    <div className='flex flex-wrap items-center gap-2 lg:flex-nowrap'>
                        <button
                            onClick={onFollowToggle}
                            disabled={isTogglingFollow}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                                isFollowing
                                    ? "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                                    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            }`}
                        >
                            {isTogglingFollow ? (
                                "Loading..."
                            ) : isFollowing ? (
                                <>
                                    <IoPersonRemoveOutline size={18} />
                                    
                                </>
                            ) : (
                                <>
                                    <IoPersonAddOutline size={18} />
                                   
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={onSendMessage}
                            className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 cursor-pointer bg-white/10 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center gap-2"
                        >
                            <IoChatbubbleOutline size={18} />
                          
                        </button>
                        
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 cursor-pointer bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 flex items-center justify-center gap-2"
                        >
                            <FiFlag size={18} />
                 
                        </button>
                    </div>
                )}
            </div>
            
            <ReportUserModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                userId={String(userId)}
                username={username}
            />
        </div>
    );
};

export default UserProfileHeader;

