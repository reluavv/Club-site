"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/firebase";

export default function AnalyticsListener() {
    useEffect(() => {
        // This component doesn't need to do anything complex.
        // Importing 'analytics' from '@/lib/firebase' ensures the initialization code runs.
        // We can add page view tracking here in the future if needed, 
        // but Firebase Analytics tracks page views automatically for SPAs in many cases 
        // or we might need a specific router listener.

        if (process.env.NODE_ENV === "development") {
            console.log("Analytics Listener mounted");
            if (analytics) {
                console.log("Analytics instance available:", analytics);
            }
        }
    }, []);

    return null;
}
