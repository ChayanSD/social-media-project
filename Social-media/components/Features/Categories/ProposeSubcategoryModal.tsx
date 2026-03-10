"use client";

import React, { useState } from 'react';
import CustomDialog from '@/components/ui/CustomDialog';
import { useCreateSubcategoryMutation } from '@/store/categoryApi';
import { toast } from 'sonner';

interface ProposeSubcategoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoryName: string;
}

const ProposeSubcategoryModal: React.FC<ProposeSubcategoryModalProps> = ({ open, onOpenChange, categoryName }) => {
    const [subcategoryName, setSubcategoryName] = useState('');
    const [createSubcategory, { isLoading }] = useCreateSubcategoryMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subcategoryName.trim()) {
            toast.error('Please enter an interest name');
            return;
        }

        try {
            await createSubcategory({
                category_name: categoryName,
                name: subcategoryName
            }).unwrap();

            toast.success('Interest proposed successfully!', {
                description: 'Awaiting admin approval.'
            });
            setSubcategoryName('');
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Failed to propose interest', {
                description: error?.data?.message || 'Something went wrong. Make sure it is not already proposed.'
            });
        }
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Propose Interest in "${categoryName}"`}
            description="Suggest a specific interest for this category. Once approved, it will be joinable."
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="subname" className="block text-sm font-medium text-white/70 mb-2">
                        Interest Name
                    </label>
                    <input
                        id="subname"
                        type="text"
                        value={subcategoryName}
                        onChange={(e) => setSubcategoryName(e.target.value)}
                        placeholder="e.g. Deep Learning, Macro Photography, etc."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white/30"
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Submitting...' : 'Propose Interest'}
                    </button>
                </div>
            </form>
        </CustomDialog>
    );
};

export default ProposeSubcategoryModal;
