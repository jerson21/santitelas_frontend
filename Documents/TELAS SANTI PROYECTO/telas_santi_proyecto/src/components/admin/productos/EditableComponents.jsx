// src/components/admin/productos/EditableComponents.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Plus, Minus, MoreVertical } from 'lucide-react';
import { getStockUnit } from './helpers';

export const EditableField = ({
  value,
  onSave,
  onStartEditing,
  onEndEditing,
  type = "number",
  prefix = "$",
  className = "",
  isStock = false,
  unit = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { 
    setCurrentValue(value); 
  }, [value]);
  
  useEffect(() => { 
    if (isEditing) inputRef.current?.focus(); 
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    onEndEditing();
    if (currentValue != value) {
      try {
        await onSave(currentValue);
      } catch (error) {
        console.error("Fallo al guardar:", error);
        setCurrentValue(value);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      onEndEditing();
      setCurrentValue(value);
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number') return price;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
  };

  const getDisplayValue = () => {
    if (isStock) {
      const stockNum = parseFloat(value) || 0;
      return `${stockNum.toFixed(0)}${unit ? ` ${unit}` : ''}`;
    } else if (type === 'number' && prefix === '$') {
      return formatPrice(parseFloat(value) || 0);
    } else if (type === 'text' || prefix === '') {
      return value;
    } else {
      return value;
    }
  };

  if (isEditing) {
    return (
      <div className="relative flex items-center">
        {prefix && !isStock && type === 'number' && <span className="absolute left-2 text-gray-400 text-xs">{prefix}</span>}
        <input
          ref={inputRef}
          type={type}
          value={currentValue}
          onChange={e => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${prefix && !isStock && type === 'number' ? 'pl-5' : 'pl-2'} pr-2 py-1 border rounded-md focus:outline-none ring-2 ring-blue-500 w-24 text-right ${className}`}
        />
        {isStock && unit && (
          <span className="absolute right-2 text-gray-400 text-xs">{unit}</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setIsEditing(true); onStartEditing(); }}
      className={`group text-left hover:bg-gray-200 px-2 py-1 rounded transition-colors inline-flex items-center justify-end w-24 ${className}`}
    >
      <span>{getDisplayValue()}</span>
      <Edit2 className="w-3 h-3 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export const EditableToggle = ({ checked, onSave, onStartEditing, onEndEditing }) => {
  const handleSave = async (newChecked) => {
    onStartEditing();
    try { await onSave(newChecked); } catch (e) { console.error("Error al guardar toggle", e); }
    finally { onEndEditing(); }
  };
  return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => handleSave(e.target.checked)} className="sr-only peer" />
        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
  );
};

export const StockControls = ({ stock, onUpdateStock, onStartEditing, onEndEditing, varianteId, unidadMedida = "unidad" }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [quickAmount, setQuickAmount] = useState(10);
  
  const stockNumerico = parseFloat(stock) || 0;
  
  console.log(`StockControls variante ${varianteId}: stock recibido="${stock}", parseado=${stockNumerico}`);

  const handleQuickStock = async (action) => {
    const amount = parseInt(quickAmount) || 0;
    if (amount <= 0) return;

    onStartEditing();
    try {
      if (action === 'add') {
        await onUpdateStock(stockNumerico + amount);
      } else if (action === 'subtract') {
        const newStock = Math.max(0, stockNumerico - amount);
        await onUpdateStock(newStock);
      }
    } catch (error) {
      console.error('Error al actualizar stock:', error);
    } finally {
      onEndEditing();
      setShowQuickActions(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <EditableField
        value={stockNumerico}
        onSave={onUpdateStock}
        onStartEditing={onStartEditing}
        onEndEditing={onEndEditing}
        type="number"
        prefix=""
        className="w-20 text-center"
        isStock={true}
        unit={getStockUnit(unidadMedida)}
      />

      <div className="relative">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
          title="Acciones rápidas de stock"
        >
          <MoreVertical size={14} />
        </button>

        {showQuickActions && (
          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3 min-w-48">
            <div className="text-xs font-semibold text-gray-700 mb-2">Ajuste Rápido de Stock</div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="Cant."
                min="1"
              />
              <button
                onClick={() => handleQuickStock('add')}
                className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                title="Agregar stock"
              >
                <Plus size={12} />
                Agregar
              </button>
              <button
                onClick={() => handleQuickStock('subtract')}
                className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                title="Reducir stock"
              >
                <Minus size={12} />
                Reducir
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Stock actual: {stockNumerico} {getStockUnit(unidadMedida)}
            </div>
            <button
              onClick={() => setShowQuickActions(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};