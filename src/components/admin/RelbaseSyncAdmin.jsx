// src/components/admin/RelbaseSyncAdmin.jsx
// Componente para gestionar sincronización de productos con Relbase

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Cloud,
  Settings,
  Play,
  Loader2,
  Info
} from 'lucide-react';
import ApiService from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';

const RelbaseSyncAdmin = () => {
  // Socket y Auth
  const { on, off, joinRoom, isConnected } = useSocket();
  const { user } = useAuth();

  // Estados
  const [config, setConfig] = useState(null);
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmClean, setShowConfirmClean] = useState(false);

  // Estado de progreso en tiempo real
  const [realTimeProgress, setRealTimeProgress] = useState(null);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  // Conectar al socket y escuchar eventos de progreso
  useEffect(() => {
    if (isConnected && user) {
      // Unirse a la sala admin para recibir eventos
      joinRoom('admin', {
        usuario: user.username || user.nombre || 'Admin',
        rol: 'admin'
      });

      // Handler para eventos de progreso
      const handleProgress = (data) => {
        console.log('📊 Progreso recibido:', data);
        setRealTimeProgress(data);

        // Si completó, limpiar después de un momento
        if (data.phase === 'completed') {
          setTimeout(() => {
            setRealTimeProgress(null);
            loadData(); // Recargar datos
          }, 1500);
        }
      };

      // Registrar listener
      on('relbase_sync_progress', handleProgress);

      // Cleanup
      return () => {
        off('relbase_sync_progress', handleProgress);
      };
    }
  }, [isConnected, user, on, off, joinRoom]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [configRes, estadoRes] = await Promise.all([
        ApiService.getRelbaseSyncConfig(),
        ApiService.getRelbaseSyncEstado()
      ]);

      if (configRes.success) {
        setConfig(configRes.data);
      } else {
        setError('Error cargando configuración de Relbase');
      }

      if (estadoRes.success) {
        setEstado(estadoRes.data);
      } else {
        setError('Error cargando estado de sincronización');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (syncing) return;

    setSyncing(true);
    setError(null);
    setLastSyncResult(null);

    try {
      const response = await ApiService.sincronizarTodasRelbase();

      if (response.success) {
        setLastSyncResult(response.data);
        // Recargar estado
        await loadData();
      } else {
        setError(response.error || response.message || 'Error en sincronización');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCleanAll = async () => {
    if (cleaning) return;

    setCleaning(true);
    setError(null);
    setShowConfirmClean(false);

    try {
      const response = await ApiService.limpiarProductosRelbase();

      if (response.success) {
        setLastSyncResult({
          tipo: 'limpieza',
          eliminados: response.data.eliminados,
          errores: response.data.errores
        });
        // Recargar estado
        await loadData();
      } else {
        setError(response.error || response.message || 'Error en limpieza');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCleaning(false);
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
            Esta acción eliminará <strong>TODOS</strong> los productos sincronizados en Relbase
            (categoría Plataforma) y reseteará el estado de sincronización local.
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
            onClick={handleCleanAll}
            disabled={cleaning}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
          >
            {cleaning ? (
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
        <span className="text-gray-600">Cargando estado de sincronización...</span>
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
            <p className="text-gray-600">Gestiona la sincronización de productos con Relbase</p>
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

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h4 className="font-semibold text-red-800">Error</h4>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progreso en Tiempo Real */}
      {realTimeProgress && (
        <div className={`border rounded-lg p-4 ${
          realTimeProgress.type === 'sync' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Loader2 className={`w-5 h-5 mr-2 animate-spin ${
                realTimeProgress.type === 'sync' ? 'text-blue-600' : 'text-red-600'
              }`} />
              <span className={`font-semibold ${
                realTimeProgress.type === 'sync' ? 'text-blue-800' : 'text-red-800'
              }`}>
                {realTimeProgress.type === 'sync' ? 'Sincronizando...' : 'Limpiando...'}
              </span>
            </div>
            <span className={`text-sm font-medium ${
              realTimeProgress.type === 'sync' ? 'text-blue-700' : 'text-red-700'
            }`}>
              {realTimeProgress.phase === 'loading'
                ? 'Cargando productos...'
                : `${realTimeProgress.current} / ${realTimeProgress.total}`}
            </span>
          </div>

          {/* Barra de progreso animada */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                realTimeProgress.phase === 'completed'
                  ? 'bg-green-500'
                  : realTimeProgress.type === 'sync' ? 'bg-blue-500' : 'bg-red-500'
              }`}
              style={{ width: `${realTimeProgress.percentage || 0}%` }}
            />
          </div>

          {/* Item actual */}
          {realTimeProgress.currentItem && (
            <p className="text-sm text-gray-600 truncate">
              {realTimeProgress.type === 'sync' ? '➡️' : '🗑️'} {realTimeProgress.currentItem}
            </p>
          )}

          {realTimeProgress.phase === 'completed' && (
            <p className="text-sm text-green-600 font-medium mt-1">
              ✅ {realTimeProgress.type === 'sync' ? 'Sincronización' : 'Limpieza'} completada
            </p>
          )}
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
            {/* Modo */}
            <div className={`p-4 rounded-lg border ${config.modo_prueba ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center mb-2">
                {config.modo_prueba ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                )}
                <span className="font-medium text-gray-700">Modo</span>
              </div>
              <p className={`text-lg font-bold ${config.modo_prueba ? 'text-yellow-700' : 'text-green-700'}`}>
                {config.modo_prueba ? 'PRUEBA' : 'PRODUCCIÓN'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {config.modo_prueba ? 'Los productos no se envían a Relbase' : 'Los productos se sincronizan con Relbase'}
              </p>
            </div>

            {/* Categoría */}
            <div className={`p-4 rounded-lg border ${config.category_configurada ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center mb-2">
                {config.category_configurada ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className="font-medium text-gray-700">Categoría Plataforma</span>
              </div>
              <p className={`text-lg font-bold ${config.category_configurada ? 'text-green-700' : 'text-red-700'}`}>
                {config.category_configurada ? `ID: ${config.category_plataforma_id}` : 'No configurada'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {config.category_configurada ? 'Categoría asignada en Relbase' : 'Configure RELBASE_CATEGORY_PLATAFORMA_ID en .env'}
              </p>
            </div>

            {/* Estado API */}
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center mb-2">
                <Cloud className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-700">API Relbase</span>
              </div>
              <p className="text-lg font-bold text-blue-700">Conectada</p>
              <p className="text-xs text-gray-500 mt-1">api.relbase.cl</p>
            </div>
          </div>
        </div>
      )}

      {/* Estado de Sincronización */}
      {estado && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-gray-600" />
            Estado de Sincronización
          </h3>

          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progreso de sincronización
              </span>
              <span className="text-sm font-medium text-gray-700">
                {estado.sincronizadas} / {estado.total_variantes} variantes
              </span>
            </div>
            <ProgressBar porcentaje={estado.porcentaje} />
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">{estado.total_variantes}</p>
              <p className="text-sm text-gray-600">Total Variantes</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{estado.sincronizadas}</p>
              <p className="text-sm text-gray-600">Sincronizadas</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{estado.pendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{estado.porcentaje}%</p>
              <p className="text-sm text-gray-600">Completado</p>
            </div>
          </div>

          {/* Alerta de pendientes */}
          {estado.alerta && estado.pendientes > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Variantes pendientes de sincronizar</h4>
                  <p className="text-yellow-700 text-sm">
                    Hay {estado.pendientes} variantes que aún no se han sincronizado con Relbase.
                    Ejecuta la sincronización para agregarlas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSyncAll}
              disabled={syncing || estado.pendientes === 0}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Sincronizar Pendientes ({estado.pendientes})
                </>
              )}
            </button>

            <button
              onClick={() => setShowConfirmClean(true)}
              disabled={cleaning}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Limpiar Todo en Relbase
            </button>
          </div>
        </div>
      )}

      {/* Resultado de última sincronización */}
      {lastSyncResult && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-gray-600" />
            Resultado de la Última Operación
          </h3>

          {lastSyncResult.tipo === 'limpieza' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{lastSyncResult.eliminados}</p>
                <p className="text-sm text-gray-600">Productos Eliminados</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{lastSyncResult.errores}</p>
                <p className="text-sm text-gray-600">Errores</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-800">{lastSyncResult.total}</p>
                  <p className="text-sm text-gray-600">Total Procesadas</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{lastSyncResult.sincronizadas}</p>
                  <p className="text-sm text-gray-600">Exitosas</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{lastSyncResult.errores}</p>
                  <p className="text-sm text-gray-600">Errores</p>
                </div>
              </div>

              {/* Tabla de detalles */}
              {lastSyncResult.detalles && lastSyncResult.detalles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Detalles:</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Relbase ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lastSyncResult.detalles.slice(0, 50).map((detalle, idx) => (
                          <tr key={idx} className={detalle.success ? '' : 'bg-red-50'}>
                            <td className="px-4 py-2 text-sm text-gray-900 font-mono">{detalle.sku}</td>
                            <td className="px-4 py-2 text-sm">
                              {detalle.success ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  OK
                                </span>
                              ) : (
                                <span className="flex items-center text-red-600">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {detalle.relbase_product_id || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-red-600">
                              {detalle.error || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {lastSyncResult.detalles.length > 50 && (
                      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                        Mostrando 50 de {lastSyncResult.detalles.length} registros
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Info adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Información:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>La sincronización crea productos en Relbase con los datos de las variantes locales</li>
              <li>El nombre del producto en Relbase será: "PRODUCTO Color Medida"</li>
              <li>Se usa el precio de la primera modalidad activa de cada variante</li>
              <li>El rate limit es de 7 requests/segundo para respetar los límites de Relbase</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmClean && <ConfirmCleanModal />}
    </div>
  );
};

export default RelbaseSyncAdmin;
