import React from 'react';
import { OtherFeeRow } from '../types';
import { formatCurrency } from '../utils/currency';

const tableInputClasses = "w-full p-2 bg-transparent text-slate-900 border-0 focus:ring-1 focus:ring-indigo-500 focus:outline-none";

interface OtherFeeTableProps {
    rows: OtherFeeRow[];
    updateRow: (rowIndex: number, updatedValue: Partial<OtherFeeRow>) => void;
    removeRow: (rowIndex: number) => void;
    addRow: () => void;
}

export const OtherFeeTable: React.FC<OtherFeeTableProps> = ({ rows, updateRow, removeRow, addRow }) => {
    return (
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
                    {rows.map((row, index) => {
                        const totalCost = row.qty * row.unitPrice;
                        return (
                            <tr key={row.id} className="border-b hover:bg-slate-50">
                                <td className="p-0 border-r"><input type="text" value={row.feeName} onChange={(e) => updateRow(index, { feeName: e.target.value })} placeholder="e.g., Shipping" className={tableInputClasses} required /></td>
                                <td className="p-0 border-r"><input type="number" value={row.qty} onChange={(e) => updateRow(index, { qty: Math.max(0, parseInt(e.target.value, 10) || 0) })} className={tableInputClasses} min="0" step="1" /></td>
                                <td className="p-0 border-r"><input type="text" value={row.unit} onChange={(e) => updateRow(index, { unit: e.target.value })} placeholder="e.g., each" className={tableInputClasses} /></td>
                                <td className="p-0 border-r"><input type="number" value={row.unitPrice} onChange={(e) => updateRow(index, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })} className={tableInputClasses} min="0" step="0.01" /></td>
                                <td className="p-2 border-r font-semibold text-slate-800">{formatCurrency(totalCost)}</td>
                                <td className="p-2 text-center"><button onClick={() => removeRow(index)} className="text-slate-400 hover:text-red-600" aria-label="Remove row">&times;</button></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <button onClick={addRow} className="mt-3 px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">+ Add Fee</button>
        </div>
    );
};
