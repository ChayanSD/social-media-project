"use client";

import React, { useState } from 'react';
import CustomDialog from '@/components/ui/CustomDialog';
import { useCreateCategoryMutation } from '@/store/categoryApi';
import { toast } from 'sonner';

interface ProposeCategoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ProposeCategoryModal: React.FC<ProposeCategoryModalProps> = ({ open, onOpenChange }) => {
    const [categoryName, setCategoryName] = useState('');
    const [createCategory, { isLoading }] = useCreateCategoryMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            await createCategory({ name: categoryName }).unwrap();
            toast.success('Category proposed successfully!', {
                description: 'Awaiting admin approval.'
            });
            setCategoryName('');
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Failed to propose category', {
                description: error?.data?.message || 'Something went wrong'
            });
        }
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Propose New Category"
            description="Suggest a new interest category. It will be visible to everyone once approved by an admin."
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
                        Category Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="e.g. Artificial Intelligence, Photography, etc."
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
                        {isLoading ? 'Submitting...' : 'Propose Category'}
                    </button>
                </div>
            </form>
        </CustomDialog>
    );
};

export default ProposeCategoryModal;
