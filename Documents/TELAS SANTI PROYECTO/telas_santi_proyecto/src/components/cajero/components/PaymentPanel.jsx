// /src/components/cajero/components/PaymentPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Receipt
} from 'lucide-react';
import PaymentAmountModal from './PaymentAmountModal';
import ValidacionTransferencia from './ValidacionTransferencia';
import { filterEmptyFields } from '../utils/validators';
import apiService from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';

const PaymentPanel = ({ vale, onSuccess, showToast, turnoAbierto }) => {
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [paymentData, setPaymentData] = useState({
    tipo_documento: 'ticket',
    metodo_pago: 'EFE',
    cuenta_transferencia: '',
    nombre_cliente: '',
    rut_cliente: '',
    razon_social: '',
    observaciones_caja: ''
  });

  // Hook para socket - unirse a la sala de cajeros
  const { joinRoom } = useSocket();

  useEffect(() => {
    // Unirse a la sala de cajeros al montar el componente
    const cajeroData = {
      usuario: localStorage.getItem('usuario_nombre') || 'Cajero',
      id: localStorage.getItem('usuario_id')
    };
    joinRoom('cajero', cajeroData);
  }, [joinRoom]);

  // Cuentas para transferencia
  const cuentasTransferencia = [
    { id: 'santander', nombre: 'SANTANDER' },
    { id: 'fer_chile', nombre: 'FER CHILE' },
    { id: 'fer_global', nombre: 'FER GLOBAL' },
    { id: 'mely_global', nombre: 'MELY GLOBAL' }
  ];

  // Llenar datos cuando cambia el vale
  useEffect(() => {
    if (vale) {
      const clienteInfo = vale.detalles_originales?.cliente_info || {};
      
      let tipoDocumento = 'ticket';
      const tipoVale = vale.tipo_documento || 
                      vale.detalles_originales?.tipo_documento || 
                      vale.detalles_originales?.tipo_venta;
      
      console.log('🎫 Tipo documento del vale:', tipoVale, '-> Seleccionando:', tipoVale === 'factura' ? 'factura' : 'ticket');
      
      if (tipoVale === 'factura') {
        tipoDocumento = 'factura';
      }
      
      setPaymentData(prev => ({
        ...prev,
        tipo_documento: tipoDocumento,
        nombre_cliente: clienteInfo.nombre || clienteInfo.razon_social || '',
        rut_cliente: clienteInfo.rut || '',
        razon_social: clienteInfo.razon_social || ''
      }));
    } else {
      setPaymentData({
        tipo_documento: 'ticket',
        metodo_pago: 'EFE',
        cuenta_transferencia: '',
        nombre_cliente: '',
        rut_cliente: '',
        razon_social: '',
        observaciones_caja: ''
      });
    }
  }, [vale]);

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL');
  };

  const handleOpenPaymentModal = () => {
    // Validaciones básicas
    if (paymentData.tipo_documento === 'factura' && (!paymentData.rut_cliente || !paymentData.razon_social)) {
      showToast('Para factura se requiere RUT y razón social del cliente', 'error');
      return;
    }

    if (paymentData.metodo_pago === 'TRA' && !paymentData.cuenta_transferencia) {
      showToast('Selecciona la cuenta de transferencia', 'error');
      return;
    }

    // Si es transferencia, mostrar modal de validación
    if (paymentData.metodo_pago === 'TRA') {
      setTransferData({
        monto: vale.total,
        numeroVale: vale.numero,
        clienteNombre: paymentData.nombre_cliente || vale.cliente || 'Cliente sin identificar',
        cuenta: cuentasTransferencia.find(c => c.id === paymentData.cuenta_transferencia)?.nombre
      });
      setShowTransferModal(true);
    } else {
      // Para otros métodos, mostrar modal de monto
      setShowAmountModal(true);
    }
  };

  const handleTransferValidation = async (validada, observaciones) => {
    setShowTransferModal(false);
    
    if (validada) {
      // Si la transferencia fue validada, procesar el pago
      if (observaciones === 'Validación pendiente posterior') {
        showToast('La transferencia se procesará con validación posterior', 'info');
      }
      
      // Procesar con el monto exacto (sin vuelto en transferencias)
      await handleProcessPayment(vale.total, observaciones);
    } else {
      // Transferencia rechazada
      showToast('La transferencia no pudo ser validada. Por favor, verifique con el cliente.', 'error');
    }
    
    setTransferData(null);
  };

  const handleProcessPayment = async (montoRecibido, observacionesTransferencia = null) => {
    if (!vale) return;

    setLoading(true);
    try {
      const datosCompletos = {
        tipo_documento: paymentData.tipo_documento,
        metodo_pago: paymentData.metodo_pago,
        cuenta_transferencia: paymentData.cuenta_transferencia,
        monto_pagado: montoRecibido,
        descuento: 0,
        nombre_cliente: paymentData.nombre_cliente,
        razon_social: paymentData.razon_social,
        rut_cliente: paymentData.rut_cliente,
        observaciones_caja: observacionesTransferencia || paymentData.observaciones_caja
      };
      
      const datosVenta = filterEmptyFields(datosCompletos);
      const resp = await apiService.procesarVale(vale.numero, datosVenta);

      if (resp.success) {
        const vuelto = montoRecibido - vale.total;
        let mensaje = `✅ Pago procesado correctamente: vale ${vale.numero}`;
        
        if (paymentData.metodo_pago === 'EFE' && vuelto > 0) {
          mensaje += `\n💰 Vuelto entregado: $${vuelto.toLocaleString('es-CL')}`;
        }
        
        const metodosTexto = {
          'EFE': 'Efectivo',
          'TAR': 'Tarjeta',
          'TRA': 'Transferencia'
        };
        mensaje += `\n💳 Método: ${metodosTexto[paymentData.metodo_pago]}`;
        
        if (paymentData.metodo_pago === 'TRA' && paymentData.cuenta_transferencia) {
          const cuenta = cuentasTransferencia.find(c => c.id === paymentData.cuenta_transferencia);
          if (cuenta) {
            mensaje += ` (${cuenta.nombre})`;
          }
        }
        
        if (vale.es_vale_antiguo) {
          mensaje += `\n⚠️ Nota: Era un vale de hace ${vale.dias_atras} días`;
        }
        
        showToast(mensaje, 'success', false);
        setShowAmountModal(false);
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

  return (
    <>
      <div className="bg-white rounded-lg shadow p-5 sticky top-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Opciones de Pago
        </h3>

        {vale ? (
          <div className="space-y-4">
            {/* Información del Vale */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Receipt className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Vale {vale.numero_display || vale.numero}
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-900">
                  ${formatCurrency(vale.total)}
                </span>
              </div>
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento
              </label>
              <div className="grid grid-cols-3 gap-1">
                {['ticket', 'boleta', 'factura'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleInputChange('tipo_documento', tipo)}
                    className={`py-2 px-1 text-xs font-medium rounded border transition-colors ${
                      paymentData.tipo_documento === tipo
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tipo.toUpperCase()}
                  </button>
                ))}
              </div>
              {((vale?.tipo_documento === 'factura' || 
                 vale?.detalles_originales?.tipo_documento === 'factura' ||
                 vale?.detalles_originales?.tipo_venta === 'factura') && 
                paymentData.tipo_documento === 'factura') && (
                <p className="text-xs text-blue-600 mt-1">
                  Auto-seleccionado: El vale requiere factura
                </p>
              )}
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { key: 'EFE', label: 'EFECTIVO' },
                  { key: 'TAR', label: 'TARJETA' },
                  { key: 'TRA', label: 'TRANSFER.' }
                ].map(metodo => (
                  <button
                    key={metodo.key}
                    type="button"
                    onClick={() => handleInputChange('metodo_pago', metodo.key)}
                    className={`py-2 px-1 text-xs font-medium rounded border transition-colors ${
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
                <div className="grid grid-cols-2 gap-1">
                  {cuentasTransferencia.map(cuenta => (
                    <button
                      key={cuenta.id}
                      type="button"
                      onClick={() => handleInputChange('cuenta_transferencia', cuenta.id)}
                      className={`py-2 px-1 text-xs font-medium rounded border transition-colors ${
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
              <div className="border border-blue-200 rounded p-3 bg-blue-50">
                <h4 className="font-medium text-blue-800 mb-2 text-sm">Datos Factura</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={paymentData.rut_cliente}
                    onChange={(e) => handleInputChange('rut_cliente', e.target.value)}
                    className="w-full px-2 py-2 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    placeholder="RUT Cliente"
                    required
                  />
                  <input
                    type="text"
                    value={paymentData.razon_social}
                    onChange={(e) => handleInputChange('razon_social', e.target.value)}
                    className="w-full px-2 py-2 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    placeholder="Razón Social"
                    required
                  />
                </div>
              </div>
            )}

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones (opcional)
              </label>
              <textarea
                value={paymentData.observaciones_caja}
                onChange={(e) => handleInputChange('observaciones_caja', e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                rows="2"
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Botón de Procesar */}
            <button
              type="button"
              onClick={handleOpenPaymentModal}
              disabled={!turnoAbierto || vale.estado !== 'vale_pendiente'}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg shadow-lg"
            >
              <CreditCard className="w-6 h-6" />
              <span>PROCESAR PAGO</span>
            </button>

            {/* Advertencias */}
            {!turnoAbierto && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-red-600 text-sm text-center">
                  ⚠️ Debes abrir el turno para procesar pagos
                </p>
              </div>
            )}

            {vale.estado !== 'vale_pendiente' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-yellow-800 text-sm text-center">
                  ⚠️ Este vale ya fue procesado
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <h4 className="text-gray-500 text-sm">
              Selecciona un vale para procesar
            </h4>
          </div>
        )}
      </div>

      {/* Modal de Monto (para efectivo y tarjeta) */}
      <PaymentAmountModal
        isOpen={showAmountModal}
        onClose={() => setShowAmountModal(false)}
        onConfirm={handleProcessPayment}
        totalAmount={vale?.total || 0}
        loading={loading}
        valeInfo={vale ? {
          numero: vale.numero_display || vale.numero,
          cliente: vale.cliente
        } : null}
        metodoPago={paymentData.metodo_pago}
        cuentaTransferencia={paymentData.metodo_pago === 'TRA' ? 
          cuentasTransferencia.find(c => c.id === paymentData.cuenta_transferencia)?.nombre : null
        }
      />

      {/* Modal de Validación de Transferencia */}
      <ValidacionTransferencia
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setTransferData(null);
        }}
        monto={transferData?.monto || 0}
        numeroVale={transferData?.numeroVale || ''}
        clienteNombre={transferData?.clienteNombre || ''}
        cuentaTransferencia={transferData?.cuenta || ''}
        onValidacionCompleta={handleTransferValidation}
      />
    </>
  );
};

export default PaymentPanel;