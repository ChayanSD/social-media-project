"use client";
import React, { useEffect, useState } from 'react';
import { IoClose, IoImageOutline, IoPersonOutline } from 'react-icons/io5';
import { useForm } from 'react-hook-form';
import { FiUploadCloud } from 'react-icons/fi';
import { useGetCurrentUserProfileQuery, useUpdateUserProfileMutation } from '@/store/authApi';
import { toast } from 'sonner';
import Image from 'next/image';
import { getApiBaseUrl } from '@/lib/utils';

interface AvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormData {
    image: FileList;
}

const AvatarModal = ({ isOpen, onClose }: AvatarModalProps) => {
    const [preview, setPreview] = useState<string | null>(null);
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>();
    const { data: profileResponse } = useGetCurrentUserProfileQuery(undefined, { skip: !isOpen });
    const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
    const profile = profileResponse?.data;
    const currentAvatar = profile?.avatar || profile?.profile_image;

    const watchedFile = watch('image');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (watchedFile && watchedFile.length > 0) {
            const file = watchedFile[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // Show current avatar if no new file selected
            setPreview(currentAvatar ? (currentAvatar.startsWith('http') ? currentAvatar : `${getApiBaseUrl()}${currentAvatar.startsWith('/') ? currentAvatar.slice(1) : currentAvatar}`) : null);
        }
    }, [watchedFile, currentAvatar]);

    // Set initial preview when modal opens
    useEffect(() => {
        if (isOpen && currentAvatar && !watchedFile) {
            const avatarUrl = currentAvatar.startsWith('http') 
                ? currentAvatar 
                : `${getApiBaseUrl()}${currentAvatar.startsWith('/') ? currentAvatar.slice(1) : currentAvatar}`;
            setPreview(avatarUrl);
        }
    }, [isOpen, currentAvatar, watchedFile]);

    const onSubmit = (data: FormData) => {
        console.log('Uploaded file:', data.image[0]);

        onClose();
    };

    const handleClose = () => {
        reset();
        setPreview(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={handleClose}
            />

            <div
                className={`relative bg-slate-800 backdrop-blur-[17.5px] rounded-3xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
                    }`}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Avatar image</h2>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="text-center">
                            <div className="bg-gray-700/50 rounded-lg p-8 mb-4 border-1 border-dashed border-gray-500/50 hover:border-gray-400/70 transition-colors duration-200">
                                {preview ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-20 h-20 object-cover rounded-full mb-4"
                                        />
                                        <p className="text-gray-300 text-sm">Image selected</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 mx-auto bg-gray-600 rounded-full flex items-center justify-center">
                                            <IoImageOutline size={32} className='text-gray-400' />
                                        </div>
                                    </div>
                                )}
                               
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="image-upload"
                                {...register('image', { required: 'Please select an image' })}
                            />
                            <label
                                htmlFor="image-upload"
                                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-full transition-colors duration-300 cursor-pointer inline-block"
                            >
                                {preview ? 'Change image' : 'Select an image'}
                            </label>
                            {errors.image && (
                                <p className="text-red-400 text-sm mt-2">{errors.image.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className=" bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-full transition-colors duration-300 cursor-pointer "
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className=" bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-6 rounded-full transition-colors duration-300 cursor-pointer "
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AvatarModal;