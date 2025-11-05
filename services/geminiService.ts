/**
 * @file geminiService.ts
 * NOTE: This service is responsible for interacting with the Google Gemini API to
 * generate pricing advice. It is used by the `PricingAdvisor` component and is
 * not currently integrated into the main `App.tsx` flow.
 */
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { CalculatorInputs, CalculatedResults, ProductInputs, CalculatedPricing } from '../types';
import { formatCurrency } from "../utils/currency";

// Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Constructs a detailed prompt for the AI model based on the user's inputs and calculated results.
 * @param inputs - The user's cost and goal inputs.
 * @param results - The calculated pricing results.
 * @returns A formatted string to be used as the prompt for the Gemini API.
 */
function buildPrompt(inputs: CalculatorInputs, results: CalculatedResults): string {
    const formatNumber = (num: number) => num.toFixed(2);
    return `
Analyze the following product cost and pricing data.

**Product Cost & Pricing Data:**
- Material Cost Per Unit: ${formatNumber(inputs.materialCost)}
- Labor Cost Per Unit: ${formatNumber(inputs.laborCost)}
- Packaging/Shipping Cost Per Unit: ${formatNumber(inputs.packagingCost)}
- Total Cost Per Unit (including overhead): ${formatNumber(results.totalCostPerUnit)}
- Desired Profit Margin: ${inputs.profitMargin}%
- Monthly Sales Volume: ${inputs.monthlySalesVolume} units

**Calculated Prices:**
- Suggested Retail Price: ${formatNumber(results.retailPrice)}
- Suggested Wholesale Price: ${formatNumber(results.wholesalePrice)}
- Profit Per Retail Sale: ${formatNumber(results.profitPerUnit)}
- Total Estimated Monthly Profit: ${formatNumber(results.totalMonthlyProfit)}

**Instructions:**
1. Comment on the retail price given the cost and profit margin.
2. Suggest the market positioning (e.g., premium, mid-range, budget).
3. Offer 2-3 actionable bullet points to improve profitability.
4. Comment on the wholesale price and discount.
`;
}


/**
 * Calls the Gemini API to get pricing advice.
 * @param inputs - The user's cost and goal inputs.
 * @param results - The calculated pricing results.
 * @returns A promise that resolves to the AI-generated advice as a string.
 */
export const getPricingAdvice = async (inputs: CalculatorInputs, results: CalculatedResults): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }

  const prompt = buildPrompt(inputs, results);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 1,
        topK: 32,
        maxOutputTokens: 512,
        thinkingConfig: { thinkingBudget: 256 },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      }
    });

    if (!response.candidates || response.candidates.length === 0 || !response.text) {
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`Request was blocked for safety reasons: ${blockReason}.`);
        }
        throw new Error("The AI returned an empty response.");
    }
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get pricing advice: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the AI model.");
  }
};
