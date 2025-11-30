import React from 'react';
import { X, Trash2, ShoppingCart, Receipt } from 'lucide-react';

const CartModal = ({ cart, documentType, onCreateVale, onClose, onRemoveItem, loading }) => {
  const total = cart.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // ✅ CORREGIDO: Función para obtener el nombre del producto
  const getProductName = (item) => {
    if (item.product?.nombre) {
      return item.product.nombre;
    }
    return 'Producto';
  };

  // ✅ MEJORADO: Función para obtener la descripción de la variante
  const getVariantDescription = (item) => {
    if (!item.variante) {
      // Si no hay variante específica, usar el color del item
      return item.color || 'Estándar';
    }
    
    const parts = [];
    if (item.variante.color) parts.push(item.variante.color);
    if (item.variante.medida) parts.push(item.variante.medida);
    if (item.variante.material) parts.push(item.variante.material);
    
    // Si no hay partes específicas, usar descripción general o color del item
    if (parts.length === 0) {
      if (item.variante.descripcion) return item.variante.descripcion;
      if (item.color) return item.color;
      return 'Estándar';
    }
    
    return parts.join(' - ');
  };

  // ✅ MEJORADO: Función para obtener el color como texto con mejor fallback
  const getColorText = (item) => {
    // Prioridad: variante.color > color del item > 'Sin especificar'
    if (item.variante?.color) {
      return item.variante.color;
    }
    if (item.color && item.color !== 'Sin Color') {
      return item.color;
    }
    return 'Sin especificar';
  };

  // ✅ CORREGIDO: Función para obtener información del tipo/modelo
  const getProductTypeInfo = (item) => {
    const parts = [];
    if (item.product?.tipo) parts.push(item.product.tipo);
    if (item.product?.codigo) parts.push(`Cód: ${item.product.codigo}`);
    return parts.join(' - ');
  };

  // ✅ NUEVO: Función para obtener medida/material adicional
  const getAdditionalVariantInfo = (item) => {
    const parts = [];
    if (item.variante?.medida) parts.push(`Medida: ${item.variante.medida}`);
    if (item.variante?.material) parts.push(`Material: ${item.variante.material}`);
    return parts;
  };

  // ✅ NUEVO: Función para formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="p-6 border-b bg-blue-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Vale en Construcción</h3>
                <p className="text-sm text-gray-600">
                  Documento: <span className="font-medium capitalize">{documentType}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-96">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay productos en el vale</p>
              <p className="text-gray-400 text-sm mt-2">Selecciona productos para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* ✅ MEJORADO: Header del producto con número de item */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {index + 1}. {getProductName(item)}
                        </h4>
                        {item.variante?.sku && (
                          <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                            SKU: {item.variante.sku}
                          </span>
                        )}
                      </div>
                      
                      {/* ✅ MEJORADO: Mostrar tipo/código en línea separada si existe */}
                      {getProductTypeInfo(item) && (
                        <p className="text-xs text-gray-500 mb-3 font-medium">
                          {getProductTypeInfo(item)}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {/* ✅ MEJORADO: Información principal de la variante */}
                        <div className="space-y-1">
                          <p>
                            <span className="font-medium text-gray-700">Variante:</span> 
                            <span className="ml-1">{getVariantDescription(item)}</span>
                          </p>
                          
                          <p>
                            <span className="font-medium text-gray-700">Color:</span>
                            <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {getColorText(item)}
                            </span>
                          </p>

                          {/* ✅ NUEVO: Mostrar medida y material si existen */}
                          {getAdditionalVariantInfo(item).map((info, idx) => (
                            <p key={idx} className="text-xs text-gray-500">
                              {info}
                            </p>
                          ))}
                        </div>

                        {/* ✅ MEJORADO: Información de cantidad y precios */}
                        <div className="space-y-1">
                          <p>
                            <span className="font-medium text-gray-700">Modalidad:</span> 
                            <span className="ml-1">{item.modalidad || 'Por metro'}</span>
                          </p>
                          
                          <p>
                            <span className="font-medium text-gray-700">Cantidad:</span> 
                            <span className="ml-1 font-semibold">{item.quantity || 0}</span>
                            <span className="ml-1 text-xs text-gray-500">
                              {item.product?.unidad_medida || 'unidades'}
                            </span>
                          </p>
                          
                          <p>
                            <span className="font-medium text-gray-700">Precio unit.:</span> 
                            <span className="ml-1 font-semibold">{formatPrice(item.price)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* ✅ MEJORADO: Panel lateral de total y acciones */}
                    <div className="text-right ml-4 flex flex-col items-end">
                      <p className="font-bold text-xl text-blue-600 mb-3">
                        {formatPrice(item.total)}
                      </p>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 text-sm flex items-center space-x-1 transition-all px-2 py-1 rounded"
                        title="Eliminar producto del carrito"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t bg-gray-50 space-y-4">
            {/* ✅ MEJORADO: Resumen más detallado */}
            <div className="bg-white p-4 rounded-lg border space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total de productos:</span>
                <span className="font-medium">{cart.length} líneas</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Cantidad total:</span>
                <span className="font-medium">{totalItems} unidades</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tipo de documento:</span>
                <span className="capitalize font-medium text-blue-600">{documentType}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-gray-800 border-t pt-2 mt-3">
                <span>Total:</span>
                <span className="text-blue-600">{formatPrice(total)}</span>
              </div>
            </div>

            {/* ✅ MEJORADO: Botón Crear Vale con mejor estado visual */}
            <button
              onClick={onCreateVale}
              disabled={loading || cart.length === 0}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creando Vale...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-5 h-5" />
                  <span>Crear Vale para Caja</span>
                </>
              )}
            </button>

            {/* ✅ NUEVO: Botón para cerrar */}
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
            >
              Seguir Agregando Productos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;