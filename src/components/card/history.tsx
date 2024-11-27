import React from 'react';

interface HistoryItem {
    href : string;

}

export default function HistoryCard({href} : HistoryItem) {
  return (
    <div className="relative group/row">
      {/* Checkbox Selection */}
      <div className="p-1 absolute z-10 top-1/2 -translate-y-1/2 -translate-x-1/2 transition duration-100 -left-1 opacity-0 scale-75 group-hover/row:opacity-100 group-hover/row:scale-100 group-has-[:focus-visible]/row:opacity-100 group-has-[:focus-visible]/row:scale-100">
        <div data-state="closed">
          <label className="select-none inline-flex align-top items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-6 h-6 overflow-hidden flex items-center justify-center border rounded transition-colors duration-100 ease-in-out peer-focus-visible:ring-1 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 bg-bg-000 border-border-200 hover:border-border-100 cursor-pointer" />
            </div>
            <span className="text-text-100 sr-only">Select chat</span>
          </label>
        </div>
      </div>

      {/* Card Content */}
      <div className="group relative">
        <a 
          href={href}
          className="
            border-0.5
            text-md
            flex
            cursor-pointer
            overflow-x-hidden
            text-ellipsis
            whitespace-nowrap
            rounded-xl
            bg-gradient-to-b
            py-4
            pl-5
            pr-4
            transition-all
            ease-in-out
            hover:shadow-sm
            active:scale-[0.98]
            from-bg-100 
            to-bg-100/30 
            border-border-300 
            hover:from-bg-000 
            hover:to-bg-000/80 
            hover:border-border-200"
        >
          <div className="flex-grow flex-col">
            <div className="font-tiempos">Chat History Viewer Component</div>
            <div className="flex min-h-5 items-center gap-1.5">
              <div className="text-text-400 text-xs">
                Last message <span data-state="closed">4 minutes ago</span>
              </div>
            </div>
          </div>
        </a>

        {/* Delete Button */}
        <button 
          className="
            inline-flex
            items-center
            justify-center
            relative
            shrink-0
            ring-offset-2
            ring-offset-bg-300
            ring-accent-main-100
            focus-visible:outline-none
            focus-visible:ring-1
            disabled:pointer-events-none
            disabled:opacity-50
            disabled:shadow-none
            disabled:drop-shadow-none
            text-text-200
            border-transparent
            transition-colors
            font-styrene
            active:bg-bg-400
            hover:bg-bg-500/40
            hover:text-text-100
            z-2
            absolute
            top-2
            right-2
            p-2
            rounded-lg
            transition
            duration-300
            opacity-0
            translate-x-1
            ease-in-out
            group-hover:translate-x-0
            group-hover:opacity-100"
          aria-label="Delete conversation"
          data-state="closed"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            fill="currentColor" 
            viewBox="0 0 256 256"
          >
            <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}