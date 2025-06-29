// /src/components/admin/TransferValidationNotifications.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Building,
  Hash,
  CreditCard,
  RefreshCw,
  WifiOff,
  Loader2
} from 'lucide-react';
import { useTransferValidation } from '../../hooks/useTransferValidation';
import { useAuth } from '../../hooks/useAuth';

const TransferValidationNotifications = () => {
  const { user } = useAuth();
  const { 
    pendingValidations, 
    responderValidacion, 
    isConnected,
    isReady,
    actualizarPendientes 
  } = useTransferValidation();
  
  const validacionesPendientes = pendingValidations.filter(v => 
    !v.aprobada && !v.rechazada && v.estado !== 'procesada' && v.estado !== 'completada'
  );
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isUpdating, setIsUpdating] = useState(false);
  
  // --- NUEVA LÓGICA DE SONIDO ---
  // Este estado controla si el sonido ya se reprodujo para el lote actual de notificaciones.
  const [hasPlayedSoundForThisBatch, setHasPlayedSoundForThisBatch] = useState(false);
  
  // Usamos useRef para comparar el contador anterior y decidir si auto-expandir el panel.
  const previousCountRef = useRef(0);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/sound2.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.error('Error al reproducir sonido de notificación:', error);
      });
    } catch (error) {
      console.error('Error al crear audio de notificación:', error);
    }
  };

  // --- useEffect DEDICADO Y CORREGIDO PARA EL SONIDO ---
  useEffect(() => {
    const currentCount = validacionesPendientes.length;

    // Si hay notificaciones Y AÚN NO hemos tocado el sonido para este lote, lo hacemos.
    if (currentCount > 0 && !hasPlayedSoundForThisBatch) {
      playNotificationSound();
      setHasPlayedSoundForThisBatch(true); // Marcamos que ya sonó.
    } 
    // Si ya no hay notificaciones, reiniciamos la bandera para el próximo lote.
    else if (currentCount === 0) {
      setHasPlayedSoundForThisBatch(false);
    }
  }, [validacionesPendientes.length, hasPlayedSoundForThisBatch]);


  // --- useEffect para manejar la interfaz (notificación y auto-expansión) ---
  useEffect(() => {
    const currentCount = validacionesPendientes.length;
    const previousCount = previousCountRef.current;
    
    // Si llega una nueva validación (el contador aumentó)
    if (currentCount > previousCount) {
      // Mostrar la notificación emergente si el panel está cerrado
      if (!isExpanded) {
        setShowNotification(true);
      }
      
      // Auto-expandir el panel para mostrarla
      if (!isExpanded) {
        setTimeout(() => setIsExpanded(true), 500);
      }

      // Ocultar la notificación emergente después de 5 segundos
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    }

    // Si la última validación se fue, ocultamos el pop-up
    if (currentCount === 0) {
        setShowNotification(false);
    }

    // Siempre actualizamos la referencia del contador al final.
    previousCountRef.current = currentCount;

  }, [validacionesPendientes.length, isExpanded]);


  // Actualizar timestamp cuando cambian las validaciones
  useEffect(() => {
    setLastUpdateTime(Date.now());
  }, [validacionesPendientes]);

  const handleValidar = async (validacion, aprobada) => {
    setProcessingId(validacion.id);
    
    let observaciones = '';
    if (aprobada) {
        observaciones = `Transferencia validada por ${user.username || user.nombre}`;
    } else {
        const motivo = prompt('Motivo del rechazo:');
        if (motivo === null) {
            setProcessingId(null);
            return;
        }
        observaciones = motivo || `Transferencia rechazada por ${user.username || user.nombre}`;
    }
    
    try {
      await responderValidacion(validacion.id, aprobada, observaciones);
      setShowNotification(false);
      setTimeout(async () => {
        await actualizarPendientes();
        setProcessingId(null);
      }, 500);
    } catch (error) {
      console.error('Error al procesar validación:', error);
      setProcessingId(null);
    }
  };

  const handleActualizar = async () => {
    setIsUpdating(true);
    await actualizarPendientes();
    setTimeout(() => setIsUpdating(false), 1000);
  };

  const formatearTiempo = (timestamp) => {
    const ahora = new Date();
    const diferencia = Math.floor((ahora - new Date(timestamp)) / 1000);
    
    if (diferencia < 10) return 'ahora';
    if (diferencia < 60) return `${diferencia}s`;
    if (diferencia < 3600) return `${Math.floor(diferencia / 60)}m`;
    if (diferencia < 86400) return `${Math.floor(diferencia / 3600)}h`;
    return `${Math.floor(diferencia / 86400)}d`;
  };

  const formatearUltimaActualizacion = () => {
    const diferencia = Math.floor((Date.now() - lastUpdateTime) / 1000);
    if (diferencia < 60) return 'Actualizado hace un momento';
    return `Actualizado hace ${Math.floor(diferencia / 60)}m`;
  };

  // El resto del código JSX no necesita cambios...
  if (!isReady) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-gray-600 text-white p-4 rounded-full shadow-lg animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleActualizar}
          className="relative bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 group"
          title="Sin conexión - Click para actualizar"
        >
          <WifiOff className="w-6 h-6" />
          <span className="absolute -top-12 right-0 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Sin conexión - Click para actualizar
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Botón flotante principal */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (!isExpanded) {
              setShowNotification(false);
            }
          }}
          className={`relative p-4 rounded-full shadow-lg transition-all duration-300 ${
            validacionesPendientes.length > 0 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          <Bell className="w-6 h-6" />
          {validacionesPendientes.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
              {validacionesPendientes.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel expandible */}
      {isExpanded && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[70vh] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Validaciones de Transferencia
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleActualizar}
                  className={`text-gray-400 hover:text-gray-600 p-1 transition-colors ${
                    isUpdating ? 'animate-spin' : ''
                  }`}
                  title="Actualizar lista"
                  disabled={isUpdating}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>
            {validacionesPendientes.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {validacionesPendientes.length} transferencia{validacionesPendientes.length > 1 ? 's' : ''} esperando validación
              </p>
            )}
          </div>

          {/* Lista de validaciones */}
          <div className="flex-1 overflow-y-auto">
            {validacionesPendientes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No hay transferencias pendientes</p>
                <p className="text-xs text-gray-400 mt-2">{formatearUltimaActualizacion()}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {validacionesPendientes.map((validacion) => (
                  <div 
                    key={validacion.id} 
                    className={`p-4 hover:bg-gray-50 transition-all duration-200 ${
                      processingId === validacion.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        <span className="font-medium">
                          {validacion.cajero || validacion.cajero_nombre || 'Cajero'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>hace {formatearTiempo(validacion.timestamp)}</span>
                      </div>
                    </div>

                    {validacion.cajeroDesconectado && (
                      <div className="mb-3 bg-orange-50 border border-orange-200 rounded-md p-2">
                        <div className="flex items-center text-xs text-orange-700">
                          <WifiOff className="w-3 h-3 mr-1" />
                          <span>{validacion.mensaje || 'Cajero desconectado'}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cliente:</span>
                        <span className="text-sm font-medium">
                          {validacion.cliente || validacion.cliente_nombre || 'Sin especificar'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Monto:</span>
                        <span className="text-lg font-bold text-green-600">
                          ${(validacion.monto || 0).toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Banco:</span>
                        <span className="text-sm font-medium">
                          {validacion.cuenta_destino || 'No especificado'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Referencia:</span>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {validacion.referencia || '---'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Vale:</span>
                        <span className="text-sm font-medium flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {validacion.numero_vale || '---'}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleValidar(validacion, true)}
                        disabled={processingId === validacion.id || validacion.cajeroDesconectado}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                      >
                        {processingId === validacion.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleValidar(validacion, false)}
                        disabled={processingId === validacion.id || validacion.cajeroDesconectado}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                      >
                        {processingId === validacion.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Conectado al sistema
              </div>
              <span>{formatearUltimaActualizacion()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notificación temporal */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl border-l-4 border-red-500 p-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="flex items-start">
            <DollarSign className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">
                Nueva transferencia por validar
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Tienes {validacionesPendientes.length} transferencia{validacionesPendientes.length > 1 ? 's' : ''} pendiente{validacionesPendientes.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TransferValidationNotifications;
