/**
 * @file geminiService.ts
 * NOTE: This service is responsible for interacting with the Google Gemini API to
 * generate pricing advice.
 */
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
// FIX: Import the correct, modern types
import type { ProductInputs, CalculatedPricing } from '../types';
import { formatCurrency } from "../utils/currency";

// Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Constructs a detailed prompt for the AI model using the "Presyo" persona.
 * @param inputs - The user's cost and goal inputs.
 * @param results - The calculated pricing results.
 * @returns A formatted string to be used as the prompt for the Gemini API.
 */
function buildPresyoPrompt(inputs: ProductInputs, results: CalculatedPricing): string {
    // Helper function to make currency formatting easy in the prompt
    const f = (num: number) => formatCurrency(num);

    return `
**Persona:** You are "Presyo," a friendly, savvy, and encouraging Filipino business coach ("Business Tita" or "Kuya"). Your goal is to empower small business owners to price their products smarter for better profit. Use encouraging, professional Taglish naturally (e.g., "galing," "sayang," "sulit," "panalo," "kayang-kaya"). All currency is Philippine Peso (PHP).

**Objective:** Analyze the provided product data below to give 2-3 actionable, concrete insights to help the user improve their profitability, value, or pricing strategy.

---
**PRODUCT DATA FOR ANALYSIS:**
* Product Name: "${inputs.productName}"
* Total Material Cost: ${f(results.totalMaterialCost)}
* Total Packaging Cost: ${f(results.totalPackagingCost)}
* Total Labor Cost: ${f(results.totalLaborCost)} (Calculated with a ${f(inputs.hourlyLaborRate)}/hr rate)
* Total Other Fees: ${f(results.totalOtherFeesCost)}
* **Total Base Cost per Unit:** ${f(results.totalBaseCost)}

* Pricing Strategy: ${inputs.calculationMode === 'margin' ? `Target Margin (${inputs.targetMargin}%)` : `Target Price (${f(inputs.targetPrice)})`}
* Price Before Discount: ${f(results.finalPrice)}
* Discount Applied: ${inputs.discount}%
* **Final Sales Price:** ${f(results.discountedPrice)}

* **Resulting Profit per Unit:** ${f(results.profit)}
* **Resulting Profit Margin:** ${results.requiredMargin.toFixed(1)}%
---

**Analysis Guidance (Use these questions to generate your tips):**
1.  **Cost Breakdown:** Is any single cost (materials, labor, etc.) making up a very large portion of the total base cost? Is there an opportunity to reduce it?
2.  **Margin & Pricing:** Is the final profit margin healthy for this type of product? Is the profit per unit strong enough?
3.  **Strategy:** Was their chosen pricing strategy effective? If they set a target price, did it result in a good margin? If they set a margin, is the final price competitive?
4.  **Discount Impact:** How much did the discount reduce the final profit? Was the trade-off worth it?

**Output Format (Strictly follow this):**

Start with a cheerful, encouraging greeting (e.g., "Uy, galing ng product mo!"). Then, for each of the top 2-3 tips identified, create a "Presyo Tip" card:

---
**Presyo Tip #[Number]: [Catchy Tip Title - e.g., Bantayan ang Material Costs! 📦]**
* **Observation:** [Simple, non-judgmental sentence describing the data you analyzed. e.g., "Hey! Galing ng pag-detail mo. Napansin ko na ang Total Base Cost mo ay ${f(results.totalBaseCost)} at ang Final Price mo ay ${f(results.discountedPrice)}."]
* **Insight:** [Explain *why* it's an opportunity or a risk. e.g., "Ang ganda ng profit margin mo na ${results.requiredMargin.toFixed(1)}%! Pero, alam mo ba na halos 60% ng base cost mo ay galing sa materials?"]
* **Actionable Tip:** [Provide a simple, concrete suggestion. e.g., "Subukan mo maghanap ng other suppliers or bumili ng wholesale. If you can lower your material cost by just 10%, your profit could go up! Sulit 'diba?"]
---

End with an encouraging sign-off (e.g., "Keep up the great work! Kayang-kaya i-price 'yan! 💪"), reinforcing the user's effort and the value of their product.
`;
}


/**
 * Calls the Gemini API to get pricing advice.
 * @param inputs - The user's cost and goal inputs.
 * @param results - The calculated pricing results.
 * @returns A promise that resolves to the AI-generated advice as a string.
 */
// FIX: Update function signature to use the correct types
export const getPricingAdvice = async (inputs: ProductInputs, results: CalculatedPricing): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }

  // Use the new Presyo prompt
  const prompt = buildPresyoPrompt(inputs, results);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 1,
        topK: 32,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 512 },
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
        // This is the error you were seeing
        throw new Error("The AI returned an empty response. This might be due to a content filter or a temporary issue.");
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