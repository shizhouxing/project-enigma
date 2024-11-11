"use client";
import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnimatedStarButtonProps {
  initialStars: number;
  onStar?: (starred: boolean) => void;
}

export function AnimatedStarButton({
  initialStars,
  onStar,
}: AnimatedStarButtonProps) {
  const [stars, setStars] = useState(initialStars);
  const [isStarred, setIsStarred] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStarClick = () => {
    setIsAnimating(true);
    setIsStarred(!isStarred);
    setStars((prev) => (isStarred ? prev - 1 : prev + 1));
    onStar?.(!isStarred);

    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className={`relative overflow-hidden transition-colors ${
          isStarred ? "hover:bg-yellow-100" : "hover:bg-gray-100"
        }`}
        onClick={handleStarClick}
      >
        <Star
          className={`w-7 h-7 transition-all duration-300 ${
            isStarred ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
          } ${isAnimating ? "animate-[star-pulse_500ms_ease-in-out]" : ""}`}
        />

        {/* Burst particles */}
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute left-1/2 top-1/2 w-1 h-1 bg-yellow-400 rounded-full
                  animate-[star-particle_500ms_ease-out_forwards]`}
                style={
                  {
                    transform: `rotate(${i * 45}deg)`,
                    "--particle-angle": `${i * 45}deg`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </Button>
      <span className="text-lg font-medium">{stars}</span>

      <style jsx global>{`
        @keyframes star-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.35);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes star-particle {
          0% {
            transform: rotate(var(--particle-angle)) translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--particle-angle)) translateX(12px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
