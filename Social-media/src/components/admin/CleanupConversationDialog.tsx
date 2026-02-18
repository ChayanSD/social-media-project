
import React, { useState } from "react";
import CustomDialog from "@/components/ui/CustomDialog";

interface CleanupConversationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (startDate: string, endDate: string) => void;
    title: string;
    description: string;
    isCleaning: boolean;
}

export default function CleanupConversationDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    isCleaning
}: CleanupConversationDialogProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedQuarter, setSelectedQuarter] = useState<string>("1"); // 1=Q1, 2=Q2, etc.

    const periods = [
        { value: "1", label: "Jan - Mar (Q1)" },
        { value: "2", label: "Apr - Jun (Q2)" },
        { value: "3", label: "Jul - Sep (Q3)" },
        { value: "4", label: "Oct - Dec (Q4)" },
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const handleConfirm = () => {
        let startMonth = 0;
        let endMonth = 0;

        switch (selectedQuarter) {
            case "1": startMonth = 0; endMonth = 2; break; // Jan - Mar
            case "2": startMonth = 3; endMonth = 5; break; // Apr - Jun
            case "3": startMonth = 6; endMonth = 8; break; // Jul - Sep
            case "4": startMonth = 9; endMonth = 11; break; // Oct - Dec
        }

        // Create dates in local time but format as YYYY-MM-DD
        // Start date: 1st of startMonth
        const startDate = new Date(selectedYear, startMonth, 1);

        // End date: Last day of endMonth
        // To get last day of month, go to next month day 0
        const endDate = new Date(selectedYear, endMonth + 1, 0);

        // Format as YYYY-MM-DD
        const formatDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        onConfirm(formatDate(startDate), formatDate(endDate));
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) onClose();
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={handleOpenChange}
            title={title}
            description={description}
            maxWidth="sm"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-full text-base text-gray-200 bg-transparent hover:bg-white/10 transition-colors cursor-pointer"
                        disabled={isCleaning}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isCleaning}
                        className="px-4 py-2 rounded-full text-base text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        {isCleaning ? "Cleaning..." : "Cleanup Messages"}
                    </button>
                </>
            }
        >
            <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-base font-medium text-gray-200">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isCleaning}
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-base font-medium text-gray-200">Period</label>
                        <select
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isCleaning}
                        >
                            {periods.map((period) => (
                                <option key={period.value} value={period.value}>
                                    {period.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-sm text-orange-200">
                        Warning: This will permanently delete all messages from the selected period. This action cannot be undone.
                    </p>
                </div>
            </div>
        </CustomDialog>
    );
}
