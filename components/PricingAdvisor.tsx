/**
 * @file PricingAdvisor.tsx
 * NOTE: This component provides AI-powered pricing advice using the Gemini API.
 * It is not currently used in the main App.tsx component flow.
 */
import React, { useState } from 'react';
import { getPricingAdvice } from '../services/geminiService';
import type { CalculatorInputs, CalculatedResults } from '../types';

interface PricingAdvisorProps {
  inputs: CalculatorInputs;
  results: CalculatedResults;
}

export const PricingAdvisor: React.FC<PricingAdvisorProps> = ({ inputs, results }) => {
  // State to manage the API call status and results.
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState('');
  const [error, setError] = useState('');

  /**
   * Fetches pricing advice from the Gemini service when the user clicks the button.
   */
  const handleGetAdvice = async () => {
    setIsLoading(true);
    setError('');
    setAdvice('');
    try {
      const generatedAdvice = await getPricingAdvice(inputs, results);
      setAdvice(generatedAdvice);
    } catch (e) {
      setError('Sorry, the AI advisor could not be reached. Please try again later.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renders the advice string from the API, formatting it into paragraphs and lists.
   */
  const renderAdvice = () => {
    return advice.split('\n').map((paragraph, index) => {
      // Basic markdown-like formatting for bullet points.
      if (paragraph.startsWith('* ')) {
        return <li key={index} className="ml-5 list-disc">{paragraph.substring(2)}</li>;
      }
      // Treat empty lines as paragraph breaks.
      if (paragraph.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="mb-4">{paragraph}</p>;
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center border-b pb-3 mb-6">
        <h2 className="text-xl font-semibold text-slate-800">AI Pricing Advisor</h2>
        <button
          onClick={handleGetAdvice}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Thinking...' : 'Get Advice'}
        </button>
      </div>

      {/* Conditional rendering based on the loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="ml-3 text-slate-600">Generating strategic insights...</p>
        </div>
      )}

      {/* Display error message if the API call fails */}
      {error && <div className="text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}

      {/* Display the formatted advice once it's available */}
      {advice && (
        <div className="prose prose-sm max-w-none text-slate-600">
          {renderAdvice()}
        </div>
      )}

      {/* Initial placeholder content */}
      {!isLoading && !advice && !error && (
        <div className="text-center py-10">
            <p className="text-slate-500">Click "Get Advice" to receive AI-powered insights on your pricing strategy.</p>
        </div>
      )}
    </div>
  );
};
