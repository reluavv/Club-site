import { z } from "zod";

/**
 * Zod validation schemas for all forms in the application.
 * 
 * Usage:
 *   const result = contactFormSchema.safeParse(formData);
 *   if (!result.success) {
 *       const errors = result.error.flatten().fieldErrors;
 *       // Show errors per field
 *   }
 */

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

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine((p) => /[A-Z]/.test(p), "Must contain at least one uppercase letter")
    .refine((p) => /[a-z]/.test(p), "Must contain at least one lowercase letter")
    .refine((p) => /[0-9]/.test(p), "Must contain at least one number")
    .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p), "Must contain at least one special character");

// --- Auth Schemas ---

export const signupSchema = z
    .object({
        email: z
            .string()
            .email("Please enter a valid email address")
            .refine(
                (e) => e.endsWith("@av.students.amrita.edu"),
                "Must use your college email (@av.students.amrita.edu)"
            ),
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

// --- Profile Schemas ---

export const profileSchema = z.object({
    displayName: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be under 50 characters"),
    rollNo: z
        .string()
        .min(1, "Roll number is required")
        .max(20, "Roll number is too long"),
    mobile: z
        .string()
        .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
    class: z.string().min(1, "Class is required"),
    section: z.string().min(1, "Section is required"),
});

export const adminOnboardingSchema = z.object({
    displayName: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be under 50 characters"),
    rollNo: z
        .string()
        .min(1, "Roll number is required")
        .max(20, "Roll number is too long"),
    dob: z.string().min(1, "Date of birth is required"),
    socials: z.object({
        github: z.string().url("Must be a valid URL").optional().or(z.literal("")),
        linkedin: z.string().url("Must be a valid URL").optional().or(z.literal("")),
        instagram: z.string().optional(),
    }).optional(),
});

// --- Contact Form Schema ---

export const contactFormSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be under 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    subject: z
        .string()
        .min(5, "Subject must be at least 5 characters")
        .max(200, "Subject must be under 200 characters"),
    message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(2000, "Message must be under 2000 characters"),
});

// --- Event Schema ---

export const eventSchema = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be under 100 characters"),
    date: z.string().min(1, "Date is required"),
    time: z.string().optional(),
    venue: z.string().optional(),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(500, "Description must be under 500 characters"),
    fullDescription: z.string().optional(),
    status: z.enum(["upcoming", "ongoing", "past"]),
    registrationStatus: z.enum(["open", "closed"]).optional(),
    minTeamSize: z.number().int().min(1).optional(),
    maxTeamSize: z.number().int().min(1).optional(),
});

// --- Team Registration Schema ---

export const teamRegistrationSchema = z.object({
    teamName: z
        .string()
        .min(2, "Team name must be at least 2 characters")
        .max(50, "Team name must be under 50 characters")
        .regex(/^[a-zA-Z0-9\s_-]+$/, "Team name can only contain letters, numbers, spaces, hyphens, and underscores"),
});

// --- Resource Schema ---

export const resourceSchema = z.object({
    title: z.string().min(2, "Title is required").max(100),
    description: z.string().max(500).optional(),
    category: z.enum(["AIML", "DSA", "General"]),
    type: z.enum(["link", "pdf", "video"]),
    url: z.string().url("Must be a valid URL"),
});

// --- Utility: Extract error messages ---

/**
 * Extract a flat map of field-name → error-message from a Zod error.
 * Returns an empty object if there are no errors.
 */
export function getFieldErrors(result: { success: boolean; error?: z.ZodError }): Record<string, string> {
    if (result.success || !result.error) return {};
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const field = issue.path.join(".");
        if (!errors[field]) {
            errors[field] = issue.message;
        }
    }
    return errors;
}
