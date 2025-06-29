// ModernStockManager.tsx - Componente mejorado para gestión de stock
import React, { useState, useEffect } from 'react';
import { 
  Warehouse, AlertTriangle, Check, Package, Settings, 
  ArrowUpDown, Eye, EyeOff, Info, MapPin
} from 'lucide-react';

// 👈 ANOTACIÓN: Se importa la instancia del servicio de API centralizado.
import ApiService from '../../services/api';

// ✅ INTERFACES TIPADAS
interface DisponibilidadData {
  variante_id: number;
  producto: {
    nombre: string;
    codigo: string;
    unidad_medida: string;
  };
  variante: {
    sku: string;
    descripcion: string;
  };
  disponibilidad: {
    total_sistema: number;
    total_disponible: number;
    total_reservado: number;
    puede_vender: boolean;
    cantidad_maxima_venta: number;
  };
  por_bodega: {
    bodega_id: number;
    nombre: string;
    es_punto_venta: boolean;
    cantidad_disponible: number;
    cantidad_reservada: number;
    estado_stock: 'sin_stock' | 'bajo_minimo' | 'normal' | 'sobre_maximo';
    puede_vender_desde_aqui: boolean;
  }[];
  configuracion: {
    permite_venta_sin_stock: boolean;
    bodega_sugerida?: number;
    motivo_sugerencia?: string;
  };
  alertas?: string[];
}

interface ModernStockManagerProps {
  varianteId: number;
  modo?: 'admin' | 'venta' | 'consulta';
  onStockUpdate?: (varianteId: number, bodegaId: number, nuevoStock: number) => void;
  showConfiguration?: boolean;
}

export const ModernStockManager: React.FC<ModernStockManagerProps> = ({
  varianteId,
  modo = 'consulta',
  onStockUpdate,
  showConfiguration = false
}) => {
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vistaDetallada, setVistaDetallada] = useState(false);
  const [editandoBodega, setEditandoBodega] = useState<number | null>(null);
  const [configuracion, setConfiguracion] = useState({
    permite_venta_sin_stock: false,
    mostrar_todas_bodegas: false,
    auto_asignar_bodega: true
  });

  useEffect(() => {
    cargarDisponibilidad();
  }, [varianteId]);

  const cargarDisponibilidad = async () => {
    setLoading(true);
    try {
      // 👈 ANOTACIÓN: Se reemplaza la llamada 'fetch' por el método del servicio.
      // El método 'getDisponibilidadVariante' parece ser el más adecuado.
      // NOTA: El parámetro original `para_venta` no existe en el método del service.
      // El backend debería manejar esta lógica o el método del service debería ser ajustado.
      const response = await ApiService.getDisponibilidadVariante(varianteId);
      
      if (response.success) {
        // Asumiendo que la estructura de `response.data` coincide con `DisponibilidadData`
        setDisponibilidad(response.data);
        setConfiguracion(prev => ({
          ...prev,
          permite_venta_sin_stock: response.data.configuracion.permite_venta_sin_stock
        }));
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarStockBodega = async (bodegaId: number, nuevoStock: number, motivo: string) => {
    try {
      // 👈 ANOTACIÓN: Se reemplaza la llamada 'fetch' por el método del servicio 'updateVarianteStock'.
      const response = await ApiService.updateVarianteStock(
        varianteId,
        nuevoStock,
        motivo,
        bodegaId
      );
      
      if (response.success) {
        await cargarDisponibilidad(); // Recargar datos
        onStockUpdate?.(varianteId, bodegaId, nuevoStock);
      } else {
        alert('Error actualizando stock: ' + response.message);
      }
    } catch (error) {
        alert(`Error de conexión al actualizar stock: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setEditandoBodega(null);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'sin_stock': return 'text-red-600 bg-red-50';
      case 'bajo_minimo': return 'text-yellow-600 bg-yellow-50';
      case 'normal': return 'text-green-600 bg-green-50';
      case 'sobre_maximo': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'sin_stock': return 'Sin Stock';
      case 'bajo_minimo': return 'Bajo Mínimo';
      case 'normal': return 'Normal';
      case 'sobre_maximo': return 'Sobre Máximo';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Cargando disponibilidad...</span>
      </div>
    );
  }

  if (!disponibilidad) {
    return (
      <div className="text-center p-4 text-red-600">
        Error cargando información de stock
      </div>
    );
  }

  const bodegasVisibles = configuracion.mostrar_todas_bodegas 
    ? disponibilidad.por_bodega 
    : disponibilidad.por_bodega.filter(b => b.es_punto_venta);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header con información del producto */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            {disponibilidad.producto.nombre}
          </h3>
          <p className="text-sm text-gray-600">
            {disponibilidad.variante.descripcion} • SKU: {disponibilidad.variante.sku}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Indicador de stock total */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            disponibilidad.disponibilidad.total_disponible > 0
              ? 'bg-green-100 text-green-800'
              : disponibilidad.configuracion.permite_venta_sin_stock
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {disponibilidad.disponibilidad.total_disponible} {disponibilidad.producto.unidad_medida}
            {disponibilidad.disponibilidad.total_reservado > 0 && (
              <span className="ml-1 text-xs">
                (+{disponibilidad.disponibilidad.total_reservado} reservado)
              </span>
            )}
          </div>

          {/* Toggle vista detallada */}
          <button
            onClick={() => setVistaDetallada(!vistaDetallada)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={vistaDetallada ? 'Vista simple' : 'Vista detallada'}
          >
            {vistaDetallada ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Configuración (solo en modo admin) */}
          {showConfiguration && (
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Configuración"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {disponibilidad.alertas && disponibilidad.alertas.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              {disponibilidad.alertas.map((alerta, index) => (
                <div key={index} className="text-yellow-800">{alerta}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resumen rápido (vista simple) */}
      {!vistaDetallada && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {disponibilidad.disponibilidad.total_disponible}
            </div>
            <div className="text-xs text-gray-500">Disponible</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {bodegasVisibles.filter(b => b.cantidad_disponible > 0).length}
            </div>
            <div className="text-xs text-gray-500">Con Stock</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              disponibilidad.disponibilidad.puede_vender ? 'text-green-600' : 'text-red-600'
            }`}>
              {disponibilidad.disponibilidad.puede_vender ? '✓' : '✗'}
            </div>
            <div className="text-xs text-gray-500">Puede Vender</div>
          </div>
        </div>
      )}

      {/* Vista detallada por bodega */}
      {vistaDetallada && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Warehouse className="w-4 h-4 mr-2" />
              Stock por Bodega
            </h4>
            {modo === 'admin' && (
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={configuracion.mostrar_todas_bodegas}
                  onChange={(e) => setConfiguracion(prev => ({
                    ...prev,
                    mostrar_todas_bodegas: e.target.checked
                  }))}
                  className="mr-2"
                />
                Mostrar todas las bodegas
              </label>
            )}
          </div>

          {bodegasVisibles.map((bodega) => (
            <div key={bodega.bodega_id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900">{bodega.nombre}</h5>
                      {bodega.es_punto_venta && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Punto de Venta
                        </span>
                      )}
                      {disponibilidad.configuracion.bodega_sugerida === bodega.bodega_id && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          Sugerida
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">
                        Disponible: 
                        <span className="font-medium ml-1">
                          {bodega.cantidad_disponible} {disponibilidad.producto.unidad_medida}
                        </span>
                      </span>
                      
                      {bodega.cantidad_reservada > 0 && (
                        <span className="text-sm text-orange-600">
                          Reservado: {bodega.cantidad_reservada}
                        </span>
                      )}
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(bodega.estado_stock)}`}>
                        {getEstadoTexto(bodega.estado_stock)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controles de edición (solo admin) */}
                {modo === 'admin' && (
                  <div className="flex items-center gap-2">
                    {editandoBodega === bodega.bodega_id ? (
                      <StockEditor
                        stockActual={bodega.cantidad_disponible}
                        unidad={disponibilidad.producto.unidad_medida}
                        onSave={(nuevoStock, motivo) => 
                          actualizarStockBodega(bodega.bodega_id, nuevoStock, motivo)
                        }
                        onCancel={() => setEditandoBodega(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setEditandoBodega(bodega.bodega_id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información de configuración */}
      {disponibilidad.configuracion.bodega_sugerida && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-medium">Bodega sugerida para venta:</span>
              <span className="ml-1">
                {bodegasVisibles.find(b => b.bodega_id === disponibilidad.configuracion.bodega_sugerida)?.nombre}
              </span>
              {disponibilidad.configuracion.motivo_sugerencia && (
                <div className="text-xs text-blue-600 mt-1">
                  {disponibilidad.configuracion.motivo_sugerencia}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para editar stock
const StockEditor: React.FC<{
  stockActual: number;
  unidad: string;
  onSave: (nuevoStock: number, motivo: string) => void;
  onCancel: () => void;
}> = ({ stockActual, unidad, onSave, onCancel }) => {
  const [nuevoStock, setNuevoStock] = useState(stockActual.toString());
  const [motivo, setMotivo] = useState('');

  const handleSave = () => {
    const stock = parseFloat(nuevoStock);
    if (isNaN(stock) || stock < 0) {
      alert('Ingrese una cantidad válida');
      return;
    }
    
    if (!motivo.trim()) {
      alert('Ingrese un motivo para el cambio');
      return;
    }
    
    onSave(stock, motivo);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={nuevoStock}
        onChange={(e) => setNuevoStock(e.target.value)}
        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
        min="0"
        step="0.1"
      />
      <span className="text-xs text-gray-500">{unidad}</span>
      
      <input
        type="text"
        placeholder="Motivo..."
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
      />
      
      <button
        onClick={handleSave}
        className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
        title="Guardar"
      >
        <Check size={16} />
      </button>
      
      <button
        onClick={onCancel}
        className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
        title="Cancelar"
      >
        ✕
      </button>
    </div>
  );
};

// ===================================================================
// COMPONENTE PARA SELECTOR DE BODEGA EN VENTAS
// ===================================================================

interface BodegaSelectorProps {
  varianteId: number;
  cantidadSolicitada: number;
  onBodegaSeleccionada: (bodegaId: number, disponible: number) => void;
  modo?: 'automatico' | 'manual';
}

export const BodegaSelector: React.FC<BodegaSelectorProps> = ({
  varianteId,
  cantidadSolicitada,
  onBodegaSeleccionada,
  modo = 'automatico'
}) => {
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadData | null>(null);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDisponibilidad();
  }, [varianteId]);

  useEffect(() => {
    if (disponibilidad && modo === 'automatico') {
      // Seleccionar automáticamente la bodega sugerida
      const bodegaSugerida = disponibilidad.configuracion.bodega_sugerida;
      if (bodegaSugerida) {
        const bodega = disponibilidad.por_bodega.find(b => b.bodega_id === bodegaSugerida);
        if (bodega) {
          setBodegaSeleccionada(bodegaSugerida);
          onBodegaSeleccionada(bodegaSugerida, bodega.cantidad_disponible);
        }
      }
    }
  }, [disponibilidad, modo]);

  const cargarDisponibilidad = async () => {
    setLoading(true);
    try {
      // 👈 ANOTACIÓN: Se reemplaza la llamada 'fetch' por el método del servicio.
      const response = await ApiService.getDisponibilidadVariante(varianteId);
      
      if (response.success) {
        setDisponibilidad(response.data);
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBodegaChange = (bodegaId: number) => {
    setBodegaSeleccionada(bodegaId);
    const bodega = disponibilidad?.por_bodega.find(b => b.bodega_id === bodegaId);
    if (bodega) {
      onBodegaSeleccionada(bodegaId, bodega.cantidad_disponible);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Verificando disponibilidad...</div>;
  }

  if (!disponibilidad) {
    return <div className="text-sm text-red-500">Error cargando disponibilidad</div>;
  }

  // Filtrar solo bodegas de punto de venta
  const bodegasDisponibles = disponibilidad.por_bodega.filter(b => b.es_punto_venta);

  if (modo === 'automatico' && disponibilidad.configuracion.bodega_sugerida) {
    const bodegaSugerida = bodegasDisponibles.find(
      b => b.bodega_id === disponibilidad.configuracion.bodega_sugerida
    );
    
    return (
      <div className="text-sm text-green-600 flex items-center">
        <Check className="w-4 h-4 mr-1" />
        <span>
          Se asignará desde: <strong>{bodegaSugerida?.nombre}</strong>
          {bodegaSugerida && cantidadSolicitada > bodegaSugerida.cantidad_disponible && (
            <span className="text-orange-600 ml-2">
              (Venta sin stock)
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Seleccionar bodega:
      </label>
      
      <select
        value={bodegaSeleccionada || ''}
        onChange={(e) => handleBodegaChange(Number(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Seleccionar bodega...</option>
        {bodegasDisponibles.map((bodega) => (
          <option key={bodega.bodega_id} value={bodega.bodega_id}>
            {bodega.nombre} - Disponible: {bodega.cantidad_disponible}
            {cantidadSolicitada > bodega.cantidad_disponible && ' (Insuficiente)'}
          </option>
        ))}
      </select>

      {bodegaSeleccionada && (
        <div className="text-xs text-gray-600">
          {(() => {
            const bodega = bodegasDisponibles.find(b => b.bodega_id === bodegaSeleccionada);
            if (!bodega) return null;
            
            if (cantidadSolicitada <= bodega.cantidad_disponible) {
              return (
                <span className="text-green-600">
                  ✓ Stock suficiente ({bodega.cantidad_disponible} disponible)
                </span>
              );
            } else {
              return (
                <span className="text-orange-600">
                  ⚠️ Stock insuficiente. Faltante: {cantidadSolicitada - bodega.cantidad_disponible}
                  {disponibilidad.configuracion.permite_venta_sin_stock && (
                    <span className="text-blue-600 ml-2">(Venta sin stock permitida)</span>
                  )}
                </span>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
};
