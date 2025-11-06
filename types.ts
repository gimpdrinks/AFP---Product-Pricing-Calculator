/**
 * @file types.ts
 * This file contains all the TypeScript type definitions and interfaces
 * used throughout the application, ensuring type safety and code clarity.
 */

// Represents a single raw material with its cost breakdown, mirroring the spreadsheet structure.
export interface Material {
  id: string;               // Unique identifier
  sku: string;              // Stock Keeping Unit (optional)
  name: string;             // Display name of the material (Item Description)
  supplier: string;         // Supplier name (optional)
  totalCost: number;        // Total cost for the quantity purchased
  qty: number;              // Quantity purchased
  unitOfMeasurement: string;// Unit of measurement (e.g., pieces, yards, kg)
  unitPrice: number;        // Calculated cost per single unit (totalCost / qty)
}

// Defines the two possible modes for price calculation.
export type CalculationMode = 'margin' | 'price';

// A row in the Material or Packaging cost calculator tables.
export interface ProductMaterialRow {
  id: string; // Unique ID for the row itself
  materialId: string | null; // ID from the master Material list
  qty: number;
}

// A row in the Labor cost calculator table.
export interface LaborCostRow {
  id: string;
  taskName: string;
  hours: number;
}

// A row in the Other Fees calculator table.
export interface OtherFeeRow {
  id: string;
  feeName: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

// Define the type for the new material data received from the form.
export type NewMaterialData = Omit<Material, 'id' | 'unitPrice'>;


// Represents all the user-configurable inputs for pricing a single product,
// matching the new spreadsheet-style UI.
export interface ProductInputs {
  productName: string;
  hourlyLaborRate: number;
  
  // Rows for the different cost calculators
  materialCostRows: ProductMaterialRow[];
  packagingCostRows: ProductMaterialRow[];
  laborCostRows: LaborCostRow[];
  otherFeeRows: OtherFeeRow[];

  // Pricing strategy remains the same
  calculationMode: CalculationMode;
  targetMargin: number; // As a percentage, e.g., 50 for 50%
  targetPrice: number;
  discount: number;     // As a percentage
}

// Represents all the calculated pricing results derived from `ProductInputs`.
export interface CalculatedPricing {
  // Breakdown of costs
  totalMaterialCost: number; // From the material cost calculator
  totalPackagingCost: number; // From the packaging cost calculator
  totalLaborCost: number; // From the labor cost calculator
  totalOtherFeesCost: number; // From the other fees calculator

  // Grand total
  totalBaseCost: number;

  // Final pricing
  finalPrice: number;       // Non-discounted price
  requiredMargin: number;   // As a percentage
  discountedPrice: number;
  profit: number;           // Profit on the discounted price
}

// FIX: Add missing legacy type `CalculatorInputs` to resolve compilation errors.
// This type is used by the old, unused CalculatorForm component.
export interface CalculatorInputs {
  materialCost: number;
  laborCost: number;
  packagingCost: number;
  monthlyOverhead: number;
  monthlySalesVolume: number;
  profitMargin: number;
  wholesaleDiscount: number;
}

// FIX: Add missing legacy type `CalculatedResults` to resolve compilation errors.
// This type is used by the old, unused ResultsDisplay component.
export interface CalculatedResults {
  retailPrice: number;
  wholesalePrice: number;
  totalCostPerUnit: number;
  profitPerUnit: number;
  totalMonthlyProfit: number;
}
