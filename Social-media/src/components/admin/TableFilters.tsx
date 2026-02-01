"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

export interface TableFiltersProps {
  title?: string;
  filters?: {
    type: "select" | "button-group";
    key: string;
    label?: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  children?: React.ReactNode;
}

export function TableFilters({ title, filters, children }: TableFiltersProps) {
  if (!filters || filters.length === 0) {
    return title ? (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => {
          if (filter.type === "button-group") {
            return (
              <div key={filter.key} className="flex items-center gap-2">
                {filter.label && (
                  <label className="text-sm text-white/70 whitespace-nowrap">
                    {filter.label}:
                  </label>
                )}
                <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                  {filter.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => filter.onChange(option.value)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        filter.value === option.value
                          ? "bg-blue-600 text-white"
                          : "bg-transparent text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // Select dropdown using shadcn Select
          return (
            <div key={filter.key} className="flex flex-col gap-1">
              {filter.label && (
                <label className="text-sm text-white/70 whitespace-nowrap">
                  {filter.label}:
                </label>
              )}
              <Select
                value={filter.value}
                onValueChange={filter.onChange}
              >
                <SelectTrigger className="min-w-[120px] h-9 bg-white/10 border border-white/20 text-white hover:bg-white/15 focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-[#06133FBF] text-white backdrop-blur-md border border-white/20 shadow-lg">
                  {filter.options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer focus:bg-white/20"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

