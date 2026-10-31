"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WARN_AFTER = 3; // Show warning after 3 failed attempts

interface RateLimitState {
    attempts: number;
    firstAttemptTime: number;
    lockoutUntil: number | null;
}

function getStorageKey(page: string) {
    return `relu_login_ratelimit_${page}`;
}

function loadState(page: string): RateLimitState {
    try {
        const raw = sessionStorage.getItem(getStorageKey(page));
        if (raw) {
            const parsed = JSON.parse(raw) as RateLimitState;
            // Reset if the 15-minute window has expired and no active lockout
            if (parsed.lockoutUntil && Date.now() > parsed.lockoutUntil) {
                sessionStorage.removeItem(getStorageKey(page));
                return { attempts: 0, firstAttemptTime: 0, lockoutUntil: null };
            }
            // Reset if the attempt window (15 min) expired without lockout
            if (!parsed.lockoutUntil && Date.now() - parsed.firstAttemptTime > LOCKOUT_DURATION_MS) {
                sessionStorage.removeItem(getStorageKey(page));
                return { attempts: 0, firstAttemptTime: 0, lockoutUntil: null };
            }
            return parsed;
        }
    } catch { }
    return { attempts: 0, firstAttemptTime: 0, lockoutUntil: null };
}

function saveState(page: string, state: RateLimitState) {
    try {
        sessionStorage.setItem(getStorageKey(page), JSON.stringify(state));
    } catch { }
}

export function useLoginRateLimit(page: "admin" | "public") {
    const [state, setState] = useState<RateLimitState>({ attempts: 0, firstAttemptTime: 0, lockoutUntil: null });
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load state from sessionStorage on mount
    useEffect(() => {
        const loaded = loadState(page);
        setState(loaded);

        if (loaded.lockoutUntil && loaded.lockoutUntil > Date.now()) {
            setRemainingSeconds(Math.ceil((loaded.lockoutUntil - Date.now()) / 1000));
        }
    }, [page]);

    // Countdown timer for lockout
    useEffect(() => {
        if (remainingSeconds > 0) {
            intervalRef.current = setInterval(() => {
                setRemainingSeconds((prev) => {
                    if (prev <= 1) {
                        // Lockout expired
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        const newState: RateLimitState = { attempts: 0, firstAttemptTime: 0, lockoutUntil: null };
                        setState(newState);
                        saveState(page, newState);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [remainingSeconds, page]);

    const recordFailedAttempt = useCallback(() => {
        setState((prev) => {
            const now = Date.now();
            const newAttempts = prev.attempts + 1;
            const firstAttempt = prev.firstAttemptTime || now;

            if (newAttempts >= MAX_ATTEMPTS) {
                // Lock out for 15 minutes
                const lockoutUntil = now + LOCKOUT_DURATION_MS;
                const newState: RateLimitState = { attempts: newAttempts, firstAttemptTime: firstAttempt, lockoutUntil };
                saveState(page, newState);
                setRemainingSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
                return newState;
            }

            const newState: RateLimitState = { attempts: newAttempts, firstAttemptTime: firstAttempt, lockoutUntil: null };
            saveState(page, newState);
            return newState;
        });
    }, [page]);

    const resetAttempts = useCallback(() => {
        const newState: RateLimitState = { attempts: 0, firstAttemptTime: 0, lockoutUntil: null };
        setState(newState);
        saveState(page, newState);
        setRemainingSeconds(0);
    }, [page]);

    const isLockedOut = state.lockoutUntil !== null && state.lockoutUntil > Date.now();
    const showWarning = state.attempts >= WARN_AFTER && !isLockedOut;
    const attemptsRemaining = MAX_ATTEMPTS - state.attempts;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return {
        isLockedOut,
        showWarning,
        attemptsRemaining,
        remainingSeconds,
        formattedTime: formatTime(remainingSeconds),
        recordFailedAttempt,
        resetAttempts,
    };
}
