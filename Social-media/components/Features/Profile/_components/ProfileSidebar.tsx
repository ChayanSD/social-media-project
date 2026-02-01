import { useGetCurrentUserProfileQuery } from '@/store/authApi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { IoImageOutline, IoPersonOutline } from 'react-icons/io5';

const ProfileSidebar = () => {
    const router = useRouter();
    const { data: profileResponse } = useGetCurrentUserProfileQuery();
    const profile = profileResponse?.data;
    return (
        <div className='space-y-4'>
            <div className='bg-[#06133F]/75 backdrop-blur-[17.5px] rounded-2xl'>
                <div className='relative'>
                    {profile?.cover_photo ? (
                        <Image src={profile.cover_photo} alt="Cover Image" width={500} height={500} className='rounded-t-2xl h-32 object-cover' />
                    ) : (
                        <div className=' rounded-t-2xl h-32 bg-gradient-to-br from-[#6c3f79] from-10% via-[#081a55] via-99% to-[#995a98] to-100%' />
                    )}
                    <button
                        onClick={() => router.push('/main/edit-profile')}
                        className='bg-[#06133F]/75 backdrop-blur-[17.5px] hover:bg-[#06133F]/90 transition-all duration-300 text-white p-2 rounded-full absolute bottom-4 right-4 cursor-pointer'
                    >
                        <IoImageOutline size={16} />
                    </button>
                </div>
                <div className='p-4'>
                    <div className='mb-4'>
                        <h3 className='font-semibold text-white'>{profile?.display_name || profile?.username || "Name Of the profile"}</h3>
                        <p className='text-sm text-gray-400'>Followers: {profile?.followers_count || 0}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className='text-xs text-gray-400'>Total Posts</p>
                            <p className='text-xs font-bold text-white'>{profile?.posts_count || 0}</p>
                        </div>
                        <div>
                            <p className='text-xs text-gray-400'>Following</p>
                            <p className='text-xs font-bold text-white'>{profile?.following_count || 0}</p>
                        </div>
                        <div>
                            <p className='text-xs text-gray-400'>Communities</p>
                            <p className='text-xs font-bold text-white'>{profile?.communities_count || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='bg-[#06133F]/75 backdrop-blur-[17.5px] rounded-2xl p-4'>
                <h3 className='text-white text-lg font-semibold mb-4'>Settings</h3>
                <div className='space-y-4'>
                    {/* Avatar Option */}
                    <button 
                        onClick={() => router.push('/main/edit-profile')}
                        className='w-full flex items-center justify-between p-3 hover:bg-[#06133F]/50 rounded-lg transition-colors group'
                    >
                        <div className='flex items-center space-x-3'>
                            <div className='w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0'>
                                {profile?.avatar ? (
                                    <Image src={profile.avatar} alt="avatar" width={48} height={48} className='rounded-full object-cover w-full h-full' />
                                ) : (
                                    <div className='w-full h-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center'>
                                        <IoPersonOutline className='text-white' size={24} />
                                    </div>
                                )}
                            </div>
                            <div className='text-left'>
                                <h4 className='text-white font-medium group-hover:text-gray-200 transition-colors'>Avatar</h4>
                                <p className='text-gray-400 text-sm'>Edit your avatar or upload an image.</p>
                            </div>
                        </div>
                        <IoImageOutline className='text-gray-400 group-hover:text-white transition-colors' size={18} />
                    </button>

                    {/* Cover Photo Option */}
                    <button 
                        onClick={() => router.push('/main/edit-profile')}
                        className='w-full flex items-center justify-between p-3 hover:bg-[#06133F]/50 rounded-lg transition-colors group'
                    >
                        <div className='flex items-center space-x-3'>
                            <div className='w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0'>
                                {profile?.cover_photo ? (
                                    <Image src={profile.cover_photo} alt="cover photo" width={48} height={48} className='object-cover w-full h-full' />
                                ) : (
                                    <div className='w-full h-full bg-gradient-to-br from-[#6c3f79] from-10% via-[#081a55] via-99% to-[#995a98] to-100% flex items-center justify-center'>
                                        <IoImageOutline className='text-white' size={20} />
                                    </div>
                                )}
                            </div>
                            <div className='text-left'>
                                <h4 className='text-white font-medium group-hover:text-gray-200 transition-colors'>Cover Photo</h4>
                                <p className='text-gray-400 text-sm'>Update your cover photo.</p>
                            </div>
                        </div>
                        <IoImageOutline className='text-gray-400 group-hover:text-white transition-colors' size={18} />
                    </button>

                    {/* Details Option */}
                    <button 
                        onClick={() => router.push('/main/edit-profile')}
                        className='w-full flex items-center justify-between p-3 hover:bg-[#06133F]/50 rounded-lg transition-colors group'
                    >
                        <div className='flex items-center space-x-3'>
                            <div className='w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 flex-shrink-0'>
                                <IoPersonOutline className='text-white' size={24} />
                            </div>
                            <div className='text-left'>
                                <h4 className='text-white font-medium group-hover:text-gray-200 transition-colors'>Profile Details</h4>
                                <p className='text-gray-400 text-sm'>Manage your profile information.</p>
                            </div>
                        </div>
                        <IoImageOutline className='text-gray-400 group-hover:text-white transition-colors' size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSidebar;