/**
 * @file ProductPricing.tsx
 * This component renders the entire product pricing workflow, now based on a
 * spreadsheet-style interface with multiple cost calculator tables.
 */
import React, { useCallback } from 'react';
import type { ProductMaterialRow, LaborCostRow, OtherFeeRow, ProductInputs, CalculationMode } from '../types';
import { formatCurrency } from '../utils/currency';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from './Tooltip';
import { useAppContext } from '../context/AppContext';
// Import the new components
import { MaterialCostTable } from './MaterialCostTable';
import { PackagingCostTable } from './PackagingCostTable';
import { LaborCostTable } from './LaborCostTable';
import { OtherFeeTable } from './OtherFeeTable';


// Reusable class strings for consistent input styling.
const inputBaseClasses = "mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-3 bg-white text-slate-900 placeholder:text-slate-400";

// Reusable component for the step headers with color-coded numbers.
const StepHeader = ({ number, title }: { number: number; title: string }) => {
    // Colors inspired by the Philippine flag.
    const colors: { [key: number]: string } = {
        1: 'bg-blue-600 text-white',
        2: 'bg-red-600 text-white',
        3: 'bg-yellow-400 text-slate-800',
        4: 'bg-green-600 text-white',
    };
    
    // Fallback for any other number
    const colorClasses = colors[number] || 'bg-slate-200 text-slate-600';

    return (
        <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${colorClasses}`}>
                {number}
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
    );
};

type CostTab = 'materials' | 'packaging' | 'labor' | 'other';
type RowType = 'materialCostRows' | 'packagingCostRows' | 'laborCostRows' | 'otherFeeRows';


export const ProductPricing: React.FC = () => {
  const { 
    productInputs: product, 
    calculatedPricing: results,
    onProductTextChange,
    onProductNumberChange,
    onProductModeChange,
    onProductRowsChange,
  } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<CostTab>('materials');

  // Generic handler for top-level numeric input changes.
  const handleTopLevelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as 'hourlyLaborRate' | 'targetMargin' | 'targetPrice' | 'discount';
    const value = Math.max(0, parseFloat(e.target.value) || 0);
    onProductNumberChange(name, value);
  };
  
  // Generic handler for top-level text input changes (e.g., product name).
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onProductTextChange('productName', e.target.value);
  };

  // HANDLERS for Table Rows
  
  const addRow = useCallback((rowType: RowType) => {
    let newRow: ProductMaterialRow | LaborCostRow | OtherFeeRow;
    switch (rowType) {
        case 'materialCostRows':
        case 'packagingCostRows':
            newRow = { id: uuidv4(), materialId: null, qty: 1 };
            break;
        case 'laborCostRows':
            newRow = { id: uuidv4(), taskName: '', hours: 1 };
            break;
        case 'otherFeeRows':
            newRow = { id: uuidv4(), feeName: '', qty: 1, unit: 'each', unitPrice: 0 };
            break;
        default: return;
    }
    const currentRows = product[rowType] as any[];
    onProductRowsChange(rowType, [...currentRows, newRow]);
  }, [product, onProductRowsChange]);

  const updateRow = useCallback((rowType: RowType, rowIndex: number, updatedValue: any) => {
    const currentRows = product[rowType] as any[];
    const newRows = [...currentRows];
    newRows[rowIndex] = { ...newRows[rowIndex], ...updatedValue };
    onProductRowsChange(rowType, newRows);
  }, [product, onProductRowsChange]);

  const removeRow = useCallback((rowType: RowType, rowIndex: number) => {
    const currentRows = product[rowType] as any[];
    onProductRowsChange(rowType, currentRows.filter((_, index) => index !== rowIndex));
  }, [product, onProductRowsChange]);

  const TabButton = ({ tab, label }: { tab: CostTab, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
    >
      {label}
    </button>
  );
  
  return (
    <div className="space-y-8">
        
        {/* Step 1: Product Details */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <StepHeader number={1} title="Product Details" />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-slate-700">Product Name</label>
                    <input id="productName" name="productName" type="text" value={product.productName} onChange={handleTextChange} className={inputBaseClasses} placeholder="e.g., Custom T-Shirt"/>
                </div>
                <div>
                    <label htmlFor="hourlyLaborRate" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span>Default Hourly Labor Rate (₱)</span>
                      <Tooltip text="The cost of one hour of labor. This rate is used to calculate the total labor cost for each task." />
                    </label>
                    <input id="hourlyLaborRate" name="hourlyLaborRate" type="number" value={product.hourlyLaborRate} onChange={handleTopLevelInputChange} className={inputBaseClasses} placeholder="40.00" min="0" step="0.01"/>
                </div>
            </div>
        </div>

        {/* Step 2: Cost Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <StepHeader number={2} title="Cost Breakdown" />
            <div className="mt-4 pt-4 border-t">
                <div className="flex space-x-2 border-b mb-4">
                    <TabButton tab="materials" label="Materials" />
                    <TabButton tab="packaging" label="Packaging" />
                    <TabButton tab="labor" label="Labor" />
                    <TabButton tab="other" label="Other Fees" />
                </div>
                
                {/* Tables Container */}
                <div className="overflow-x-auto">
                    {activeTab === 'materials' && (
                        <MaterialCostTable 
                            rows={product.materialCostRows}
                            updateRow={(index, value) => updateRow('materialCostRows', index, value)}
                            removeRow={(index) => removeRow('materialCostRows', index)}
                            addRow={() => addRow('materialCostRows')}
                        />
                    )}
                     {activeTab === 'packaging' && (
                        <PackagingCostTable
                            rows={product.packagingCostRows}
                            updateRow={(index, value) => updateRow('packagingCostRows', index, value)}
                            removeRow={(index) => removeRow('packagingCostRows', index)}
                            addRow={() => addRow('packagingCostRows')}
                        />
                    )}
                    {activeTab === 'labor' && (
                       <LaborCostTable
                            rows={product.laborCostRows}
                            updateRow={(index, value) => updateRow('laborCostRows', index, value)}
                            removeRow={(index) => removeRow('laborCostRows', index)}
                            addRow={() => addRow('laborCostRows')}
                        />
                    )}
                    {activeTab === 'other' && (
                        <OtherFeeTable
                            rows={product.otherFeeRows}
                            updateRow={(index, value) => updateRow('otherFeeRows', index, value)}
                            removeRow={(index) => removeRow('otherFeeRows', index)}
                            addRow={() => addRow('otherFeeRows')}
                        />
                    )}
                </div>

                {/* Total Base Cost */}
                 <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex justify-end items-center bg-slate-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                           <h3 className="text-lg font-bold text-slate-800">Total Base Cost</h3>
                           <Tooltip text="This is the sum of all your costs (Materials, Packaging, Labor, and Fees) to produce one unit of your product." />
                        </div>
                        <p className="text-2xl font-bold text-indigo-600 ml-auto">{formatCurrency(results.totalBaseCost)}</p>
                    </div>
                </div>
            </div>
        </div>

         {/* Step 3: Pricing Strategy */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <StepHeader number={3} title="Pricing Strategy" />
            <div className="mt-4 pt-4 border-t space-y-4">
                 <p className="text-sm text-slate-600">Choose how you want to calculate your final price.</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 p-3 bg-slate-50 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                        <input type="radio" name="calculationMode" value="margin" checked={product.calculationMode === 'margin'} onChange={() => onProductModeChange('calculationMode', 'margin')} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                        <span className="ml-2 text-sm font-medium text-slate-700">Set a Target Margin</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                         <input type="radio" name="calculationMode" value="price" checked={product.calculationMode === 'price'} onChange={() => onProductModeChange('calculationMode', 'price')} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                        <span className="ml-2 text-sm font-medium text-slate-700">Set a Target Price</span>
                    </label>
                </div>

                {product.calculationMode === 'margin' ? (
                    <div>
                        <label htmlFor="targetMargin" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span>Target Margin (%)</span>
                          <Tooltip text="The percentage of the final sales price that will be profit. For example, a 60% margin means 60% of the price is profit and 40% covers your base cost." />
                        </label>
                        <input id="targetMargin" name="targetMargin" type="number" value={product.targetMargin} onChange={handleTopLevelInputChange} className={inputBaseClasses} placeholder="e.g., 60" min="0" />
                    </div>
                ) : (
                    <div>
                        <label htmlFor="targetPrice" className="block text-sm font-medium text-slate-700">Target Price (₱)</label>
                        <input id="targetPrice" name="targetPrice" type="number" value={product.targetPrice} onChange={handleTopLevelInputChange} className={inputBaseClasses} placeholder="e.g., 1000" min="0" step="0.01" />
                    </div>
                )}
            </div>
        </div>

        {/* Step 4: Final Price & Summary */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <StepHeader number={4} title="Final Price & Summary" />
            <div className="mt-4 pt-4 border-t space-y-6">
                 <div>
                    <label htmlFor="discount" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span>Apply Discount (Optional)</span>
                        <Tooltip text="A percentage discount applied to the final sales price. This will affect your final profit per unit." />
                    </label>
                    <div className="relative mt-1">
                        <input id="discount" name="discount" type="number" value={product.discount} onChange={handleTopLevelInputChange} className={`${inputBaseClasses} pr-12`} placeholder="e.g., 10" min="0" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-200">
                        <h4 className="text-sm font-medium text-indigo-800">Final Sales Price</h4>
                        <p className="text-4xl font-bold text-indigo-600 mt-1">{formatCurrency(results.discountedPrice)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <h4 className="text-sm font-medium text-slate-500">Profit Margin</h4>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{results.requiredMargin.toFixed(1)}%</p>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-lg text-center md:col-span-2">
                        <h4 className="text-sm font-medium text-slate-500">Profit per Unit</h4>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{formatCurrency(results.profit)}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};