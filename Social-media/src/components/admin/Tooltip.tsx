"use client";
import { useState, useRef } from "react";

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    disabled?: boolean;
}

export function Tooltip({
    text,
    children,
    position = "top",
    disabled = false,
}: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = () => {
        timeoutRef.current = setTimeout(() => setVisible(true), 200);
    };

    const hide = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisible(false);
    };

    const positionClasses: Record<string, string> = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    const arrowClasses: Record<string, string> = {
        top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent border-4",
        bottom:
            "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent border-4",
        left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent border-4",
        right:
            "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent border-4",
    };

    return (
        <div
            className="relative inline-flex items-center justify-center overflow-visible"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {visible && !disabled && text && (
                <div
                    className={`absolute z-50 pointer-events-none ${positionClasses[position]}`}
                >
                    <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-white/10 whitespace-nowrap">
                        {text}
                    </div>
                    <div className={`absolute ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
}
