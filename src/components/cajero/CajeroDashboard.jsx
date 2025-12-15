// /src/components/cajero/CajeroDashboard.jsx - USANDO COMPONENTES SEPARADOS
import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import {
  RefreshCw,
  Bug,
  Settings,
  FileText,
  Search,
  Clock,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

// Componentes organizados
import ValeSearch from './components/ValeSearch';
import ValeDetails from './components/ValeDetails';
import PaymentPanel from './components/PaymentPanel';
import TurnoControlModal from './components/TurnoControlModal';
import EstadisticasModal from './components/EstadisticasModal';
import ValeAntiguoModal from './components/ValeAntiguoModal';
import ArqueoModal from './components/ArqueoModal';
import RetiroCajaModal from './components/RetiroCajaModal';
import CierreTurnoResumenModal from './components/CierreTurnoResumenModal';
import DebugPanel from './components/DebugPanel';
import Toast from './components/Toast';
import ReportesModal from './components/ReportesModal';
import BuscarClienteModal from './components/BuscarClienteModal';
import PagoMultipleModal from './components/PagoMultipleModal';
import ValeDetalleModal from './components/ValeDetalleModal';
import QuickActionsMenu from './components/QuickActionsMenu';
import ClientesModal from './components/ClientesModal';

// Hooks customizados
import useTurno from './hooks/useTurno';
import useVale from './hooks/useVale';
import useEstadisticas from './hooks/useEstadisticas';
import useToast from './hooks/useToast';

// Servicios
import apiService from '../../services/api';
import printService from '../../services/printService';

const CajeroDashboard = () => {
  // Estados principales del dashboard
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [showRetiroModal, setShowRetiroModal] = useState(false);
  const [showCierreResumenModal, setShowCierreResumenModal] = useState(false);
  const [datosCierreTurno, setDatosCierreTurno] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [showBuscarClienteModal, setShowBuscarClienteModal] = useState(false);
  const [showPagoMultipleModal, setShowPagoMultipleModal] = useState(false);
  const [showValeDetalleModal, setShowValeDetalleModal] = useState(false);
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [datosMultiples, setDatosMultiples] = useState(null);
  const [valeDetalleNumero, setValeDetalleNumero] = useState(null);
  const [productosAfectosDescuento, setProductosAfectosDescuento] = useState({});
  const [ultimaVentaNumero, setUltimaVentaNumero] = useState(null);

  // Hooks customizados
  const { toast, showToast, hideToast } = useToast();
  const { turnoAbierto, turnoInfo, actions: turnoActions } = useTurno(showToast);
  const { estadisticas, refreshEstadisticas } = useEstadisticas();
  const {
    currentVale,
    valeNumber,
    setValeNumber,
    loading,
    searchVale,
    clearVale,
    anularVale,
    updatePrices,
    // Estados para vales antiguos
    showValeAntiguoModal,
    setShowValeAntiguoModal,
    valeAntiguo,
    confirmarValeAntiguo,
    confirmandoValeAntiguo
  } = useVale(showToast, refreshEstadisticas);

  // Inicialización
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        turnoActions.checkEstado(),
        refreshEstadisticas()
      ]);
    };
    initialize();
  }, []);

  // Escuchar evento de sesión expirada
  useEffect(() => {
    const handleSessionExpired = (event) => {
      console.warn('🚪 Sesión expirada detectada en CajeroDashboard');
      showToast(event.detail?.message || 'Su sesión ha expirado', 'error');
      // Recargar la página para que App.jsx detecte que no hay sesión
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [showToast]);

  const handleRefresh = async () => {
    await Promise.all([
      turnoActions.checkEstado(),
      refreshEstadisticas()
    ]);
    showToast('Datos actualizados', 'info');
  };

  const handlePaymentSuccess = (numeroVenta) => {
    if (numeroVenta) {
      setUltimaVentaNumero(numeroVenta);
    }
    clearVale();
    refreshEstadisticas();
  };

  const handleValeSelectFromReporte = (numeroVale) => {
    setValeNumber(numeroVale);
    // Buscar el vale automáticamente
    searchVale(numeroVale);
  };

  const handleCobrarMultiples = (datos) => {
    setDatosMultiples(datos);
    setShowPagoMultipleModal(true);
  };

  const handlePagoMultipleSuccess = () => {
    setDatosMultiples(null);
    setShowPagoMultipleModal(false);
    refreshEstadisticas();
  };

  const handleVerDetalle = (numeroVale) => {
    setValeDetalleNumero(numeroVale);
    setShowValeDetalleModal(true);
  };

  // Función para reimprimir una boleta/factura específica
  const handleReimprimir = async (numeroVenta) => {
    try {
      showToast('Obteniendo datos para reimprimir...', 'info');

      // Obtener datos desde el backend
      const response = await apiService.obtenerDatosReimprimir(numeroVenta);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'No se encontraron datos para reimprimir');
      }

      const datos = response.data;

      // Verificar que el servidor de impresión esté disponible
      const printerAvailable = await printService.checkConnection();
      if (!printerAvailable) {
        showToast('Servidor de impresión no disponible', 'error');
        return;
      }

      // Transformar datos al formato que espera el printService
      // Formatear número de vale: VP20251203 04
      let numeroValeFormateado = '';
      const codigoCompleto = datos.numero_vale;
      if (codigoCompleto && codigoCompleto.includes('VP')) {
        const partes = codigoCompleto.split('-');
        const codigoBase = partes[0];
        const numeroDiario = datos.numero_diario
          ? String(datos.numero_diario).padStart(2, '0')
          : (partes[1] ? String(parseInt(partes[1], 10)).padStart(2, '0') : '');
        numeroValeFormateado = `${codigoBase} ${numeroDiario}`;
      } else {
        numeroValeFormateado = codigoCompleto || '';
      }

      const boletaData = {
        numero_vale: numeroValeFormateado,
        fecha: datos.fecha,
        cliente: {
          nombre: datos.cliente?.nombre || 'Cliente General',
          rut: datos.cliente?.rut || '',
          direccion: datos.cliente?.direccion || ''
        },
        productos: datos.productos?.map(p => ({
          nombre: p.descripcion_completa || p.nombre || 'Producto',
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          subtotal: p.subtotal || (p.cantidad * p.precio_unitario)
        })) || [],
        neto: datos.totales?.subtotal || 0,
        iva: datos.totales?.iva || 0,
        descuento: datos.totales?.descuento || 0,
        total: datos.totales?.total || 0,
        tipo_documento: datos.dte?.tipo || 'boleta',
        metodo_pago: datos.pago?.metodo || 'EFE',
        monto_pagado: datos.pago?.monto_pagado || datos.totales?.total || 0,
        vuelto: datos.pago?.vuelto > 0 ? datos.pago.vuelto : 0,
        vendedor: datos.vendedor || '',
        folio_dte: datos.dte?.folio || null,
        modo_prueba_dte: datos.dte?.modo_prueba || false,
        timbre_ted: datos.dte?.timbre_ted || null
      };

      console.log('🖨️ Datos para reimprimir:', boletaData);

      // Enviar a imprimir
      await printService.printBoleta(boletaData);
      showToast('Reimpresión enviada correctamente', 'success');

    } catch (error) {
      console.error('Error al reimprimir:', error);
      showToast(`Error al reimprimir: ${error.message}`, 'error');
    }
  };

  // Función para reimprimir la última venta procesada
  const handleReimprimirUltima = async () => {
    if (!ultimaVentaNumero) {
      showToast('No hay una venta reciente para reimprimir', 'warning');
      return;
    }
    await handleReimprimir(ultimaVentaNumero);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Caja">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
          {/* Estadísticas del Día */}
          <button
            onClick={() => setShowEstadisticasModal(true)}
            className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm flex-shrink-0"
            title="Ver estadísticas completas"
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-sm sm:text-base font-bold text-blue-900">
                {estadisticas.dia_actual.total_vales}
              </span>
              <span className="text-xs sm:text-sm text-blue-700 hidden xs:inline">
                {estadisticas.dia_actual.total_vales === 1 ? 'vale' : 'vales'}
              </span>
              <span className="text-xs sm:text-sm text-blue-700 hidden sm:inline">
                hoy
              </span>
            </div>
          </button>

          {/* Vales Pendientes */}
          {estadisticas.dia_actual.pendientes > 0 && (
            <button
              onClick={() => setShowReportesModal(true)}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all shadow-sm flex-shrink-0"
              title="Ver vales pendientes"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                <span className="text-sm sm:text-base font-bold text-orange-900">
                  {estadisticas.dia_actual.pendientes}
                </span>
                <span className="text-xs sm:text-sm text-orange-600 hidden sm:inline">
                  {estadisticas.dia_actual.pendientes === 1 ? 'pendiente' : 'pendientes'}
                </span>
              </div>
            </button>
          )}

          {/* Alerta de Retiro - Más de $200.000 en caja */}
          {turnoInfo?.requiere_retiro && (
            <button
              onClick={() => setShowRetiroModal(true)}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-100 to-red-200 border-2 border-red-400 rounded-lg hover:from-red-200 hover:to-red-300 transition-all shadow-sm flex-shrink-0 animate-pulse"
              title="Realizar retiro de caja"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                <span className="text-xs sm:text-sm font-bold text-red-800 hidden sm:inline">
                  Retiro
                </span>
              </div>
            </button>
          )}

          <div className="h-6 sm:h-8 w-px bg-gray-300 hidden sm:block"></div>

          {/* Buscar Cliente */}
          <button
            onClick={() => setShowBuscarClienteModal(true)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm flex-shrink-0"
            title="Buscar Cliente por RUT"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm md:text-base font-medium hidden sm:inline">Buscar Cliente</span>
          </button>

          <div className="h-6 sm:h-8 w-px bg-gray-300 hidden sm:block"></div>

          {/* Estado del Turno */}
          <button
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all shadow-sm flex-shrink-0 ${
              turnoAbierto
                ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
            }`}
            onClick={() => setShowTurnoModal(true)}
            title="Click para gestionar turno"
          >
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse flex-shrink-0 ${turnoAbierto ? 'bg-green-600' : 'bg-red-600'}`}></span>
            <span className="text-xs sm:text-sm md:text-base font-medium hidden sm:inline">{turnoAbierto ? 'Turno Abierto' : 'Turno Cerrado'}</span>
          </button>
        </div>
      </Header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {!currentVale ? (
          /* Vista Centrada - Sin Vale Seleccionado */
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Caja</h2>
                <p className="text-gray-600">Ingresa el número de vale para comenzar</p>
              </div>
              <ValeSearch
                valeNumber={valeNumber}
                setValeNumber={setValeNumber}
                onSearch={searchVale}
                loading={loading}
                turnoAbierto={turnoAbierto}
                currentVale={currentVale}
                onClear={clearVale}
              />
            </div>
          </div>
        ) : (
          /* Vista Normal - Con Vale Seleccionado */
          <>
            {/* Búsqueda de Vale - Compacta */}
            <div className="mb-4">
              <ValeSearch
                valeNumber={valeNumber}
                setValeNumber={setValeNumber}
                onSearch={searchVale}
                loading={loading}
                turnoAbierto={turnoAbierto}
                currentVale={currentVale}
                onClear={clearVale}
              />
            </div>

            {/* Layout Principal - 2 Columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* COLUMNA IZQUIERDA - Detalles del Vale */}
              <div className="lg:col-span-2">
                <ValeDetails
                  vale={currentVale}
                  onClear={clearVale}
                  onAnular={anularVale}
                  turnoAbierto={turnoAbierto}
                  onUpdatePrice={updatePrices}
                  showToast={showToast}
                  productosAfectosDescuento={productosAfectosDescuento}
                  setProductosAfectosDescuento={setProductosAfectosDescuento}
                />
              </div>

              {/* COLUMNA DERECHA - Panel de Pago */}
              <div className="lg:col-span-1">
                <PaymentPanel
                  vale={currentVale}
                  onSuccess={handlePaymentSuccess}
                  showToast={showToast}
                  turnoAbierto={turnoAbierto}
                  productosAfectosDescuento={productosAfectosDescuento}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modales */}
      <TurnoControlModal
        isOpen={showTurnoModal}
        onClose={() => setShowTurnoModal(false)}
        turnoAbierto={turnoAbierto}
        turnoInfo={turnoInfo}
        turnoActions={turnoActions}
        showToast={showToast}
        onTurnoChange={refreshEstadisticas}
        onArqueoIntermedio={() => setShowRetiroModal(true)}
        onCierreCompleto={(datosCierre) => {
          setDatosCierreTurno(datosCierre);
          setShowCierreResumenModal(true);
        }}
      />

      <EstadisticasModal
        isOpen={showEstadisticasModal}
        onClose={() => setShowEstadisticasModal(false)}
        estadisticas={estadisticas}
        turnoInfo={turnoInfo}
      />

      <ArqueoModal
        isOpen={showArqueoModal}
        onClose={() => setShowArqueoModal(false)}
        onSubmit={turnoActions.arqueoIntermedio}
        loading={turnoActions.arqueoLoading}
      />

      <RetiroCajaModal
        isOpen={showRetiroModal}
        onClose={() => setShowRetiroModal(false)}
        onSubmit={async (monto, motivo) => {
          try {
            const result = await turnoActions.retiroCaja(monto, motivo);
            showToast(`Retiro de $${monto.toLocaleString('es-CL')} registrado correctamente`, 'success');
            setShowRetiroModal(false);
            return result;
          } catch (error) {
            showToast(error.message || 'Error al registrar retiro', 'error');
            throw error;
          }
        }}
        loading={turnoActions.retiroLoading}
        montoTeorico={turnoInfo?.monto_teorico || 0}
      />

      <CierreTurnoResumenModal
        isOpen={showCierreResumenModal}
        onClose={() => {
          setShowCierreResumenModal(false);
          setDatosCierreTurno(null);
        }}
        data={datosCierreTurno}
        onPrint={async () => {
          if (datosCierreTurno) {
            try {
              const datosFormateados = printService.formatCierreTurnoData(datosCierreTurno);
              const result = await printService.printCierreTurno(datosFormateados);
              if (result.success) {
                showToast('Ticket de cierre impreso correctamente', 'success');
              } else {
                showToast(result.error || 'Error al imprimir', 'error');
              }
            } catch (error) {
              showToast('Error al imprimir: ' + error.message, 'error');
            }
          }
        }}
      />

      <ValeAntiguoModal
        isOpen={showValeAntiguoModal}
        onClose={() => setShowValeAntiguoModal(false)}
        onConfirm={confirmarValeAntiguo}
        valeAntiguo={valeAntiguo}
        loading={confirmandoValeAntiguo}
      />

      <DebugPanel
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />

      <ReportesModal
        isOpen={showReportesModal}
        onClose={() => setShowReportesModal(false)}
        onValeSelect={handleValeSelectFromReporte}
        onVerDetalle={handleVerDetalle}
        onReimprimir={handleReimprimir}
      />

      <BuscarClienteModal
        isOpen={showBuscarClienteModal}
        onClose={() => setShowBuscarClienteModal(false)}
        onValeSelect={handleValeSelectFromReporte}
        onCobrarMultiples={handleCobrarMultiples}
        onVerDetalle={handleVerDetalle}
      />

      <PagoMultipleModal
        isOpen={showPagoMultipleModal}
        onClose={() => setShowPagoMultipleModal(false)}
        datosMultiples={datosMultiples}
        onSuccess={handlePagoMultipleSuccess}
        showToast={showToast}
        turnoAbierto={turnoAbierto}
      />

      <ValeDetalleModal
        isOpen={showValeDetalleModal}
        onClose={() => setShowValeDetalleModal(false)}
        numeroVale={valeDetalleNumero}
      />

      {/* Sistema de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          autoClose={toast.autoClose}
        />
      )}

      {/* Menú de Acciones Rápidas (Flotante Circular) */}
      <QuickActionsMenu
        onClientes={() => setShowClientesModal(true)}
        onBuscarCliente={() => setShowBuscarClienteModal(true)}
        onReportes={() => setShowReportesModal(true)}
        onEstadisticas={() => setShowEstadisticasModal(true)}
        onMorosidades={() => {
          setShowReportesModal(true);
          // TODO: Abrir directamente en la pestaña de morosidades
        }}
        onReimprimirUltima={handleReimprimirUltima}
      />

      {/* Modal de Clientes */}
      <ClientesModal
        isOpen={showClientesModal}
        onClose={() => setShowClientesModal(false)}
        onClienteSelect={(cliente) => {
          // Al seleccionar un cliente, cerrar el modal de clientes y abrir búsqueda
          setShowClientesModal(false);
          setShowBuscarClienteModal(true);
        }}
      />
    </div>
  );
};

export default CajeroDashboard;