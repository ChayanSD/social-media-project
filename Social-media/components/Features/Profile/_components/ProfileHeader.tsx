"use client";
import { useGetCurrentUserProfileQuery } from '@/store/authApi';
import Image from 'next/image';
import React from 'react';
import { IoImageOutline, IoPersonOutline } from 'react-icons/io5';

interface ProfileHeaderProps {
    onAvatarClick: () => void;
}

const ProfileHeader = ({ onAvatarClick }: ProfileHeaderProps) => {
    const { data: profileResponse, isLoading: isProfileLoading } = useGetCurrentUserProfileQuery();
    const profile = profileResponse?.data;
    return (
        <div>
            {/* Header */}
            <div className='flex items-center gap-4'>
                <div className='relative'>
                    {profile?.avatar ? (
                        <Image src={profile.avatar} alt="profile" width={60} height={60} className='rounded-full object-cover h-12 w-12' unoptimized={true} />
                    ) : (
                        <div className='h-12 w-12 rounded-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center'>
                            <IoPersonOutline className='text-white' size={28} />
                        </div>
                    )}
                    <button
                        onClick={onAvatarClick}
                        className='bg-[#06133F]/75 backdrop-blur-[17.5px] hover:bg-[#06133F]/90 transition-all duration-300 text-white p-2 rounded-full absolute -bottom-1 -right-2 cursor-pointer'
                    >
                        <IoImageOutline size={10} />
                    </button>
                </div>
                <div>
                    <h1 className='text-2xl font-bold text-white'>{profile?.display_name || profile?.username || "Name Of the profile"}</h1>
                    <p className='text-sm text-gray-400 font-semibold'>{profile?.email || "Email"}</p>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;