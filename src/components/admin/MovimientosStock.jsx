import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Settings,
  Calendar,
  User,
  Package,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import ApiService from '../../services/api';

const MovimientosStock = ({ onBack }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    pages: 0
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    id_bodega: '',
    tipo_movimiento: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  const [showFiltros, setShowFiltros] = useState(false);

  useEffect(() => {
    loadBodegas();
    loadMovimientos();
  }, []);

  const loadBodegas = async () => {
    try {
      const response = await ApiService.getBodegas({ activa: true });
      if (response.success) {
        setBodegas(response.data || []);
      }
    } catch (error) {
      console.error('Error loading bodegas:', error);
    }
  };

  const loadMovimientos = async (offset = 0) => {
    setLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        offset,
        ...Object.fromEntries(
          Object.entries(filtros).filter(([_, v]) => v !== '')
        )
      };

      const response = await ApiService.getMovimientosStock(params);
      if (response.success) {
        setMovimientos(response.data || []);
        setPagination(response.pagination || {
          total: 0,
          limit: 20,
          offset: 0,
          pages: 0
        });
      }
    } catch (error) {
      console.error('Error loading movimientos:', error);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    loadMovimientos(0);
    setShowFiltros(false);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      id_bodega: '',
      tipo_movimiento: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    setTimeout(() => loadMovimientos(0), 100);
  };

  const handlePagina = (nuevaPagina) => {
    const nuevoOffset = nuevaPagina * pagination.limit;
    loadMovimientos(nuevoOffset);
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return <ArrowDownCircle className="w-5 h-5 text-green-600" />;
      case 'salida':
        return <ArrowUpCircle className="w-5 h-5 text-red-600" />;
      case 'transferencia':
        return <ArrowRightLeft className="w-5 h-5 text-blue-600" />;
      case 'ajuste':
        return <Settings className="w-5 h-5 text-orange-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return 'bg-green-100 text-green-800';
      case 'salida':
        return 'bg-red-100 text-red-800';
      case 'transferencia':
        return 'bg-blue-100 text-blue-800';
      case 'ajuste':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoTexto = (tipo) => {
    switch (tipo) {
      case 'entrada': return 'Entrada';
      case 'salida': return 'Salida';
      case 'transferencia': return 'Transferencia';
      case 'ajuste': return 'Ajuste';
      default: return tipo;
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const paginaActual = Math.floor(pagination.offset / pagination.limit);
  const hayFiltrosActivos = Object.values(filtros).some(v => v !== '');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="bg-indigo-100 p-3 rounded-xl">
            <History className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Historial de Movimientos</h1>
            <p className="text-gray-500">Registro de entradas, salidas y transferencias</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              hayFiltrosActivos
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {hayFiltrosActivos && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                Activos
              </span>
            )}
          </button>
          <button
            onClick={() => loadMovimientos(pagination.offset)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFiltros && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800">Filtros</h3>
            {hayFiltrosActivos && (
              <button
                onClick={handleLimpiarFiltros}
                className="text-sm text-indigo-600 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bodega</label>
              <select
                value={filtros.id_bodega}
                onChange={(e) => setFiltros({ ...filtros, id_bodega: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todas las bodegas</option>
                {bodegas.map(b => (
                  <option key={b.id_bodega} value={b.id_bodega}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filtros.tipo_movimiento}
                onChange={(e) => setFiltros({ ...filtros, tipo_movimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos los tipos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
                <option value="transferencia">Transferencia</option>
                <option value="ajuste">Ajuste</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleFiltrar}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabla de movimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron movimientos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bodega</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Ant.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Nuevo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movimientos.map((mov) => {
                  const producto = mov.varianteProducto?.producto;
                  const variante = mov.varianteProducto;

                  return (
                    <tr key={mov.id_movimiento} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatFecha(mov.fecha_movimiento)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(mov.tipo_movimiento)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(mov.tipo_movimiento)}`}>
                            {getTipoTexto(mov.tipo_movimiento)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{producto?.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {variante?.sku}
                            {variante?.color && ` | ${variante.color}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Warehouse className="w-4 h-4 text-gray-400" />
                            {mov.bodega?.nombre}
                          </div>
                          {mov.tipo_movimiento === 'transferencia' && mov.bodegaDestino && (
                            <div className="flex items-center gap-1 text-blue-600 mt-1">
                              <ArrowRightLeft className="w-3 h-3" />
                              <span className="text-xs">{mov.bodegaDestino.nombre}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${
                          mov.tipo_movimiento === 'entrada' ? 'text-green-600' :
                          mov.tipo_movimiento === 'salida' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {mov.tipo_movimiento === 'entrada' ? '+' : mov.tipo_movimiento === 'salida' ? '-' : ''}
                          {mov.cantidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {mov.stock_anterior}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                        {mov.stock_nuevo}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 max-w-[150px] truncate" title={mov.motivo}>
                          {mov.motivo}
                        </p>
                        {mov.referencia && (
                          <p className="text-xs text-gray-400">Ref: {mov.referencia}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          {mov.usuario?.nombre_completo || mov.usuario?.usuario || 'Sistema'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} movimientos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePagina(paginaActual - 1)}
              disabled={paginaActual === 0}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Página {paginaActual + 1} de {pagination.pages}
            </span>
            <button
              onClick={() => handlePagina(paginaActual + 1)}
              disabled={paginaActual >= pagination.pages - 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovimientosStock;
