"use client";

import { ToastProvider } from "@/components/ui/Toast";

/**
 * Client-side providers wrapper.
 * 
 * This component wraps client-side context providers that need to be
 * available throughout the app. It's imported in the root layout
 * (which is a Server Component) to bridge the server/client boundary.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}
