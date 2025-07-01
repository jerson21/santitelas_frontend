// src/components/admin/BodegasAdmin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Package,
  Warehouse,
  MapPin,
  AlertTriangle,
  X,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Home,
  Info
} from 'lucide-react';

import ApiService from '../../services/api';

// Componente principal
const BodegasAdmin = ({ onNavigateToStock = null }) => {
  // Estados principales
  const [bodegas, setBodegas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [filterActiva, setFilterActiva] = useState('todas'); // 'todas', 'activas', 'inactivas'
  const [filterPuntoVenta, setFilterPuntoVenta] = useState('todas'); // 'todas', 'si', 'no'
  
  // Estado para notificaciones
  const [notification, setNotification] = useState(null);
  
  // Estados de modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [bodegaToEdit, setBodegaToEdit] = useState(null);
  const [bodegaToDelete, setBodegaToDelete] = useState(null);
  const [bodegaStock, setBodegaStock] = useState(null);
  
  // Estados de expansión
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Cargar bodegas
  const loadBodegas = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {};
      
      // Agregar filtros si no es 'todas'
      if (filterActiva !== 'todas') {
        params.activa = filterActiva === 'activas';
      }
      
      if (filterPuntoVenta !== 'todas') {
        params.punto_venta = filterPuntoVenta === 'si';
      }
      
      const response = await ApiService.getBodegas(params);
      
      if (response.success) {
        setBodegas(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando bodegas:', error);
      showNotification('Error al cargar las bodegas', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterActiva, filterPuntoVenta]);

  // Effect inicial
  useEffect(() => {
    loadBodegas();
  }, [loadBodegas]);

  // Buscar bodegas con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue) {
        setBodegas(currentBodegas => 
          currentBodegas.filter(bodega => 
            bodega.nombre.toLowerCase().includes(searchValue.toLowerCase()) ||
            bodega.codigo.toLowerCase().includes(searchValue.toLowerCase()) ||
            (bodega.direccion && bodega.direccion.toLowerCase().includes(searchValue.toLowerCase()))
          )
        );
      } else {
        loadBodegas();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, loadBodegas]);

  // Expandir/Contraer fila
  const toggleRowExpansion = (bodegaId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(bodegaId)) {
      newExpanded.delete(bodegaId);
    } else {
      newExpanded.add(bodegaId);
    }
    setExpandedRows(newExpanded);
  };

  // Ver stock de bodega
  const handleViewStock = async (bodega) => {
    try {
      const response = await ApiService.getBodegaDetalle(bodega.id_bodega);
      if (response.success) {
        setBodegaStock(response.data);
        setShowStockModal(true);
      }
    } catch (error) {
      console.error('Error cargando stock:', error);
      showNotification('Error al cargar el stock', 'error');
    }
  };

  // Handlers
  const handleEdit = (bodega) => {
    setBodegaToEdit(bodega);
    setShowFormModal(true);
  };

  const handleDelete = (bodega) => {
    setBodegaToDelete(bodega);
    setShowDeleteModal(true);
  };

  const handleToggleActive = async (bodega) => {
    const nuevaAccion = bodega.activa ? 'desactivar' : 'activar';
    const confirmMessage = bodega.activa 
      ? `¿Estás seguro de que deseas desactivar la bodega "${bodega.nombre}"?`
      : `¿Estás seguro de que deseas reactivar la bodega "${bodega.nombre}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await ApiService.updateBodega(bodega.id_bodega, {
        activa: !bodega.activa
      });
      
      if (response.success) {
        showNotification(
          bodega.activa 
            ? 'Bodega desactivada correctamente'
            : 'Bodega reactivada correctamente'
        );
        loadBodegas();
      }
    } catch (error) {
      console.error('Error actualizando bodega:', error);
      showNotification(`Error al ${nuevaAccion} la bodega`, 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcular estadísticas
  const totalActivas = bodegas.filter(b => b.activa).length;
  const totalPuntosVenta = bodegas.filter(b => b.es_punto_venta).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/admin'}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            title="Volver al Dashboard"
          >
            <Home size={20} className="text-gray-600" />
            <span className="text-sm text-gray-600 hidden sm:inline">Dashboard</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Bodegas</h1>
            <p className="text-sm text-gray-500">
              {loading ? 'Cargando...' :
               `${bodegas.length} bodegas (${totalActivas} activas, ${totalPuntosVenta} puntos de venta)`
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadBodegas}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => {
              setBodegaToEdit(null);
              setShowFormModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} />
            Nueva Bodega
          </button>
        </div>
      </header>

      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {searching && (
                <Loader2 size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
              )}
              {searchValue && (
                <button
                  onClick={() => setSearchValue('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              )}
              <input
                type="text"
                placeholder="Buscar por nombre, código o dirección..."
                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              {/* Filtro de estado */}
              <select
                value={filterActiva}
                onChange={(e) => setFilterActiva(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="activas">Activas</option>
                <option value="inactivas">Inactivas</option>
              </select>
              
              {/* Filtro de punto de venta */}
              <select
                value={filterPuntoVenta}
                onChange={(e) => setFilterPuntoVenta(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todos los tipos</option>
                <option value="si">Puntos de venta</option>
                <option value="no">Solo almacén</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-500">Cargando bodegas...</p>
            </div>
          ) : bodegas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Warehouse className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {searchValue 
                  ? `No se encontraron bodegas para "${searchValue}"`
                  : 'No se encontraron bodegas'
                }
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Dirección</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {bodegas.map(bodega => (
                  <React.Fragment key={bodega.id_bodega}>
                    <tr 
                      className={`border-b border-slate-200 hover:bg-slate-50 ${
                        !bodega.activa ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {bodega.codigo}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          {bodega.nombre}
                          {!bodega.activa && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                              Inactiva
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin size={14} />
                          <span className="text-xs">
                            {bodega.direccion || 'Sin dirección'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {bodega.es_punto_venta ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            <ShoppingBag size={12} />
                            Punto de Venta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            <Warehouse size={12} />
                            Almacén
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(bodega)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            bodega.activa 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={bodega.activa ? 'Desactivar bodega' : 'Reactivar bodega'}
                        >
                          {bodega.activa ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewStock(bodega)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                          title="Ver stock"
                        >
                          <Package size={14} />
                          <span className="text-xs">Ver stock</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggleRowExpansion(bodega.id_bodega)}
                            className="p-1.5 hover:bg-gray-200 rounded"
                            title="Ver detalles"
                          >
                            {expandedRows.has(bodega.id_bodega) ? (
                              <Eye size={16} className="text-gray-600" />
                            ) : (
                              <EyeOff size={16} className="text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(bodega)}
                            className="p-1.5 hover:bg-gray-200 rounded"
                            title="Editar bodega"
                          >
                            <Edit2 size={16} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(bodega)}
                            className="p-1.5 hover:bg-red-100 rounded"
                            title="Desactivar bodega"
                            disabled={!bodega.activa || (bodega.stock && bodega.stock.length > 0)}
                          >
                            <Trash2 
                              size={16} 
                              className={
                                !bodega.activa || (bodega.stock && bodega.stock.length > 0)
                                  ? "text-gray-300"
                                  : "text-red-500"
                              } 
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Fila expandida con detalles */}
                    {expandedRows.has(bodega.id_bodega) && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Información General</h4>
                              <div className="space-y-1">
                                <p className="text-gray-600">
                                  <span className="font-medium">Descripción:</span> {bodega.descripcion || 'Sin descripción'}
                                </p>
                                <p className="text-gray-600">
                                  <span className="font-medium">Creada:</span> {formatDate(bodega.fecha_creacion)}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Estadísticas</h4>
                              <div className="space-y-1">
                                <p className="text-gray-600">
                                  <span className="font-medium">Productos con stock:</span> {bodega.stock?.length || 0}
                                </p>
                                {bodega.es_punto_venta && (
                                  <p className="text-green-600 text-xs">
                                    ✓ Habilitada para ventas directas
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Formulario */}
      <BodegaFormModal
        isOpen={showFormModal}
        bodega={bodegaToEdit}
        onClose={() => {
          setShowFormModal(false);
          setBodegaToEdit(null);
        }}
        onSave={async (data) => {
          try {
            const response = bodegaToEdit
              ? await ApiService.updateBodega(bodegaToEdit.id_bodega, data)
              : await ApiService.createBodega(data);
              
            if (response.success) {
              setShowFormModal(false);
              setBodegaToEdit(null);
              showNotification(
                bodegaToEdit ? 'Bodega actualizada correctamente' : 'Bodega creada correctamente'
              );
              loadBodegas();
            }
          } catch (error) {
            console.error('Error guardando bodega:', error);
            showNotification('Error al guardar la bodega', 'error');
          }
        }}
      />

      {/* Modal de Confirmación de Eliminación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        bodega={bodegaToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setBodegaToDelete(null);
        }}
        onConfirm={async () => {
          try {
            const response = await ApiService.deleteBodega(bodegaToDelete.id_bodega);
            
            if (response.success) {
              setShowDeleteModal(false);
              setBodegaToDelete(null);
              showNotification('Bodega desactivada correctamente');
              loadBodegas();
            }
          } catch (error) {
            console.error('Error desactivando bodega:', error);
            showNotification(error.response?.data?.message || 'Error al desactivar la bodega', 'error');
          }
        }}
      />

      {/* Modal de Stock */}
      <StockModal
        isOpen={showStockModal}
        bodega={bodegaStock}
        onClose={() => {
          setShowStockModal(false);
          setBodegaStock(null);
        }}
      />
    </div>
  );
};

// Modal de Formulario
const BodegaFormModal = ({ isOpen, bodega, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    direccion: '',
    es_punto_venta: false,
    activa: true
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bodega) {
      setFormData({
        codigo: bodega.codigo || '',
        nombre: bodega.nombre || '',
        descripcion: bodega.descripcion || '',
        direccion: bodega.direccion || '',
        es_punto_venta: bodega.es_punto_venta || false,
        activa: bodega.activa ?? true
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        direccion: '',
        es_punto_venta: false,
        activa: true
      });
    }
    setErrors({});
  }, [bodega, isOpen]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido';
    } else if (formData.codigo.length > 20) {
      newErrors.codigo = 'El código no puede exceder 20 caracteres';
    }
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length > 50) {
      newErrors.nombre = 'El nombre no puede exceder 50 caracteres';
    }
    
    if (formData.direccion && formData.direccion.length > 200) {
      newErrors.direccion = 'La dirección no puede exceder 200 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      await onSave({
        codigo: formData.codigo.trim().toUpperCase(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        es_punto_venta: formData.es_punto_venta,
        activa: formData.activa
      });
    } catch (error) {
      console.error('Error en el formulario:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Warehouse className="w-5 h-5" />
            {bodega ? 'Editar Bodega' : 'Nueva Bodega'}
          </h3>
        </div>

        <div className="p-5 space-y-4">
          {/* Campo Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              onKeyPress={handleKeyPress}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.codigo ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: BOD001"
              autoFocus
              maxLength={20}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.codigo && (
              <p className="mt-1 text-sm text-red-600">{errors.codigo}</p>
            )}
          </div>

          {/* Campo Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              onKeyPress={handleKeyPress}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nombre ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Bodega Principal"
              maxLength={50}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Campo Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              onKeyPress={handleKeyPress}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.direccion ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Av. Principal 123"
              maxLength={200}
            />
            {errors.direccion && (
              <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
            )}
          </div>

          {/* Campo Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción opcional de la bodega"
              rows={3}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            {/* Punto de Venta */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.es_punto_venta}
                onChange={(e) => setFormData({ ...formData, es_punto_venta: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Es punto de venta</span>
              <span className="ml-2 text-xs text-gray-500">
                (Permite realizar ventas desde esta bodega)
              </span>
            </label>

            {/* Estado */}
            {bodega && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Bodega activa</span>
              </label>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-3 flex justify-end items-center gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                {bodega ? 'Actualizar' : 'Crear'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Confirmación de Eliminación
const DeleteConfirmModal = ({ isOpen, bodega, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !bodega) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-semibold text-slate-800">
                Desactivar Bodega
              </h3>
              <div className="mt-2 text-sm text-slate-600">
                <p>¿Estás seguro de que deseas desactivar la bodega <strong>{bodega.nombre}</strong>?</p>
                
                {bodega.stock && bodega.stock.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-amber-800 font-medium">
                      ⚠️ Esta bodega tiene stock de productos
                    </p>
                    <p className="text-amber-700 text-xs mt-1">
                      No se puede desactivar una bodega con stock
                    </p>
                  </div>
                )}
                
                {!bodega.stock || bodega.stock.length === 0 && (
                  <p className="mt-2 text-amber-600 font-medium text-xs">
                    La bodega será desactivada y podrá reactivarse después.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-3 flex justify-end items-center gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={deleting}
          >
            Cancelar
          </button>
          {(!bodega.stock || bodega.stock.length === 0) && (
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Desactivando...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Desactivar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de Stock
const StockModal = ({ isOpen, bodega, onClose }) => {
  if (!isOpen || !bodega) return null;

  const stockItems = bodega.stock || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Stock en {bodega.nombre}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {stockItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay productos con stock en esta bodega</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-4 py-2 text-left">Código</th>
                    <th className="px-4 py-2 text-right">Cantidad Disponible</th>
                    <th className="px-4 py-2 text-right">Cantidad Reservada</th>
                    <th className="px-4 py-2 text-left">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">
                        {item.varianteProducto?.producto?.nombre || 'Producto sin nombre'}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {item.producto?.codigo || '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {item.cantidad_disponible || 0}
                      </td>
                      <td className="px-4 py-2 text-right text-orange-600">
                        {item.cantidad_reservada || 0}
                      </td>
                      <td className="px-4 py-2">
                        {item.producto?.unidad_medida || 'unidad'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-5 py-3 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BodegasAdmin;