// /src/components/cajero/components/EstadisticasModal.jsx
import React from 'react';
import {
  X,
  BarChart3,
  Receipt,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Target
} from 'lucide-react';

const EstadisticasModal = ({ isOpen, onClose, estadisticas, turnoInfo }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CL');
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null }) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center text-sm ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4 mr-1" />
              ) : (
                <Target className="w-4 h-4 mr-1" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            Estadísticas del Turno
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información del Turno Actual */}
        {turnoInfo && (
          <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              Turno Actual
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Apertura:</span>
                <div className="font-medium">{formatDateTime(turnoInfo.fecha_apertura)}</div>
              </div>
              <div>
                <span className="text-gray-600">Monto inicial:</span>
                <div className="font-medium">${formatCurrency(turnoInfo.monto_inicial)}</div>
              </div>
              <div>
                <span className="text-gray-600">Tiempo abierto:</span>
                <div className="font-medium">
                  {Math.floor((turnoInfo.tiempo_abierto_minutos || 0) / 60)}h {(turnoInfo.tiempo_abierto_minutos || 0) % 60}m
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas del Día */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Estadísticas del Día - {formatDate(estadisticas.dia_actual.fecha)}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Vales Procesados"
              value={estadisticas.dia_actual.total_vales}
              icon={Receipt}
              color="blue"
            />
            
            <StatCard
              title="Total Recaudado"
              value={`$${formatCurrency(estadisticas.dia_actual.monto_total)}`}
              icon={DollarSign}
              color="green"
            />
            
            <StatCard
              title="Vales Pendientes"
              value={estadisticas.dia_actual.pendientes}
              subtitle="Del día actual"
              icon={Clock}
              color="yellow"
            />
            
            <StatCard
              title="En Procesamiento"
              value={estadisticas.dia_actual.procesando || 0}
              subtitle="Siendo procesados"
              icon={TrendingUp}
              color="purple"
            />
          </div>
        </div>

        {/* Estadísticas Históricas */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
            Pendientes Históricos
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Pendientes"
              value={estadisticas.pendientes_historicos.total}
              subtitle="De días anteriores"
              icon={AlertCircle}
              color="red"
            />
            
            <StatCard
              title="Monto Pendiente"
              value={`$${formatCurrency(estadisticas.pendientes_historicos.monto_total)}`}
              subtitle="Valor total histórico"
              icon={DollarSign}
              color="orange"
            />
            
            <StatCard
              title="Días con Pendientes"
              value={estadisticas.pendientes_historicos.dias_con_pendientes || 0}
              subtitle="Días diferentes"
              icon={Calendar}
              color="gray"
            />
          </div>
        </div>

        {/* Resumen de Rendimiento */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            Resumen de Rendimiento
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Indicadores de eficiencia */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Indicadores del Día</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Vales procesados:</span>
                  <span className="font-semibold">{estadisticas.dia_actual.total_vales}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Vales pendientes:</span>
                  <span className={`font-semibold ${
                    estadisticas.dia_actual.pendientes > 0 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {estadisticas.dia_actual.pendientes}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Eficiencia:</span>
                  <span className={`font-semibold ${
                    estadisticas.dia_actual.pendientes === 0 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {estadisticas.dia_actual.pendientes === 0 ? (
                      <span className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        100%
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {Math.round(((estadisticas.dia_actual.total_vales - estadisticas.dia_actual.pendientes) / Math.max(estadisticas.dia_actual.total_vales, 1)) * 100)}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Información General</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Promedio por vale:</span>
                  <span className="font-semibold">
                    ${formatCurrency(
                      estadisticas.dia_actual.total_vales > 0 
                        ? estadisticas.dia_actual.monto_total / estadisticas.dia_actual.total_vales 
                        : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total histórico pendiente:</span>
                  <span className="font-semibold text-orange-600">
                    ${formatCurrency(estadisticas.pendientes_historicos.monto_total)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Estado general:</span>
                  <span className={`font-semibold ${
                    estadisticas.dia_actual.pendientes === 0 && estadisticas.pendientes_historicos.total === 0
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {estadisticas.dia_actual.pendientes === 0 && estadisticas.pendientes_historicos.total === 0
                      ? 'Excelente'
                      : 'Hay pendientes'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de cierre */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasModal;