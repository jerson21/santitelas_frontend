// /src/components/cajero/CajeroDashboard.jsx - USANDO COMPONENTES SEPARADOS
import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { 
  RefreshCw, 
  Bug,
  Settings,
  BarChart3
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Sistema de Caja">
        <div className="flex items-center space-x-2">
          {/* Estadísticas como botones pequeños */}
          <div className="flex items-center space-x-1 mr-4">
            <button className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
              Vales: {estadisticas.dia_actual.total_vales}
            </button>
            <button className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
              ${Number(estadisticas.dia_actual.monto_total).toLocaleString('es-CL')}
            </button>
            <button className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
              Pend: {estadisticas.dia_actual.pendientes}
            </button>
            <button className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
              Hist: {estadisticas.pendientes_historicos.total}
            </button>
          </div>

          {/* Botones del header */}
          <button
            onClick={() => setShowEstadisticasModal(true)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            title="Ver Estadísticas"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowTurnoModal(true)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            title="Control de Turno"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowDebugPanel(true)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            title="Panel de Debug"
          >
            <Bug className="w-5 h-5" />
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Estado del turno */}
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
              turnoAbierto
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
            onClick={() => setShowTurnoModal(true)}
          >
            Turno: {turnoAbierto ? 'Abierto' : 'Cerrado'}
          </div>
        </div>
      </Header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Búsqueda de Vale */}
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
  onUpdatePrice={updatePrices}    // ✅ Agregado
  showToast={showToast}           // ✅ Agregado
/>
          </div>

          {/* COLUMNA DERECHA - Panel de Pago */}
          <div className="lg:col-span-1">
            <PaymentPanel
              vale={currentVale}
              onSuccess={handlePaymentSuccess}
              showToast={showToast}
              turnoAbierto={turnoAbierto}
            />
          </div>
        </div>
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

      {/* Sistema de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          autoClose={toast.autoClose}
        />
      )}
    </div>
  );
};

export default CajeroDashboard;