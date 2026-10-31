import { z } from "zod";

// --- Password Policy ---

export const PASSWORD_RULES = [
    { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { id: "uppercase", label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
    { id: "lowercase", label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
    { id: "number", label: "One number (0-9)", test: (p: string) => /[0-9]/.test(p) },
    { id: "special", label: "One special character (!@#$%^&*)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
] as const;

export function isPasswordStrong(password: string): boolean {
    return PASSWORD_RULES.every((rule) => rule.test(password));
}

// --- Team Registration Schema ---

export const teamRegistrationSchema = z.object({
    teamName: z
        .string()
        .min(2, "Team name must be at least 2 characters")
        .max(50, "Team name must be under 50 characters")
        .regex(/^[a-zA-Z0-9\s_-]+$/, "Team name can only contain letters, numbers, spaces, hyphens, and underscores"),
});
