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
import ClienteModal from './ClienteModal';
import InputModal from './InputModal';

const ValeDetails = ({ vale, onClear, onAnular, turnoAbierto, onUpdatePrice, showToast, productosAfectosDescuento, setProductosAfectosDescuento }) => {
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingBrutoPrice, setEditingBrutoPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [tempBrutoPrice, setTempBrutoPrice] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [showAnularModal, setShowAnularModal] = useState(false);

  // Inicializar productos afectos al descuento según BD cuando cambia el vale
  React.useEffect(() => {
    if (vale?.productos) {
      const afectos = {};
      vale.productos.forEach((producto, index) => {
        // El campo viene en producto.modalidad.afecto_descuento_ticket
        const afectoDescuento = producto.modalidad?.afecto_descuento_ticket;

        // Solo usar true por defecto si el campo es undefined/null
        // Si es false explícitamente, respetarlo
        if (afectoDescuento !== undefined && afectoDescuento !== null) {
          afectos[index] = Boolean(afectoDescuento);
        } else {
          afectos[index] = true; // Por defecto true solo si no viene el campo
        }
      });
      setProductosAfectosDescuento(afectos);
    }
    // Inicializar nombre del cliente
    if (vale?.cliente) {
      setClienteNombre(vale.cliente);
    } else {
      setClienteNombre('');
    }
  }, [vale]);

  const handleSaveCliente = (nombre) => {
    setClienteNombre(nombre);
    // Aquí podrías hacer un llamado al backend para actualizar el nombre si es necesario
    showToast(`Cliente actualizado: ${nombre}`, 'success');
  };

  const toggleAfectoDescuento = (index) => {
    setProductosAfectosDescuento(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

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
    return Math.round(Number(amount || 0)).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
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

  const handleEditBrutoPrice = (producto, index) => {
    setEditingBrutoPrice(index);
    setTempBrutoPrice((producto.precio_unitario * 1.19).toFixed(0));
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

  const handleSaveBrutoPrice = (producto, index) => {
    const newBrutoPrice = Number(tempBrutoPrice);

    if (isNaN(newBrutoPrice) || newBrutoPrice <= 0) {
      showToast('El precio debe ser un número válido mayor a 0', 'error');
      return;
    }

    // Calcular el precio neto desde el precio bruto (dividir entre 1.19)
    const newNetoPrice = Math.round(newBrutoPrice / 1.19);

    // Buscar productos similares con el mismo precio actual
    const productosSimiliares = vale.productos.filter((p, i) => {
      if (i === index) return false;

      const mismoTipo = p.tipo === producto.tipo && p.producto === producto.producto;
      const mismoPrecio = p.precio_unitario === producto.precio_unitario;

      return mismoTipo && mismoPrecio;
    });

    if (productosSimiliares.length > 0) {
      setSelectedProduct({ ...producto, index, newPrice: newNetoPrice });
      setSimilarProducts(productosSimiliares.map((p, i) => ({
        ...p,
        index: vale.productos.findIndex(prod => prod === p)
      })));
      setShowPriceModal(true);
    } else {
      actualizarPrecio(index, newNetoPrice, false);
    }

    setEditingBrutoPrice(null);
    setTempBrutoPrice('');
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setTempPrice('');
    setEditingBrutoPrice(null);
    setTempBrutoPrice('');
  };

  const canEditPrice = vale.estado === 'vale_pendiente' && turnoAbierto;

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Header del Vale COMPACTO */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Vale {vale.numero_display || vale.numero}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center group">
                  <span className="mr-2">Cliente:</span>
                  <span className="font-medium">{clienteNombre || 'Sin identificar'}</span>
                  {canEditPrice && (
                    <button
                      onClick={() => setShowClienteModal(true)}
                      className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Editar nombre del cliente"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
                  P. Unit (Neto)
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  P. c/IVA
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" title="Marcar si aplica descuento del 10%">
                  Aplica Desc.
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vale.productos?.map((producto, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {/* COLUMNA PRODUCTO - Simplificado */}
                  <td className="px-3 py-2">
                    <div>
                      <div className="font-medium text-gray-900 text-sm leading-tight">
                        {[producto.tipo, producto.producto].filter(Boolean).join(' ') || 'Producto'}
                      </div>
                      {producto.codigo && (
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {producto.codigo}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* COLUMNA MEDIDA/VARIANTE */}
                  <td className="px-3 py-2 text-center">
                    <div className="text-sm text-gray-700">
                      {producto.variante?.color || '-'}
                    </div>
                    {producto.variante?.medida && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {producto.variante.medida}
                      </div>
                    )}
                  </td>
                  
                  {/* COLUMNA CANTIDAD */}
                  <td className="px-3 py-2 text-center">
                    <div className="font-medium">{producto.cantidad}</div>
                    {producto.unidad_medida && (
                      <div className="text-xs text-gray-500">{producto.unidad_medida}</div>
                    )}
                  </td>

                  {/* COLUMNA PRECIO UNITARIO NETO - EDITABLE */}
                  <td className="px-3 py-2 text-right">
                    {editingPrice === index ? (
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="w-20 px-2 py-1 text-right border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
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
                      <div
                        className="group cursor-pointer"
                        onDoubleClick={() => canEditPrice && handleEditPrice(producto, index)}
                        title={canEditPrice ? "Doble click para editar precio neto" : ""}
                      >
                        <div className="flex items-center justify-end">
                          <span className={`font-medium text-gray-700 ${canEditPrice ? 'hover:text-blue-600' : ''}`}>
                            ${formatCurrency(producto.precio_unitario)}
                          </span>
                          {canEditPrice && (
                            <button
                              onClick={() => handleEditPrice(producto, index)}
                              className="ml-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Editar precio neto"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* COLUMNA PRECIO CON IVA - EDITABLE */}
                  <td className="px-3 py-2 text-right">
                    {editingBrutoPrice === index ? (
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          type="number"
                          value={tempBrutoPrice}
                          onChange={(e) => setTempBrutoPrice(e.target.value)}
                          className="w-20 px-2 py-1 text-right border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveBrutoPrice(producto, index);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveBrutoPrice(producto, index)}
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
                      <div
                        className="group cursor-pointer"
                        onDoubleClick={() => canEditPrice && handleEditBrutoPrice(producto, index)}
                        title={canEditPrice ? "Doble click para editar precio con IVA" : ""}
                      >
                        <div className="flex items-center justify-end">
                          <span className={`font-medium text-blue-600 ${canEditPrice ? 'hover:text-blue-800' : ''}`}>
                            ${formatCurrency(producto.precio_unitario * 1.19)}
                          </span>
                          {canEditPrice && (
                            <button
                              onClick={() => handleEditBrutoPrice(producto, index)}
                              className="ml-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Editar precio con IVA"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* COLUMNA APLICA DESCUENTO */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={productosAfectosDescuento[index] || false}
                      onChange={() => canEditPrice && toggleAfectoDescuento(index)}
                      disabled={!canEditPrice}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer disabled:cursor-not-allowed"
                      title={canEditPrice ? "Marcar si este producto puede recibir el descuento del 10% (se aplica en el panel de pago)" : "Este producto puede recibir descuento del 10%"}
                    />
                  </td>

                  {/* COLUMNA SUBTOTAL - BRUTO GRANDE, NETO PEQUEÑO */}
                  <td className="px-3 py-2 text-right">
                    <div className="font-bold text-base text-green-600">
                      ${formatCurrency(producto.cantidad * Math.round(producto.precio_unitario * 1.19))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Neto: ${formatCurrency(producto.cantidad * producto.precio_unitario)}
                    </div>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-gray-500">
                    No hay productos para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total del Vale */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total del Vale:</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                ${formatCurrency(
                  vale.productos?.reduce((sum, p) =>
                    sum + (p.cantidad * Math.round(p.precio_unitario * 1.19)), 0
                  ) || 0
                )}
              </div>
              <div className="text-sm text-gray-500">
                Neto: ${formatCurrency(vale.total)}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        {vale.estado === 'vale_pendiente' && turnoAbierto && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowAnularModal(true)}
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

      {/* Modal de edición de cliente */}
      <ClienteModal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSave={handleSaveCliente}
        currentName={clienteNombre}
      />

      {/* Modal para anular vale */}
      <InputModal
        isOpen={showAnularModal}
        onClose={() => setShowAnularModal(false)}
        onConfirm={onAnular}
        title="Anular Vale"
        message={`¿Cuál es el motivo para anular el vale ${vale?.numero}?${vale?.es_vale_antiguo ? `\n\n⚠️ Nota: Este vale es de hace ${vale.dias_atras} días` : ''}`}
        inputType="textarea"
        placeholder="Ingresa el motivo de anulación..."
        confirmText="Anular Vale"
        cancelText="Cancelar"
        showIcon={false}
        required={true}
      />
    </>
  );
};

export default ValeDetails;