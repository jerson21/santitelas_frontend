// /src/components/cajero/components/PaymentAmountModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  DollarSign,
  Loader,
  Calculator
} from 'lucide-react';

const PaymentAmountModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalAmount, 
  loading,
  valeInfo 
}) => {
  const [montoRecibido, setMontoRecibido] = useState('');
  const [vuelto, setVuelto] = useState(0);
  const inputRef = useRef(null);

  // Focus automático al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setMontoRecibido();
      inputRef.current.select();
    }
  }, [isOpen, totalAmount]);

  // Calcular vuelto automáticamente
  useEffect(() => {
    const recibido = Number(montoRecibido) || 0;
    const cambio = recibido - totalAmount;
    setVuelto(cambio > 0 ? cambio : 0);
  }, [montoRecibido, totalAmount]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && Number(montoRecibido) >= totalAmount) {
      handleConfirm();
    }
  };

  const handleConfirm = () => {
    const monto = Number(montoRecibido);
    if (monto >= totalAmount) {
      onConfirm(monto);
    }
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Calculator className="w-6 h-6 mr-2 text-green-600" />
            Cobrar Vale
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info del Vale */}
        {valeInfo && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Vale:</span>
                <span className="font-medium">{valeInfo.numero}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-medium">{valeInfo.cliente}</span>
              </div>
            </div>
          </div>
        )}

        {/* Total a Cobrar */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-blue-600 mb-1">Total a Cobrar</p>
            <p className="text-3xl font-bold text-blue-800">
              ${formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Input de Monto Recibido */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto Recibido del Cliente
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="number"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 w-full px-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={totalAmount.toString()}
              min={totalAmount}
            />
          </div>
          {Number(montoRecibido) > 0 && Number(montoRecibido) < totalAmount && (
            <p className="mt-2 text-sm text-red-600">
              El monto recibido no puede ser menor al total
            </p>
          )}
        </div>

        {/* Vuelto */}
        {vuelto > 0 && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-green-600 mb-1">Vuelto a Entregar</p>
              <p className="text-3xl font-bold text-green-800">
                ${formatCurrency(vuelto)}
              </p>
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="bg-gray-50 rounded p-3 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total a cobrar:</span>
              <span className="font-medium">${formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monto recibido:</span>
              <span className="font-medium">
                ${formatCurrency(Number(montoRecibido) || 0)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-700">Vuelto:</span>
              <span className="font-bold text-lg text-green-600">
                ${formatCurrency(vuelto)}
              </span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading || Number(montoRecibido) < totalAmount}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                <span>CONFIRMAR PAGO</span>
              </>
            )}
          </button>
        </div>

        {/* Instrucciones */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Presiona Enter para confirmar el pago
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentAmountModal;