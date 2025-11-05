
import React from 'react';

interface TooltipProps {
  text: string;
}

/**
 * A reusable tooltip component that displays informational text on hover.
 * It uses a simple question mark icon as a trigger.
 * 
 * @param {string} text - The informational text to display inside the tooltip.
 */
export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  return (
    <div className="relative flex items-center group">
      {/* Tooltip Trigger Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-slate-400 cursor-help"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true" // Icon is decorative
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="sr-only">Information</span>

      {/* Tooltip Popup */}
      <div 
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"
        role="tooltip" // Accessibility role
      >
        {text}
        {/* Tooltip Arrow */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800"></div>
      </div>
    </div>
  );
};
