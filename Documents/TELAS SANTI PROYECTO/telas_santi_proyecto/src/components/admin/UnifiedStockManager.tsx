// UnifiedStockManager.tsx – versión TypeScript completa (sin PropTypes) - CORREGIDO
// -----------------------------------------------------------------------------
// Este componente unifica la visualización y administración de stock por bodega
// para una variante de producto. Incluye soporte de vista, edición, transferencia
// y paneles de detalle. Todas las protecciones contra undefined/null aplicadas.
// -----------------------------------------------------------------------------

import React, { useState, useEffect, useMemo } from 'react';
import {
  Warehouse,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  History,
  Settings,
  MapPin,
  Check,
  Eye,
  EyeOff,
  Info,
  X,
} from 'lucide-react';
import ApiService from '../../services/api';

// ──────────────────────────────────────────────────────────────────────────────
// Tipos auxiliares (ajusta según tus modelos reales)
// ──────────────────────────────────────────────────────────────────────────────

interface BodegaData {
  bodega_id: number;
  nombre?: string;
  nombre_bodega?: string;
  es_punto_venta: boolean;
  cantidad_disponible: number;
  cantidad_reservada: number;
  estado_stock?: 'sin_stock' | 'bajo_minimo' | 'normal' | 'sobre_maximo' | string;
}

interface DisponibilidadData {
  producto: {
    nombre: string;
    unidad_medida: string;
  };
  variante: {
    descripcion: string;
    sku: string;
  };
  configuracion: {
    permite_venta_sin_stock: boolean;
    bodega_sugerida?: number;
    motivo_sugerencia?: string;
  };
  disponibilidad: {
    total_sistema: string;
    total_disponible: string;
    total_reservado: string;
    puede_vender: boolean;
    cantidad_maxima_venta: string;
  };
  por_bodega: BodegaData[];
  alertas?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Props principales
// ──────────────────────────────────────────────────────────────────────────────

type Modo = 'view' | 'edit' | 'transfer' | 'admin' | 'venta';

interface UnifiedStockManagerProps {
  varianteId: number;
  modo?: Modo;
  onStockUpdate?: (varianteId: number, bodegaId: number, nuevoStock: number) => void;
  showConfiguration?: boolean;
  showTransferOptions?: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Utilidades visuales
// ──────────────────────────────────────────────────────────────────────────────
const getEstadoColor = (estado?: string) => {
  switch (estado) {
    case 'sin_stock':
      return 'text-red-600 bg-red-50';
    case 'bajo_minimo':
      return 'text-yellow-600 bg-yellow-50';
    case 'normal':
      return 'text-green-600 bg-green-50';
    case 'sobre_maximo':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getEstadoTexto = (estado?: string) => {
  switch (estado) {
    case 'sin_stock':
      return 'Sin Stock';
    case 'bajo_minimo':
      return 'Bajo Mínimo';
    case 'normal':
      return 'Normal';
    case 'sobre_maximo':
      return 'Sobre Máximo';
    default:
      return 'Desconocido';
  }
};

const getStockStatusIndicator = (cantidad: number) => {
  if (cantidad === 0) return { color: 'bg-red-500', label: 'Sin stock' } as const;
  if (cantidad < 10) return { color: 'bg-orange-500', label: 'Stock bajo' } as const;
  if (cantidad < 50) return { color: 'bg-yellow-500', label: 'Stock medio' } as const;
  return { color: 'bg-green-500', label: 'Stock óptimo' } as const;
};

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────────
export const UnifiedStockManager: React.FC<UnifiedStockManagerProps> = ({
  varianteId,
  modo = 'view',
  onStockUpdate,
  showConfiguration = false,
  showTransferOptions = false,
}) => {
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadData | null>(null);
  const [todasLasBodegas, setTodasLasBodegas] = useState<BodegaData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedBodega, setSelectedBodega] = useState<number | null>(null);
  const [vistaDetallada, setVistaDetallada] = useState<boolean>(false);
  const [editandoBodega, setEditandoBodega] = useState<number | null>(null);

  const [transferMode, setTransferMode] = useState<boolean>(false);
  const [transferData, setTransferData] = useState({
    bodegaOrigen: 0,
    bodegaDestino: 0,
    cantidad: 0,
    motivo: '',
  });

  const [configuracion, setConfiguracion] = useState({
    permite_venta_sin_stock: false,
    // CAMBIO: Se establece a `true` por defecto para mostrar siempre todas las bodegas.
    mostrar_todas_bodegas: true,
    auto_asignar_bodega: true,
  });

  // Carga inicial ----------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      ApiService.getDisponibilidadVariante(varianteId) as Promise<ApiResponse<DisponibilidadData>>,
      ApiService.getBodegas({ activa: true }) as Promise<ApiResponse<BodegaData[]>>,
    ])
      .then(([dispRes, bodRes]) => {
        if (!isMounted) return;
        if (dispRes.success) {
          setDisponibilidad(dispRes.data);
          setConfiguracion((prev) => ({
            ...prev,
            permite_venta_sin_stock: dispRes.data.configuracion.permite_venta_sin_stock,
          }));
        }
        if (bodRes.success && Array.isArray(bodRes.data)) {
          // NORMALIZACIÓN: La API devuelve `id_bodega`, pero el componente usa `bodega_id`.
          // Se transforma la data aquí para asegurar consistencia en todo el componente.
          const normalizedBodegas = (bodRes.data as any[]).map(bodega => ({
            ...bodega,
            bodega_id: bodega.id_bodega, // Mapeo de la clave ID
            nombre: bodega.nombre || bodega.nombre_bodega, // Asegura que el nombre exista
          }));
          setTodasLasBodegas(normalizedBodegas);
        }
      })
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [varianteId]);

  // Helpers ----------------------------------------------------------------------
  const listadoCompletoBodegas = useMemo(() => {
    const mapa = new Map<number, BodegaData>();

    // 1. Iniciar con todas las bodegas activas como base.
    // Esto asegura que todas tienen un nombre correcto y están en la lista.
    (todasLasBodegas || []).forEach((b) => {
      mapa.set(b.bodega_id, {
        ...b, // Copia todas las propiedades de la bodega (id, nombre, etc.)
        cantidad_disponible: 0, // Establece un valor por defecto
        cantidad_reservada: 0,
      });
    });

    // 2. Actualizar (o añadir) con el stock específico de la variante.
    if (disponibilidad?.por_bodega) {
      (disponibilidad.por_bodega || []).forEach((stockInfo) => {
        // Obtiene la bodega base si existe, o un objeto vacío si no.
        const bodegaBase = mapa.get(stockInfo.bodega_id) || {};
        // Combina la info base (que tiene el nombre) con la info de stock.
        // stockInfo (con la cantidad correcta) tiene prioridad.
        mapa.set(stockInfo.bodega_id, {
          ...bodegaBase,
          ...stockInfo,
        });
      });
    }

    return Array.from(mapa.values()).sort((a, b) =>
      (a.nombre || a.nombre_bodega || '').localeCompare(b.nombre || b.nombre_bodega || '')
    );
  }, [todasLasBodegas, disponibilidad]);

  const bodegasVisibles = useMemo(() => {
    if (!listadoCompletoBodegas || listadoCompletoBodegas.length === 0) return [];

    if (configuracion.mostrar_todas_bodegas) {
      return listadoCompletoBodegas;
    }
    
    // Filtrar la lista completa si solo se deben mostrar los puntos de venta.
    return listadoCompletoBodegas.filter((b) => b.es_punto_venta);
  }, [listadoCompletoBodegas, configuracion.mostrar_todas_bodegas]);

  // Acciones ---------------------------------------------------------------------
  const actualizarStockBodega = async (
    bodegaId: number,
    nuevoStock: number,
    motivo: string
  ) => {
    const res = (await ApiService.updateVarianteStock(
      varianteId,
      nuevoStock,
      motivo,
      bodegaId
    )) as ApiResponse<unknown>;
    if (res.success) {
      onStockUpdate && onStockUpdate(varianteId, bodegaId, nuevoStock);
      // refrescar datos locales
      const dispRes = (await ApiService.getDisponibilidadVariante(
        varianteId
      )) as ApiResponse<DisponibilidadData>;
      if (dispRes.success) setDisponibilidad(dispRes.data);
      setEditandoBodega(null);
    } else {
      alert(res.message || 'Error al actualizar stock');
    }
  };

  const realizarTransferencia = async () => {
    const { bodegaOrigen, bodegaDestino, cantidad, motivo } = transferData;
    if (bodegaOrigen === bodegaDestino) return alert('Las bodegas deben ser distintas');
    if (cantidad <= 0) return alert('Cantidad inválida');
    if (!motivo.trim()) return alert('Ingrese motivo');

    const origen = listadoCompletoBodegas.find((b) => b.bodega_id === bodegaOrigen);
    const destino = listadoCompletoBodegas.find((b) => b.bodega_id === bodegaDestino);
    if (!origen || !destino) return;

    await actualizarStockBodega(
      bodegaOrigen,
      origen.cantidad_disponible - cantidad,
      `Transferencia a ${destino.nombre}: ${motivo}`
    );
    await actualizarStockBodega(
      bodegaDestino,
      destino.cantidad_disponible + cantidad,
      `Transferencia desde ${origen.nombre}: ${motivo}`
    );

    setTransferMode(false);
    setTransferData({ bodegaOrigen: 0, bodegaDestino: 0, cantidad: 0, motivo: '' });
  };

  // Render -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Cargando disponibilidad...</span>
      </div>
    );
  }

  if (!disponibilidad) {
    return (
      <div className="text-center p-8 text-red-600">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        Error cargando información de stock
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header principal */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {disponibilidad.producto.nombre}
            </h3>
            <p className="text-sm text-gray-600">
              {disponibilidad.variante.descripcion} • SKU: {disponibilidad.variante.sku}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {disponibilidad.disponibilidad.total_disponible}
              </div>
              <div className="text-xs text-gray-500 uppercase">
                {disponibilidad.producto.unidad_medida} disponibles
              </div>
              {Number(disponibilidad.disponibilidad.total_reservado) > 0 && (
                <div className="text-xs text-orange-600">
                  +{disponibilidad.disponibilidad.total_reservado} reservado
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setVistaDetallada(!vistaDetallada)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title={vistaDetallada ? 'Vista simple' : 'Vista detallada'}
              >
                {vistaDetallada ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {showConfiguration && modo === 'admin' && (
                <button type="button" className="p-2 hover:bg-gray-100 rounded-lg" title="Configuración">
                  <Settings size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estado general */}
        <div
          className={`px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
            disponibilidad.disponibilidad.puede_vender
              ? 'bg-green-100 text-green-800'
              : configuracion.permite_venta_sin_stock
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {disponibilidad.disponibilidad.puede_vender ? (
            <>
              <Check className="w-4 h-4" /> Disponible para venta
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              {configuracion.permite_venta_sin_stock ? 'Venta sin stock permitida' : 'Sin stock para venta'}
            </>
          )}
        </div>
      </div>

      {/* Alertas - CORREGIDO */}
      {(disponibilidad.alertas || []).length > 0 && (

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <div className="text-sm space-y-1">
              {(disponibilidad.alertas || []).map((a, i) => (
                <div key={i} className="text-yellow-800">{a}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Distribución */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" /> Distribución de Stock
          </h3>
          {modo === 'admin' && (
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={configuracion.mostrar_todas_bodegas}
                onChange={(e) =>
                  setConfiguracion((p) => ({ ...p, mostrar_todas_bodegas: e.target.checked }))
                }
                className="mr-2"
              />
              Mostrar todas las bodegas
            </label>
          )}
        </div>
        <div className="p-4 space-y-3">
          {(bodegasVisibles || []).map((b) => (
            <BodegaStockRow
              key={b.bodega_id}
              bodega={b}
              modo={modo}
              vistaDetallada={vistaDetallada}
              isSelected={selectedBodega === b.bodega_id}
              isEditing={editandoBodega === b.bodega_id}
              disponibilidad={disponibilidad}
              onSelect={() => setSelectedBodega(selectedBodega === b.bodega_id ? null : b.bodega_id)}
              onEdit={() => setEditandoBodega(b.bodega_id)}
              onCancelEdit={() => setEditandoBodega(null)}
              onSaveEdit={(ns, m) => actualizarStockBodega(b.bodega_id, ns, m)}
              onInitTransfer={() => {
                setTransferData((prev) => ({ ...prev, bodegaOrigen: b.bodega_id }));
                setTransferMode(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Acciones generales */}
      {(modo === 'admin' || modo === 'edit') && (
        <div className="flex gap-2 flex-wrap">
          {showTransferOptions && (
            <button
              type="button"
              onClick={() => setTransferMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowRightLeft className="w-4 h-4" /> Nueva Transferencia
            </button>
          )}
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            <History className="w-4 h-4" /> Ver Histórico
          </button>
        </div>
      )}

      {/* Modal transferencia */}
      {transferMode && (
        <TransferModal
          listadoBodegas={listadoCompletoBodegas}
          transferData={transferData}
          onUpdate={setTransferData}
          onConfirm={realizarTransferencia}
          onCancel={() => {
            setTransferMode(false);
            setTransferData({ bodegaOrigen: 0, bodegaDestino: 0, cantidad: 0, motivo: '' });
          }}
          unidad={disponibilidad.producto.unidad_medida}
        />
      )}

      {/* Sugerencia de bodega */}
      {disponibilidad.configuracion.bodega_sugerida && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="w-4 h-4 text-blue-600 mr-2" />
            <div className="text-sm text-blue-800">
              <span className="font-medium">Bodega sugerida para venta:</span>{' '}
              {
                listadoCompletoBodegas.find(
                  (b) => b.bodega_id === disponibilidad.configuracion.bodega_sugerida
                )?.nombre
              }
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

// ──────────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────────────
interface BodegaStockRowProps {
  bodega: BodegaData;
  modo: Modo;
  vistaDetallada: boolean;
  isSelected: boolean;
  isEditing: boolean;
  disponibilidad: DisponibilidadData;
  onSelect: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (nuevoStock: number, motivo: string) => void;
  onInitTransfer: () => void;
}

const BodegaStockRow: React.FC<BodegaStockRowProps> = ({
  bodega,
  modo,
  vistaDetallada,
  isSelected,
  isEditing,
  disponibilidad,
  onSelect,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onInitTransfer,
}) => {
  const status = getStockStatusIndicator(bodega.cantidad_disponible);
  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Warehouse className="w-5 h-5 text-gray-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{bodega.nombre || bodega.nombre_bodega}</h4>
              {bodega.es_punto_venta && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                  Punto Venta
                </span>
              )}
              {disponibilidad.configuracion.bodega_sugerida === bodega.bodega_id && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center">
                  <MapPin className="w-3 h-3 mr-1" /> Sugerida
                </span>
              )}
            </div>
            {vistaDetallada && (
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>
                  Disponible: <strong>{bodega.cantidad_disponible}</strong>
                </span>
                {bodega.cantidad_reservada > 0 && (
                  <span className="text-orange-600">Reservado: {bodega.cantidad_reservada}</span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded-full ${getEstadoColor(bodega.estado_stock)}`}>
                  {getEstadoTexto(bodega.estado_stock)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${status.color}`} />
            {!vistaDetallada && (
              <span className="text-sm font-medium text-gray-700">
                {bodega.cantidad_disponible}
              </span>
            )}
          </div>
          {modo === 'admin' && !isEditing && (
            <button
              type="button"
              onClick={onInitTransfer}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
              title="Transferir stock"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
          {(modo === 'admin' || modo === 'edit') && !isEditing && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Editar
            </button>
          )}
          {isEditing && (
            <StockEditor
              stockActual={bodega.cantidad_disponible}
              unidad={disponibilidad.producto.unidad_medida}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
            />
          )}
        </div>
      </div>
      {isSelected && vistaDetallada && <ExpandedBodegaPanel bodega={bodega} modo={modo} />}
    </div>
  );
};

// StockEditor ---------------------------------------------------------------
interface StockEditorProps {
  stockActual: number;
  unidad: string;
  onSave: (nuevoStock: number, motivo: string) => void;
  onCancel: () => void;
}

const StockEditor: React.FC<StockEditorProps> = ({ stockActual, unidad, onSave, onCancel }) => {
  const [nuevoStock, setNuevoStock] = useState<string>(stockActual.toString());
  const [motivo, setMotivo] = useState<string>('');

  const handleSave = () => {
    const ns = parseFloat(nuevoStock);
    if (Number.isNaN(ns) || ns < 0) return alert('Cantidad inválida');
    if (!motivo.trim()) return alert('Ingrese motivo');
    onSave(ns, motivo);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={nuevoStock}
        onChange={(e) => setNuevoStock(e.target.value)}
        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
        min={0}
        step={0.1}
      />
      <span className="text-xs text-gray-500">{unidad}</span>
      <input
        type="text"
        placeholder="Motivo…"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
      />
      <button type="button" onClick={handleSave} className="p-1 bg-green-600 text-white rounded hover:bg-green-700">
        <Check size={16} />
      </button>
      <button type="button" onClick={onCancel} className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500">
        <X size={16} />
      </button>
    </div>
  );
};

// ExpandedBodegaPanel -------------------------------------------------------
interface ExpandedBodegaPanelProps {
  bodega: BodegaData;
  modo: Modo;
}

const ExpandedBodegaPanel: React.FC<ExpandedBodegaPanelProps> = ({ bodega, modo }) => (
  <div className="mt-3 pt-3 border-t space-y-3">
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <History className="w-4 h-4" />
      <button type="button" className="hover:text-gray-800 hover:underline">
        Ver histórico de movimientos
      </button>
    </div>
    {modo === 'admin' && (
      <div className="text-xs text-gray-500">ID Bodega: {bodega.bodega_id}</div>
    )}
  </div>
);

// TransferModal -------------------------------------------------------------
interface TransferModalProps {
  listadoBodegas: BodegaData[];
  transferData: {
    bodegaOrigen: number;
    bodegaDestino: number;
    cantidad: number;
    motivo: string;
  };
  onUpdate: (d: TransferModalProps['transferData']) => void;
  onConfirm: () => void;
  onCancel: () => void;
  unidad: string;
}

const TransferModal: React.FC<TransferModalProps> = ({
  listadoBodegas,
  transferData,
  onUpdate,
  onConfirm,
  onCancel,
  unidad,
}) => {
  const bodegaOrigen = (listadoBodegas || []).find((b) => b.bodega_id === transferData.bodegaOrigen);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" /> Transferir Stock
        </h3>
        <div className="space-y-4">
          {/* Origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bodega origen</label>
            {bodegaOrigen ? (
              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-700">
                {bodegaOrigen.nombre || bodegaOrigen.nombre_bodega}
                <span className="text-gray-500 ml-2">({bodegaOrigen.cantidad_disponible} disp.)</span>
              </div>
            ) : (
              <select
                value={transferData.bodegaOrigen}
                onChange={(e) => onUpdate({ ...transferData, bodegaOrigen: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={0}>Seleccionar bodega de origen…</option>
                {(listadoBodegas || []).map((b) => (
                  <option key={b.bodega_id} value={b.bodega_id}>
                    {(b.nombre || b.nombre_bodega) + ` (${b.cantidad_disponible} disp.)`}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bodega destino</label>
            <select
              value={transferData.bodegaDestino}
              onChange={(e) => onUpdate({ ...transferData, bodegaDestino: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={0}>Seleccionar bodega…</option>
              {(listadoBodegas || [])
                .filter((b) => b.bodega_id !== transferData.bodegaOrigen)
                .map((b) => (
                  <option key={b.bodega_id} value={b.bodega_id}>
                    {b.nombre || b.nombre_bodega}
                  </option>
                ))}
            </select>
          </div>
          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={transferData.cantidad}
                onChange={(e) => onUpdate({ ...transferData, cantidad: Number(e.target.value) })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                min={0}
                max={bodegaOrigen?.cantidad_disponible || 0}
              />
              <span className="text-sm text-gray-500">{unidad}</span>
            </div>
            {bodegaOrigen && (
              <p className="text-xs text-gray-500 mt-1">
                Máx. disponible: {bodegaOrigen.cantidad_disponible}
              </p>
            )}
          </div>
          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea
              value={transferData.motivo}
              onChange={(e) => onUpdate({ ...transferData, motivo: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ingrese motivo…"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={
              !transferData.bodegaOrigen ||
              !transferData.bodegaDestino ||
              transferData.cantidad <= 0 ||
              !transferData.motivo.trim()
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Confirmar Transferencia
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Selector de bodega para venta (sin "prop-types")
// ──────────────────────────────────────────────────────────────────────────────
interface BodegaSelectorProps {
  varianteId: number;
  cantidadSolicitada: number;
  onBodegaSeleccionada: (idBodega: number | null, disponible: number) => void;
  modo?: 'automatico' | 'manual';
}

export const BodegaSelector: React.FC<BodegaSelectorProps> = ({
  varianteId,
  cantidadSolicitada,
  onBodegaSeleccionada,
  modo = 'automatico',
}) => {
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadData | null>(null);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    (ApiService.getDisponibilidadVariante(varianteId) as Promise<ApiResponse<DisponibilidadData>>)
      .then((r) => {
        if (r.success) setDisponibilidad(r.data);
      })
      .finally(() => setLoading(false));
  }, [varianteId]);

  useEffect(() => {
    if (disponibilidad && modo === 'automatico') {
      const sugerida = disponibilidad.configuracion.bodega_sugerida;
      if (sugerida) {
        const b = (disponibilidad.por_bodega || []).find((x) => x.bodega_id === sugerida);
        if (b) {
          setBodegaSeleccionada(sugerida);
          onBodegaSeleccionada(sugerida, b.cantidad_disponible);
        }
      }
    }
  }, [disponibilidad, modo, onBodegaSeleccionada]);

  if (loading) return <div className="text-sm text-gray-500">Verificando disponibilidad…</div>;
  if (!disponibilidad)
    return <div className="text-sm text-red-500">Error al cargar disponibilidad</div>;

  const bodegasVenta = (disponibilidad.por_bodega || []).filter((b) => b.es_punto_venta);

  if (modo === 'automatico' && disponibilidad.configuracion.bodega_sugerida) {
    const b = bodegasVenta.find((x) => x.bodega_id === disponibilidad.configuracion.bodega_sugerida);
    return (
      <div className="text-sm text-green-600 flex items-center">
        <Check className="w-4 h-4 mr-1" />
        Se asignará desde <strong className="ml-1">{b?.nombre}</strong>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Seleccionar bodega:</label>
      <select
        value={bodegaSeleccionada || ''}
        onChange={(e) => {
          const id = Number(e.target.value) || null;
          setBodegaSeleccionada(id);
          const b = bodegasVenta.find((x) => x.bodega_id === id);
          if (b) onBodegaSeleccionada(id, b.cantidad_disponible);
          else onBodegaSeleccionada(null, 0);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">Seleccionar…</option>
        {bodegasVenta.map((b) => (
          <option key={b.bodega_id} value={b.bodega_id}>
            {b.nombre} - Disponible: {b.cantidad_disponible}
          </option>
        ))}
      </select>
    </div>
  );
};