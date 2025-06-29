// /src/components/cajero/components/ValidacionTransferencia.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Check, Send, X } from 'lucide-react';
import { useTransferValidation } from '../../../hooks/useSocket';
import { useAuth } from '../../../hooks/useAuth';

// --- Estilos y Animaciones CSS (Sin dependencias) ---
const constAnimationStyle = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes zoomIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .modal-backdrop-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
  }
  .modal-content-zoom-in {
    animation: zoomIn 0.2s ease-out forwards;
  }
  .spinner-animation {
    animation: spin 1s linear infinite;
  }
`;

// --- Componente de Carga Mejorado (con botón para cancelar y monto) ---
const LoadingView = ({ text, onCancel, monto }) => (
  <div className="flex flex-col items-center justify-center text-center py-8">
    <style>{`
      @keyframes pulse-icon {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      .pulse-icon-animation { animation: pulse-icon 2s infinite ease-in-out; }
    `}</style>
    <div className="relative w-20 h-20 mb-4">
      <Send className="w-20 h-20 text-blue-500 pulse-icon-animation" />
    </div>
    <h3 className="text-xl font-semibold mt-4 mb-2">Esperando validación...</h3>
    <p className="text-gray-600 mb-6">{text}</p>
    
    {/* CAMBIO: Se muestra el monto durante la espera */}
    <div className="bg-gray-100 rounded-lg p-4 w-full mb-6">
        <p className="text-sm text-gray-600">Monto a validar</p>
        <p className="text-3xl font-bold text-green-600">
            ${monto.toLocaleString('es-CL')}
        </p>
    </div>

    <button
      onClick={onCancel}
      className="text-red-600 hover:text-red-700 font-medium transition-colors"
    >
      Cancelar Validación
    </button>
  </div>
);

// --- Componente de Resultado Mejorado ---
const ResultView = ({ status, message, onAccept }) => {
  const config = {
    aprobada: { Icon: Check, color: 'green', title: '¡Transferencia Validada!' },
    rechazada: { Icon: X, color: 'red', title: 'Transferencia Rechazada' },
    timeout: { Icon: AlertTriangle, color: 'yellow', title: 'Tiempo de Espera Agotado' },
  };
  const { Icon, color, title } = config[status];
  const colorClasses = {
    bg: `bg-${color}-600`,
    hoverBg: `hover:bg-${color}-700`,
    ring: `focus:ring-${color}-500`,
    iconBg: `bg-${color}-100`,
    iconText: `text-${color}-600`,
    titleText: `text-${color}-600`,
  };

  return (
    <div className="text-center py-8 flex flex-col items-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${colorClasses.iconBg} mb-6`}>
        <Icon className={`w-12 h-12 ${colorClasses.iconText}`} strokeWidth={2.5} />
      </div>
      <h3 className={`text-2xl font-bold ${colorClasses.titleText} mb-2`}>{title}</h3>
      <p className="text-gray-600 mb-8 max-w-sm">{message}</p>
      <button
        onClick={onAccept}
        className={`w-full text-white py-3 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colorClasses.bg} ${colorClasses.hoverBg} ${colorClasses.ring}`}
      >
        Aceptar
      </button>
    </div>
  );
};

// --- Componente Principal ---
const ValidacionTransferencia = ({
  isOpen,
  onClose,
  monto,
  numeroVale,
  clienteNombre,
  cuentaTransferencia,
  onValidacionCompleta,
}) => {
  const { user } = useAuth();
  const { solicitarValidacion, cancelarValidacion, on, off } = useTransferValidation();

  const [detalles, setDetalles] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // 'aprobada', 'rechazada', 'timeout'
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState(null);

  const resetStateAndClose = useCallback(() => {
    setIsProcessing(false);
    setValidationStatus(null);
    setMessage('');
    setRequestId(null);
    setDetalles('');
    onClose();
  }, [onClose]);
  
  const handleCancelation = useCallback(() => {
    if (isProcessing && requestId) {
      cancelarValidacion(requestId, 'Cancelado por cajero');
    }
    // El listener 'validacion_cancelada' se encargará de llamar a resetStateAndClose
    // Si no hay request, simplemente cerramos.
    if (!requestId) {
        resetStateAndClose();
    }
  }, [isProcessing, requestId, cancelarValidacion, resetStateAndClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleValidationStarted = (data) => {
      setRequestId(data.id);
      setMessage(data.mensaje || 'Enviando a administración...');
    };
    const handleValidationResult = (data) => {
      if (data.id === requestId) {
        setValidationStatus(data.validada ? 'aprobada' : 'rechazada');
        setMessage(data.observaciones || data.mensaje);
        setIsProcessing(false);
      }
    };
    const handleTimeout = (data) => {
      if (data.id === requestId) {
        setValidationStatus('timeout');
        setMessage(data.mensaje);
        setIsProcessing(false);
      }
    };
    const handleCancellationConfirmed = (data) => {
      if (data.id === requestId) {
        resetStateAndClose();
      }
    };

    on('validacion_iniciada', handleValidationStarted);
    on('resultado_validacion', handleValidationResult);
    on('validacion_timeout', handleTimeout);
    on('validacion_cancelada', handleCancellationConfirmed);

    return () => {
      off('validacion_iniciada', handleValidationStarted);
      off('resultado_validacion', handleValidationResult);
      off('validacion_timeout', handleTimeout);
      off('validacion_cancelada',handleCancellationConfirmed);
    };
  }, [isOpen, requestId, on, off, resetStateAndClose]);

  const handleSendValidation = () => {
    setIsProcessing(true);
    solicitarValidacion({
      cajero_nombre: user.username || user.nombre || 'Cajero',
      cliente_nombre: clienteNombre,
      monto,
      cuenta_destino: cuentaTransferencia,
      referencia: detalles,
      numero_vale: numeroVale,
    });
  };

  const handleAcceptResult = () => {
    const isValidated = validationStatus === 'aprobada';
    onValidacionCompleta(isValidated, message);
    resetStateAndClose();
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (isProcessing) {
      // CAMBIO: Se pasa el prop "monto" a la vista de carga
      return <LoadingView text={message} onCancel={handleCancelation} monto={monto} />;
    }
    if (validationStatus) {
      return <ResultView status={validationStatus} message={message} onAccept={handleAcceptResult} />;
    }
    // --- Vista Inicial (Formulario) ---
    return (
      <>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Validar Transferencia</h2>
        <p className="text-gray-500 mb-6">Confirma los datos y envía para validación.</p>
        <div className="space-y-4">
          <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r-lg">
            <label className="block text-xs font-medium text-purple-800">Cuenta Destino</label>
            <p className="text-lg font-semibold text-purple-900">{cuentaTransferencia}</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-1"><label className="block text-sm font-medium text-gray-700">Cliente</label><p className="text-lg font-semibold">{clienteNombre}</p></div>
            <div className="flex-1"><label className="block text-sm font-medium text-gray-700">Monto</label><p className="text-2xl font-bold text-green-600">${monto.toLocaleString('es-CL')}</p></div>
          </div>
          <div>
            <label htmlFor="detalles" className="block text-sm font-medium text-gray-700 mb-1">Detalles (Opcional)</label>
            <textarea id="detalles" value={detalles} onChange={(e) => setDetalles(e.target.value)} placeholder="Añade un banco, n° de referencia o nota..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" />
          </div>
        </div>
        <div className="mt-8">
          <button onClick={handleSendValidation} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Send className="w-5 h-5" /> Validar Ahora
          </button>
          <button onClick={handleCancelation} className="mt-3 w-full text-gray-600 py-2 hover:text-gray-800 transition-colors font-medium">Cancelar</button>
        </div>
      </>
    );
  };

  return (
    <>
      <style>{constAnimationStyle}</style>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 modal-backdrop-fade-in">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 modal-content-zoom-in">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default ValidacionTransferencia;