"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    FiImage,
    FiCamera,
    FiSave,
    FiX
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import {
    useGetCurrentUserProfileQuery,
    useUpdateUserProfileMutation,
} from "@/store/authApi";
import Image from "next/image";
import { toast } from "@/components/ui/sonner";

interface FormData {
    displayName: string;
    about: string;
    socialLinks: string[];
    avatar?: FileList;
    banner?: FileList;
}

const EditProfile = () => {
    const router = useRouter();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const { data: profileResponse, isLoading: isProfileLoading } = useGetCurrentUserProfileQuery();
    const profile = profileResponse?.data;
    const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        defaultValues: {
            displayName: "",
            about: "",
            socialLinks: [""],
        },
    });

    useEffect(() => {
        if (profile) {
            const safeDisplayName = profile.display_name ?? profile.username ?? "";
            const safeAbout = profile.about ?? "";
            const rawSocialLink = profile.social_link ?? "";
            const links =
                rawSocialLink.trim().length > 0
                    ? rawSocialLink.split(",").map((link: string) => link.trim()).filter(Boolean)
                    : [""];
            setValue("displayName", safeDisplayName);
            setValue("about", safeAbout);
            setValue("socialLinks", links);
            setAvatarPreview(profile.avatar ?? null);
            setBannerPreview(profile.cover_photo ?? null);
        }
    }, [profile, setValue]);

    const socialLinks = watch("socialLinks") || [""];

    const displayNameValue = watch("displayName");
    const aboutValue = watch("about");
    const isSaving = isSubmitting || isUpdating;

    const handleFileChange = (file: File | null, type: 'avatar' | 'banner') => {
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            const maxSize = type === 'avatar' ? 2 * 1024 * 1024 : 5 * 1024 * 1024; 
            if (file.size > maxSize) {
                toast.error(`File size must be less than ${type === 'avatar' ? '2MB' : '5MB'}`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (type === 'avatar') {
                    setAvatarPreview(result);
                } else {
                    setBannerPreview(result);
                }
            };
            reader.readAsDataURL(file);
        } else {
            if (type === 'avatar') {
                setAvatarPreview(null);
            } else {
                setBannerPreview(null);
            }
        }
    };


    const onSubmit = async (data: FormData) => {
        try {
            const avatarFile = avatarInputRef.current?.files?.[0] ?? null;
            const bannerFile = bannerInputRef.current?.files?.[0] ?? null;

            const payload = {
                display_name: data.displayName ?? "",
                about: data.about ?? "",
                social_link: (data.socialLinks || [])
                    .map((link) => link.trim())
                    .filter(Boolean)
                    .join(","),
                avatar: avatarFile,
                cover_photo: bannerFile,
            };

            await updateProfile(payload).unwrap();
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile. Please try again.");
        }
    };


    if (isProfileLoading && !profile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-white">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="bg-cover bg-center bg-no-repeat p-2 sm:p-4">
            <div className="bg-[#06133FBF] max-w-[1220px] backdrop-blur-[17.5px] mx-auto border border-white/10 rounded-xl sm:rounded-2xl">
                <div className="p-4 sm:p-6 md:p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Header */}
                        <div className="mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                Edit Profile
                            </h1>
                            <p className="text-sm sm:text-base text-gray-300">
                                Customize your profile information
                            </p>
                        </div>
                        {/* Form Fields */}
                        <div className="space-y-4 sm:space-y-6">
                            {/* Display Name */}
                            <div className="space-y-2">
                                <label className="block text-white font-medium">Display Name</label>
                                <input
                                    {...register("displayName", {
                                        maxLength: {
                                            value: 50,
                                            message: "Display name must be less than 50 characters",
                                        },
                                    })}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 text-sm sm:text-base"
                                    placeholder="Enter your display name..."
                                />

                                <div className="text-right text-gray-400 text-xs sm:text-sm">
                                    {displayNameValue?.length || 0}/50
                                </div>
                            </div>

                            {/* About Description */}
                            <div className="space-y-2">
                                <label className="block text-white font-medium">About Description</label>
                                <textarea
                                    {...register("about", {
                                        maxLength: {
                                            value: 500,
                                            message: "About description must be less than 500 characters",
                                        },
                                    })}
                                    rows={3}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 resize-none text-sm sm:text-base"
                                    placeholder="Tell others about yourself..."
                                />
                                {errors.about && (
                                    <p className="text-red-400 text-sm">{errors.about.message}</p>
                                )}
                                <div className="text-right text-gray-400 text-xs sm:text-sm">
                                    {aboutValue?.length || 0}/500
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-white font-medium">Social Links</label>
                                    <button
                                        type="button"
                                        onClick={() => setValue("socialLinks", [...socialLinks, ""], { shouldDirty: true })}
                                        className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 transition-all"
                                    >
                                        + Add
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {socialLinks.map((_, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                {...register(`socialLinks.${index}` as const, {
                                                    pattern: {
                                                        value: /^https?:\/\/.+/,
                                                        message: "Please enter a valid URL",
                                                    },
                                                })}
                                                type="url"
                                                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 text-sm sm:text-base"
                                                placeholder="https://example.com"
                                            />
                                            {socialLinks.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = socialLinks.filter((__, i) => i !== index);
                                                        setValue("socialLinks", next.length ? next : [""], { shouldDirty: true });
                                                    }}
                                                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {Array.isArray(errors.socialLinks) && errors.socialLinks.some(Boolean) && (
                                    <div className="space-y-1">
                                        {errors.socialLinks.map((err, idx) => (
                                            <div key={idx} className="text-red-400 text-sm">
                                                {err?.message as unknown as string}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Avatar Upload */}
                            <div className="space-y-3 sm:space-y-4">
                                <label className="block text-white font-medium text-sm sm:text-base">Avatar</label>
                                <div
                                    className="relative border-2 border-dashed border-white/30 hover:border-purple-400 hover:bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center transition-all duration-300 cursor-pointer"
                                    onClick={() => avatarInputRef.current?.click()}
                                >
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'avatar')}
                                        className="hidden"
                                    />

                                    {avatarPreview ? (
                                        <div className="relative">
                                            <Image
                                                src={avatarPreview}
                                                alt="Avatar preview"
                                                width={80}
                                                height={80}
                                                unoptimized
                                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-white/20 mx-auto"
                                            />
                                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <div className="text-center">
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                                                        <FiCamera size={12} className="sm:hidden text-white" />
                                                        <FiCamera size={16} className="hidden sm:block text-white" />
                                                    </div>
                                                    <p className="text-xs text-white">Change</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                                                <FiCamera size={18} className="sm:hidden text-purple-400" />
                                                <FiCamera size={24} className="hidden sm:block text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-medium text-white">Upload Avatar</p>
                                                <p className="text-xs text-gray-300">Click to browse</p>
                                                <p className="text-xs text-gray-400 mt-1">Square image recommended</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Banner Upload */}
                            <div className="space-y-3 sm:space-y-4">
                                <label className="block text-white font-medium text-sm sm:text-base">Banner</label>
                                <div
                                    className="relative border-2 border-dashed border-white/30 hover:border-purple-400 hover:bg-white/5 rounded-lg sm:rounded-xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer"
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'banner')}
                                        className="hidden"
                                    />

                                    {bannerPreview ? (
                                        <div className="relative">
                                            <Image
                                                src={bannerPreview}
                                                alt="Banner preview"
                                                width={800}
                                                height={200}
                                                unoptimized
                                                className="w-full h-24 sm:h-32 object-cover rounded-lg border border-white/20"
                                            />
                                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <div className="text-center">
                                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                                                        <FiImage size={16} className="sm:hidden text-white" />
                                                        <FiImage size={20} className="hidden sm:block text-white" />
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-white">Click to change</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                                                <FiImage size={18} className="sm:hidden text-purple-400" />
                                                <FiImage size={24} className="hidden sm:block text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm sm:text-lg font-medium text-white">Upload Banner</p>
                                                <p className="text-xs sm:text-sm text-gray-300">Click to browse</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                            <button
                                onClick={() => router.back()}
                                type="button"
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl border border-white/20 transition-all duration-300 text-sm sm:text-base"
                            >
                                <FiX size={16} className="sm:hidden" />
                                <FiX size={18} className="hidden sm:block" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                            >
                                <FiSave size={16} className="sm:hidden" />
                                <FiSave size={18} className="hidden sm:block" />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;