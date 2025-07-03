// src/components/admin/productos/StockModals.tsx
import React, { useState, useEffect } from 'react';
import { Archive, Check, AlertTriangle, ChevronDown } from 'lucide-react';
import {
  StockConfirmationModalProps,
  StockMassiveModalProps,
  ConfirmationModalProps
} from '../../../types/productos'; // ✅ Correcto

export const StockConfirmationModal: React.FC<StockConfirmationModalProps> = ({ 
  isOpen, 
  oldStock, 
  newStock, 
  motivo, 
  onConfirm, 
  onCancel, 
  onChange, 
  skipConfirmation 
}) => {
  if (!isOpen) return null;

  const difference = newStock - oldStock;
  const isIncrease = difference > 0;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Confirmar Cambio de Stock
          </h3>
        </div>

        <div className="p-5 space-y-4">
          {/* Resumen del cambio */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Stock actual:</span>
              <span className="font-mono font-semibold">{oldStock}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Nuevo stock:</span>
              <span className="font-mono font-semibold">{newStock}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Diferencia:</span>
                <span className={`font-mono font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncrease ? '+' : ''}{difference}
                </span>
              </div>
            </div>
          </div>

          {/* Campo de motivo opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del ajuste (opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => onChange({ motivo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Inventario físico, Ajuste por rotura, etc."
              autoFocus
            />
          </div>

          {/* Checkbox para saltar confirmación */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="skipConfirmation"
              checked={skipConfirmation}
              onChange={(e) => onChange({ skipConfirmation: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="skipConfirmation" className="ml-2 text-sm text-gray-600">
              No volver a preguntar en esta sesión
            </label>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 flex justify-end items-center gap-3 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivo)}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Check size={16} />
            Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};

export const StockMassiveModal: React.FC<StockMassiveModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedProducts 
}) => {
  const [operation, setOperation] = useState<string>('set');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Por favor ingresa una cantidad válida');
      return;
    }

    onSave({
      operation,
      amount: numAmount,
      reason: reason.trim()
    });

    setAmount('');
    setReason('');
    setOperation('set');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-slate-800">Gestión Masiva de Stock</h3>
          <p className="text-sm text-gray-600 mt-1">
            Afectará {selectedProducts.length} variante(s) seleccionada(s)
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operación
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="set">Establecer cantidad exacta</option>
              <option value="add">Agregar stock</option>
              <option value="subtract">Reducir stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa la cantidad"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Inventario, Ajuste, Reposición..."
            />
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 flex justify-end items-center gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  title = 'Confirmación', 
  message = '', 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  variantDetails = []
}) => {
  const [detailsVisible, setDetailsVisible] = useState<boolean>(false);
  
  useEffect(() => { 
    if (isOpen) setDetailsVisible(false); 
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" role="alertdialog">
        <div className="p-5"> 
          <div className="flex items-start"> 
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div> 
            <div className="ml-4 text-left w-full"> 
              <h3 className="text-lg font-semibold text-slate-800">{title}</h3> 
              <p className="text-sm text-slate-600 mt-1" dangerouslySetInnerHTML={{ __html: message }}></p> 
              {variantDetails && variantDetails.length > 0 && (
                <div className="mt-3 text-sm"> 
                  <button 
                    onClick={() => setDetailsVisible(!detailsVisible)} 
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-xs"
                  >
                    {detailsVisible ? 'Ocultar' : 'Ver'} variantes afectadas 
                    <ChevronDown className={`w-4 h-4 transition-transform ${detailsVisible ? 'rotate-180' : ''}`} />
                  </button> 
                  {detailsVisible && (
                    <ul className="mt-2 pl-4 list-disc text-slate-500 bg-slate-50 p-2 rounded-md border text-xs max-h-24 overflow-y-auto">
                      {variantDetails.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  )} 
                </div>
              )} 
            </div> 
          </div> 
        </div>
        <div className="bg-slate-50 px-5 py-3 flex justify-end items-center gap-3 rounded-b-lg">
          <button 
            onClick={onCancel} 
            className="px-4 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};