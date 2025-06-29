// /src/components/cajero/components/PaymentModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Loader,
  AlertTriangle,
  Calculator
} from 'lucide-react';
import { validarDatosPago, filterEmptyFields } from '../utils/validators';
import apiService from '../../../services/api';

const PaymentModal = ({ isOpen, onClose, vale, onSuccess, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    tipo_documento: 'boleta',
    metodo_pago: 'EFE',
    cuenta_transferencia: '',
    nombre_cliente: '',
    rut_cliente: '',
    razon_social: '',
    monto_pagado: '',
    descuento: 0,
    observaciones_caja: ''
  });

  // Cuentas para transferencia
  const cuentasTransferencia = [
    { id: 'santander', nombre: 'SANTANDER' },
    { id: 'fer_chile', nombre: 'FER CHILE' },
    { id: 'fer_global', nombre: 'FER GLOBAL' },
    { id: 'mely_global', nombre: 'MELY GLOBAL' }
  ];

  // Llenar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && vale) {
      const clienteInfo = vale.detalles_originales?.cliente_info || {};
      
      setPaymentData(prev => ({
        ...prev,
        monto_pagado: vale.total.toString(),
        nombre_cliente: clienteInfo.nombre || clienteInfo.razon_social || '',
        rut_cliente: clienteInfo.rut || '',
        razon_social: clienteInfo.razon_social || ''
      }));
    }
  }, [isOpen, vale]);

  if (!isOpen || !vale) return null;

  const totalConDescuento = vale.total - Number(paymentData.descuento);
  const vuelto = Number(paymentData.monto_pagado) - totalConDescuento;

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProcessPayment = async () => {
    // Validaciones básicas
    if (paymentData.tipo_documento === 'factura' && (!paymentData.rut_cliente || !paymentData.razon_social)) {
      showToast('Para factura se requiere RUT y razón social del cliente', 'error');
      return;
    }

    if (paymentData.metodo_pago === 'TRA' && !paymentData.cuenta_transferencia) {
      showToast('Selecciona la cuenta de transferencia', 'error');
      return;
    }

    const montoPagado = Number(paymentData.monto_pagado) || vale.total;
    const descuento = Number(paymentData.descuento) || 0;

    if (descuento >= vale.total) {
      showToast('El descuento no puede ser mayor o igual al total', 'error');
      return;
    }

    if (montoPagado < totalConDescuento) {
      showToast('El monto pagado no puede ser menor al total a cobrar', 'error');
      return;
    }

    setLoading(true);
    try {
      const datosCompletos = {
        tipo_documento: paymentData.tipo_documento,
        metodo_pago: paymentData.metodo_pago,
        cuenta_transferencia: paymentData.cuenta_transferencia,
        monto_pagado: montoPagado,
        descuento: descuento,
        nombre_cliente: paymentData.nombre_cliente,
        razon_social: paymentData.razon_social,
        rut_cliente: paymentData.rut_cliente,
        observaciones_caja: paymentData.observaciones_caja
      };
      
      const datosVenta = filterEmptyFields(datosCompletos);
      console.log('📨 Datos finales (filtrados):', datosVenta);

      const resp = await apiService.procesarVale(vale.numero, datosVenta);

      if (resp.success) {
        let mensaje = `✅ Pago procesado correctamente: vale ${vale.numero}`;
        if (vuelto > 0) {
          mensaje += `\n💰 Vuelto a entregar: $${vuelto.toLocaleString('es-CL')}`;
        }
        
        if (vale.es_vale_antiguo) {
          mensaje += `\n⚠️ Nota: Era un vale de hace ${vale.dias_atras} días`;
        }
        
        showToast(mensaje, 'success', false);
        onSuccess();
      } else {
        showToast(resp.message || 'Error al procesar el vale', 'error');
      }
    } catch (error) {
      console.error('Error procesando el vale:', error);
      showToast('Error al procesar el vale. Intenta nuevamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL');
  };

  return (
    <div className="flex h-screen">
      {/* Contenido Principal - Lado Izquierdo */}
      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        {/* Número del Vale */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Vale {vale.numero_display || vale.numero}
          </h2>
          <p className="text-gray-600">Cliente: {vale.cliente}</p>
          {vale.es_vale_antiguo && (
            <div className="mt-2 bg-yellow-100 border border-yellow-300 rounded-lg p-2">
              <p className="text-yellow-800 text-sm">
                ⚠️ Vale antiguo de hace {vale.dias_atras} días
              </p>
            </div>
          )}
        </div>

        {/* Lista de Productos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">
              Productos ({vale.productos?.length || 0})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Precio Unit.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vale.productos?.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {producto.producto || 'Producto'}
                        </div>
                        {producto.codigo && (
                          <div className="text-xs text-gray-500 font-mono">
                            {producto.codigo}
                          </div>
                        )}
                        {producto.tipo && (
                          <div className="text-xs text-blue-600 font-medium">
                            {producto.tipo}
                          </div>
                        )}
                        {(producto.variante?.color || producto.variante?.medida) && (
                          <div className="text-sm text-gray-600 mt-1">
                            {[producto.variante?.color, producto.variante?.medida]
                              .filter(Boolean)
                              .join(' • ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-medium">{producto.cantidad}</div>
                      {producto.unidad_medida && (
                        <div className="text-xs text-gray-500">{producto.unidad_medida}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      ${formatCurrency(producto.precio_unitario)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold">
                      ${formatCurrency(producto.subtotal)}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No hay productos para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total a Cobrar:</span>
              <span className="text-green-600">${formatCurrency(vale.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Pago - Lado Derecho */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Header del Panel */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Procesar Pago</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Panel */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          {/* Tipo de Documento - Botones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['ticket', 'boleta', 'factura'].map(tipo => (
                <button
                  key={tipo}
                  onClick={() => handleInputChange('tipo_documento', tipo)}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    paymentData.tipo_documento === tipo
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tipo.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Método de Pago - Botones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <div className="space-y-2">
              {[
                { key: 'EFE', label: 'EFECTIVO' },
                { key: 'TAR', label: 'TARJETA' },
                { key: 'TRA', label: 'TRANSFERENCIA' }
              ].map(metodo => (
                <button
                  key={metodo.key}
                  onClick={() => handleInputChange('metodo_pago', metodo.key)}
                  className={`w-full py-3 px-4 text-sm font-medium rounded-lg border transition-colors ${
                    paymentData.metodo_pago === metodo.key
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {metodo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cuentas de Transferencia */}
          {paymentData.metodo_pago === 'TRA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta de Transferencia
              </label>
              <div className="space-y-2">
                {cuentasTransferencia.map(cuenta => (
                  <button
                    key={cuenta.id}
                    onClick={() => handleInputChange('cuenta_transferencia', cuenta.id)}
                    className={`w-full py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                      paymentData.cuenta_transferencia === cuenta.id
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cuenta.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Datos del Cliente (solo para factura) */}
          {paymentData.tipo_documento === 'factura' && (
            <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-3">Datos para Factura</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    RUT Cliente *
                  </label>
                  <input
                    type="text"
                    value={paymentData.rut_cliente}
                    onChange={(e) => handleInputChange('rut_cliente', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="12345678-9"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    value={paymentData.razon_social}
                    onChange={(e) => handleInputChange('razon_social', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Empresa S.A."
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cálculo */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Calculator className="w-4 h-4 mr-2 text-purple-600" />
              Cálculo
            </h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento
                  </label>
                  <input
                    type="number"
                    value={paymentData.descuento}
                    onChange={(e) => handleInputChange('descuento', Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    max={vale.total}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Pagado
                  </label>
                  <input
                    type="number"
                    value={paymentData.monto_pagado}
                    onChange={(e) => handleInputChange('monto_pagado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                    placeholder={totalConDescuento}
                    min={totalConDescuento}
                  />
                </div>
              </div>

              {/* Resumen del Cálculo */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${formatCurrency(vale.total)}</span>
                  </div>
                  {Number(paymentData.descuento) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span className="font-medium">-${formatCurrency(paymentData.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-blue-200 pt-2">
                    <span>Total a cobrar:</span>
                    <span className="text-green-600">${formatCurrency(totalConDescuento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monto recibido:</span>
                    <span className="font-medium">${formatCurrency(paymentData.monto_pagado || 0)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-blue-200 pt-2">
                    <span>Vuelto:</span>
                    <span className={`${vuelto > 0 ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                      ${formatCurrency(Math.max(0, vuelto))}
                    </span>
                  </div>
                  {vuelto > 0 && (
                    <div className="bg-blue-100 border border-blue-300 rounded p-2 mt-2">
                      <p className="text-blue-800 text-xs font-bold text-center">
                        💰 ENTREGAR VUELTO: ${formatCurrency(vuelto)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <button
            onClick={handleProcessPayment}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                <span>Procesar Pago - ${formatCurrency(totalConDescuento)}</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;