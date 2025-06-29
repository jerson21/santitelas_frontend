import React from 'react';
import { Loader, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { usePendingValidations } from '../hooks/usePendingValidations';

const statusConfig = {
  pending: { Icon: Loader, color: 'text-blue-500', text: 'En espera...', spin: true },
  approved: { Icon: CheckCircle, color: 'text-green-500', text: 'Aprobada' },
  rejected: { Icon: XCircle, color: 'text-red-500', text: 'Rechazada' },
  timeout: { Icon: Clock, color: 'text-yellow-500', text: 'Expirada' },
};

const PendingValidationsPanel = ({ onSelectVale }) => {
  const { pendingVales, removeValidation } = usePendingValidations();

  if (pendingVales.length === 0) {
    return null; // No mostrar nada si no hay vales pendientes
  }

  const formatCurrency = (amount) => Number(amount || 0).toLocaleString('es-CL');

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-40">
      <div className="bg-gray-800 text-white p-3 rounded-t-lg">
        <h4 className="font-bold text-sm flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Validaciones de Transferencia
        </h4>
      </div>
      <div className="p-2 max-h-80 overflow-y-auto">
        {pendingVales.length > 0 ? (
          <ul className="space-y-2">
            {pendingVales.map((vale) => {
              const { Icon, color, text, spin } = statusConfig[vale.status] || {};
              return (
                <li
                  key={vale.requestId}
                  className="bg-gray-50 p-3 rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer"
                  onClick={() => onSelectVale(vale.numero_vale)}
                  title={`Cliente: ${vale.cliente_nombre}\nObservaciones: ${vale.message || 'N/A'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-800 text-sm">{vale.numero_vale}</span>
                    <span className="font-bold text-green-600 text-sm">${formatCurrency(vale.monto)}</span>
                  </div>
                  <div className={`flex items-center text-xs ${color}`}>
                    <Icon className={`w-4 h-4 mr-2 ${spin ? 'animate-spin' : ''}`} />
                    <span className="font-medium">{text}</span>
                  </div>
                   {/* Botón para descartar notificaciones finales */}
                   {(vale.status === 'approved' || vale.status === 'rejected' || vale.status === 'timeout') && (
                     <button
                        onClick={(e) => {
                            e.stopPropagation(); // Evitar que el click se propague al li
                            removeValidation(vale.requestId);
                        }}
                        className="text-xs text-gray-500 hover:text-red-600 mt-2 w-full text-right"
                      >
                        Descartar
                      </button>
                   )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-sm text-gray-500 py-4">No hay validaciones pendientes.</p>
        )}
      </div>
    </div>
  );
};

export default PendingValidationsPanel;