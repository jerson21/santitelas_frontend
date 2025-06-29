// /src/components/cajero/components/ValeDetails.jsx
import React, { useState } from 'react';
import {
  Receipt,
  AlertTriangle,
  Trash2,
  Edit3,
  Check,
  X,
  Save
} from 'lucide-react';
import PriceUpdateModal from './PriceUpdateModal';

const ValeDetails = ({ vale, onClear, onAnular, turnoAbierto, onUpdatePrice, showToast }) => {
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);

  if (!vale) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            No hay vale seleccionado
          </h3>
          <p className="text-gray-500 text-sm">
            Busca un vale para ver sus detalles
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL');
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'vale_pendiente': 'bg-yellow-100 text-yellow-800',
      'procesando_caja': 'bg-blue-100 text-blue-800', 
      'completado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };

    const labels = {
      'vale_pendiente': 'Pendiente',
      'procesando_caja': 'Procesando',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[estado] || 'bg-gray-100 text-gray-800'}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  const handleEditPrice = (producto, index) => {
    setEditingPrice(index);
    setTempPrice(producto.precio_unitario.toString());
  };

  const handleSavePrice = (producto, index) => {
    const newPrice = Number(tempPrice);
    
    if (isNaN(newPrice) || newPrice <= 0) {
      showToast('El precio debe ser un número válido mayor a 0', 'error');
      return;
    }

    // Buscar productos similares con el mismo precio actual
    const productosSimiliares = vale.productos.filter((p, i) => {
      if (i === index) return false; // No incluir el producto actual
      
      // Mismo tipo y producto, pero diferente variante (color/medida)
      const mismoTipo = p.tipo === producto.tipo && p.producto === producto.producto;
      const mismoPrecio = p.precio_unitario === producto.precio_unitario;
      
      return mismoTipo && mismoPrecio;
    });

    if (productosSimiliares.length > 0) {
      // Si hay productos similares, mostrar modal de confirmación
      setSelectedProduct({ ...producto, index, newPrice });
      setSimilarProducts(productosSimiliares.map((p, i) => ({
        ...p,
        index: vale.productos.findIndex(prod => prod === p)
      })));
      setShowPriceModal(true);
    } else {
      // Si no hay productos similares, actualizar solo este
      actualizarPrecio(index, newPrice, false);
    }

    setEditingPrice(null);
    setTempPrice('');
  };

  const actualizarPrecio = async (index, newPrice, updateAll = false, productIndices = []) => {
    try {
      const updates = updateAll 
        ? [index, ...productIndices].map(i => ({ index: i, precio: newPrice }))
        : [{ index, precio: newPrice }];

      await onUpdatePrice(vale.numero, updates);
      
      if (updateAll) {
        showToast(`✅ Se actualizaron ${updates.length} productos con el nuevo precio`, 'success');
      } else {
        showToast('✅ Precio actualizado correctamente', 'success');
      }
    } catch (error) {
      showToast('Error al actualizar el precio', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setTempPrice('');
  };

  const canEditPrice = vale.estado === 'vale_pendiente' && turnoAbierto;

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Header del Vale COMPACTO */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Vale {vale.numero_display || vale.numero}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>Cliente: {vale.cliente}</span>
                <span>Vendedor: {vale.vendedor}</span>
                <span>{new Date(vale.fecha).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
            {getEstadoBadge(vale.estado)}
          </div>

          {/* Advertencia para vales antiguos COMPACTA */}
          {vale.es_vale_antiguo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-xs">
                  ⚠️ Vale Antiguo - {vale.dias_atras} días atrás
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de Productos ESTILO EXCEL/EMPRESARIAL */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Medida/Variante
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Cant.
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  P. Unit.
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vale.productos?.map((producto, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {/* COLUMNA PRODUCTO - Con código pequeño abajo */}
                  <td className="px-3 py-2">
                    <div>
                      <div className="font-medium text-gray-900 text-sm leading-tight">
                        {[producto.tipo, producto.producto].filter(Boolean).join(' ') || 'Producto'}
                      </div>
                      {producto.codigo && (
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          {producto.codigo}
                        </div>
                      )}
                      {producto.descripcion && (
                        <div className="text-xs text-gray-600 mt-1">
                          {producto.descripcion}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* COLUMNA MEDIDA/VARIANTE */}
                  <td className="px-3 py-2 text-center">
                    <div className="text-sm text-gray-700">
                      {[producto.variante?.color, producto.variante?.medida]
                        .filter(Boolean)
                        .join(' • ') || '-'}
                    </div>
                  </td>
                  
                  {/* COLUMNA CANTIDAD */}
                  <td className="px-3 py-2 text-center">
                    <div className="font-medium">{producto.cantidad}</div>
                    {producto.unidad_medida && (
                      <div className="text-xs text-gray-500">{producto.unidad_medida}</div>
                    )}
                  </td>
                  
                  {/* COLUMNA PRECIO UNITARIO - EDITABLE */}
                  <td className="px-3 py-2 text-right font-medium">
                    {editingPrice === index ? (
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="w-20 px-1 py-1 text-right border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSavePrice(producto, index);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSavePrice(producto, index)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Guardar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end group">
                        <span>${formatCurrency(producto.precio_unitario)}</span>
                        {canEditPrice && (
                          <button
                            onClick={() => handleEditPrice(producto, index)}
                            className="ml-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Editar precio"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* COLUMNA SUBTOTAL */}
                  <td className="px-3 py-2 text-right font-bold text-green-600">
                    ${formatCurrency(producto.cantidad * producto.precio_unitario)}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" className="px-3 py-8 text-center text-gray-500">
                    No hay productos para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total COMPACTO */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total a Cobrar:</span>
            <span className="text-xl font-bold text-green-600">
              ${formatCurrency(vale.total)}
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        {vale.estado === 'vale_pendiente' && turnoAbierto && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onAnular}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Anular Vale</span>
            </button>
          </div>
        )}

        {/* Advertencia si el turno está cerrado */}
        {vale.estado === 'vale_pendiente' && !turnoAbierto && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">
                ⚠️ Debes abrir el turno para procesar vales
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación para actualizar precios similares */}
      <PriceUpdateModal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        selectedProduct={selectedProduct}
        similarProducts={similarProducts}
        onConfirm={(updateAll) => {
          if (selectedProduct) {
            actualizarPrecio(
              selectedProduct.index, 
              selectedProduct.newPrice, 
              updateAll,
              updateAll ? similarProducts.map(p => p.index) : []
            );
          }
          setShowPriceModal(false);
        }}
      />
    </>
  );
};

export default ValeDetails;