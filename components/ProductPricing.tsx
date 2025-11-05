

/**
 * @file ProductPricing.tsx
 * This component renders the entire product pricing workflow, now based on a
 * spreadsheet-style interface with multiple cost calculator tables.
 */
import React from 'react';
import type { Material, ProductInputs, CalculatedPricing, CalculationMode, ProductMaterialRow, LaborCostRow, OtherFeeRow } from '../types';
import { formatCurrency } from '../utils/currency';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from './Tooltip'; // Import the new Tooltip component


// Props for the main ProductPricing component.
interface ProductPricingProps {
  materials: Material[];
  product: ProductInputs;
  onProductChange: (name: keyof ProductInputs, value: any) => void;
  results: CalculatedPricing;
}

// Reusable class strings for consistent input styling.
const inputBaseClasses = "mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-3 bg-white text-slate-900 placeholder:text-slate-400";
const tableInputClasses = "w-full p-2 bg-transparent text-slate-900 border-0 focus:ring-1 focus:ring-indigo-500 focus:outline-none";

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

export const ProductPricing: React.FC<ProductPricingProps> = ({ materials, product, onProductChange, results }) => {
  const [activeTab, setActiveTab] = React.useState<CostTab>('materials');

  // Generic handler for top-level numeric input changes.
  const handleTopLevelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onProductChange(e.target.name as keyof ProductInputs, Math.max(0, parseFloat(e.target.value) || 0));
  };
  
  // Generic handler for top-level text input changes (e.g., product name).
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onProductChange(e.target.name as keyof ProductInputs, e.target.value);
  };

  // HANDLERS for Table Rows
  
  const addRow = (rowType: keyof ProductInputs) => {
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
    onProductChange(rowType, [...currentRows, newRow]);
  };

  const updateRow = (rowType: keyof ProductInputs, rowIndex: number, updatedValue: any) => {
    const currentRows = product[rowType] as any[];
    const newRows = [...currentRows];
    newRows[rowIndex] = { ...newRows[rowIndex], ...updatedValue };
    onProductChange(rowType, newRows);
  };

  const removeRow = (rowType: keyof ProductInputs, rowIndex: number) => {
    const currentRows = product[rowType] as any[];
    onProductChange(rowType, currentRows.filter((_, index) => index !== rowIndex));
  };

  // Helper to get material details.
  const getMaterialDetails = (materialId: string | null) => {
      return materials.find(m => m.id === materialId) || null;
  }

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
                    {/* Material Cost Table */}
                    {activeTab === 'materials' && (
                        <div>
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                                    <tr>
                                        <th className="p-2 border-b text-left font-semibold w-2/5">Material</th>
                                        <th className="p-2 border-b text-left font-semibold">Qty.</th>
                                        <th className="p-2 border-b text-left font-semibold">Unit</th>
                                        <th className="p-2 border-b text-left font-semibold">Unit Price</th>
                                        <th className="p-2 border-b text-left font-semibold">Total Cost</th>
                                        <th className="p-2 border-b w-10"><span className="sr-only">Remove</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.materialCostRows.map((row, index) => {
                                        const material = getMaterialDetails(row.materialId);
                                        const unitPrice = material?.unitPrice || 0;
                                        const totalCost = row.qty * unitPrice;
                                        return (
                                            <tr key={row.id} className="border-b hover:bg-slate-50">
                                                <td className="p-0 border-r"><select value={row.materialId ?? ''} onChange={(e) => updateRow('materialCostRows', index, { materialId: e.target.value })} className={`${tableInputClasses} w-full`} required><option value="">Select Material</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                                                <td className="p-0 border-r"><input type="number" value={row.qty} onChange={(e) => updateRow('materialCostRows', index, { qty: Math.max(0, parseFloat(e.target.value) || 0) })} className={tableInputClasses} min="0" /></td>
                                                <td className="p-2 border-r text-slate-600">{material?.unitOfMeasurement || '-'}</td>
                                                <td className="p-2 border-r text-slate-600">{formatCurrency(unitPrice)}</td>
                                                <td className="p-2 border-r font-semibold text-slate-800">{formatCurrency(totalCost)}</td>
                                                <td className="p-2 text-center"><button onClick={() => removeRow('materialCostRows', index)} className="text-slate-400 hover:text-red-600" aria-label="Remove row">&times;</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                             <button onClick={() => addRow('materialCostRows')} className="mt-3 px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">+ Add Material</button>
                        </div>
                    )}
                     {/* Packaging Cost Table */}
                     {activeTab === 'packaging' && (
                        <div>
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                                    <tr>
                                        <th className="p-2 border-b text-left font-semibold w-2/5">Packaging</th>
                                        <th className="p-2 border-b text-left font-semibold">Qty.</th>
                                        <th className="p-2 border-b text-left font-semibold">Unit</th>
                                        <th className="p-2 border-b text-left font-semibold">Unit Price</th>
                                        <th className="p-2 border-b text-left font-semibold">Total Cost</th>
                                        <th className="p-2 border-b w-10"><span className="sr-only">Remove</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.packagingCostRows.map((row, index) => {
                                        const material = getMaterialDetails(row.materialId);
                                        const unitPrice = material?.unitPrice || 0;
                                        const totalCost = row.qty * unitPrice;
                                        return (
                                            <tr key={row.id} className="border-b hover:bg-slate-50">
                                                <td className="p-0 border-r"><select value={row.materialId ?? ''} onChange={(e) => updateRow('packagingCostRows', index, { materialId: e.target.value })} className={`${tableInputClasses} w-full`} required><option value="">Select Packaging</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                                                <td className="p-0 border-r"><input type="number" value={row.qty} onChange={(e) => updateRow('packagingCostRows', index, { qty: Math.max(0, parseFloat(e.target.value) || 0) })} className={tableInputClasses} min="0" /></td>
                                                <td className="p-2 border-r text-slate-600">{material?.unitOfMeasurement || '-'}</td>
                                                <td className="p-2 border-r text-slate-600">{formatCurrency(unitPrice)}</td>
                                                <td className="p-2 border-r font-semibold text-slate-800">{formatCurrency(totalCost)}</td>
                                                <td className="p-2 text-center"><button onClick={() => removeRow('packagingCostRows', index)} className="text-slate-400 hover:text-red-600" aria-label="Remove row">&times;</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                             <button onClick={() => addRow('packagingCostRows')} className="mt-3 px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">+ Add Packaging</button>
                        </div>
                    )}
                    {/* Labor Cost Table */}
                    {activeTab === 'labor' && (
                        <div>
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                                    <tr>
                                        <th className="p-2 border-b text-left font-semibold w-2/5">Task</th>
                                        <th className="p-2 border-b text-left font-semibold">Hours</th>
                                        <th className="p-2 border-b text-left font-semibold">Rate</th>
                                        <th className="p-2 border-b text-left font-semibold">Unit Price</th>
                                        <th className="p-2 border-b text-left font-semibold">Total Cost</th>
                                        <th className="p-2 border-b w-10"><span className="sr-only">Remove</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.laborCostRows.map((row, index) => {
                                        const totalCost = row.hours * product.hourlyLaborRate;
                                        return (
                                            <tr key={row.id} className="border-b hover:bg-slate-50">
                                                <td className="p-0 border-r"><input type="text" value={row.taskName} onChange={(e) => updateRow('laborCostRows', index, { taskName: e.target.value })} placeholder="e.g., Production" className={tableInputClasses} required /></td>
                                                <td className="p-0 border-r"><input type="number" value={row.hours} onChange={(e) => updateRow('laborCostRows', index, { hours: Math.max(0, parseFloat(e.target.value) || 0) })} className={tableInputClasses} min="0" /></td>
                                                <td className="p-2 border-r text-slate-600">hours</td>
                                                <td className="p-2 border-r text-slate-600">{formatCurrency(product.hourlyLaborRate)}</td>
                                                <td className="p-2 border-r font-semibold text-slate-800">{formatCurrency(totalCost)}</td>
                                                <td className="p-2 text-center"><button onClick={() => removeRow('laborCostRows', index)} className="text-slate-400 hover:text-red-600" aria-label="Remove row">&times;</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <button onClick={() => addRow('laborCostRows')} className="mt-3 px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">+ Add Labor Task</button>
                        </div>
                    )}
                    {/* Other Fees Table */}
                    {activeTab === 'other' && (
                        <div>
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                                    <tr>
                                        <th className="p-2 border-b text-left font-semibold w-2/5">Fee Name</th>
                                        <th className="p-2 border-b text-left font-semibold">Qty</th>
                                        <th className="p-2 border-b text-left font-semibold">Unit</th>
                                        <th className="p-2 border-b text-left font-semibold">Unit Price</th>
                                        <th className="p-2 border-b text-left font-semibold">Total Cost</th>
                                        <th className="p-2 border-b w-10"><span className="sr-only">Remove</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.otherFeeRows.map((row, index) => {
                                        const totalCost = row.qty * row.unitPrice;
                                        return (
                                            <tr key={row.id} className="border-b hover:bg-slate-50">
                                                <td className="p-0 border-r"><input type="text" value={row.feeName} onChange={(e) => updateRow('otherFeeRows', index, { feeName: e.target.value })} placeholder="e.g., Shipping" className={tableInputClasses} required /></td>
                                                <td className="p-0 border-r"><input type="number" value={row.qty} onChange={(e) => updateRow('otherFeeRows', index, { qty: Math.max(0, parseFloat(e.target.value) || 0) })} className={tableInputClasses} min="0" /></td>
                                                <td className="p-0 border-r"><input type="text" value={row.unit} onChange={(e) => updateRow('otherFeeRows', index, { unit: e.target.value })} placeholder="e.g., each" className={tableInputClasses} /></td>
                                                <td className="p-0 border-r"><input type="number" value={row.unitPrice} onChange={(e) => updateRow('otherFeeRows', index, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })} className={tableInputClasses} min="0" /></td>
                                                <td className="p-2 border-r font-semibold text-slate-800">{formatCurrency(totalCost)}</td>
                                                <td className="p-2 text-center"><button onClick={() => removeRow('otherFeeRows', index)} className="text-slate-400 hover:text-red-600" aria-label="Remove row">&times;</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <button onClick={() => addRow('otherFeeRows')} className="mt-3 px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">+ Add Fee</button>
                        </div>
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
                        <input type="radio" name="calculationMode" value="margin" checked={product.calculationMode === 'margin'} onChange={() => onProductChange('calculationMode', 'margin')} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                        <span className="ml-2 text-sm font-medium text-slate-700">Set a Target Margin</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                         <input type="radio" name="calculationMode" value="price" checked={product.calculationMode === 'price'} onChange={() => onProductChange('calculationMode', 'price')} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
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