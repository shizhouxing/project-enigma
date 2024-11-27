'use client';
import React from 'react';

const colorSchemes = {
  new: {
    border: "border-indigo-400/50",
    hover: "hover:border-indigo-400",
    gradient: "from-transparent to-indigo-500/10",
    badge: "from-indigo-400 to-indigo-300",
    placeholder: "from-indigo-400 to-indigo-100"
  },
  update: {
    border: "border-emerald-400/50",
    hover: "hover:border-emerald-400",
    gradient: "from-transparent to-emerald-500/10",
    badge: "from-emerald-400 to-emerald-300",
    placeholder: "from-emerald-400 to-emerald-100"
  },
  beta: {
    border: "border-purple-400/50",
    hover: "hover:border-purple-400",
    gradient: "from-transparent to-purple-500/10",
    badge: "from-purple-400 to-purple-300",
    placeholder: "from-purple-400 to-purple-100"
  },
  warning: {
    border: "border-amber-400/50",
    hover: "hover:border-amber-400",
    gradient: "from-transparent to-amber-500/10",
    badge: "from-amber-400 to-amber-300",
    placeholder: "from-amber-400 to-amber-100"
  }
};

type colors = "new" | "update" | "beta" | "warning";

export const AnnouncementButton = ({ 
  badge = "New",
  title = "Introducing the upgraded Claude 3.5 Sonnet",
  description = "A new version with broad improvements, especially for coding and complex reasoning",
  variant = "new"
} : {badge? : string; title? : string; description?: string; variant? : colors}) => {
  const colors = colorSchemes[(variant as colors)] || colorSchemes.new;

  return (
    <button className={`${colors.border} relative flex w-full flex-col items-start gap-2 overflow-hidden rounded-2xl border px-3 py-3 text-left text-sm transition-all ${colors.hover} scale-100 cursor-pointer opacity-100 active:scale-[0.9875]`}>
      {/* Gradient overlay */}
      <div className={`bg-gradient-to-b ${colors.gradient} pointer-events-none absolute inset-0 h-full w-full`}></div>
      
      {/* Title section with badge */}
      <div className="flex grow items-center gap-2 w-full max-md:pl-9 max-md:pb-1">
        <div className={`uppercase mt-0.5 bg-gradient-to-bl ${colors.badge} text-white rounded-lg px-1.5 py-[0.03rem] text-[0.6rem] font-medium max-md:absolute max-md:top-1.5 max-md:left-2 max-md:mt-px`}>
          {badge}
        </div>
        <div className="grow font-medium">
          {title}
        </div>
      </div>
      
      {/* Description section */}
      <div className="-mt-2 flex gap-2">
        <div
          aria-hidden="true"
          className={`uppercase mt-0.5 bg-gradient-to-bl ${colors.placeholder} text-oncolor-100 rounded-lg px-1.5 py-[0.03rem] text-[0.6rem] font-medium max-md:absolute max-md:top-1.5 max-md:left-2 max-md:mt-px h-0 opacity-0`}
        >
          {badge}
        </div>
        <div>
          {description}
        </div>
      </div>
    </button>
  );
};
