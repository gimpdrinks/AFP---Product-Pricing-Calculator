import { useMemo } from 'react';
import type { ProductInputs, Material, CalculatedPricing } from '../types';

export const useProductCalculator = (
  productInputs: ProductInputs,
  materials: Material[]
): CalculatedPricing => {
  return useMemo(() => {
    const getMaterialPrice = (id: string | null) =>
      materials.find(m => m.id === id)?.unitPrice || 0;

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

    const totalBaseCost = totalMaterialCost + totalPackagingCost + totalLaborCost + totalOtherFeesCost;

    let finalPrice = 0;
    let requiredMargin = 0;

    if (productInputs.calculationMode === 'margin') {
      const marginDecimal = productInputs.targetMargin / 100;
      finalPrice = marginDecimal < 1 ? totalBaseCost / (1 - marginDecimal) : totalBaseCost;
      requiredMargin = productInputs.targetMargin;
    } else {
      finalPrice = productInputs.targetPrice;
      requiredMargin = finalPrice > 0 ? ((finalPrice - totalBaseCost) / finalPrice) * 100 : 0;
    }

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
};
