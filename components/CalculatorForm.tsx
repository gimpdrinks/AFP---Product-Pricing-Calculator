/**
 * @file CalculatorForm.tsx
 * NOTE: This component is part of a previous, simpler application structure and is
 * not currently used in the main App.tsx component flow. It provides a form
 * for a basic pricing calculation.
 */
import React from 'react';
import type { CalculatorInputs } from '../types';

interface CalculatorFormProps {
  inputs: CalculatorInputs;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// FIX: Added missing interface definition for InputFieldProps.
interface InputFieldProps {
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  suffix?: string;
  description?: string;
}

/**
 * A reusable input field component for the calculator form.
 */
const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, prefix, suffix, description }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700">
      {label}
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      {prefix && <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><span className="text-slate-500 sm:text-sm">{prefix}</span></div>}
      <input
        type="number"
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-12' : 'pr-3'}`}
        placeholder="0.00"
        min="0"
        step="0.01"
      />
      {suffix && <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center"><span className="text-slate-500 sm:text-sm">{suffix}</span></div>}
    </div>
    <p className="mt-2 text-xs text-slate-500">{description}</p>
  </div>
);

/**
 * Renders the main form with various input fields for cost and pricing parameters.
 */
export const CalculatorForm: React.FC<CalculatorFormProps> = ({ inputs, onInputChange }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-slate-800 border-b pb-3 mb-6">Enter Your Costs & Goals</h2>
      <form className="space-y-6">
        {/* Grouping related inputs using fieldset for better structure and accessibility */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-slate-900">Per-Unit Costs</legend>
          <InputField label="Material Cost" name="materialCost" value={inputs.materialCost} onChange={onInputChange} prefix="$" description="The cost of raw materials for one unit." />
          <InputField label="Labor Cost" name="laborCost" value={inputs.laborCost} onChange={onInputChange} prefix="$" description="The cost of labor to produce one unit." />
          <InputField label="Packaging & Shipping" name="packagingCost" value={inputs.packagingCost} onChange={onInputChange} prefix="$" description="The cost to package and ship one unit." />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-slate-900">Monthly Business Costs</legend>
          <InputField label="Fixed Monthly Overhead" name="monthlyOverhead" value={inputs.monthlyOverhead} onChange={onInputChange} prefix="$" description="Total fixed costs like rent, utilities, marketing." />
          <InputField label="Monthly Sales Volume" name="monthlySalesVolume" value={inputs.monthlySalesVolume} onChange={onInputChange} suffix="units" description="Estimated number of units sold per month." />
        </fieldset>
        
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-slate-900">Profit & Pricing</legend>
          <InputField label="Desired Profit Margin" name="profitMargin" value={inputs.profitMargin} onChange={onInputChange} suffix="%" description="Your target profit percentage on the sale price." />
          <InputField label="Wholesale Discount" name="wholesaleDiscount" value={inputs.wholesaleDiscount} onChange={onInputChange} suffix="%" description="Discount off retail price for wholesale buyers." />
        </fieldset>
      </form>
    </div>
  );
};