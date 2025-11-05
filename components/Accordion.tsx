/**
 * @file Accordion.tsx
 * A generic, reusable accordion component for creating collapsible content sections.
 * It's used in the ProductPricing component to break down the form into manageable steps.
 */
import React, { useState, ReactNode, useId } from 'react';

// Props for the Accordion component.
interface AccordionProps {
  title: ReactNode;     // The content for the accordion's button/header.
  children: ReactNode;  // The content to be shown/hidden inside the panel.
  startOpen?: boolean;  // Optional: whether the accordion should be open by default.
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, startOpen = false }) => {
  // State to track whether the accordion panel is open or closed.
  const [isOpen, setIsOpen] = useState(startOpen);
  // `useId` generates a unique ID to link the button and the panel for accessibility.
  const contentId = useId();

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-sm">
      <h3 className="text-lg mb-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center p-4 text-left font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75"
          // ARIA attributes for accessibility, indicating the panel's state and which panel it controls.
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          {title}
          {/* Chevron icon that rotates based on the open/closed state. */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-300 text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </h3>
      {/* The content panel is conditionally rendered based on the `isOpen` state. */}
      {isOpen && (
        <div id={contentId} className="p-4 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
};
