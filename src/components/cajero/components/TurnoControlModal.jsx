// /src/components/cajero/components/TurnoControlModal.jsx
import React, { useState } from 'react';
import {
  X,
  Clock,
  Calculator,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import InputModal from './InputModal';
import ConfirmModal from './ConfirmModal';

const TurnoControlModal = ({
  isOpen,
  onClose,
  turnoAbierto,
  turnoInfo,
  turnoActions,
  showToast,
  onTurnoChange
}) => {
  const [showMontoInicialModal, setShowMontoInicialModal] = useState(false);
  const [showConfirmCierreModal, setShowConfirmCierreModal] = useState(false);
  const [showMontoCierreModal, setShowMontoCierreModal] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const handleAbrirTurno = async (monto) => {
    if (isNaN(monto) || monto < 0) {
      showToast('Ingresa un monto válido', 'error');
      return;
    }

    try {
      await turnoActions.abrirTurno(monto);
      showToast('✅ Turno de caja abierto correctamente', 'success');
      onTurnoChange();
    } catch (error) {
      showToast('Error al abrir el turno', 'error');
    }
  };

  const handleConfirmCerrarTurno = () => {
    setShowConfirmCierreModal(false);
    setShowMontoCierreModal(true);
  };

  const handleCerrarTurno = async (monto) => {
    if (isNaN(monto) || monto < 0) {
      showToast('Ingresa un monto válido', 'error');
      return;
    }

    try {
      const resultado = await turnoActions.cerrarTurno(monto);
      const diferencia = resultado?.diferencia || 0;

      let mensaje = '✅ Turno de caja cerrado correctamente';
      if (diferencia !== 0) {
        mensaje += `\n${diferencia > 0 ? '📈' : '📉'} Diferencia: $${Math.abs(diferencia).toLocaleString('es-CL')} ${diferencia > 0 ? 'sobrante' : 'faltante'}`;
      } else {
        mensaje += '\n🎯 Sin diferencias - Arqueo perfecto';
      }

      showToast(mensaje, diferencia === 0 ? 'success' : 'warning', false);
      onTurnoChange();
      onClose();
    } catch (error) {
      showToast('Error al cerrar el turno', 'error');
    }
  };

  const handleArqueoIntermedio = () => {
    // Esta función se manejará desde el componente padre
    // que abrirá el modal de arqueo
    onClose();
    // Aquí se debería abrir el modal de arqueo
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-blue-600" />
            Control de Turno
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Estado actual del turno */}
        <div className="mb-6">
          <div className={`p-4 rounded-lg border-2 ${
            turnoAbierto 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center mb-2">
              {turnoAbierto ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`font-semibold ${
                turnoAbierto ? 'text-green-800' : 'text-red-800'
              }`}>
                Estado: {turnoAbierto ? 'Turno Abierto' : 'Turno Cerrado'}
              </span>
            </div>
            
            {turnoAbierto && turnoInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-700">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Apertura: {formatDate(turnoInfo.fecha_apertura)}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>Monto inicial: ${formatCurrency(turnoInfo.monto_inicial)}</span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>Caja: {turnoInfo.caja || 'Principal'}</span>
                </div>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  <span>Tiempo: {Math.floor((turnoInfo.tiempo_abierto_minutos || 0) / 60)}h {(turnoInfo.tiempo_abierto_minutos || 0) % 60}m</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones disponibles */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 mb-3">Acciones Disponibles</h4>
          
          {/* Abrir Turno */}
          <button
            onClick={() => setShowMontoInicialModal(true)}
            disabled={turnoAbierto}
            className="w-full bg-green-600 text-white p-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700"
          >
            <div className="flex items-center justify-center space-x-3">
              <Clock className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Abrir Turno</p>
                <p className="text-sm opacity-90">Iniciar turno de caja con monto inicial</p>
              </div>
            </div>
          </button>

          {/* Arqueo Intermedio */}
          <button
            onClick={handleArqueoIntermedio}
            disabled={!turnoAbierto}
            className="w-full bg-blue-600 text-white p-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            <div className="flex items-center justify-center space-x-3">
              <Calculator className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Arqueo Intermedio</p>
                <p className="text-sm opacity-90">Realizar conteo de caja durante el turno</p>
              </div>
            </div>
          </button>

          {/* Cerrar Turno */}
          <button
            onClick={() => setShowConfirmCierreModal(true)}
            disabled={!turnoAbierto}
            className="w-full bg-red-600 text-white p-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-700"
          >
            <div className="flex items-center justify-center space-x-3">
              <X className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Cerrar Turno</p>
                <p className="text-sm opacity-90">Finalizar turno con arqueo final</p>
              </div>
            </div>
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">Información importante:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• El turno debe estar abierto para procesar vales</li>
            <li>• Los arqueos intermedios ayudan a controlar el efectivo</li>
            <li>• Al cerrar el turno se genera un reporte completo</li>
            <li>• Las diferencias se registran automáticamente</li>
          </ul>
        </div>
      </div>

      {/* Modal para Monto Inicial */}
      <InputModal
        isOpen={showMontoInicialModal}
        onClose={() => setShowMontoInicialModal(false)}
        onConfirm={handleAbrirTurno}
        title="Abrir Turno de Caja"
        message="Ingresa el monto inicial de caja:"
        inputType="number"
        placeholder="0"
        defaultValue="0"
        confirmText="Abrir Turno"
        cancelText="Cancelar"
      />

      {/* Modal de Confirmación para Cerrar Turno */}
      <ConfirmModal
        isOpen={showConfirmCierreModal}
        onClose={() => setShowConfirmCierreModal(false)}
        onConfirm={handleConfirmCerrarTurno}
        title="Confirmar Cierre de Turno"
        message="¿Estás seguro de que deseas cerrar el turno? Esta acción no se puede deshacer."
        confirmText="Sí, cerrar turno"
        cancelText="Cancelar"
        danger={true}
      />

      {/* Modal para Monto de Cierre */}
      <InputModal
        isOpen={showMontoCierreModal}
        onClose={() => setShowMontoCierreModal(false)}
        onConfirm={handleCerrarTurno}
        title="Monto Real de Cierre"
        message="Ingresa el monto real de cierre (efectivo en caja):"
        inputType="number"
        placeholder="0"
        defaultValue="0"
        confirmText="Cerrar Turno"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default TurnoControlModal;