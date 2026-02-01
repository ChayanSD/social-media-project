"use client";
import React, { useState } from 'react';
import { FiDatabase, FiHardDrive, FiUpload, FiDownload, FiTrash2, FiSearch, FiFilter, FiFile, FiImage, FiVideo, FiMusic } from 'react-icons/fi';

const Storage = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const storageUsed = 45; // GB used
    const storageTotal = 100; // GB total

    const categories = [
        { id: 'all', label: 'All Files', icon: <FiFile className="w-5 h-5" /> },
        { id: 'images', label: 'Images', icon: <FiImage className="w-5 h-5" /> },
        { id: 'videos', label: 'Videos', icon: <FiVideo className="w-5 h-5" /> },
        { id: 'audio', label: 'Audio', icon: <FiMusic className="w-5 h-5" /> },
    ];

    const files = [
        { id: 1, name: 'profile-photo.jpg', type: 'image', size: '2.5 MB', date: '2024-01-15' },
        { id: 2, name: 'video-intro.mp4', type: 'video', size: '15.3 MB', date: '2024-01-14' },
        { id: 3, name: 'background-music.mp3', type: 'audio', size: '4.2 MB', date: '2024-01-13' },
        { id: 4, name: 'community-banner.png', type: 'image', size: '1.8 MB', date: '2024-01-12' },
        { id: 5, name: 'tutorial-video.mp4', type: 'video', size: '28.7 MB', date: '2024-01-11' },
        { id: 6, name: 'podcast-episode.mp3', type: 'audio', size: '12.4 MB', date: '2024-01-10' },
    ];

    const storagePercentage = (storageUsed / storageTotal) * 100;

    return (
        <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
            <div className="page-container">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <FiDatabase className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                            Storage Management
                        </h1>
                    </div>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Manage your uploaded files, media, and content storage. Keep track of your storage usage and organize your files efficiently.
                    </p>
                </div>

                {/* Storage Overview */}
                <div className="mb-12">
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-semibold text-white">Storage Overview</h2>
                            <div className="flex items-center gap-2 text-white/60">
                                <FiHardDrive className="w-5 h-5" />
                                <span className="text-sm">{storageUsed} GB / {storageTotal} GB used</span>
                            </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-4 mb-4">
                            <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-300"
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiImage className="w-5 h-5 text-blue-400" />
                                    <span className="text-white font-medium">Images</span>
                                </div>
                                <p className="text-2xl font-bold text-white">18.5 GB</p>
                                <p className="text-sm text-white/60">1,234 files</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiVideo className="w-5 h-5 text-purple-400" />
                                    <span className="text-white font-medium">Videos</span>
                                </div>
                                <p className="text-2xl font-bold text-white">22.3 GB</p>
                                <p className="text-sm text-white/60">456 files</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiMusic className="w-5 h-5 text-pink-400" />
                                    <span className="text-white font-medium">Audio</span>
                                </div>
                                <p className="text-2xl font-bold text-white">4.2 GB</p>
                                <p className="text-sm text-white/60">89 files</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Management */}
                <div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-semibold text-white">Your Files</h2>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all">
                                <FiSearch className="w-4 h-4" />
                                <span>Search</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all">
                                <FiFilter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all">
                                <FiUpload className="w-4 h-4" />
                                <span>Upload</span>
                            </button>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                                    selectedCategory === category.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                        : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                                }`}
                            >
                                {category.icon}
                                <span>{category.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Files List */}
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="text-left p-4 text-white/80 font-medium">Name</th>
                                        <th className="text-left p-4 text-white/80 font-medium">Type</th>
                                        <th className="text-left p-4 text-white/80 font-medium">Size</th>
                                        <th className="text-left p-4 text-white/80 font-medium">Date</th>
                                        <th className="text-right p-4 text-white/80 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file) => (
                                        <tr key={file.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {file.type === 'image' && <FiImage className="w-5 h-5 text-blue-400" />}
                                                    {file.type === 'video' && <FiVideo className="w-5 h-5 text-purple-400" />}
                                                    {file.type === 'audio' && <FiMusic className="w-5 h-5 text-pink-400" />}
                                                    <span className="text-white">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-white/60 capitalize">{file.type}</td>
                                            <td className="p-4 text-white/60">{file.size}</td>
                                            <td className="p-4 text-white/60">{file.date}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all" title="Download">
                                                        <FiDownload className="w-4 h-4 text-white/60" />
                                                    </button>
                                                    <button className="p-2 hover:bg-red-500/20 rounded-lg transition-all" title="Delete">
                                                        <FiTrash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Upgrade Storage */}
                <div className="mt-12 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl border border-blue-500/30 p-6 md:p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-3">Need More Storage?</h3>
                    <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                        Upgrade your storage plan to get more space for your files, media, and content. Choose from our flexible storage plans.
                    </p>
                    <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg">
                        Upgrade Storage
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Storage;

