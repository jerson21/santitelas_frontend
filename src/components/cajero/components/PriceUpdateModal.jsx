// /src/components/cajero/components/PriceUpdateModal.jsx
import React from 'react';
import {
  AlertCircle,
  CheckCircle,
  X,
  DollarSign,
  Tag
} from 'lucide-react';

const PriceUpdateModal = ({ isOpen, onClose, selectedProduct, similarProducts, onConfirm }) => {
  if (!isOpen || !selectedProduct) return null;

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatProductName = (producto) => {
    const parts = [producto.tipo, producto.producto].filter(Boolean);
    if (producto.variante) {
      const variante = [producto.variante.color, producto.variante.medida]
        .filter(Boolean)
        .join(' - ');
      if (variante) parts.push(`(${variante})`);
    }
    return parts.join(' ') || 'Producto';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-8 h-8 mr-3 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-800">
            Productos Similares Detectados
          </h3>
        </div>

        {/* Producto seleccionado */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Producto Modificado
          </h4>
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-800">{formatProductName(selectedProduct)}</p>
            <div className="flex items-center space-x-4 text-gray-700">
              <span>Precio actual: <strong>${formatCurrency(selectedProduct.precio_unitario)}</strong></span>
              <span>→</span>
              <span className="text-green-600">Precio nuevo: <strong>${formatCurrency(selectedProduct.newPrice)}</strong></span>
            </div>
          </div>
        </div>

        {/* Productos similares */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">
            Se encontraron {similarProducts.length} producto{similarProducts.length > 1 ? 's' : ''} similar{similarProducts.length > 1 ? 'es' : ''}:
          </h4>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-yellow-800 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                Estos productos tienen el mismo tipo y precio actual (${formatCurrency(selectedProduct.precio_unitario)}), 
                pero diferente color o medida. ¿Deseas actualizar todos al nuevo precio?
              </span>
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {similarProducts.map((producto, index) => (
              <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {formatProductName(producto)}
                    </p>
                    {producto.codigo && (
                      <p className="text-xs text-gray-500 font-mono">
                        Código: {producto.codigo}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Cant: {producto.cantidad}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen de cambio */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Impacto del cambio:
            </span>
            <span className="text-green-800">
              {similarProducts.length + 1} productos actualizados a ${formatCurrency(selectedProduct.newPrice)}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-3">
          <button
            onClick={() => onConfirm(false)}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Solo Este Producto
          </button>
          
          <button
            onClick={() => onConfirm(true)}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Actualizar Todos</span>
          </button>
        </div>

        {/* Botón de cancelar */}
        <button
          onClick={onClose}
          className="mt-3 w-full text-gray-600 py-2 hover:text-gray-800 transition-colors text-sm"
        >
          Cancelar operación
        </button>
      </div>
    </div>
  );
};

export default PriceUpdateModal;