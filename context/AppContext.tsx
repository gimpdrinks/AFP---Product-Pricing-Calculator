import React, { createContext, useContext } from 'react';
import type { Material, ProductInputs, CalculatedPricing, NewMaterialData, CalculationMode, ProductMaterialRow, LaborCostRow, OtherFeeRow } from '../types';

interface AppContextType {
  materials: Material[];
  onAddMaterial: (data: NewMaterialData) => boolean;
  onDeleteMaterial: (id: string) => void;
  productInputs: ProductInputs;
  onProductTextChange: (name: 'productName', value: string) => void;
  onProductNumberChange: (name: 'hourlyLaborRate' | 'targetMargin' | 'targetPrice' | 'discount', value: number) => void;
  onProductModeChange: (name: 'calculationMode', value: CalculationMode) => void;
  onProductRowsChange: (rowType: 'materialCostRows' | 'packagingCostRows' | 'laborCostRows' | 'otherFeeRows', value: ProductMaterialRow[] | LaborCostRow[] | OtherFeeRow[]) => void;
  calculatedPricing: CalculatedPricing;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};