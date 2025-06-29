// /src/components/cajero/components/ValeAntiguoModal.jsx
import React from 'react';
import {
  AlertTriangle,
  CheckSquare,
  X,
  Clock,
  Calendar,
  Hash,
  Loader,
  Info
} from 'lucide-react';

const ValeAntiguoModal = ({ isOpen, onClose, onConfirm, valeAntiguo, loading }) => {
  if (!isOpen || !valeAntiguo) return null;

  const formatDate = (daysAgo) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - daysAgo);
    return fecha.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getColorByDays = (days) => {
    if (days <= 7) return 'yellow'; // Hasta 1 semana
    if (days <= 30) return 'orange'; // Hasta 1 mes
    return 'red'; // Más de 1 mes
  };

  const getMessageByDays = (days) => {
    if (days <= 3) return 'Vale reciente, seguramente válido';
    if (days <= 7) return 'Vale de la semana pasada, verificar validez';
    if (days <= 30) return 'Vale del mes pasado, confirmar con vendedor';
    return 'Vale muy antiguo, revisar cuidadosamente';
  };

  const colorScheme = getColorByDays(valeAntiguo.dias_atras);
  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      button: 'bg-orange-600 hover:bg-orange-700'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700'
    }
  };

  const colors = colorClasses[colorScheme];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className={`w-8 h-8 mr-3 text-${colorScheme}-600`} />
          <h3 className="text-xl font-bold text-gray-800">Vale Antiguo Detectado</h3>
        </div>

        {/* Información principal del vale antiguo */}
        <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 mb-4`}>
          <div className="flex items-center mb-3">
            <Clock className={`w-6 h-6 mr-2 text-${colorScheme}-600`} />
            <p className={`font-medium ${colors.text}`}>
              Vale de hace {valeAntiguo.dias_atras} día{valeAntiguo.dias_atras !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Calendar className={`w-4 h-4 mr-2 text-${colorScheme}-600`} />
              <span className={colors.text}>
                <strong>Fecha estimada:</strong> {formatDate(valeAntiguo.dias_atras)}
              </span>
            </div>
            
            <div className="flex items-center">
              <Hash className={`w-4 h-4 mr-2 text-${colorScheme}-600`} />
              <span className={colors.text}>
                <strong>Vale:</strong> {valeAntiguo.numero_pedido || valeAntiguo.numero_original}
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de recomendación */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 text-sm font-medium mb-1">
                Recomendación:
              </p>
              <p className="text-blue-700 text-sm">
                {getMessageByDays(valeAntiguo.dias_atras)}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de verificaciones */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Antes de continuar, verifica:</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>El vale aún es válido y no ha sido procesado</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>El cliente confirma que no ha sido cobrado anteriormente</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Los productos solicitados aún están disponibles</span>
            </div>
            {valeAntiguo.dias_atras > 7 && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-red-700 font-medium">
                  Consultar con supervisor por antigüedad del vale
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${colors.button} text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-5 h-5" />
                <span>Sí, Continuar</span>
              </>
            )}
          </button>
        </div>

        {/* Nota adicional para vales muy antiguos */}
        {valeAntiguo.dias_atras > 30 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-xs text-center">
              ⚠️ Este vale tiene más de 30 días. Se recomienda autorización de supervisor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValeAntiguoModal;