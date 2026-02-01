import React, { useState } from "react";
import Image from "next/image";
import { Edit, Trash2, Eye } from "lucide-react";
import { getApiBaseUrl } from "@/lib/utils";

interface ProductCardProps {
    index?: number;
    image?: string;
    title?: string;
    description?: string;
    id?: number | string;
    location?: string;
    link?: string;
    seller?: {
        username?: string;
        display_name?: string;
    };
    user_name?: string;
    isOwner?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onCardClick?: () => void;
    onViewDetails?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
    index = 0,
    image,
    title = "Service Title",
    description,
    location,
    link,
    seller,
    isOwner = false,
    onEdit,
    onDelete,
    onViewDetails
}) => {
    const [showActions, setShowActions] = useState(false);
    const imageUrl = image
        ? (image.startsWith('http') ? image : `${getApiBaseUrl()}${image.startsWith('/') ? image.slice(1) : image}`)
        : "/sheep.jpg";

    const handleCardClick = () => {
        setShowActions(!showActions);
        if (onViewDetails) {
            onViewDetails();
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={`group relative flex flex-col ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'} max-h-[350px] overflow-hidden cursor-pointer rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
        >
            {/* Product Image */}
            <div className="relative md:w-2/3 aspect-square overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />

                {/* Action Buttons */}
                {/* On mobile: show when showActions is true, on desktop: show on hover */}
                <div className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-300 ${showActions
                    ? 'opacity-100'
                    : 'opacity-0 md:opacity-0 md:group-hover:opacity-100'
                    }`}>
                    {/* View Details Button - Show for everyone */}
                    {onViewDetails && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(false); // Close actions on mobile
                                onViewDetails();
                            }}
                            className="p-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition text-white"
                            title="View details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}

                    {/* Edit/Delete Buttons - Only show if user is owner */}
                    {isOwner && (
                        <>
                            {onEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowActions(false); // Close actions on mobile
                                        onEdit();
                                    }}
                                    className="p-2 bg-blue-500/80 hover:bg-blue-500 rounded-lg transition text-white"
                                    title="Edit product"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowActions(false); // Close actions on mobile
                                        onDelete();
                                    }}
                                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition text-white"
                                    title="Delete product"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Service Info */}
            <div className="flex-1 md:w-1/3 p-6 md:p-10 flex flex-col justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-white line-clamp-2 min-h-[2rem]">{title}</h3>

                    {/* Description */}
                    {description && (
                        <p className="text-sm text-white/70 line-clamp-5 mt-1">
                            {description}
                        </p>
                    )}

                    {(location || seller) && (
                        <div className="flex items-center gap-2 text-xs text-white/50 pt-1">
                            {location && <span>{location}</span>}
                            {seller?.display_name && (
                                <span className="ml-auto">by {seller.display_name}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Visit Platform Button - Show if link exists and user is not the owner */}
                {link && !isOwner && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(link, '_blank', 'noopener,noreferrer');
                        }}
                        className="mt-2 max-w-[250px] flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 font-medium cursor-pointer"
                    >
                        Explore
                    </button>
                )}

                {/* View Details Button - Show if onViewDetails is provided and no link button */}
                {onViewDetails && !link && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails();
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 font-medium cursor-pointer"
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
