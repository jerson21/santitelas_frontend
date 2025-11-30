// /src/components/cajero/components/PagoMultipleModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Receipt,
  DollarSign,
  CreditCard,
  Banknote,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  Building2,
  ArrowRightLeft
} from 'lucide-react';
import apiService from '../../../services/api';
import ValidacionTransferencia from './ValidacionTransferencia';

const PagoMultipleModal = ({ isOpen, onClose, datosMultiples, onSuccess, showToast, turnoAbierto }) => {
  // Estados principales
  const [tipoDocumento, setTipoDocumento] = useState('ticket');
  const [metodoPago, setMetodoPago] = useState('EFE');
  const [cuentaTransferencia, setCuentaTransferencia] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Estados para facturación
  const [nombreCliente, setNombreCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [comuna, setComuna] = useState('');
  const [giro, setGiro] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estado para validación de transferencia
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferValidada, setTransferValidada] = useState(false);
  const [observacionesTransfer, setObservacionesTransfer] = useState('');

  // Cuentas para transferencia
  const cuentasTransferencia = [
    { id: 'santander', nombre: 'SANTANDER' },
    { id: 'fer_chile', nombre: 'FER CHILE' },
    { id: 'fer_global', nombre: 'FER GLOBAL' },
    { id: 'mely_global', nombre: 'MELY GLOBAL' }
  ];

  // Calcular totales
  const calcularNeto = () => {
    if (!datosMultiples) return 0;
    return datosMultiples.vales.reduce((sum, vale) => sum + Number(vale.total || 0), 0);
  };

  const calcularIVA = () => {
    return calcularNeto() * 0.19;
  };

  const calcularTotalConIva = () => {
    return calcularNeto() * 1.19;
  };

  const calcularDescuento = () => {
    // 10% de descuento solo para tickets
    if (tipoDocumento === 'ticket') {
      return calcularTotalConIva() * 0.1;
    }
    return 0;
  };

  const calcularTotal = () => {
    const totalConIva = calcularTotalConIva();
    if (tipoDocumento === 'ticket') {
      return totalConIva - calcularDescuento();
    }
    return totalConIva;
  };

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && datosMultiples) {
      const total = calcularTotal();
      setMontoPagado(Math.round(total).toString());

      // Pre-llenar datos del cliente si existen
      if (datosMultiples.cliente) {
        setNombreCliente(datosMultiples.cliente.nombre || '');
        setRutCliente(datosMultiples.cliente.rut || '');
        setTelefono(datosMultiples.cliente.telefono || '');
        setCorreo(datosMultiples.cliente.email || '');
        setDireccion(datosMultiples.cliente.direccion || '');
        setRazonSocial(datosMultiples.cliente.razon_social || datosMultiples.cliente.nombre || '');
      }
    }
  }, [isOpen, datosMultiples, tipoDocumento]);

  if (!isOpen || !datosMultiples) return null;

  const { cliente, vales } = datosMultiples;
  const totalAPagar = calcularTotal();

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const handleValidacionTransferencia = (validada, observaciones) => {
    setShowTransferModal(false);
    setTransferValidada(validada);
    setObservacionesTransfer(observaciones || '');

    if (validada) {
      // Procesar el pago después de validar la transferencia
      procesarPago(observaciones);
    } else {
      showToast('Transferencia no validada', 'error');
      setError('La transferencia no fue validada');
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!turnoAbierto) {
      showToast('Debes abrir un turno primero', 'error');
      return;
    }

    if (tipoDocumento === 'factura' && (!rutCliente || !razonSocial)) {
      showToast('Para factura se requiere RUT y razón social', 'error');
      setError('Complete los datos de facturación');
      return;
    }

    if (metodoPago === 'TRA' && !cuentaTransferencia) {
      showToast('Selecciona la cuenta de transferencia', 'error');
      setError('Seleccione una cuenta de transferencia');
      return;
    }

    const montoNumerico = parseFloat(montoPagado);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setError('Ingrese un monto válido');
      return;
    }

    if (montoNumerico < totalAPagar) {
      setError(`El monto debe ser al menos $${formatCurrency(totalAPagar)}`);
      return;
    }

    setError('');

    // Si es transferencia, mostrar modal de validación
    if (metodoPago === 'TRA') {
      setShowTransferModal(true);
    } else {
      // Para otros métodos, procesar directamente
      procesarPago();
    }
  };

  const procesarPago = async (obsTransfer = '') => {
    setProcessing(true);
    setError('');

    try {
      const montoNumerico = parseFloat(montoPagado);
      const cambio = Math.max(0, montoNumerico - totalAPagar);

      // Preparar datos de pago (mismos para todos los vales)
      const datosVenta = {
        tipo_documento: tipoDocumento,
        metodo_pago: metodoPago,
        cuenta_transferencia: metodoPago === 'TRA' ? cuentaTransferencia : null,
        monto_pagado: 0, // Se llenará individualmente para cada vale
        monto_cambio: 0,  // Se calculará individualmente
        descuento: 0,     // Se calculará individualmente
        nombre_cliente: nombreCliente || cliente.nombre || '',
        razon_social: tipoDocumento === 'factura' ? razonSocial : null,
        rut_cliente: tipoDocumento === 'factura' ? rutCliente : null,
        direccion_cliente: tipoDocumento === 'factura' ? direccion : null,
        comuna: tipoDocumento === 'factura' ? comuna : null,
        giro: tipoDocumento === 'factura' ? giro : null,
        email_cliente: tipoDocumento === 'factura' ? correo : null,
        telefono_cliente: telefono || cliente.telefono || '',
        observaciones_caja: observaciones || (metodoPago === 'TRA' ? obsTransfer : '')
      };

      console.log('📋 Procesando', vales.length, 'vales con los mismos datos:', datosVenta);

      // Procesar cada vale individualmente
      const resultados = [];
      let cambioRestante = cambio;

      for (let i = 0; i < vales.length; i++) {
        const vale = vales[i];
        try {
          // Calcular montos individuales del vale
          const netoVale = Number(vale.total || 0);
          const totalConIvaVale = netoVale * 1.19;
          const descuentoVale = tipoDocumento === 'ticket' ? totalConIvaVale * 0.1 : 0;
          const totalVale = totalConIvaVale - descuentoVale;

          // El primer vale lleva todo el monto pagado, los demás solo su total
          const montoPagadoVale = i === 0 ? montoNumerico : totalVale;
          const cambioVale = i === 0 ? cambio : 0;

          const datosValeIndividual = {
            ...datosVenta,
            monto_pagado: montoPagadoVale,
            monto_cambio: cambioVale,
            descuento: descuentoVale
          };

          console.log(`📄 Procesando vale ${vale.numero_pedido}:`, datosValeIndividual);

          const response = await apiService.procesarVale(vale.numero_pedido, datosValeIndividual);

          if (response.success) {
            resultados.push({ vale: vale.numero_pedido, exito: true });
          } else {
            resultados.push({ vale: vale.numero_pedido, exito: false, error: response.message });
          }
        } catch (err) {
          console.error(`❌ Error procesando vale ${vale.numero_pedido}:`, err);
          resultados.push({ vale: vale.numero_pedido, exito: false, error: err.message });
        }
      }

      // Verificar resultados
      const exitosos = resultados.filter(r => r.exito).length;
      const fallidos = resultados.filter(r => !r.exito).length;

      console.log('📊 Resultados:', { exitosos, fallidos, resultados });

      if (fallidos === 0) {
        showToast(`✓ ${exitosos} vales cobrados exitosamente`, 'success');
        handleClose();
        if (onSuccess) onSuccess();
      } else if (exitosos > 0) {
        showToast(`⚠ ${exitosos} vales cobrados, ${fallidos} fallidos`, 'warning');

        // Mostrar detalle de errores
        const valesConError = resultados.filter(r => !r.exito);
        console.error('Vales con error:', valesConError);

        handleClose();
        if (onSuccess) onSuccess();
      } else {
        showToast('Error al cobrar los vales', 'error');
        setError('No se pudo cobrar ningún vale. Intente nuevamente.');
      }
    } catch (err) {
      console.error('Error procesando cobro múltiple:', err);
      setError('Error procesando el cobro. Intente nuevamente.');
      showToast('Error procesando el cobro', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset todos los estados
    setTipoDocumento('ticket');
    setMetodoPago('EFE');
    setCuentaTransferencia('');
    setMontoPagado('');
    setError('');
    setNombreCliente('');
    setRutCliente('');
    setRazonSocial('');
    setDireccion('');
    setComuna('');
    setGiro('');
    setCorreo('');
    setTelefono('');
    setObservaciones('');
    setTransferValidada(false);
    setObservacionesTransfer('');
    onClose();
  };

  const handleMontoPagadoChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setMontoPagado(value);
    setError('');
  };

  const cambio = montoPagado ? Math.max(0, parseFloat(montoPagado) - totalAPagar) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Receipt className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Cobrar Múltiples Vales</h3>
                <p className="text-sm text-gray-500">
                  Procesando {vales.length} vale{vales.length !== 1 ? 's' : ''} para {cliente.nombre}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={processing}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna 1: Cliente y Vales */}
              <div className="space-y-4">
                {/* Información del Cliente */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-900">{cliente.nombre}</h4>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div><span className="font-medium">RUT:</span> {cliente.rut}</div>
                    {cliente.telefono && (
                      <div><span className="font-medium">Tel:</span> {cliente.telefono}</div>
                    )}
                  </div>
                </div>

                {/* Lista de Vales */}
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Receipt className="w-4 h-4 mr-2 text-gray-600" />
                    Vales a Cobrar ({vales.length})
                  </h5>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {vales.map((vale, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-bold text-blue-600">
                                {vale.numero_diario ? `#${String(vale.numero_diario).padStart(3, '0')}` : vale.numero_pedido}
                              </span>
                              {vale.dias_pendiente > 0 && (
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  vale.dias_pendiente > 7
                                    ? 'bg-red-100 text-red-800'
                                    : vale.dias_pendiente > 3
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {vale.dias_pendiente}d
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatDate(vale.fecha_creacion)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold text-gray-900">
                              ${formatCurrency(vale.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna 2: Detalles del Pago */}
              <div className="space-y-4">
                {/* Tipo de Documento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTipoDocumento('ticket')}
                      disabled={processing}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        tipoDocumento === 'ticket'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      Ticket
                    </button>
                    <button
                      onClick={() => setTipoDocumento('boleta')}
                      disabled={processing}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        tipoDocumento === 'boleta'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      Boleta
                    </button>
                    <button
                      onClick={() => setTipoDocumento('factura')}
                      disabled={processing}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        tipoDocumento === 'factura'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      Factura
                    </button>
                  </div>
                </div>

                {/* Campos de Facturación (solo si es factura) */}
                {tipoDocumento === 'factura' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="w-4 h-4 text-orange-600" />
                      <h5 className="font-semibold text-gray-800">Datos de Facturación</h5>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">RUT *</label>
                      <input
                        type="text"
                        value={rutCliente}
                        onChange={(e) => setRutCliente(e.target.value)}
                        disabled={processing}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12.345.678-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Razón Social *</label>
                      <input
                        type="text"
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        disabled={processing}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Empresa SpA"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Giro</label>
                      <input
                        type="text"
                        value={giro}
                        onChange={(e) => setGiro(e.target.value)}
                        disabled={processing}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Comercio al por menor"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
                        <input
                          type="text"
                          value={direccion}
                          onChange={(e) => setDireccion(e.target.value)}
                          disabled={processing}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Comuna</label>
                        <input
                          type="text"
                          value={comuna}
                          onChange={(e) => setComuna(e.target.value)}
                          disabled={processing}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setMetodoPago('EFE')}
                      disabled={processing}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        metodoPago === 'EFE'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      <Banknote className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Efectivo</span>
                    </button>
                    <button
                      onClick={() => setMetodoPago('TAR')}
                      disabled={processing}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        metodoPago === 'TAR'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      <CreditCard className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Tarjeta</span>
                    </button>
                    <button
                      onClick={() => setMetodoPago('TRA')}
                      disabled={processing}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        metodoPago === 'TRA'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      <ArrowRightLeft className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Selector de Cuenta (solo para transferencia) */}
                {metodoPago === 'TRA' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cuenta de Transferencia *
                    </label>
                    <select
                      value={cuentaTransferencia}
                      onChange={(e) => setCuentaTransferencia(e.target.value)}
                      disabled={processing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecciona una cuenta</option>
                      {cuentasTransferencia.map((cuenta) => (
                        <option key={cuenta.id} value={cuenta.id}>
                          {cuenta.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones (Opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    disabled={processing}
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              {/* Columna 3: Resumen y Pago */}
              <div className="space-y-4">
                {/* Desglose de montos */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <h5 className="font-semibold text-gray-800 mb-3">Desglose</h5>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Neto:</span>
                    <span className="font-medium">${formatCurrency(calcularNeto())}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA (19%):</span>
                    <span className="font-medium">${formatCurrency(calcularIVA())}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${formatCurrency(calcularTotalConIva())}</span>
                  </div>

                  {tipoDocumento === 'ticket' && calcularDescuento() > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento (10%):</span>
                      <span className="font-medium">-${formatCurrency(calcularDescuento())}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-base font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${formatCurrency(totalAPagar)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Monto Pagado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Pagado
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                      $
                    </span>
                    <input
                      type="text"
                      value={montoPagado}
                      onChange={handleMontoPagadoChange}
                      disabled={processing}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Cambio */}
                {cambio > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-yellow-800">Cambio:</span>
                      <span className="text-2xl font-bold text-yellow-900">
                        ${formatCurrency(cambio)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Botón de Cobrar */}
                <button
                  onClick={handleSubmit}
                  disabled={processing || !turnoAbierto || !montoPagado}
                  className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span>Cobrar {vales.length} Vale{vales.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>

                {!turnoAbierto && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠ Debes abrir un turno antes de cobrar
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              💡 <span className="font-medium">Tip:</span> Todos los vales se procesarán con el mismo documento y método de pago
            </div>
            <button
              onClick={handleClose}
              disabled={processing}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Validación de Transferencia */}
      {showTransferModal && metodoPago === 'TRA' && (
        <ValidacionTransferencia
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          monto={Math.round(totalAPagar)}
          numeroVale={`Múltiple (${vales.length} vales)`}
          clienteNombre={nombreCliente || cliente.nombre}
          cuentaTransferencia={cuentasTransferencia.find(c => c.id === cuentaTransferencia)?.nombre || ''}
          onValidacionCompleta={handleValidacionTransferencia}
        />
      )}
    </>
  );
};

export default PagoMultipleModal;
