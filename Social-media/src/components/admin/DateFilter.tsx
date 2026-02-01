"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";

export type DateRangePreset = 
  | "all"
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "this-year"
  | "last-year"
  | "custom";

export interface DateRange {
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
}

export interface DateFilterProps {
  value?: DateRangePreset;
  dateRange?: DateRange;
  onChange: (preset: DateRangePreset, dateRange?: DateRange) => void;
  label?: string;
  className?: string;
}

export function DateFilter({
  value = "all",
  dateRange,
  onChange,
  label = "Date",
  className = "",
}: DateFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(value);
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Initialize custom dates from dateRange prop if provided
  useEffect(() => {
    if (dateRange?.start_date) {
      setCustomStartDate(dateRange.start_date);
    }
    if (dateRange?.end_date) {
      setCustomEndDate(dateRange.end_date);
    }
  }, [dateRange]);

  const getDateRangeForPreset = (preset: DateRangePreset): DateRange | undefined => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case "all":
        return undefined; // No date filtering
      
      case "this-week": {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          start_date: formatDate(startOfWeek),
          end_date: formatDate(endOfWeek),
        };
      }
      
      case "last-week": {
        const dayOfWeek = today.getDay();
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        return {
          start_date: formatDate(startOfLastWeek),
          end_date: formatDate(endOfLastWeek),
        };
      }
      
      case "this-month": {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          start_date: formatDate(startOfMonth),
          end_date: formatDate(endOfMonth),
        };
      }
      
      case "last-month": {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          start_date: formatDate(startOfLastMonth),
          end_date: formatDate(endOfLastMonth),
        };
      }
      
      case "this-year": {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        return {
          start_date: formatDate(startOfYear),
          end_date: formatDate(endOfYear),
        };
      }
      
      case "last-year": {
        const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
        return {
          start_date: formatDate(startOfLastYear),
          end_date: formatDate(endOfLastYear),
        };
      }
      
      case "custom":
        return dateRange; // Return existing custom range or undefined
      
      default:
        return undefined;
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setSelectedPreset(newPreset);
    
    if (newPreset === "custom") {
      setCustomRangeOpen(true);
    } else {
      const range = getDateRangeForPreset(newPreset);
      onChange(newPreset, range);
    }
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      if (new Date(customStartDate) > new Date(customEndDate)) {
        // Swap dates if start is after end
        onChange("custom", {
          start_date: customEndDate,
          end_date: customStartDate,
        });
      } else {
        onChange("custom", {
          start_date: customStartDate,
          end_date: customEndDate,
        });
      }
      setCustomRangeOpen(false);
    }
  };

  const getDisplayValue = (): string => {
    if (selectedPreset === "custom" && dateRange?.start_date && dateRange?.end_date) {
      const start = new Date(dateRange.start_date);
      const end = new Date(dateRange.end_date);
      return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
    }
    
    const presetLabels: Record<DateRangePreset, string> = {
      all: "All",
      "this-week": "This Week",
      "last-week": "Last Week",
      "this-month": "This Month",
      "last-month": "Last Month",
      "this-year": "This Year",
      "last-year": "Last Year",
      custom: "Custom Range",
    };
    
    return presetLabels[selectedPreset];
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label className="text-sm text-white/70 whitespace-nowrap">
            {label}:
          </label>
        )}
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="min-w-[160px] h-9 bg-white/10 border border-white/20 text-white hover:bg-white/15 focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <SelectValue>{getDisplayValue()}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#06133FBF] text-white backdrop-blur-md border border-white/20 shadow-lg">
            <SelectItem value="all" className="cursor-pointer focus:bg-white/20">
              All
            </SelectItem>
            <SelectItem value="this-week" className="cursor-pointer focus:bg-white/20">
              This Week
            </SelectItem>
            <SelectItem value="last-week" className="cursor-pointer focus:bg-white/20">
              Last Week
            </SelectItem>
            <SelectItem value="this-month" className="cursor-pointer focus:bg-white/20">
              This Month
            </SelectItem>
            <SelectItem value="last-month" className="cursor-pointer focus:bg-white/20">
              Last Month
            </SelectItem>
            <SelectItem value="this-year" className="cursor-pointer focus:bg-white/20">
              This Year
            </SelectItem>
            <SelectItem value="last-year" className="cursor-pointer focus:bg-white/20">
              Last Year
            </SelectItem>
            <SelectItem value="custom" className="cursor-pointer focus:bg-white/20">
              Custom Range
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range Dialog */}
      <Dialog open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#06133FBF] border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Custom Date Range
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                max={formatDate(new Date())} // Can't select future dates
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCustomRangeOpen(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomRangeApply}
                disabled={!customStartDate || !customEndDate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

