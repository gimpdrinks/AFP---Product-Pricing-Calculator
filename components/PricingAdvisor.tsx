/**
 * @file PricingAdvisor.tsx
 * NOTE: This component provides AI-powered pricing advice using the Gemini API.
 */
import React, { useState, useEffect, useRef } from 'react';
import { getPricingAdvice } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';

// Constants for local storage and limits
const DAILY_LIMIT = 5;
const COOLDOWN_SECONDS = 30;
const STORAGE_KEYS = {
  REQUEST_COUNT: 'ai_pricing_advisor_requests_v2',
  LAST_REQUEST_DATE: 'ai_pricing_advisor_last_request_date_v2',
};

// Helper to get today's date as a string (YYYY-MM-DD)
const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const PricingAdvisor: React.FC = () => {
  const { productInputs: inputs, calculatedPricing: results } = useAppContext();
  // State to manage the API call status and results.
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState('');
  const [error, setError] = useState('');

  // New states for rate limiting
  const [remainingRequests, setRemainingRequests] = useState(DAILY_LIMIT);
  const [cooldown, setCooldown] = useState(0);
  const cooldownIntervalRef = useRef<number | null>(null);

  // Effect to initialize and manage daily limits from local storage
  useEffect(() => {
    try {
        const lastRequestDate = localStorage.getItem(STORAGE_KEYS.LAST_REQUEST_DATE);
        const today = getTodayDateString();

        // If the last request was not made today, reset the daily limit.
        if (lastRequestDate !== today) {
          localStorage.setItem(STORAGE_KEYS.REQUEST_COUNT, String(DAILY_LIMIT));
          setRemainingRequests(DAILY_LIMIT);
        } else {
          // Otherwise, load the remaining count for today.
          const savedCount = parseInt(localStorage.getItem(STORAGE_KEYS.REQUEST_COUNT) || String(DAILY_LIMIT), 10);
          setRemainingRequests(savedCount);
        }
    } catch (e) {
        console.error("Could not access local storage:", e);
        // If local storage is disabled, proceed with default limits in memory
        setRemainingRequests(DAILY_LIMIT);
    }
  }, []);

  // Effect to manage the cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownIntervalRef.current = window.setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    } else if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
    }
    
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [cooldown]);

  /**
   * Fetches pricing advice from the Gemini service when the user clicks the button.
   */
  const handleGetAdvice = async () => {
    if (remainingRequests <= 0) {
        setError("You have reached your daily limit. Please try again tomorrow.");
        return;
    }

    setIsLoading(true);
    setError('');
    setAdvice('');
    try {
      const generatedAdvice = await getPricingAdvice(inputs, results);
      setAdvice(generatedAdvice);

      // On success, update counts, store today's date, and start cooldown
      const newCount = remainingRequests - 1;
      setRemainingRequests(newCount);
      try {
        const today = getTodayDateString();
        localStorage.setItem(STORAGE_KEYS.REQUEST_COUNT, String(newCount));
        localStorage.setItem(STORAGE_KEYS.LAST_REQUEST_DATE, today);
      } catch (e) {
        console.error("Could not write to local storage:", e);
      }
      setCooldown(COOLDOWN_SECONDS);

    } catch (e) {
      if (e instanceof Error) {
          setError(`Sorry, an error occurred: ${e.message}`);
      } else {
          setError('Sorry, the AI advisor could not be reached. Please try again later.');
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renders the advice string from the API, formatting it for better readability.
   * Handles markdown for bold, code snippets, and custom list formatting.
   */
  const renderAdvice = () => {
    // Handles inline formats: bold (**text**) and code (`text`)
    const processInlineFormatting = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g).filter(Boolean);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-slate-200 text-slate-800 rounded px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };
    
    // Split the entire advice text into chunks based on the "---" separator
    const tipSections = advice.split('---').filter(section => section.trim() !== '');

    // The first part is usually the greeting, and the last is the sign-off if they don't contain a tip title.
    const greeting = tipSections.length > 0 && !tipSections[0].includes('**Presyo Tip') ? tipSections.shift() : null;
    const signoff = tipSections.length > 0 && !tipSections[tipSections.length - 1].includes('**Presyo Tip') ? tipSections.pop() : null;

    return (
      <>
        {greeting && <p className="mb-4 text-slate-700">{processInlineFormatting(greeting.trim())}</p>}

        {tipSections.map((section, sectionIndex) => {
            const lines = section.trim().split('\n');
            const titleLine = lines.shift() || '';
            const listItems = lines.filter(line => line.trim().startsWith('* '));

            return (
                <div key={sectionIndex} className="mb-4">
                    <h4 className="text-md font-semibold text-slate-800 mb-2">{processInlineFormatting(titleLine.trim())}</h4>
                    <div className="space-y-2">
                        {listItems.map((item, itemIndex) => {
                            const content = item.trim().substring(2);
                            return (
                                <p key={itemIndex} className="pl-5 relative before:content-['•'] before:absolute before:left-0 before:text-indigo-500 text-slate-600">
                                    {processInlineFormatting(content)}
                                </p>
                            );
                        })}
                    </div>
                </div>
            );
        })}
        
        {signoff && <p className="mt-4 font-semibold text-slate-700">{processInlineFormatting(signoff.trim())}</p>}
      </>
    );
  };
  
  const isButtonDisabled = isLoading || cooldown > 0 || remainingRequests <= 0;
  
  const getButtonContent = () => {
    if (isLoading) {
      return (
            <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Thinking...</span>
            </>
      );
    }
    if (cooldown > 0) {
      return <span>On Cooldown ({cooldown}s)</span>;
    }
    if (remainingRequests <= 0) {
        return <span>Limit Reached</span>
    }
    return (
        <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM4.343 5.757a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 16a1 1 0 10-2 0v1a1 1 0 102 0v-1zM5.757 15.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM14.243 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM3 11a1 1 0 100 2h1a1 1 0 100-2H3zM16 11a1 1 0 100 2h1a1 1 0 100-2h-1zM7.879 8.879a3 3 0 004.242 0a3 3 0 000-4.242a3 3 0 00-4.242 0a3 3 0 000 4.242zM11 10a1 1 0 10-2 0v3a1 1 0 102 0v-3z" />
            </svg>
            <span>Get AI Analysis</span>
        </>
    );
  };


  return (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-inner">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-3 mb-6">
        <div className="flex-grow">
            <h2 className="text-lg font-semibold text-slate-800">Presyo - Your AI Pricing Analyst</h2>
            {remainingRequests > 0 && cooldown <= 0 && (
                <p className="text-xs text-slate-500 mt-1">
                You have {remainingRequests} {remainingRequests === 1 ? 'analysis' : 'analyses'} left today.
                </p>
            )}
            {remainingRequests <= 0 && (
                <p className="text-xs text-red-500 font-medium mt-1">
                Daily limit reached. Please check back tomorrow.
                </p>
            )}
        </div>
        <button
          onClick={handleGetAdvice}
          disabled={isButtonDisabled}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {getButtonContent()}
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
      {error && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</div>}

      {/* Display the formatted advice once it's available */}
      {advice && (
        <div className="prose prose-sm max-w-none text-slate-700">
          {renderAdvice()}
        </div>
      )}

      {/* Initial placeholder content */}
      {!isLoading && !advice && !error && (
        <div className="text-center py-10">
            <p className="text-slate-500">Click "Get AI Analysis" to receive AI-powered insights on your pricing strategy.</p>
        </div>
      )}
    </div>
  );
};