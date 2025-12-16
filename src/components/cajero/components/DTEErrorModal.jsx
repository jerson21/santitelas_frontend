// /src/components/cajero/components/DTEErrorModal.jsx
// Modal para manejar errores de emisión DTE con opciones de reintento
import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle, Clock, FileX } from 'lucide-react';

const DTEErrorModal = ({
  isOpen,
  onClose,
  error,
  intentos,
  maxIntentos = 3,
  onReintentar,
  onGuardarPendiente,
  tipoDocumento,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const porcentajeIntentos = (intentos / maxIntentos) * 100;
  const puedeGuardarPendiente = intentos >= 2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header con gradiente de advertencia */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-white">
              <AlertTriangle className="w-6 h-6 mr-3" />
              <h2 className="text-lg font-bold">
                Error al Emitir {tipoDocumento === 'boleta' ? 'Boleta' : 'Factura'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Icono central */}
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <FileX className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Mensaje de error */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm font-medium mb-1">Mensaje del sistema:</p>
            <p className="text-red-700 text-sm">{error || 'Error desconocido al conectar con el servicio de facturación'}</p>
          </div>

          {/* Barra de progreso de intentos */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Intentos realizados</span>
              <span className="font-medium">{intentos} de {maxIntentos}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  porcentajeIntentos >= 100 ? 'bg-red-500' :
                  porcentajeIntentos >= 66 ? 'bg-orange-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(porcentajeIntentos, 100)}%` }}
              />
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-blue-800 text-xs">
                {!puedeGuardarPendiente
                  ? 'Puede ser un problema temporal de conexión con Relbase. Reintenta la emisión.'
                  : 'Si el problema persiste, puedes guardar como pendiente y reintentar después desde Administración.'
                }
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={onReintentar}
              disabled={isLoading || intentos >= maxIntentos}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center transition-all ${
                isLoading || intentos >= maxIntentos
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reintentar Emisión
                </>
              )}
            </button>

            {puedeGuardarPendiente && (
              <button
                onClick={onGuardarPendiente}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center transition-all ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600 active:scale-[0.98]'
                }`}
              >
                <Clock className="w-5 h-5 mr-2" />
                Guardar como DTE Pendiente
              </button>
            )}
          </div>

          {/* Mensaje de ayuda */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {intentos >= maxIntentos
              ? 'Has alcanzado el máximo de reintentos. Guarda como pendiente para continuar.'
              : puedeGuardarPendiente
                ? 'El DTE pendiente se podrá emitir posteriormente desde el panel de Administración'
                : `Intenta ${maxIntentos - intentos} ${maxIntentos - intentos === 1 ? 'vez' : 'veces'} más antes de poder guardar como pendiente`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default DTEErrorModal;
