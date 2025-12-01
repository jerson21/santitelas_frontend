
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, ShoppingCart, X, Trash2, Receipt, Printer } from 'lucide-react';
import UltimosVales from './UltimosVales';

const VendedorHeader = ({ cartItems = [], cartTotal = 0, onRemoveItem, onCreateVale, documentType, loading = false, clienteActual = null, onNewClient, onAgregarProductosAVale }) => {
  const { logout } = useAuth();
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [showUltimosVales, setShowUltimosVales] = useState(false);

  const handleLogout = async () => {
    await logout();
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  // ✅ CORREGIDO: Función para obtener el nombre del producto
  const getProductName = (item) => {
    if (item.product?.nombre) {
      return item.product.nombre;
    }
    return 'Producto';
  };

  // ✅ CORREGIDO: Función para obtener la descripción de la variante
  const getVariantDescription = (item) => {
    if (!item.variante) return item.color || 'Estándar';
    
    const parts = [];
    if (item.variante.color) parts.push(item.variante.color);
    if (item.variante.medida) parts.push(`Med. ${item.variante.medida}`);
    if (item.variante.material) parts.push(item.variante.material);
    
    return parts.length > 0 ? parts.join(' - ') : (item.color || 'Estándar');
  };

  // ✅ CORREGIDO: Función para obtener el color como texto
  const getColorText = (item) => {
    if (item.variante?.color) {
      return item.variante.color;
    }
    return item.color || 'N/A';
  };

  // ✅ CORREGIDO: Función para obtener información del tipo/modelo
  const getProductTypeInfo = (item) => {
    const parts = [];
    if (item.product?.tipo) parts.push(item.product.tipo);
    return parts.join(' ');
  };

  // ✅ NUEVO: Función para formatear precios en CLP
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  return (
    <>
      {/* Header Super Simple */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex justify-between items-center gap-2">
            {/* Logo */}
            <h1 className="text-lg sm:text-2xl font-bold text-blue-600 flex-shrink-0">Santi Telas</h1>

            {/* Controles de Vendedor */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Botón Reimprimir Últimos Vales */}
              <button
                onClick={() => setShowUltimosVales(true)}
                className="p-2 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-xl flex-shrink-0"
                title="Reimprimir últimos vales"
              >
                <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Botón Carrito Grande */}
              <button
                onClick={() => setShowCartPanel(true)}
                className="relative bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium flex items-center gap-2 sm:gap-3 transition-colors shadow-lg flex-shrink-0"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                <div className="text-left">
                  <div className="text-xs sm:text-sm opacity-90 hidden xs:block">Carrito</div>
                  <div className="font-bold text-xs sm:text-base whitespace-nowrap">
                    <span className="hidden sm:inline">{cartItems.length} productos - </span>
                    <span className="sm:hidden">{cartItems.length} - </span>
                    {formatPrice(cartTotal)}
                  </div>
                </div>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs sm:text-sm rounded-full h-5 w-5 sm:h-7 sm:w-7 flex items-center justify-center font-bold">
                    {cartItems.length}
                  </span>
                )}
              </button>

              {/* Botón Logout */}
              <button
                onClick={handleLogout}
                className="p-2 sm:p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded-xl flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Centrado del Carrito */}
      {showCartPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay más sutil */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20" 
            onClick={() => setShowCartPanel(false)}
          />
          
          {/* Modal Centrado */}
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header del Modal */}
            <div className="p-4 border-b bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Mi Carrito</h3>
                  <p className="text-sm text-gray-600">
                    Documento: <span className="font-medium capitalize">{documentType}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setShowCartPanel(false)} 
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenido del Carrito */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 180px)' }}>
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl font-medium">Carrito vacío</p>
                  <p className="text-gray-400 mt-2">Agrega productos para comenzar</p>
                </div>
              ) : (
                /* ✅ CORREGIDA: Tabla de Productos con nueva estructura */
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-4 font-semibold text-gray-700 border-b">Producto</th>
                        <th className="text-left p-4 font-semibold text-gray-700 border-b">Variante</th>
                        <th className="text-center p-4 font-semibold text-gray-700 border-b">Modalidad</th>
                        <th className="text-center p-4 font-semibold text-gray-700 border-b">Cantidad</th>
                        <th className="text-right p-4 font-semibold text-gray-700 border-b">Precio Unit.</th>
                        <th className="text-right p-4 font-semibold text-gray-700 border-b">Total</th>
                        <th className="text-center p-4 font-semibold text-gray-700 border-b">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, index) => (
                        <tr key={item.id} className={`${
                          item.esProductoExistente
                            ? 'bg-gray-100 border-l-4 border-gray-400'
                            : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-blue-50 transition-colors`}>
                          <td className="p-2 sm:p-4 border-b">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="font-semibold text-gray-800 text-sm sm:text-base">
                                {getProductName(item)}
                              </div>
                              {/* ✅ BADGE responsive para productos existentes */}
                              {item.esProductoExistente && (
                                <span className="px-1.5 py-0.5 bg-gray-600 text-white text-[10px] sm:text-xs rounded-full whitespace-nowrap flex-shrink-0">
                                  <span className="hidden sm:inline">En vale</span>
                                  <span className="sm:hidden">✓</span>
                                </span>
                              )}
                            </div>
                            {/* ✅ AGREGAR: Mostrar tipo si está disponible */}
                            {getProductTypeInfo(item) && (
                              <div className="text-xs text-gray-500">
                                {getProductTypeInfo(item)}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              {item.product?.unidad_medida || 'unidad'}
                            </div>
                          </td>
                          
                          {/* ✅ CORREGIDA: Columna de Variante */}
                          <td className="p-4 border-b">
                            <div className="space-y-1">
                              {/* Color como texto */}
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {getColorText(item)}
                              </span>
                              
                              {/* Información adicional de la variante */}
                              {item.variante?.medida && (
                                <div className="text-xs text-gray-600">
                                  Med. {item.variante.medida}
                                </div>
                              )}
                              
                              {item.variante?.sku && (
                                <div className="text-xs text-gray-500 font-mono">
                                  {item.variante.sku}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="p-4 border-b text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              item.modalidad === 'rollo' 
                                ? 'bg-orange-100 text-orange-700' 
                                : item.modalidad === 'metro'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {item.modalidad}
                            </span>
                          </td>
                          
                          <td className="p-4 border-b text-center font-semibold">
                            {item.quantity}
                          </td>
                          
                          <td className="p-4 border-b text-right font-medium">
                            {formatPrice(item.price)}
                          </td>

                          <td className="p-4 border-b text-right">
                            <span className="font-bold text-lg text-blue-600">
                              {formatPrice(item.total)}
                            </span>
                          </td>
                          
                          <td className="p-4 border-b text-center">
                            {/* ✅ NO permitir eliminar productos existentes */}
                            {item.esProductoExistente ? (
                              <span className="text-xs text-gray-500 italic">
                                Ya en vale
                              </span>
                            ) : (
                              <button
                                onClick={() => onRemoveItem(item.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer del Modal - Total y Botón */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg text-gray-600">
                    <span className="font-medium">Total productos: </span>
                    <span className="font-bold">{cartItems.length}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total a pagar:</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(cartTotal)}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    onCreateVale();
                    setShowCartPanel(false);
                  }}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Creando Vale...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-6 h-6" />
                      <span>Crear Vale para Caja</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Últimos Vales para Reimprimir */}
      <UltimosVales
        isOpen={showUltimosVales}
        onClose={() => setShowUltimosVales(false)}
        onAgregarProductos={onAgregarProductosAVale}
      />
    </>
  );
};

export default VendedorHeader;