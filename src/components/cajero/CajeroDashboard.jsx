// /src/components/cajero/CajeroDashboard.jsx - USANDO COMPONENTES SEPARADOS
import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import {
  RefreshCw,
  Bug,
  Settings,
  FileText,
  Search,
  Clock
} from 'lucide-react';

// Componentes organizados
import ValeSearch from './components/ValeSearch';
import ValeDetails from './components/ValeDetails';
import PaymentPanel from './components/PaymentPanel';
import TurnoControlModal from './components/TurnoControlModal';
import EstadisticasModal from './components/EstadisticasModal';
import ValeAntiguoModal from './components/ValeAntiguoModal';
import ArqueoModal from './components/ArqueoModal';
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

const CajeroDashboard = () => {
  // Estados principales del dashboard
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [showBuscarClienteModal, setShowBuscarClienteModal] = useState(false);
  const [showPagoMultipleModal, setShowPagoMultipleModal] = useState(false);
  const [showValeDetalleModal, setShowValeDetalleModal] = useState(false);
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [datosMultiples, setDatosMultiples] = useState(null);
  const [valeDetalleNumero, setValeDetalleNumero] = useState(null);
  const [productosAfectosDescuento, setProductosAfectosDescuento] = useState({});

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

  const handleRefresh = async () => {
    await Promise.all([
      turnoActions.checkEstado(),
      refreshEstadisticas()
    ]);
    showToast('Datos actualizados', 'info');
  };

  const handlePaymentSuccess = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Caja">
        <div className="flex items-center space-x-4">
          {/* Estadísticas del Día */}
          <button
            onClick={() => setShowEstadisticasModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm"
            title="Ver estadísticas completas"
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-base font-bold text-blue-900">
                {estadisticas.dia_actual.total_vales}
              </span>
              <span className="text-sm text-blue-700">
                {estadisticas.dia_actual.total_vales === 1 ? 'vale hoy' : 'vales hoy'}
              </span>
            </div>
          </button>

          {/* Vales Pendientes */}
          {estadisticas.dia_actual.pendientes > 0 && (
            <button
              onClick={() => setShowReportesModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all shadow-sm"
              title="Ver vales pendientes"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-base font-bold text-orange-900">
                  {estadisticas.dia_actual.pendientes}
                </span>
                <span className="text-sm text-orange-600">
                  {estadisticas.dia_actual.pendientes === 1 ? 'pendiente' : 'pendientes'}
                </span>
              </div>
            </button>
          )}

          <div className="h-8 w-px bg-gray-300"></div>

          {/* Buscar Cliente */}
          <button
            onClick={() => setShowBuscarClienteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            title="Buscar Cliente por RUT"
          >
            <Search className="w-5 h-5" />
            <span className="text-base font-medium">Buscar Cliente</span>
          </button>

          <div className="h-8 w-px bg-gray-300"></div>

          {/* Estado del Turno */}
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
              turnoAbierto
                ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
            }`}
            onClick={() => setShowTurnoModal(true)}
            title="Click para gestionar turno"
          >
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${turnoAbierto ? 'bg-green-600' : 'bg-red-600'}`}></span>
            <span className="text-base font-medium">{turnoAbierto ? 'Turno Abierto' : 'Turno Cerrado'}</span>
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