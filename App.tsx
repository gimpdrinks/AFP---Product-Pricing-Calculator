/**
 * @file App.tsx
 * This is the root component of the Product Pricing Calculator application.
 * It manages the application's state, handles business logic, and orchestrates
 * the rendering of UI components.
 */
// FIX: Corrected the import statement for React and added useState, which was used but not imported.
import React, { useState } from 'react';
import { Materials } from './components/Materials';
import { ProductPricing } from './components/ProductPricing';
import type { Material, ProductInputs, CalculatedPricing, ProductMaterialRow, LaborCostRow, OtherFeeRow } from './types';
import { v4 as uuidv4 } from 'uuid';


// Constants for local storage keys to ensure consistency.
const LOCAL_STORAGE_KEYS = {
  MATERIALS: 'product_pricing_materials',
  PRODUCT_INPUTS: 'product_pricing_product_inputs_v2', // Versioned to avoid conflicts with old structure
};

// Default data to populate the app on first load or if local storage is empty.
const defaultMaterials: Material[] = [
    { id: '1', sku: 'FAB-001', name: 'Cotton Fabric', supplier: 'Fabric World', totalCost: 1500, qty: 10, unitOfMeasurement: 'yards', unitPrice: 150 },
    { id: '2', sku: 'INK-002', name: 'Printing Ink', supplier: 'Ink Supplies', totalCost: 500, qty: 20, unitOfMeasurement: 'bottle', unitPrice: 25 },
    { id: '3', sku: 'TAG-003', name: 'Brand Tag', supplier: 'Label Makers Inc.', totalCost: 250, qty: 50, unitOfMeasurement: 'pieces', unitPrice: 5 },
    { id: '4', sku: 'PKG-BOX-S', name: 'Small Box', supplier: 'Packaging Co', totalCost: 100, qty: 20, unitOfMeasurement: 'pieces', unitPrice: 5 },
    { id: '5', sku: 'PKG-TAPE', name: 'Packing Tape', supplier: 'Packaging Co', totalCost: 80, qty: 2, unitOfMeasurement: 'roll', unitPrice: 40 },
];


const defaultProductInputs: ProductInputs = {
  productName: 'Custom T-Shirt',
  hourlyLaborRate: 40,
  materialCostRows: [{ id: uuidv4(), materialId: '1', qty: 0.5 }, { id: uuidv4(), materialId: '2', qty: 2 }],
  packagingCostRows: [{ id: uuidv4(), materialId: '4', qty: 1 }],
  laborCostRows: [{ id: uuidv4(), taskName: 'Production', hours: 0.5 }, { id: uuidv4(), taskName: 'Packaging', hours: 0.25 }],
  otherFeeRows: [{ id: uuidv4(), feeName: 'Platform Fee', qty: 1, unit: 'transaction', unitPrice: 15 }],
  calculationMode: 'margin',
  targetMargin: 60,
  targetPrice: 1000,
  discount: 10,
};

// Define the type for the new material data received from the form.
type NewMaterialData = Omit<Material, 'id' | 'unitPrice'>;


const App: React.FC = () => {
  // STATE MANAGEMENT
  // State for the list of all available materials.
  // It's initialized from local storage to persist data between sessions.
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.MATERIALS);
      return saved ? JSON.parse(saved) : defaultMaterials;
    } catch (error) {
      console.error("Failed to load materials from local storage", error);
      return defaultMaterials;
    }
  });

  // State for the inputs related to the product being priced.
  // Also initialized from local storage.
  const [productInputs, setProductInputs] = useState<ProductInputs>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCT_INPUTS);
      return saved ? JSON.parse(saved) : defaultProductInputs;
    } catch (error) {
      console.error("Failed to load product inputs from local storage", error);
      return defaultProductInputs;
    }
  });
  
  // SIDE EFFECTS
  // This effect hook saves the materials list to local storage whenever it changes.
  React.useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    } catch (error) {
      console.error("Failed to save materials to local storage", error);
    }
  }, [materials]);

  // This effect hook saves the product inputs to local storage whenever they change.
  React.useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCT_INPUTS, JSON.stringify(productInputs));
    } catch (error) {
      console.error("Failed to save product inputs to local storage", error);
    }
  }, [productInputs]);

  // CALLBACK HANDLERS
  // `useCallback` is used to memoize these functions so they aren't recreated on every render,
  // which is a performance optimization for child components that receive them as props.

  /**
   * Adds a new material to the list, ensuring no duplicates.
   * @param data - The data for the new material from the form.
   * @returns `true` if added successfully, `false` if a duplicate name was found.
   */
  const handleAddMaterial = React.useCallback((data: NewMaterialData): boolean => {
    // Prevent adding materials with the same name (case-insensitive).
    if (materials.some(m => m.name.toLowerCase() === data.name.toLowerCase())) {
      return false; // Indicate failure (duplicate)
    }
    const newMaterial: Material = {
      id: uuidv4(), // Use a UUID for a unique ID.
      ...data,
      // Calculate unit price. Prevent division by zero.
      unitPrice: data.qty > 0 ? data.totalCost / data.qty : 0,
    };
    setMaterials(prev => [...prev, newMaterial]);
    return true; // Indicate success
  }, [materials]);

  /**
   * Deletes a material from the list and removes it from any product cost rows.
   * @param id - The ID of the material to delete.
   */
  const handleDeleteMaterial = React.useCallback((id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    // Also remove the material from the product's selected materials list.
    setProductInputs(prev => ({
        ...prev,
        materialCostRows: prev.materialCostRows.filter(row => row.materialId !== id),
        packagingCostRows: prev.packagingCostRows.filter(row => row.materialId !== id),
    }));
  }, []);

  /**
   * A generic handler to update any field in the `productInputs` state.
   * @param name - The key of the `productInputs` object to update.
   * @param value - The new value for that key.
   */
  const handleProductInputChange = React.useCallback((name: keyof ProductInputs, value: any) => {
    setProductInputs(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // MEMOIZED CALCULATION
  // `useMemo` ensures that the complex pricing calculation only runs when
  // `productInputs` or `materials` change, not on every render.
  const calculatedPricing: CalculatedPricing = React.useMemo(() => {
    
    // Helper function to find a material's price.
    const getMaterialPrice = (id: string | null) => materials.find(m => m.id === id)?.unitPrice || 0;

    // 1. Calculate costs from each calculator table.
    const totalMaterialCost = productInputs.materialCostRows.reduce((sum, row) => {
      return sum + (getMaterialPrice(row.materialId) * row.qty);
    }, 0);

    const totalPackagingCost = productInputs.packagingCostRows.reduce((sum, row) => {
      return sum + (getMaterialPrice(row.materialId) * row.qty);
    }, 0);

    const totalLaborCost = productInputs.laborCostRows.reduce((sum, row) => {
        return sum + (row.hours * productInputs.hourlyLaborRate);
    }, 0);
    
    const totalOtherFeesCost = productInputs.otherFeeRows.reduce((sum, row) => {
        return sum + (row.qty * row.unitPrice);
    }, 0);

    // 2. Calculate the total base cost (all costs combined).
    const totalBaseCost = totalMaterialCost + totalPackagingCost + totalLaborCost + totalOtherFeesCost;

    let finalPrice = 0;
    let requiredMargin = 0;

    // 3. Calculate the final price based on the chosen strategy (margin or target price).
    if (productInputs.calculationMode === 'margin') {
      // Calculate price based on a target profit margin.
      const marginDecimal = productInputs.targetMargin / 100;
      finalPrice = marginDecimal < 1 ? totalBaseCost / (1 - marginDecimal) : totalBaseCost;
      requiredMargin = productInputs.targetMargin;
    } else {
      // Use the user-defined target sales price.
      finalPrice = productInputs.targetPrice;
      // Calculate the resulting profit margin from the target price.
      requiredMargin = finalPrice > 0 ? ((finalPrice - totalBaseCost) / finalPrice) * 100 : 0;
    }

    // 4. Calculate the discounted price and profit.
    const discountDecimal = productInputs.discount / 100;
    const discountedPrice = finalPrice * (1 - discountDecimal);
    const profit = discountedPrice - totalBaseCost;

    return {
      totalMaterialCost,
      totalPackagingCost,
      totalLaborCost,
      totalOtherFeesCost,
      totalBaseCost,
      finalPrice,
      requiredMargin,
      discountedPrice,
      profit,
    };
  }, [productInputs, materials]);

  // RENDER METHOD
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center">
            <img 
                src="https://res.cloudinary.com/dbylka4xx/image/upload/v1751883360/AiForPinoys_Logo_ttg2id.png" 
                alt="AI for Pinoys Logo" 
                className="h-16 w-auto mb-2"
            />
          <h1 className="text-3xl font-bold text-slate-900 text-center">Product Pricing Calculator</h1>
          <p className="text-slate-600 mt-1 text-center">
            A step-by-step tool to determine the optimal price for your products.
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Main layout is a responsive grid. On large screens, it's a 3-column grid */}
        {/* with materials taking 1 column and pricing taking 2. On smaller screens, it stacks. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-28">
            <Materials
              materials={materials}
              onAdd={handleAddMaterial}
              onDelete={handleDeleteMaterial}
            />
          </div>
          <div className="lg:col-span-2">
            <ProductPricing
              materials={materials}
              product={productInputs}
              onProductChange={handleProductInputChange}
              results={calculatedPricing}
            />
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-slate-500">
        <p>
            Created by <a href="https://aiforpinoys.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">@aiforpinoys</a>
        </p>
      </footer>
    </div>
  );
};

export default App;