/**
 * @file App.tsx
 * This is the root component of the Product Pricing Calculator application.
 * It manages the application's state, handles business logic, and orchestrates
 * the rendering of UI components.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Materials } from './components/Materials';
import { ProductPricing } from './components/ProductPricing';
import { PricingAdvisor } from './components/PricingAdvisor';
import type { Material, ProductInputs, NewMaterialData, CalculationMode, ProductMaterialRow, LaborCostRow, OtherFeeRow } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useProductCalculator } from './hooks/useProductCalculator';
import { AppContext } from './context/AppContext';


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


const App: React.FC = () => {
  // STATE MANAGEMENT
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.MATERIALS);
      return saved ? JSON.parse(saved) : defaultMaterials;
    } catch (error) {
      console.error("Failed to load materials from local storage", error);
      return defaultMaterials;
    }
  });

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
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    } catch (error) {
      console.error("Failed to save materials to local storage", error);
    }
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCT_INPUTS, JSON.stringify(productInputs));
    } catch (error) {
      console.error("Failed to save product inputs to local storage", error);
    }
  }, [productInputs]);

  // CALLBACK HANDLERS
  const onAddMaterial = useCallback((data: NewMaterialData): boolean => {
    if (materials.some(m => m.name.toLowerCase() === data.name.toLowerCase())) {
      return false; 
    }
    const newMaterial: Material = {
      id: uuidv4(),
      ...data,
      unitPrice: data.qty > 0 ? data.totalCost / data.qty : 0,
    };
    setMaterials(prev => [...prev, newMaterial]);
    return true;
  }, [materials]);

  const onDeleteMaterial = useCallback((id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    setProductInputs(prev => ({
        ...prev,
        materialCostRows: prev.materialCostRows.filter(row => row.materialId !== id),
        packagingCostRows: prev.packagingCostRows.filter(row => row.materialId !== id),
    }));
  }, []);

  const onProductTextChange = useCallback((name: 'productName', value: string) => {
    setProductInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const onProductNumberChange = useCallback((name: 'hourlyLaborRate' | 'targetMargin' | 'targetPrice' | 'discount', value: number) => {
    setProductInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const onProductModeChange = useCallback((name: 'calculationMode', value: CalculationMode) => {
    setProductInputs(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const onProductRowsChange = useCallback((
      rowType: 'materialCostRows' | 'packagingCostRows' | 'laborCostRows' | 'otherFeeRows', 
      value: ProductMaterialRow[] | LaborCostRow[] | OtherFeeRow[]
  ) => {
      setProductInputs(prev => ({ ...prev, [rowType]: value }));
  }, []);

  // MEMOIZED CALCULATION
  const calculatedPricing = useProductCalculator(productInputs, materials);

  const contextValue = {
    materials,
    onAddMaterial,
    onDeleteMaterial,
    productInputs,
    onProductTextChange,
    onProductNumberChange,
    onProductModeChange,
    onProductRowsChange,
    calculatedPricing,
  };

  // RENDER METHOD
  return (
    <AppContext.Provider value={contextValue}>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 lg:sticky lg:top-28">
              <Materials />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <ProductPricing />
              <PricingAdvisor />
            </div>
          </div>
        </main>

        <footer className="text-center py-6 text-sm text-slate-500">
          <p>
              Created by <a href="https://aiforpinoys.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">@aiforpinoys</a>
          </p>
        </footer>
      </div>
    </AppContext.Provider>
  );
};

export default App;