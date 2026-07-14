"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, AlertTriangle, Info, XCircle, X } from "lucide-react";

// --- Types ---

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

// --- Context ---

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Fallback for components outside the provider — uses alert() as graceful degradation
        return {
            toast: (msg) => alert(msg),
            success: (msg) => alert(msg),
            error: (msg) => alert(msg),
            warning: (msg) => alert(msg),
            info: (msg) => alert(msg),
        };
    }
    return ctx;
}

// --- Icon Map ---

const ICON_MAP: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const COLOR_MAP: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: {
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        icon: "text-green-400",
        text: "text-green-300",
    },
    error: {
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        icon: "text-red-400",
        text: "text-red-300",
    },
    warning: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        icon: "text-yellow-400",
        text: "text-yellow-300",
    },
    info: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: "text-blue-400",
        text: "text-blue-300",
    },
};

// --- Provider ---

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, type: ToastType = "info") => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setToasts((prev) => [...prev, { id, message, type }]);

            // Auto-dismiss after 5 seconds
            setTimeout(() => removeToast(id), 5000);
        },
        [removeToast]
    );

    const contextValue: ToastContextType = {
        toast: addToast,
        success: (msg) => addToast(msg, "success"),
        error: (msg) => addToast(msg, "error"),
        warning: (msg) => addToast(msg, "warning"),
        info: (msg) => addToast(msg, "info"),
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Toast Container — Fixed top-right */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
                {toasts.map((t) => {
                    const Icon = ICON_MAP[t.type];
                    const colors = COLOR_MAP[t.type];

                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto animate-in slide-in-from-right-5 fade-in duration-300 ${colors.bg} ${colors.border} border backdrop-blur-xl rounded-xl p-4 shadow-2xl shadow-black/30 flex items-start gap-3`}
                        >
                            <Icon className={`${colors.icon} shrink-0 mt-0.5`} size={18} />
                            <p className={`${colors.text} text-sm font-medium flex-1`}>
                                {t.message}
                            </p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="text-gray-500 hover:text-white transition-colors shrink-0"
                                aria-label="Dismiss notification"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
