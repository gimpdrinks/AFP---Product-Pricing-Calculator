/**
 * @file Materials.tsx
 * This component handles the "A. Materials" section of the application.
 * It provides a form for adding new materials and displays a list of existing
 * materials, allowing for their deletion.
 */
import React, { useState } from 'react';
import type { NewMaterialData } from '../types';
import { formatCurrency } from '../utils/currency';
import { useAppContext } from '../context/AppContext';

// A simple, reusable input component for the "Add Material" form.
const FormInput = ({ label, id, ...props }: { label: string, id: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
        <input
            id={id}
            {...props}
            className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-3 bg-white text-slate-900 placeholder:text-slate-400"
        />
    </div>
);


export const Materials: React.FC = () => {
  const { materials, onAddMaterial, onDeleteMaterial } = useAppContext();
  // Component-level state for the "Add New Material" form inputs and error messages.
  const [formState, setFormState] = useState({
      sku: '',
      name: '',
      supplier: '',
      totalCost: '',
      qty: '',
      unitOfMeasurement: '',
  });
  const [error, setError] = useState('');

  /**
   * Handles changes to any of the form's input fields.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormState(prev => ({ ...prev, [name]: value }));
  };


  /**
   * Handles the form submission for adding a new material.
   * Performs validation and calls the `onAdd` prop.
   */
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior.
    const { name, totalCost, qty, unitOfMeasurement } = formState;

    // Validation for mandatory fields.
    if (!name.trim() || !totalCost || !qty || !unitOfMeasurement.trim()) {
      setError('Please fill out all mandatory fields: Item Description, Total Cost, Qty, and Unit of Measurement.');
      return;
    }

    const totalCostValue = parseFloat(totalCost);
    const qtyValue = parseInt(qty, 10);
    // Validation for valid number inputs.
    if (isNaN(totalCostValue) || totalCostValue < 0 || isNaN(qtyValue) || qtyValue <= 0) {
      setError('Please enter a valid positive Total Cost and a Qty greater than 0.');
      return;
    }

    // Call the parent component's add handler with the structured form data.
    const success = onAddMaterial({
        ...formState,
        totalCost: totalCostValue,
        qty: qtyValue,
    });
    
    // If successfully added, clear the form. Otherwise, display an error for duplicates.
    if (success) {
      setFormState({ sku: '', name: '', supplier: '', totalCost: '', qty: '', unitOfMeasurement: '' }); // Reset form
      setError('');
    } else {
      setError(`A material named "${name}" already exists.`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md h-full">
      <h2 className="text-xl font-semibold text-slate-800 border-b pb-3 mb-6">Material Library</h2>
      
      {/* Form for adding a new material */}
      <form onSubmit={handleAdd} className="space-y-4 mb-6">
        <h3 className="text-base font-semibold text-slate-800">Add New Material</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="SKU (Optional)" id="sku" name="sku" type="text" value={formState.sku} onChange={handleInputChange} placeholder="e.g., FAB-001" />
          <FormInput label="Supplier (Optional)" id="supplier" name="supplier" type="text" value={formState.supplier} onChange={handleInputChange} placeholder="e.g., Fabric World" />
        </div>
        <FormInput label="Item Description" id="name" name="name" type="text" value={formState.name} onChange={handleInputChange} placeholder="e.g., Cotton Fabric" required />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput label="Total Cost (₱)" id="totalCost" name="totalCost" type="number" value={formState.totalCost} onChange={handleInputChange} placeholder="1500.00" min="0" step="0.01" required />
          <FormInput label="Qty" id="qty" name="qty" type="number" value={formState.qty} onChange={handleInputChange} placeholder="10" min="1" step="1" required />
          <FormInput label="Unit" id="unitOfMeasurement" name="unitOfMeasurement" type="text" value={formState.unitOfMeasurement} onChange={handleInputChange} placeholder="e.g., yards" required />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          + Add to Library
        </button>
      </form>

      {/* List of existing materials, now displayed as a table */}
      <h3 className="text-base font-semibold text-slate-800 mt-6 pt-4 border-t">Available Materials</h3>
      <div className="mt-4 max-h-[28rem] overflow-y-auto pr-2">
        {/* Conditional rendering: show a message if the list is empty, otherwise show the table. */}
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No materials added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                    <tr>
                        <th scope="col" className="px-4 py-3">Item</th>
                        <th scope="col" className="px-4 py-3">Unit Price</th>
                        <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material) => (
                      <tr key={material.id} className="bg-white border-b hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                            {material.name}
                            <div className="font-normal text-slate-500 text-xs">{material.sku ? `${material.sku} | ` : ''}{material.qty} {material.unitOfMeasurement} from {material.supplier || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{formatCurrency(material.unitPrice)}</td>
                          <td className="px-4 py-3 text-right">
                              <button onClick={() => onDeleteMaterial(material.id)} className="text-slate-400 hover:text-red-600" aria-label={`Delete ${material.name}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                          </td>
                      </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
