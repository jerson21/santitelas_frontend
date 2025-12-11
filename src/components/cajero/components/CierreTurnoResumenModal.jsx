// /src/components/cajero/components/CierreTurnoResumenModal.jsx
import React from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowDownCircle,
  Printer,
  FileText
} from 'lucide-react';

const CierreTurnoResumenModal = ({ isOpen, onClose, data, onPrint }) => {
  if (!isOpen || !data) return null;

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularDuracion = () => {
    if (!data.fecha_apertura || !data.fecha_cierre) return '-';
    const inicio = new Date(data.fecha_apertura);
    const fin = new Date(data.fecha_cierre);
    const diffMs = fin - inicio;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  const getDiferenciaColor = () => {
    if (data.diferencia === 0) return 'text-green-600 bg-green-50 border-green-200';
    if (data.diferencia > 0) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getDiferenciaIcon = () => {
    if (data.diferencia === 0) return <CheckCircle className="w-6 h-6" />;
    return <AlertTriangle className="w-6 h-6" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Resumen de Cierre de Turno
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Estado de la diferencia */}
          <div className={`p-4 rounded-lg border-2 ${getDiferenciaColor()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getDiferenciaIcon()}
                <div>
                  <p className="font-bold text-lg">
                    {data.estado_diferencia === 'perfecto' ? 'Arqueo Perfecto' :
                     data.estado_diferencia === 'sobrante' ? 'Sobrante en Caja' : 'Faltante en Caja'}
                  </p>
                  <p className="text-sm opacity-80">
                    {data.estado_diferencia === 'perfecto' ? 'Sin diferencias' :
                     `Diferencia de $${formatCurrency(Math.abs(data.diferencia))}`}
                  </p>
                </div>
              </div>
              <span className="text-3xl font-bold">
                {data.diferencia === 0 ? '$0' :
                 data.diferencia > 0 ? `+$${formatCurrency(data.diferencia)}` :
                 `-$${formatCurrency(Math.abs(data.diferencia))}`}
              </span>
            </div>
          </div>

          {/* Info del turno */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Informacion del Turno
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Cajero:</span>
                <span className="ml-2 font-medium">{data.cajero}</span>
              </div>
              <div>
                <span className="text-gray-500">Caja:</span>
                <span className="ml-2 font-medium">{data.caja}</span>
              </div>
              <div>
                <span className="text-gray-500">Apertura:</span>
                <span className="ml-2 font-medium">{formatDate(data.fecha_apertura)}</span>
              </div>
              <div>
                <span className="text-gray-500">Cierre:</span>
                <span className="ml-2 font-medium">{formatDate(data.fecha_cierre)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Duracion:</span>
                <span className="ml-2 font-medium">{calcularDuracion()}</span>
              </div>
            </div>
          </div>

          {/* Resumen de caja */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Movimiento de Caja (Efectivo)
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monto inicial:</span>
                <span className="font-medium">${formatCurrency(data.monto_inicial)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-700">
                <span>+ Ventas en efectivo:</span>
                <span className="font-medium">+${formatCurrency(data.ventas_efectivo)}</span>
              </div>
              <div className="flex justify-between text-sm text-orange-700">
                <span>- Retiros ({data.cantidad_retiros}):</span>
                <span className="font-medium">-${formatCurrency(data.total_retiros)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between font-bold text-blue-900">
                  <span>= Dinero teorico:</span>
                  <span>${formatCurrency(data.dinero_teorico)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-900 mt-1">
                  <span>= Dinero real (contado):</span>
                  <span>${formatCurrency(data.dinero_real)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ventas por metodo de pago */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Ventas por Metodo de Pago ({data.cantidad_ventas} ventas)
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center">
                  <Banknote className="w-4 h-4 mr-2 text-green-600" />
                  Efectivo:
                </span>
                <span className="font-medium">${formatCurrency(data.ventas_efectivo)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                  Transferencia:
                </span>
                <span className="font-medium">${formatCurrency(data.ventas_transferencia)}</span>
              </div>
              {data.ventas_tarjeta > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                    Tarjeta:
                  </span>
                  <span className="font-medium">${formatCurrency(data.ventas_tarjeta)}</span>
                </div>
              )}
              <div className="border-t border-green-200 pt-2 mt-2">
                <div className="flex justify-between font-bold text-green-900">
                  <span>Total Ventas:</span>
                  <span>${formatCurrency(data.total_ventas)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Retiros realizados */}
          {data.retiros && data.retiros.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                <ArrowDownCircle className="w-5 h-5 mr-2" />
                Retiros Realizados
              </h4>
              <div className="space-y-2">
                {data.retiros.map((retiro, index) => (
                  <div key={index} className="flex justify-between items-center text-sm bg-white rounded p-2">
                    <div>
                      <span className="font-medium">${formatCurrency(retiro.monto)}</span>
                      <span className="text-gray-500 ml-2 text-xs">
                        {retiro.motivo || 'Sin motivo'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(retiro.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex space-x-4">
          <button
            onClick={onPrint}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CierreTurnoResumenModal;
