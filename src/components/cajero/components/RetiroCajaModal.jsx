// /src/components/cajero/components/RetiroCajaModal.jsx
import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Loader,
  AlertTriangle,
  ArrowDownCircle
} from 'lucide-react';

const RetiroCajaModal = ({ isOpen, onClose, onSubmit, loading, montoTeorico = 0 }) => {
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const montoNumerico = Number(monto) || 0;
  const montoDisponible = Number(montoTeorico) || 0;
  const montoDespues = montoDisponible - montoNumerico;
  const esValido = montoNumerico > 0 && montoNumerico <= montoDisponible;

  const handleSubmit = async () => {
    if (!esValido) return;

    try {
      await onSubmit(montoNumerico, motivo);
      // Limpiar y cerrar
      setMonto('');
      setMotivo('');
      onClose();
    } catch (error) {
      // El error se maneja en el componente padre
    }
  };

  const limpiarFormulario = () => {
    setMonto('');
    setMotivo('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <ArrowDownCircle className="w-6 h-6 mr-2 text-orange-600" />
            Retiro de Caja
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Monto actual en caja */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 font-medium">Monto actual en caja:</span>
            <span className="text-2xl font-bold text-blue-900">
              ${formatCurrency(montoDisponible)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Campo de monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto a retirar
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg text-lg font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  montoNumerico > montoDisponible ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                max={montoDisponible}
              />
            </div>
            {montoNumerico > montoDisponible && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                El monto excede lo disponible en caja
              </p>
            )}
          </div>

          {/* Preview del resultado */}
          {montoNumerico > 0 && montoNumerico <= montoDisponible && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex justify-between items-center text-orange-800">
                <span className="font-medium">Quedará en caja:</span>
                <span className="text-xl font-bold">${formatCurrency(montoDespues)}</span>
              </div>
            </div>
          )}

          {/* Campo de motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ej: Depósito a banco, entrega a supervisor..."
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-4 pt-4 border-t">
            <button
              onClick={limpiarFormulario}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Limpiar
            </button>

            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || !esValido}
              className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-5 h-5" />
                  <span>Registrar Retiro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetiroCajaModal;
