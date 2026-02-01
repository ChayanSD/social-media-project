"use client";

import React, { useState } from "react";
import {
  useGetSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useToggleSubscriptionPlanActiveMutation,
  SubscriptionPlan,
} from "@/store/paymentApi";
import { Loader2, Plus, Edit, Trash2, Check, X, Power, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

interface PlanFormData {
  name: string;
  display_name: string;
  price: number;
  posts_per_month: number;
  features: string[];
  is_active: boolean;
  is_recommended: boolean;
}

// Skeleton Loader Component
const PlanCardSkeleton = () => {
  return (
    <div className="relative p-6 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl animate-pulse flex flex-col">
      {/* Title Skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-white/10 rounded w-1/2"></div>
      </div>

      {/* Posts per month skeleton */}
      <div className="mb-4 flex-1">
        <div className="h-4 bg-white/10 rounded w-2/3 mb-3"></div>

        {/* Features skeleton */}
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 bg-white/10 rounded mt-0.5 flex-shrink-0"></div>
            <div className="h-4 bg-white/10 rounded flex-1"></div>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 bg-white/10 rounded mt-0.5 flex-shrink-0"></div>
            <div className="h-4 bg-white/10 rounded flex-1 w-4/5"></div>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 bg-white/10 rounded mt-0.5 flex-shrink-0"></div>
            <div className="h-4 bg-white/10 rounded flex-1 w-3/4"></div>
          </li>
        </ul>
      </div>

      {/* Buttons skeleton */}
      <div className="flex gap-2 mt-4">
        <div className="flex-1 h-10 bg-white/10 rounded-lg"></div>
        <div className="w-14 h-10 bg-white/10 rounded-lg"></div>
      </div>
    </div>
  );
};

export default function SubscriptionPlansPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    display_name: "",
    price: 0,
    posts_per_month: 0,
    features: [],
    is_active: true,
    is_recommended: false,
  });
  const [featureInput, setFeatureInput] = useState("");

  const { data, isLoading, refetch } = useGetSubscriptionPlansQuery();
  const [createPlan, { isLoading: isCreating }] = useCreateSubscriptionPlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdateSubscriptionPlanMutation();
  const [deletePlan] = useDeleteSubscriptionPlanMutation();
  const [toggleActive, { isLoading: isToggling }] = useToggleSubscriptionPlanActiveMutation();

  const plans = data?.data || [];

  const handleCreate = () => {
    setFormData({
      name: "",
      display_name: "",
      price: 0,
      posts_per_month: 0,
      features: [],
      is_active: true,
      is_recommended: false,
    });
    setFeatureInput("");
    setSelectedPlan(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      price: plan.price,
      posts_per_month: plan.posts_per_month,
      features: plan.features || [],
      is_active: plan.is_active,
      is_recommended: plan.is_recommended || false,
    });
    setFeatureInput("");
    setIsEditModalOpen(true);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPlan) return;

    try {
      await deletePlan(selectedPlan.id).unwrap();
      toast.success("Plan deleted permanently from database");
      setIsDeleteDialogOpen(false);
      setSelectedPlan(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to delete plan";
      toast.error("Failed to delete plan", { description: errorMessage });
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const result = await toggleActive(plan.id).unwrap();
      toast.success(result.message || `Plan ${plan.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        "Failed to toggle plan status";
      toast.error(errorMessage);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedPlan) {
        // Update
        await updatePlan({
          id: selectedPlan.id,
          data: formData,
        }).unwrap();
        toast.success("Plan updated successfully");
        setIsEditModalOpen(false);
      } else {
        // Create
        await createPlan(formData).unwrap();
        toast.success("Plan created successfully");
        setIsCreateModalOpen(false);
      }
      setSelectedPlan(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to save plan";
      toast.error("Failed to save plan", { description: errorMessage });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Subscription Plans</h1>
          <p className="text-white/70">Manage subscription plans and pricing</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <PlanCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-6 bg-black/30 backdrop-blur-sm border rounded-xl transition-all duration-300 flex flex-col ${plan.is_recommended
                ? "border-purple-500 bg-purple-500/10"
                : plan.is_active
                  ? "border-white/20 hover:border-white/40"
                  : "border-gray-600/50 opacity-60"
                }`}
            >
              {plan.is_recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                    RECOMMENDED
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {!plan.is_active && (
                  <span className="px-2 py-0.5 bg-gray-600 text-white text-[10px] uppercase font-bold rounded">
                    Inactive
                  </span>
                )}
                <div className={`w-2 h-2 rounded-full ${plan.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-1">{plan.display_name}</h3>
                <p className="text-2xl font-bold text-white">
                  ${plan.price}
                  <span className="text-sm font-normal text-white/60">/month</span>
                </p>
              </div>

              <div className="mb-4 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-white/80">
                    {plan.posts_per_month === 0 ? "Unlimited" : `${plan.posts_per_month} posts/month`}
                  </span>
                </div>
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 cursor-pointer flex items-center justify-center p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/5"
                  title="Edit Plan"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(plan)}
                  disabled={isToggling}
                  className={`flex-1 cursor-pointer flex items-center justify-center p-2 rounded-lg transition-all border ${plan.is_active
                      ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                    }`}
                  title={plan.is_active ? "Deactivate Plan" : "Activate Plan"}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="flex-1 flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500 cursor-pointer text-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all"
                  title="Delete Permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1F2149] rounded-xl border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedPlan ? "Edit Plan" : "Create New Plan"}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedPlan(null);
                }}
                className="text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Plan Name (slug)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="e.g., premium"
                    required
                    disabled={!!selectedPlan}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="e.g., Premium Plan"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Posts per Month (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.posts_per_month}
                    onChange={(e) => setFormData({ ...formData, posts_per_month: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Features
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="Add a feature and press Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-white text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-white/80">
                    Active (visible to users)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_recommended"
                    checked={formData.is_recommended}
                    onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="is_recommended" className="text-sm text-white/80">
                    Recommended (shows &quot;RECOMMENDED&quot; badge)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      {selectedPlan ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    selectedPlan ? "Update Plan" : "Create Plan"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedPlan(null);
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <span>Permanently Delete Plan?</span>
          </div>
        }
        description={
          <div className="space-y-3">
            <p>Are you sure you want to delete <span className="font-bold text-white underline decoration-red-500/50">"{selectedPlan?.display_name}"</span> entirely from the system?</p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">Danger Zone</p>
              <ul className="text-[11px] text-red-300/80 list-disc pl-4 space-y-1">
                <li>This action is irreversible</li>
                <li>The plan will be removed from the database</li>
                <li>New users will not be able to see or join this plan</li>
              </ul>
            </div>
            <p className="text-[11px] text-white/50 italic">Note: If users have active subscriptions, the system will block this deletion to protect their records.</p>
          </div>
        }
        confirmLabel="Yes, Delete Permanently"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setSelectedPlan(null);
        }}
      />
    </div>
  );
}