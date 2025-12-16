"use client";

import { useEffect, useState } from "react";

interface Star {
    id: number;
    size: string;
    top: string;
    left: string;
    duration: string;
    delay: string;
}

export default function StarBackground() {
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        const newStars: Star[] = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            size: i % 3 === 0 ? 'small' : i % 3 === 1 ? 'medium' : 'large',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            duration: `${2 + Math.random() * 3}s`,
            delay: `${Math.random() * 2}s`
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="stars fixed inset-0 z-0 pointer-events-none">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className={`star ${star.size}`}
                    style={{
                        top: star.top,
                        left: star.left,
                        animationDuration: star.duration,
                        animationDelay: star.delay
                    }}
                />
            ))}
            <div className="shooting-star" style={{ top: "20%", left: "30%", animationDelay: "0s" }}></div>
            <div className="shooting-star" style={{ top: "60%", left: "70%", animationDelay: "2s" }}></div>
        </div>
    );
}
