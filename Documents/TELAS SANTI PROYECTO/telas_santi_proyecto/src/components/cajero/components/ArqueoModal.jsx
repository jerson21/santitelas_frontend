// /src/components/cajero/components/ArqueoModal.jsx
import React, { useState } from 'react';
import {
  X,
  Calculator,
  DollarSign,
  Loader,
  Info,
  TrendingUp
} from 'lucide-react';

const ArqueoModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [conteo, setConteo] = useState({
    billetes_20000: 0,
    billetes_10000: 0,
    billetes_5000: 0,
    billetes_2000: 0,
    billetes_1000: 0,
    monedas_500: 0,
    monedas_100: 0,
    monedas_50: 0,
    monedas_10: 0,
    observaciones: ''
  });

  const billetes = [
    { label: '$20.000', key: 'billetes_20000', value: 20000, color: 'bg-purple-100 text-purple-800' },
    { label: '$10.000', key: 'billetes_10000', value: 10000, color: 'bg-red-100 text-red-800' },
    { label: '$5.000', key: 'billetes_5000', value: 5000, color: 'bg-blue-100 text-blue-800' },
    { label: '$2.000', key: 'billetes_2000', value: 2000, color: 'bg-green-100 text-green-800' },
    { label: '$1.000', key: 'billetes_1000', value: 1000, color: 'bg-yellow-100 text-yellow-800' }
  ];

  const monedas = [
    { label: '$500', key: 'monedas_500', value: 500, color: 'bg-gray-100 text-gray-800' },
    { label: '$100', key: 'monedas_100', value: 100, color: 'bg-gray-100 text-gray-800' },
    { label: '$50', key: 'monedas_50', value: 50, color: 'bg-gray-100 text-gray-800' },
    { label: '$10', key: 'monedas_10', value: 10, color: 'bg-gray-100 text-gray-800' }
  ];

  const calcularTotal = () => {
    return (
      conteo.billetes_20000 * 20000 +
      conteo.billetes_10000 * 10000 +
      conteo.billetes_5000 * 5000 +
      conteo.billetes_2000 * 2000 +
      conteo.billetes_1000 * 1000 +
      conteo.monedas_500 * 500 +
      conteo.monedas_100 * 100 +
      conteo.monedas_50 * 50 +
      conteo.monedas_10 * 10
    );
  };

  const calcularTotalBilletes = () => {
    return (
      conteo.billetes_20000 * 20000 +
      conteo.billetes_10000 * 10000 +
      conteo.billetes_5000 * 5000 +
      conteo.billetes_2000 * 2000 +
      conteo.billetes_1000 * 1000
    );
  };

  const calcularTotalMonedas = () => {
    return (
      conteo.monedas_500 * 500 +
      conteo.monedas_100 * 100 +
      conteo.monedas_50 * 50 +
      conteo.monedas_10 * 10
    );
  };

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('es-CL');
  };

  const handleInputChange = (key, value) => {
    setConteo(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleSubmit = () => {
    const arqueoData = {
      conteo_billetes: {
        billetes_20000: conteo.billetes_20000,
        billetes_10000: conteo.billetes_10000,
        billetes_5000: conteo.billetes_5000,
        billetes_2000: conteo.billetes_2000,
        billetes_1000: conteo.billetes_1000
      },
      conteo_monedas: {
        monedas_500: conteo.monedas_500,
        monedas_100: conteo.monedas_100,
        monedas_50: conteo.monedas_50,
        monedas_10: conteo.monedas_10
      },
      observaciones: conteo.observaciones || `Arqueo intermedio - ${new Date().toLocaleString('es-CL')}`
    };

    onSubmit(arqueoData);
  };

  const limpiarFormulario = () => {
    setConteo({
      billetes_20000: 0,
      billetes_10000: 0,
      billetes_5000: 0,
      billetes_2000: 0,
      billetes_1000: 0,
      monedas_500: 0,
      monedas_100: 0,
      monedas_50: 0,
      monedas_10: 0,
      observaciones: ''
    });
  };

  const ContadorDenominacion = ({ denominacion, tipo }) => (
    <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${denominacion.color}`}>
        {denominacion.label}
      </div>
      <div className="flex items-center space-x-2 flex-1">
        <button
          type="button"
          onClick={() => handleInputChange(denominacion.key, Math.max(0, conteo[denominacion.key] - 1))}
          className="w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex items-center justify-center font-bold"
        >
          -
        </button>
        <input
          type="number"
          value={conteo[denominacion.key]}
          onChange={(e) => handleInputChange(denominacion.key, e.target.value)}
          className="w-20 text-center px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="0"
        />
        <button
          type="button"
          onClick={() => handleInputChange(denominacion.key, conteo[denominacion.key] + 1)}
          className="w-8 h-8 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors flex items-center justify-center font-bold"
        >
          +
        </button>
      </div>
      <div className="w-28 text-right font-medium">
        ${formatCurrency(conteo[denominacion.key] * denominacion.value)}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Calculator className="w-6 h-6 mr-2 text-blue-600" />
            Arqueo Intermedio de Caja
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Instrucciones para el arqueo:</p>
              <ul className="space-y-1 text-xs">
                <li>• Cuenta todos los billetes y monedas que tienes en caja</li>
                <li>• Usa los botones + y - para ajustar rápidamente las cantidades</li>
                <li>• El sistema calculará automáticamente el total</li>
                <li>• Se registrará cualquier diferencia con el sistema</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Billetes */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Billetes
            </h4>
            <div className="space-y-3">
              {billetes.map((billete) => (
                <ContadorDenominacion 
                  key={billete.key} 
                  denominacion={billete} 
                  tipo="billete" 
                />
              ))}
            </div>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center text-green-800">
                <span className="font-medium">Subtotal Billetes:</span>
                <span className="font-bold">${formatCurrency(calcularTotalBilletes())}</span>
              </div>
            </div>
          </div>

          {/* Monedas */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
              Monedas
            </h4>
            <div className="space-y-3">
              {monedas.map((moneda) => (
                <ContadorDenominacion 
                  key={moneda.key} 
                  denominacion={moneda} 
                  tipo="moneda" 
                />
              ))}
            </div>
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex justify-between items-center text-orange-800">
                <span className="font-medium">Subtotal Monedas:</span>
                <span className="font-bold">${formatCurrency(calcularTotalMonedas())}</span>
              </div>
            </div>
          </div>

          {/* Total General */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex justify-between items-center text-xl font-bold text-blue-900">
              <span>Total Contado en Caja:</span>
              <span className="text-2xl">${formatCurrency(calcularTotal())}</span>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones del Arqueo
            </label>
            <textarea
              value={conteo.observaciones}
              onChange={(e) => setConteo(prev => ({ ...prev, observaciones: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Observaciones del arqueo (ej: billetes dañados, monedas extranjeras, etc.)"
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-4 pt-4 border-t">
            <button
              onClick={limpiarFormulario}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
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
              disabled={loading || calcularTotal() === 0}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  <span>Registrar Arqueo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArqueoModal;