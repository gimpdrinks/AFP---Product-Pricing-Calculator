/**
 * @file ResultsDisplay.tsx
 * NOTE: This component is part of a previous, simpler application structure and is
 * not currently used in the main App.tsx component flow. It's designed to display
 * the results from the basic pricing calculation.
 */
import React from 'react';
import type { CalculatedResults } from '../types';

interface ResultsDisplayProps {
  results: CalculatedResults;
}

// A utility function to format numbers into a USD currency string.
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// A reusable card component to display a single calculated result.
interface ResultCardProps {
  title: string;
  value: string;
  description: string;
  isPrimary?: boolean; // For styling the main result differently
}

const ResultCard: React.FC<ResultCardProps> = ({ title, value, description, isPrimary = false }) => (
  <div className={`${isPrimary ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'} p-4 rounded-lg shadow-md`}>
    <h3 className={`text-sm font-medium ${isPrimary ? 'text-indigo-200' : 'text-slate-500'}`}>{title}</h3>
    <p className={`text-3xl font-bold mt-1 ${isPrimary ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    <p className={`text-xs mt-2 ${isPrimary ? 'text-indigo-100' : 'text-slate-600'}`}>{description}</p>
  </div>
);

/**
 * The main component for displaying all calculated pricing results in a structured layout.
 */
export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-slate-800 border-b pb-3 mb-6">Calculated Pricing & Profit</h2>
      <div className="space-y-4">
        <ResultCard
          title="Suggested Retail Price"
          value={formatCurrency(results.retailPrice)}
          description="The final price your customer pays. This includes all costs and your profit margin."
          isPrimary={true}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            title="Suggested Wholesale Price"
            value={formatCurrency(results.wholesalePrice)}
            description="The discounted price for bulk/resale buyers."
          />
          <ResultCard
            title="Total Cost Per Unit"
            value={formatCurrency(results.totalCostPerUnit)}
            description="Your total expense to produce and sell one unit, including overhead."
          />
          <ResultCard
            title="Profit Per Unit (Retail)"
            value={formatCurrency(results.profitPerUnit)}
            description="The profit you make on a single retail sale."
          />
          <ResultCard
            title="Total Monthly Profit"
            value={formatCurrency(results.totalMonthlyProfit)}
            description="Your estimated total profit per month based on sales volume."
          />
        </div>
      </div>
    </div>
  );
};
