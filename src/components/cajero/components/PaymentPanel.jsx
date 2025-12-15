// /src/components/cajero/components/PaymentPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Receipt,
  FileText,
  Printer
} from 'lucide-react';
import PaymentAmountModal from './PaymentAmountModal';
import ValidacionTransferencia from './ValidacionTransferencia';
import FacturacionModal from './FacturacionModal';
import { filterEmptyFields } from '../utils/validators';
import apiService from '../../../services/api';
import printService from '../../../services/printService';
import { useSocket } from '../../../hooks/useSocket';

const PaymentPanel = ({ vale, onSuccess, showToast, turnoAbierto, productosAfectosDescuento = {} }) => {
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [printServerAvailable, setPrintServerAvailable] = useState(false);
  const [paymentData, setPaymentData] = useState({
    tipo_documento: 'boleta',
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

    // Verificar si el servidor de impresión está disponible
    const checkPrintServer = async () => {
      const available = await printService.checkConnection();
      setPrintServerAvailable(available);
      if (available) {
        console.log('🖨️ Servidor de impresión conectado');
      }
    };
    checkPrintServer();

    // Verificar cada 30 segundos
    const interval = setInterval(checkPrintServer, 30000);
    return () => clearInterval(interval);
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
      // Debug: Mostrar toda la información del vale
      console.log('📋 Vale completo:', vale);
      console.log('📋 Detalles originales:', vale.detalles_originales);

      const clienteInfo = vale.detalles_originales?.cliente_info || {};

      // Intentar detectar el tipo de documento desde múltiples fuentes
      let tipoDocumento = 'boleta';
      const tipoVale = vale.tipo_documento ||
                      vale.detalles_originales?.tipo_documento ||
                      vale.detalles_originales?.tipo_venta ||
                      vale.tipo_venta ||
                      vale.documento_tipo;

      console.log('🎫 Tipo documento detectado:', tipoVale);

      // Solo se respeta si es factura, todo lo demás es boleta por defecto
      if (tipoVale && tipoVale.toString().toLowerCase() === 'factura') {
        tipoDocumento = 'factura';
        console.log('✅ Auto-seleccionando FACTURA');
      } else {
        tipoDocumento = 'boleta';
        console.log('✅ Por defecto: BOLETA (ticket/boleta siempre es boleta)');
      }

      setPaymentData(prev => ({
        ...prev,
        tipo_documento: tipoDocumento,
        nombre_cliente: clienteInfo.nombre || clienteInfo.razon_social || vale.cliente || '',
        rut_cliente: clienteInfo.rut || '',
        razon_social: clienteInfo.razon_social || '',
        direccion: clienteInfo.direccion || '',
        comuna: clienteInfo.comuna || '',
        giro: clienteInfo.giro || '',
        correo: clienteInfo.email || '',
        telefono: clienteInfo.telefono || ''
      }));
    } else {
      setPaymentData({
        tipo_documento: 'boleta',
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
    setPaymentData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Si cambia a 'ticket' y tenía 'tarjeta' seleccionada, cambiar a 'efectivo'
      if (field === 'tipo_documento' && value === 'ticket' && prev.metodo_pago === 'TAR') {
        newData.metodo_pago = 'EFE';
      }

      // Si cambia a 'factura', abrir modal de facturación
      if (field === 'tipo_documento' && value === 'factura' && prev.tipo_documento !== 'factura') {
        setShowFacturacionModal(true);
      }

      return newData;
    });
  };

  const handleSaveFacturacion = async (datosFacturacion) => {
    try {
      // Guardar inmediatamente en la base de datos
      console.log('💾 Guardando datos de facturación en BD...', datosFacturacion);

      const response = await apiService.guardarCliente(datosFacturacion);

      if (response.success) {
        // Actualizar el estado local con los datos guardados
        setPaymentData(prev => ({
          ...prev,
          rut_cliente: datosFacturacion.rut,
          razon_social: datosFacturacion.razon_social,
          direccion: datosFacturacion.direccion,
          comuna: datosFacturacion.comuna,
          giro: datosFacturacion.giro,
          correo: datosFacturacion.correo,
          telefono: datosFacturacion.telefono
        }));

        showToast('✅ Datos de cliente guardados en la base de datos', 'success');
      } else {
        showToast('❌ Error al guardar datos: ' + response.message, 'error');
      }
    } catch (error) {
      console.error('Error guardando datos de facturación:', error);
      showToast('❌ Error al guardar datos del cliente', 'error');
    }
  };

  const formatCurrency = (amount) => {
    return Math.round(Number(amount || 0)).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Calcular el total según el tipo de documento
  const calcularNeto = () => {
    if (!vale) return 0;
    return vale.total;
  };

  const calcularIVA = () => {
    if (!vale) return 0;
    return vale.total * 0.19;
  };

  const calcularTotalConIva = () => {
    if (!vale) return 0;
    return vale.total * 1.19;
  };

  const calcularDescuento = () => {
    if (!vale || !vale.productos) return 0;

    // Solo si es ticket, calcular descuento
    if (paymentData.tipo_documento === 'ticket') {
      // Sumar solo los productos que están marcados como afectos al descuento
      let totalAfecto = 0;

      vale.productos.forEach((producto, index) => {
        if (productosAfectosDescuento[index] === true) {
          const subtotalProducto = producto.cantidad * producto.precio_unitario;
          totalAfecto += subtotalProducto;
        }
      });

      // Calcular 10% de descuento sobre el total con IVA de los productos afectos
      return (totalAfecto * 1.19) * 0.1;
    }

    return 0;
  };

  const calcularTotal = () => {
    if (!vale) return 0;

    const totalConIva = calcularTotalConIva();

    // Si es ticket, aplicar 10% de descuento solo a productos afectos
    if (paymentData.tipo_documento === 'ticket') {
      return totalConIva - calcularDescuento();
    }

    return totalConIva;
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
        monto: calcularTotal(),
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
      await handleProcessPayment(calcularTotal(), observaciones);
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
        descuento: calcularDescuento(),
        nombre_cliente: paymentData.nombre_cliente,
        razon_social: paymentData.razon_social,
        rut_cliente: paymentData.rut_cliente,
        direccion_cliente: paymentData.direccion,
        comuna: paymentData.comuna,
        giro: paymentData.giro,
        email_cliente: paymentData.correo,
        telefono_cliente: paymentData.telefono,
        observaciones_caja: observacionesTransferencia || paymentData.observaciones_caja
      };

      const datosVenta = filterEmptyFields(datosCompletos);
      const resp = await apiService.procesarVale(vale.numero, datosVenta);

      if (resp.success) {
        const numeroVenta = resp.data?.numero_venta;
        const totalConIva = calcularTotal();
        const vuelto = montoRecibido - totalConIva;
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

        // =========================================
        // EMISIÓN DE DTE (Boleta o Factura Electrónica)
        // =========================================
        let folioDTE = null;
        let modoPruebaDTE = false;
        let timbreTED = null;

        // Solo emitir DTE si es boleta o factura (no para ticket)
        if (paymentData.tipo_documento === 'boleta' || paymentData.tipo_documento === 'factura') {
          try {
            console.log('🧾 Iniciando emisión de DTE...');

            // Preparar productos para DTE (formato Relbase)
            // product_id: Si el producto está sincronizado con Relbase, usar su ID
            // product_id: 0 indica producto genérico (no registrado en Relbase)
            const productosParaDTE = vale.productos.map(p => ({
              product_id: p.relbase_product_id || 0, // ✅ Usar ID de Relbase si existe
              name: p.descripcion_completa || p.producto || p.nombre || 'Producto',
              code: p.codigo || p.sku || p.variante?.sku || '',
              price: Math.round(p.precio_unitario * 1.19), // Precio con IVA
              quantity: p.cantidad,
              tax_affected: true,
              unit_item: 'UNID'
            }));

            console.log('📦 Productos para DTE:', productosParaDTE.map(p => ({
              product_id: p.product_id,
              name: p.name,
              relbase_synced: p.product_id > 0
            })));

            let dteResponse;

            if (paymentData.tipo_documento === 'boleta') {
              // Emitir boleta electrónica
              dteResponse = await apiService.emitirBoleta(productosParaDTE, {
                comment: `Vale ${vale.numero}`
              });
            } else {
              // Emitir factura electrónica
              const clienteDTE = {
                rut: paymentData.rut_cliente,
                name: paymentData.razon_social || paymentData.nombre_cliente,
                address: paymentData.direccion,
                commune_id: null, // Relbase usa IDs de comuna
                city_id: null
              };

              dteResponse = await apiService.emitirFactura(productosParaDTE, clienteDTE, {
                comment: `Vale ${vale.numero}`
              });
            }

            console.log('📥 Respuesta DTE completa:', JSON.stringify(dteResponse, null, 2));

            if (dteResponse.success) {
              folioDTE = dteResponse.data?.folio;
              modoPruebaDTE = dteResponse.data?.dte?.sii_status === 'simulado';
              timbreTED = dteResponse.data?.dte?.timbre || null;  // Timbre electrónico del SII (XML para PDF417)
              console.log('📦 Datos extraídos - folioDTE:', folioDTE, 'modoPruebaDTE:', modoPruebaDTE, 'timbreTED:', timbreTED ? 'presente' : 'ausente');

              const tipoDoc = paymentData.tipo_documento === 'boleta' ? 'Boleta' : 'Factura';

              if (modoPruebaDTE) {
                mensaje += `\n🧪 ${tipoDoc} SIMULADA - Folio: ${folioDTE} (modo prueba)`;
              } else {
                mensaje += `\n🧾 ${tipoDoc} Electrónica emitida - Folio: ${folioDTE}`;
              }

              console.log(`✅ DTE emitido - Folio: ${folioDTE}, Modo prueba: ${modoPruebaDTE}`);

              // Guardar DTE en la BD para permitir reimpresión futura
              if (numeroVenta && folioDTE) {
                try {
                  await apiService.guardarDTEVenta(numeroVenta, {
                    folio_dte: folioDTE,
                    tipo_dte: paymentData.tipo_documento,
                    timbre_ted: timbreTED,
                    pdf_url_dte: dteResponse.data?.pdf_url || null,
                    modo_prueba_dte: modoPruebaDTE
                  });
                  console.log(`💾 DTE guardado en BD para venta ${numeroVenta}`);
                } catch (saveError) {
                  console.error('⚠️ No se pudo guardar DTE en BD:', saveError);
                  // No bloquear el flujo por este error
                }
              }
            } else {
              console.error('❌ Error emitiendo DTE:', dteResponse.message);
              mensaje += `\n⚠️ No se pudo emitir DTE: ${dteResponse.message}`;
            }
          } catch (dteError) {
            console.error('❌ Error en emisión DTE:', dteError);
            mensaje += '\n⚠️ Error al emitir documento tributario';
          }
        }

        // Imprimir boleta si el servidor de impresión está disponible
        if (printServerAvailable) {
          try {
            const boletaData = printService.formatBoletaData(vale, paymentData, {
              neto: calcularNeto(),
              iva: calcularIVA(),
              descuento: calcularDescuento(),
              total: totalConIva,
              montoPagado: montoRecibido,
              vuelto: vuelto > 0 ? vuelto : 0,
              folioDTE: folioDTE,
              modoPruebaDTE: modoPruebaDTE,
              timbreTED: timbreTED  // Timbre SII para código de barras PDF417
            });
            await printService.printBoleta(boletaData);
            mensaje += '\n🖨️ Boleta enviada a impresión';
          } catch (printError) {
            console.error('Error al imprimir:', printError);
            mensaje += '\n⚠️ No se pudo imprimir la boleta';
          }
        }

        showToast(mensaje, 'success');
        setShowAmountModal(false);
        onSuccess(numeroVenta);
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Resumen de Pago
          </h3>
          {printServerAvailable && (
            <button
              onClick={async () => {
                try {
                  const testData = {
                    numero_vale: 'TEST-001',
                    fecha: new Date().toISOString(),
                    cliente: { nombre: 'PRUEBA DE IMPRESIÓN', rut: '', direccion: '' },
                    productos: [
                      { nombre: 'Producto de prueba', cantidad: 1, precio_unitario: 1000, subtotal: 1000 }
                    ],
                    neto: 1000,
                    iva: 190,
                    total: 1190,
                    tipo_documento: 'boleta',
                    metodo_pago: 'EFE',
                    vendedor: 'Sistema'
                  };
                  await printService.printBoleta(testData);
                  showToast('🖨️ Prueba enviada a impresión', 'success');
                } catch (err) {
                  showToast('Error: ' + err.message, 'error');
                }
              }}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded transition-colors"
              title="Click para probar impresión"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Probar</span>
            </button>
          )}
        </div>

        {vale ? (
          <div className="space-y-4">
            {/* Información del Vale */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Receipt className="w-5 h-5 mr-2 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Vale {vale.numero_display || vale.numero}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Precio Neto:</span>
                  <span className="font-semibold text-gray-800">${formatCurrency(calcularNeto())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">IVA (19%):</span>
                  <span className="font-semibold text-gray-800">${formatCurrency(calcularIVA())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total con IVA:</span>
                  <span className="font-semibold text-gray-800">${formatCurrency(calcularTotalConIva())}</span>
                </div>
                {paymentData.tipo_documento === 'ticket' && calcularDescuento() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">Descuento (10%):</span>
                    <span className="font-semibold">-${formatCurrency(calcularDescuento())}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-blue-200">
                  <span className="font-medium text-blue-800">Total a Pagar:</span>
                  <span className="text-lg font-bold text-blue-900">${formatCurrency(calcularTotal())}</span>
                </div>
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
              <div className={`grid ${paymentData.tipo_documento === 'ticket' ? 'grid-cols-2' : 'grid-cols-3'} gap-1`}>
                {[
                  { key: 'EFE', label: 'EFECTIVO' },
                  { key: 'TAR', label: 'TARJETA', hideForTicket: true },
                  { key: 'TRA', label: 'TRANSFER.' }
                ]
                  .filter(metodo => !(paymentData.tipo_documento === 'ticket' && metodo.hideForTicket))
                  .map(metodo => (
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
              {paymentData.tipo_documento === 'ticket' && (
                <p className="text-xs text-yellow-700 mt-1 italic">
                  ⚠️ Tarjeta no disponible para tickets con descuento
                </p>
              )}
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
              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-blue-800 text-sm flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Datos de Facturación
                  </h4>
                  {(!paymentData.rut_cliente || !paymentData.razon_social) && (
                    <span className="text-xs text-red-600 font-medium">⚠️ Incompleto</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFacturacionModal(true)}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>
                    {paymentData.rut_cliente && paymentData.razon_social
                      ? 'Editar Datos de Facturación'
                      : 'Completar Datos de Facturación'}
                  </span>
                </button>

                {paymentData.rut_cliente && paymentData.razon_social && (
                  <div className="mt-3 text-xs text-gray-700 space-y-1">
                    <div><strong>RUT:</strong> {paymentData.rut_cliente}</div>
                    <div><strong>Razón Social:</strong> {paymentData.razon_social}</div>
                    {paymentData.direccion && <div><strong>Dirección:</strong> {paymentData.direccion}, {paymentData.comuna}</div>}
                  </div>
                )}
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
        totalAmount={vale ? calcularTotal() : 0}
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

      {/* Modal de Facturación */}
      <FacturacionModal
        isOpen={showFacturacionModal}
        onClose={() => {
          setShowFacturacionModal(false);
          // No cambiamos el tipo de documento, simplemente cerramos el modal
        }}
        onSave={handleSaveFacturacion}
        initialData={{
          razon_social: paymentData.razon_social || vale?.detalles_originales?.cliente_info?.razon_social || '',
          rut: paymentData.rut_cliente || vale?.detalles_originales?.cliente_info?.rut || '',
          direccion: paymentData.direccion || vale?.detalles_originales?.cliente_info?.direccion || '',
          comuna: paymentData.comuna || vale?.detalles_originales?.cliente_info?.comuna || '',
          giro: paymentData.giro || vale?.detalles_originales?.cliente_info?.giro || '',
          correo: paymentData.correo || vale?.detalles_originales?.cliente_info?.email || '',
          telefono: paymentData.telefono || vale?.detalles_originales?.cliente_info?.telefono || ''
        }}
      />
    </>
  );
};

export default PaymentPanel;