"use client";

import { PASSWORD_RULES } from "@/lib/schemas";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
    password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    if (!password) return null;

    const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
    const total = PASSWORD_RULES.length;
    const percentage = (passed / total) * 100;

    const strengthLabel =
        percentage === 100 ? "Strong" :
        percentage >= 60 ? "Medium" :
        percentage >= 20 ? "Weak" : "Very Weak";

    const strengthColor =
        percentage === 100 ? "bg-green-500" :
        percentage >= 60 ? "bg-yellow-500" :
        percentage >= 20 ? "bg-orange-500" : "bg-red-500";

    const textColor =
        percentage === 100 ? "text-green-400" :
        percentage >= 60 ? "text-yellow-400" :
        percentage >= 20 ? "text-orange-400" : "text-red-400";

    return (
        <div className="mt-2 space-y-2">
            {/* Strength Bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
                    {strengthLabel}
                </span>
            </div>

            {/* Rules Checklist */}
            <ul className="space-y-1">
                {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                        <li key={rule.id} className="flex items-center gap-2">
                            {met ? (
                                <Check size={12} className="text-green-400 shrink-0" />
                            ) : (
                                <X size={12} className="text-gray-500 shrink-0" />
                            )}
                            <span className={`text-[11px] ${met ? "text-green-400/80" : "text-gray-500"}`}>
                                {rule.label}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
