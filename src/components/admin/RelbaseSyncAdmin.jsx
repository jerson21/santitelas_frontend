// src/components/admin/RelbaseSyncAdmin.jsx
// Componente para gestionar sincronización de productos y clientes con Relbase

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Cloud,
  Settings,
  Play,
  Loader2,
  Info,
  Package,
  Users
} from 'lucide-react';
import ApiService from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';

const RelbaseSyncAdmin = () => {
  // Socket y Auth
  const { on, off, joinRoom, isConnected } = useSocket();
  const { user } = useAuth();

  // Tab activa
  const [activeTab, setActiveTab] = useState('productos');

  // Estados de productos
  const [config, setConfig] = useState(null);
  const [estadoProductos, setEstadoProductos] = useState(null);
  const [syncingProductos, setSyncingProductos] = useState(false);
  const [cleaningProductos, setCleaningProductos] = useState(false);
  const [lastSyncResultProductos, setLastSyncResultProductos] = useState(null);

  // Estados de clientes
  const [estadoClientes, setEstadoClientes] = useState(null);
  const [syncingClientes, setSyncingClientes] = useState(false);
  const [cleaningClientes, setCleaningClientes] = useState(false);
  const [lastSyncResultClientes, setLastSyncResultClientes] = useState(null);

  // Estados generales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmClean, setShowConfirmClean] = useState(false);
  const [cleanType, setCleanType] = useState(null); // 'productos' o 'clientes'

  // Estado de progreso en tiempo real
  const [realTimeProgress, setRealTimeProgress] = useState(null);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  // Conectar al socket y escuchar eventos de progreso
  useEffect(() => {
    if (isConnected && user) {
      joinRoom('admin', {
        usuario: user.username || user.nombre || 'Admin',
        rol: 'admin'
      });

      // Handlers para productos
      const handleProductoProgress = (data) => {
        console.log('📊 Progreso productos:', data);
        setRealTimeProgress({
          type: 'sync',
          entity: 'productos',
          current: data.current,
          total: data.total,
          percentage: data.percent,
          currentItem: data.variante,
          message: data.message
        });
      };

      const handleProductoComplete = (data) => {
        console.log('✅ Productos completado:', data);
        setRealTimeProgress(null);
        setSyncingProductos(false);
        setLastSyncResultProductos({
          sincronizados: data.sincronizadas,
          errores: data.errores
        });
        loadProductosData();
      };

      const handleProductoCleanProgress = (data) => {
        console.log('🗑️ Progreso limpieza productos:', data);
        setRealTimeProgress({
          type: 'clean',
          entity: 'productos',
          current: data.current,
          total: data.total,
          percentage: data.percent,
          currentItem: data.variante,
          message: data.message
        });
      };

      const handleProductoCleanComplete = (data) => {
        console.log('✅ Limpieza productos completada:', data);
        setRealTimeProgress(null);
        setCleaningProductos(false);
        setLastSyncResultProductos({
          tipo: 'limpieza',
          eliminados: data.eliminados,
          errores: data.errores
        });
        loadProductosData();
      };

      // Handlers para clientes
      const handleClienteProgress = (data) => {
        console.log('📊 Progreso clientes:', data);
        setRealTimeProgress({
          type: 'sync',
          entity: 'clientes',
          current: data.current,
          total: data.total,
          percentage: data.percent,
          currentItem: data.cliente,
          message: data.message
        });
      };

      const handleClienteComplete = (data) => {
        console.log('✅ Clientes completado:', data);
        setRealTimeProgress(null);
        setSyncingClientes(false);
        setLastSyncResultClientes({
          sincronizados: data.sincronizados,
          errores: data.errores
        });
        loadClientesData();
      };

      const handleClienteCleanProgress = (data) => {
        console.log('🗑️ Progreso limpieza clientes:', data);
        setRealTimeProgress({
          type: 'clean',
          entity: 'clientes',
          current: data.current,
          total: data.total,
          percentage: data.percent,
          currentItem: data.cliente,
          message: data.message
        });
      };

      const handleClienteCleanComplete = (data) => {
        console.log('✅ Limpieza clientes completada:', data);
        setRealTimeProgress(null);
        setCleaningClientes(false);
        setLastSyncResultClientes({
          tipo: 'limpieza',
          eliminados: data.eliminados,
          errores: data.errores
        });
        loadClientesData();
      };

      // Registrar listeners de productos
      on('producto-sync-progress', handleProductoProgress);
      on('producto-sync-complete', handleProductoComplete);
      on('producto-clean-progress', handleProductoCleanProgress);
      on('producto-clean-complete', handleProductoCleanComplete);

      // Registrar listeners de clientes
      on('cliente-sync-progress', handleClienteProgress);
      on('cliente-sync-complete', handleClienteComplete);
      on('cliente-clean-progress', handleClienteCleanProgress);
      on('cliente-clean-complete', handleClienteCleanComplete);

      return () => {
        // Limpiar listeners de productos
        off('producto-sync-progress', handleProductoProgress);
        off('producto-sync-complete', handleProductoComplete);
        off('producto-clean-progress', handleProductoCleanProgress);
        off('producto-clean-complete', handleProductoCleanComplete);

        // Limpiar listeners de clientes
        off('cliente-sync-progress', handleClienteProgress);
        off('cliente-sync-complete', handleClienteComplete);
        off('cliente-clean-progress', handleClienteCleanProgress);
        off('cliente-clean-complete', handleClienteCleanComplete);
      };
    }
  }, [isConnected, user, on, off, joinRoom]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadProductosData(),
        loadClientesData()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProductosData = async () => {
    try {
      const [configRes, estadoRes] = await Promise.all([
        ApiService.getRelbaseSyncConfig(),
        ApiService.getRelbaseSyncEstado()
      ]);

      if (configRes.success) setConfig(configRes.data);
      if (estadoRes.success) setEstadoProductos(estadoRes.data);
    } catch (err) {
      console.error('Error cargando datos de productos:', err);
    }
  };

  const loadClientesData = async () => {
    try {
      const estadoRes = await ApiService.getClientesSyncEstado();
      if (estadoRes.success) setEstadoClientes(estadoRes.data);
    } catch (err) {
      console.error('Error cargando datos de clientes:', err);
    }
  };

  // === HANDLERS PRODUCTOS ===
  const handleSyncProductos = async () => {
    if (syncingProductos) return;
    setSyncingProductos(true);
    setError(null);
    setLastSyncResultProductos(null);

    try {
      const response = await ApiService.sincronizarTodasRelbase();
      if (response.success) {
        setLastSyncResultProductos(response.data);
        await loadProductosData();
      } else {
        setError(response.error || response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingProductos(false);
    }
  };

  const handleCleanProductos = async () => {
    if (cleaningProductos) return;
    setCleaningProductos(true);
    setError(null);
    setShowConfirmClean(false);

    try {
      const response = await ApiService.limpiarProductosRelbase();
      if (response.success) {
        setLastSyncResultProductos({
          tipo: 'limpieza',
          eliminados: response.data.eliminados,
          errores: response.data.errores
        });
        await loadProductosData();
      } else {
        setError(response.error || response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCleaningProductos(false);
    }
  };

  // === HANDLERS CLIENTES ===
  const handleSyncClientes = async () => {
    if (syncingClientes) return;
    setSyncingClientes(true);
    setError(null);
    setLastSyncResultClientes(null);

    try {
      const response = await ApiService.sincronizarClientesRelbase();
      if (response.success) {
        setLastSyncResultClientes(response.data);
        await loadClientesData();
      } else {
        setError(response.error || response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingClientes(false);
    }
  };

  const handleCleanClientes = async () => {
    if (cleaningClientes) return;
    setCleaningClientes(true);
    setError(null);
    setShowConfirmClean(false);

    try {
      const response = await ApiService.limpiarClientesRelbase();
      if (response.success) {
        setLastSyncResultClientes({
          tipo: 'limpieza',
          eliminados: response.data.eliminados,
          errores: response.data.errores
        });
        await loadClientesData();
      } else {
        setError(response.error || response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCleaningClientes(false);
    }
  };

  // Componente de barra de progreso
  const ProgressBar = ({ porcentaje }) => (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          porcentaje === 100 ? 'bg-green-500' : 'bg-blue-500'
        }`}
        style={{ width: `${porcentaje}%` }}
      >
        <span className="text-xs text-white font-medium flex items-center justify-center h-full">
          {porcentaje}%
        </span>
      </div>
    </div>
  );

  // Modal de confirmación para limpiar
  const ConfirmCleanModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Confirmar Limpieza</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            Esta acción eliminará <strong>TODOS</strong> los {cleanType === 'productos' ? 'productos' : 'clientes'} sincronizados en Relbase
            y reseteará el estado de sincronización local.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowConfirmClean(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={cleanType === 'productos' ? handleCleanProductos : handleCleanClientes}
            disabled={cleanType === 'productos' ? cleaningProductos : cleaningClientes}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
          >
            {(cleanType === 'productos' ? cleaningProductos : cleaningClientes) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Limpiando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Confirmar Limpieza
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render de pestaña Productos
  const renderProductosTab = () => {
    // Determinar si hay progreso activo de productos
    const progresoActivo = realTimeProgress && realTimeProgress.entity === 'productos';
    const isSync = progresoActivo && realTimeProgress.type === 'sync';
    const isClean = progresoActivo && realTimeProgress.type === 'clean';

    return (
    <div className="space-y-6">
      {/* Estado de Sincronización de Productos */}
      {estadoProductos && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-gray-600" />
            Estado de Sincronización - Productos
          </h3>

          {/* Barra de progreso - Muestra progreso en tiempo real si está activo */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {progresoActivo ? (isSync ? 'Sincronizando...' : 'Limpiando...') : 'Progreso'}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {progresoActivo
                  ? `${realTimeProgress.current} / ${realTimeProgress.total}`
                  : `${estadoProductos.sincronizadas} / ${estadoProductos.total} variantes`
                }
              </span>
            </div>

            {/* Barra de progreso con color según estado */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progresoActivo
                    ? (isClean ? 'bg-red-500' : 'bg-blue-500')
                    : (estadoProductos.porcentaje === 100 ? 'bg-green-500' : 'bg-gray-400')
                }`}
                style={{
                  width: `${progresoActivo ? realTimeProgress.percentage : estadoProductos.porcentaje}%`
                }}
              />
            </div>

            {/* Item actual */}
            {progresoActivo && realTimeProgress.currentItem && (
              <p className="text-sm text-gray-600 mt-2 truncate">
                {isSync ? '➡️' : '🗑️'} {realTimeProgress.currentItem}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">{estadoProductos.total_variantes}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{estadoProductos.sincronizadas}</p>
              <p className="text-sm text-gray-600">Sincronizadas</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{estadoProductos.pendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{estadoProductos.porcentaje}%</p>
              <p className="text-sm text-gray-600">Completado</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSyncProductos}
              disabled={syncingProductos || estadoProductos.pendientes === 0}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncingProductos ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Sincronizar ({estadoProductos.pendientes})
                </>
              )}
            </button>

            <button
              onClick={() => { setCleanType('productos'); setShowConfirmClean(true); }}
              disabled={cleaningProductos}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Limpiar Relbase
            </button>
          </div>
        </div>
      )}

      {/* Resultado última operación productos */}
      {lastSyncResultProductos && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Última Operación</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {lastSyncResultProductos.tipo === 'limpieza' ? lastSyncResultProductos.eliminados : lastSyncResultProductos.sincronizadas}
              </p>
              <p className="text-sm text-gray-600">{lastSyncResultProductos.tipo === 'limpieza' ? 'Eliminados' : 'Sincronizados'}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{lastSyncResultProductos.errores}</p>
              <p className="text-sm text-gray-600">Errores</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  // Render de pestaña Clientes
  const renderClientesTab = () => {
    // Determinar si hay progreso activo de clientes
    const progresoActivo = realTimeProgress && realTimeProgress.entity === 'clientes';
    const isSync = progresoActivo && realTimeProgress.type === 'sync';
    const isClean = progresoActivo && realTimeProgress.type === 'clean';
    const porcentajeClientes = estadoClientes?.total > 0
      ? Math.round((estadoClientes.sincronizados / estadoClientes.total) * 100)
      : 0;

    return (
    <div className="space-y-6">
      {/* Estado de Sincronización de Clientes */}
      {estadoClientes && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-gray-600" />
            Estado de Sincronización - Clientes
          </h3>

          {/* Barra de progreso - Muestra progreso en tiempo real si está activo */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {progresoActivo ? (isSync ? 'Sincronizando...' : 'Limpiando...') : 'Progreso'}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {progresoActivo
                  ? `${realTimeProgress.current} / ${realTimeProgress.total}`
                  : `${estadoClientes.sincronizados} / ${estadoClientes.total} clientes`
                }
              </span>
            </div>

            {/* Barra de progreso con color según estado */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progresoActivo
                    ? (isClean ? 'bg-red-500' : 'bg-blue-500')
                    : (porcentajeClientes === 100 ? 'bg-green-500' : 'bg-gray-400')
                }`}
                style={{
                  width: `${progresoActivo ? realTimeProgress.percentage : porcentajeClientes}%`
                }}
              />
            </div>

            {/* Item actual */}
            {progresoActivo && realTimeProgress.currentItem && (
              <p className="text-sm text-gray-600 mt-2 truncate">
                {isSync ? '➡️' : '🗑️'} {realTimeProgress.currentItem}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">{estadoClientes.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{estadoClientes.sincronizados}</p>
              <p className="text-sm text-gray-600">Sincronizados</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{estadoClientes.pendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>

          {estadoClientes.pendientes > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Clientes pendientes</h4>
                  <p className="text-yellow-700 text-sm">
                    Hay {estadoClientes.pendientes} clientes sin sincronizar. Al emitir facturas,
                    se sincronizarán automáticamente, o puedes sincronizarlos manualmente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSyncClientes}
              disabled={syncingClientes || estadoClientes.pendientes === 0}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncingClientes ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Sincronizar ({estadoClientes.pendientes})
                </>
              )}
            </button>

            <button
              onClick={() => { setCleanType('clientes'); setShowConfirmClean(true); }}
              disabled={cleaningClientes}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Limpiar Relbase
            </button>
          </div>
        </div>
      )}

      {/* Resultado última operación clientes */}
      {lastSyncResultClientes && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Última Operación</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {lastSyncResultClientes.tipo === 'limpieza' ? lastSyncResultClientes.eliminados : lastSyncResultClientes.sincronizados}
              </p>
              <p className="text-sm text-gray-600">{lastSyncResultClientes.tipo === 'limpieza' ? 'Eliminados' : 'Sincronizados'}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{lastSyncResultClientes.errores}</p>
              <p className="text-sm text-gray-600">Errores</p>
            </div>
          </div>
        </div>
      )}

      {/* Info clientes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Información:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Los clientes se sincronizan automáticamente al emitir facturas</li>
              <li>Solo se sincronizan clientes con RUT válido</li>
              <li>Una vez sincronizado, el cliente queda registrado para futuras facturas</li>
              <li>No es necesario sincronizar clientes para boletas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
        <span className="text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Cloud className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sincronización Relbase</h2>
            <p className="text-gray-600">Gestiona productos y clientes en Relbase</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Configuración */}
      {config && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            Configuración
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${config.modo_prueba ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center mb-2">
                {config.modo_prueba ? <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" /> : <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}
                <span className="font-medium text-gray-700">Modo</span>
              </div>
              <p className={`text-lg font-bold ${config.modo_prueba ? 'text-yellow-700' : 'text-green-700'}`}>
                {config.modo_prueba ? 'PRUEBA' : 'PRODUCCIÓN'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${config.category_configurada ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center mb-2">
                {config.category_configurada ? <CheckCircle className="w-5 h-5 text-green-600 mr-2" /> : <XCircle className="w-5 h-5 text-red-600 mr-2" />}
                <span className="font-medium text-gray-700">Categoría</span>
              </div>
              <p className={`text-lg font-bold ${config.category_configurada ? 'text-green-700' : 'text-red-700'}`}>
                {config.category_configurada ? `ID: ${config.category_plataforma_id}` : 'No configurada'}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center mb-2">
                <Cloud className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-700">API Relbase</span>
              </div>
              <p className="text-lg font-bold text-blue-700">Conectada</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('productos')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors flex items-center justify-center ${
              activeTab === 'productos'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5 mr-2" />
            Productos
            {estadoProductos && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                estadoProductos.pendientes > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                {estadoProductos.pendientes > 0 ? estadoProductos.pendientes : '✓'}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors flex items-center justify-center ${
              activeTab === 'clientes'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Clientes
            {estadoClientes && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                estadoClientes.pendientes > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                {estadoClientes.pendientes > 0 ? estadoClientes.pendientes : '✓'}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'productos' ? renderProductosTab() : renderClientesTab()}
        </div>
      </div>

      {/* Modal */}
      {showConfirmClean && <ConfirmCleanModal />}
    </div>
  );
};

export default RelbaseSyncAdmin;
