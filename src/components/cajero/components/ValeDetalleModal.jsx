// /src/components/cajero/components/ValeDetalleModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  User,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import apiService from '../../../services/api';

const ValeDetalleModal = ({ isOpen, onClose, numeroVale }) => {
  const [vale, setVale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && numeroVale) {
      cargarVale();
    }
  }, [isOpen, numeroVale]);

  const cargarVale = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.buscarVale({
        numero_cliente: numeroVale,
        numero_completo: numeroVale
      });

      console.log('📋 Respuesta completa del vale:', response);
      console.log('📋 Datos del vale:', response.data);

      if (response.success && response.data) {
        setVale(response.data);
      } else {
        setError(response.mensaje || response.message || 'No se pudo cargar el vale');
      }
    } catch (err) {
      console.error('Error cargando vale:', err);
      setError('Error al cargar el detalle del vale');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVale(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pendiente' },
      'cobrado': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Cobrado' },
      'completado': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Cobrado' },
      'anulado': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Anulado' }
    };

    const estadoInfo = estados[estado] || estados['pendiente'];
    const Icon = estadoInfo.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${estadoInfo.bg} ${estadoInfo.text}`}>
        <Icon className="w-4 h-4" />
        <span>{estadoInfo.label}</span>
      </span>
    );
  };

  const getTipoDocumento = (tipo) => {
    const tipos = {
      'ticket': 'Ticket',
      'boleta': 'Boleta',
      'factura': 'Factura'
    };
    return tipos[tipo] || tipo || 'N/A';
  };

  const getMetodoPago = (metodo) => {
    const metodos = {
      'EFE': 'Efectivo',
      'TAR': 'Tarjeta',
      'TRA': 'Transferencia'
    };
    return metodos[metodo] || metodo || 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center space-x-3">
            <Receipt className="w-7 h-7 text-blue-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Detalle del Vale</h3>
              <p className="text-sm text-gray-600">Vale #{numeroVale}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Cargando detalle del vale...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-lg font-semibold text-gray-800 mb-2">Error al cargar</p>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={cargarVale}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : vale ? (
            <div className="space-y-6">
              {/* Fila 1: Información General */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información del Vale */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Información del Vale
                    </h4>
                    {getEstadoBadge(vale.estado)}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Número de Vale:</span>
                      <span className="font-bold text-blue-600">
                        {vale.numero_display || (vale.numero_diario ? `#${String(vale.numero_diario).padStart(3, '0')}` : vale.numero || vale.numero_vale)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Número de Pedido:</span>
                      <span className="font-mono text-gray-800">{vale.numero_vale || vale.numero || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Fecha de Creación:</span>
                      <span className="text-gray-800">{formatDate(vale.fecha_creacion)}</span>
                    </div>
                    {vale.fecha_cobro && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Fecha de Cobro:</span>
                        <span className="text-gray-800">{formatDate(vale.fecha_cobro)}</span>
                      </div>
                    )}
                    {vale.vendedor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Vendedor:</span>
                        <span className="text-gray-800">{vale.vendedor}</span>
                      </div>
                    )}
                    {vale.tipo_documento && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Tipo de Documento:</span>
                        <span className="text-gray-800">{getTipoDocumento(vale.tipo_documento)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del Cliente */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Información del Cliente
                  </h4>

                  {vale.cliente || vale.cliente_info?.tiene_cliente || vale.detalles_originales?.cliente_info ? (
                    <div className="space-y-3 text-sm">
                      {(vale.cliente_info?.nombre || vale.cliente) && (
                        <div>
                          <span className="text-gray-600 font-medium">Nombre:</span>
                          <p className="text-gray-800 font-semibold">{vale.cliente_info?.nombre || vale.cliente}</p>
                        </div>
                      )}
                      {(vale.cliente_info?.rut || vale.detalles_originales?.cliente_info?.rut) && (
                        <div>
                          <span className="text-gray-600 font-medium">RUT:</span>
                          <p className="text-gray-800">{vale.cliente_info?.rut || vale.detalles_originales?.cliente_info?.rut}</p>
                        </div>
                      )}
                      {(vale.cliente_info?.razon_social) && (
                        <div>
                          <span className="text-gray-600 font-medium">Razón Social:</span>
                          <p className="text-gray-800">{vale.cliente_info.razon_social}</p>
                        </div>
                      )}
                      {(vale.cliente_info?.giro) && (
                        <div>
                          <span className="text-gray-600 font-medium">Giro:</span>
                          <p className="text-gray-800">{vale.cliente_info.giro}</p>
                        </div>
                      )}
                      {(vale.cliente_info?.telefono || vale.detalles_originales?.cliente_info?.telefono) && (
                        <div>
                          <span className="text-gray-600 font-medium">Teléfono:</span>
                          <p className="text-gray-800">{vale.cliente_info?.telefono || vale.detalles_originales?.cliente_info?.telefono}</p>
                        </div>
                      )}
                      {(vale.cliente_info?.email || vale.detalles_originales?.cliente_info?.email) && (
                        <div>
                          <span className="text-gray-600 font-medium">Email:</span>
                          <p className="text-gray-800 truncate">{vale.cliente_info?.email || vale.detalles_originales?.cliente_info?.email}</p>
                        </div>
                      )}
                      {(vale.cliente_info?.direccion || vale.detalles_originales?.cliente_info?.direccion) && (
                        <div>
                          <span className="text-gray-600 font-medium">Dirección:</span>
                          <p className="text-gray-800">{vale.cliente_info?.direccion || vale.detalles_originales?.cliente_info?.direccion}</p>
                        </div>
                      )}
                      {(vale.cliente_info?.comuna) && (
                        <div>
                          <span className="text-gray-600 font-medium">Comuna:</span>
                          <p className="text-gray-800">{vale.cliente_info.comuna}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin información de cliente</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Productos ({vale.productos?.length || 0})
                </h4>

                {vale.productos && vale.productos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Precio Unit.
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vale.productos.map((producto, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {producto.descripcion_completa || producto.producto || producto.nombre || 'Producto'}
                                </p>
                                {producto.codigo && (
                                  <p className="text-xs text-gray-500">Código: {producto.codigo}</p>
                                )}
                                {producto.variante?.descripcion_completa && (
                                  <p className="text-xs text-gray-500">{producto.variante.descripcion_completa}</p>
                                )}
                                {producto.observaciones && (
                                  <p className="text-xs text-gray-500 italic">{producto.observaciones}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                                {producto.cantidad} {producto.unidad || ''}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              ${formatCurrency(producto.precio_unitario)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              ${formatCurrency(producto.subtotal || (producto.cantidad * producto.precio_unitario))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin productos registrados</p>
                  </div>
                )}
              </div>

              {/* Totales y Pago */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resumen de Montos */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-5">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Resumen de Montos
                  </h4>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-medium">Subtotal:</span>
                      <span className="text-gray-900 font-semibold">${formatCurrency(vale.totales?.subtotal || vale.total)}</span>
                    </div>

                    {(vale.totales?.descuento > 0 || vale.descuento > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">Descuento:</span>
                        <span className="text-green-600 font-semibold">-${formatCurrency(vale.totales?.descuento || vale.descuento)}</span>
                      </div>
                    )}

                    <div className="border-t-2 border-green-300 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total:</span>
                        <span className="text-3xl font-bold text-green-700">
                          ${formatCurrency(vale.totales?.total || vale.total_con_descuento || vale.total)}
                        </span>
                      </div>
                    </div>

                    {(vale.estado === 'cobrado' || vale.estado === 'completado') && (
                      <>
                        {vale.monto_pagado && (
                          <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                            <span className="text-gray-700 font-medium">Monto Pagado:</span>
                            <span className="text-gray-900 font-semibold">${formatCurrency(vale.monto_pagado)}</span>
                          </div>
                        )}
                        {vale.monto_cambio > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700 font-medium">Cambio:</span>
                            <span className="text-gray-900 font-semibold">${formatCurrency(vale.monto_cambio)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Información de Pago */}
                {(vale.estado === 'cobrado' || vale.estado === 'completado') && (
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      Información de Pago
                    </h4>

                    <div className="space-y-3 text-sm">
                      {vale.metodo_pago && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Método de Pago:</span>
                          <span className="text-gray-800 font-semibold">{getMetodoPago(vale.metodo_pago)}</span>
                        </div>
                      )}
                      {vale.cuenta_transferencia && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Cuenta:</span>
                          <span className="text-gray-800 font-semibold">{vale.cuenta_transferencia}</span>
                        </div>
                      )}
                      {vale.fecha_cobro && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Fecha de Cobro:</span>
                          <span className="text-gray-800">{formatDate(vale.fecha_cobro)}</span>
                        </div>
                      )}
                      {vale.cajero && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Cobrado por:</span>
                          <span className="text-gray-800">{vale.cajero}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Información de Anulación */}
                {vale.estado === 'anulado' && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
                    <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                      <XCircle className="w-5 h-5 mr-2" />
                      Información de Anulación
                    </h4>

                    <div className="space-y-3 text-sm">
                      {vale.motivo_anulacion && (
                        <div>
                          <span className="text-red-700 font-medium">Motivo:</span>
                          <p className="text-red-900 mt-1">{vale.motivo_anulacion}</p>
                        </div>
                      )}
                      {vale.fecha_anulacion && (
                        <div className="flex justify-between">
                          <span className="text-red-700 font-medium">Fecha:</span>
                          <span className="text-red-900">{formatDate(vale.fecha_anulacion)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              {vale.observaciones_caja && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
                  <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                    Observaciones
                  </h4>
                  <p className="text-gray-800">{vale.observaciones_caja}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Receipt className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">No se encontró información del vale</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
          <button
            onClick={handleClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValeDetalleModal;
