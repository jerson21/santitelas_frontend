import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Package,
  AlertTriangle,
  X,
  Save,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

import ApiService from '../../../services/api';

// Componente principal
const CategoriasPage = ({ onNavigateToProducts = null }) => {
  // Estados principales
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [filterActiva, setFilterActiva] = useState('todas'); // 'todas', 'activas', 'inactivas'
  
  // Estado para notificaciones
  const [notification, setNotification] = useState(null);
  
  // Estados de modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState(null);
  
  // Paginación
  const [paginacion, setPaginacion] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20
  });

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Cargar categorías
  const loadCategorias = useCallback(async (search = '') => {
    try {
      if (search) setSearching(true);
      else setLoading(true);
      
      const params = {
        page: paginacion.page,
        limit: paginacion.limit,
        con_productos: 'true', // Solicitar conteo de productos
        ...(search && { search })
      };
      
      // Agregar filtro de activa si no es 'todas'
      if (filterActiva !== 'todas') {
        params.activa = filterActiva === 'activas';
      }
      
      const response = await ApiService.getCategorias(params);
      
      if (response.success) {
        setCategorias(response.data);
        setPaginacion(response.pagination || paginacion);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      alert('Error al cargar las categorías');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [paginacion.page, paginacion.limit, filterActiva]);

  // Effect inicial
  useEffect(() => {
    loadCategorias();
  }, []);

  // Effect para recargar cuando cambie el filtro
  useEffect(() => {
    loadCategorias(searchValue);
  }, [filterActiva]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue) {
        loadCategorias(searchValue);
      } else {
        loadCategorias();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Handlers
  const handleEdit = (categoria) => {
    setCategoriaToEdit(categoria);
    setShowFormModal(true);
  };

  const handleDelete = (categoria) => {
    // Si la categoría está activa, mostrar modal de desactivación
    // Si está inactiva, podría mostrar modal de eliminación permanente (opcional)
    setCategoriaToDelete(categoria);
    setShowDeleteModal(true);
  };

  const handleToggleActive = async (categoria) => {
    const nuevaAccion = categoria.activa ? 'desactivar' : 'activar';
    const confirmMessage = categoria.activa 
      ? `¿Estás seguro de que deseas desactivar la categoría "${categoria.nombre}"?`
      : `¿Estás seguro de que deseas reactivar la categoría "${categoria.nombre}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      // Mostrar loading
      setCategorias(prevCategorias => 
        prevCategorias.map(cat => 
          cat.id_categoria === categoria.id_categoria 
            ? { ...cat, loading: true }
            : cat
        )
      );
      
              const response = await ApiService.updateCategoria(categoria.id_categoria, {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        activa: !categoria.activa
      });
      
      if (response.success) {
        // Actualizar localmente para respuesta inmediata
        setCategorias(prevCategorias => 
          prevCategorias.map(cat => 
            cat.id_categoria === categoria.id_categoria 
              ? { ...cat, activa: !categoria.activa, loading: false }
              : cat
          )
        );
        
        // Notificar éxito
        const mensaje = categoria.activa 
          ? 'Categoría desactivada correctamente'
          : 'Categoría reactivada correctamente';
        
        showNotification(mensaje);
        
        // Recargar después de un breve delay
        setTimeout(() => {
          loadCategorias(searchValue);
        }, 500);
      } else {
        throw new Error(response.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      alert(`Error al ${nuevaAccion} la categoría: ${error.message}`);
      
      // Revertir el estado de loading
      setCategorias(prevCategorias => 
        prevCategorias.map(cat => 
          cat.id_categoria === categoria.id_categoria 
            ? { ...cat, loading: false }
            : cat
        )
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
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
            <ArrowLeft size={20} className="text-gray-600" />
            <span className="text-sm text-gray-600 hidden sm:inline">Volver</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Categorías</h1>
            <p className="text-sm text-gray-500">
              {loading ? 'Cargando...' :
               searching ? 'Buscando...' :
               (() => {
                 const totalActivas = categorias.filter(c => c.activa).length;
                 const totalInactivas = categorias.filter(c => !c.activa).length;
                 
                 if (filterActiva === 'todas') {
                   return `${categorias.length} categorías (${totalActivas} activas, ${totalInactivas} inactivas)`;
                 } else if (filterActiva === 'activas') {
                   return `${totalActivas} categorías activas`;
                 } else {
                   return `${totalInactivas} categorías inactivas`;
                 }
               })()
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setCategoriaToEdit(null);
            setShowFormModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Nueva Categoría
        </button>
      </header>

      {/* Barra de búsqueda */}
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
                placeholder="Buscar por nombre o descripción..."
                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            
            {/* Filtros de estado */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterActiva('todas')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filterActiva === 'todas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterActiva('activas')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filterActiva === 'activas'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => setFilterActiva('inactivas')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filterActiva === 'inactivas'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactivas
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-500">Cargando categorías...</p>
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {searchValue 
                  ? `No se encontraron categorías para "${searchValue}"`
                  : filterActiva === 'activas'
                    ? 'No hay categorías activas'
                    : filterActiva === 'inactivas'
                      ? 'No hay categorías inactivas'
                      : 'No se encontraron categorías'
                }
              </p>
              {!searchValue && filterActiva !== 'todas' && (
                <button
                  onClick={() => setFilterActiva('todas')}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver todas las categorías
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 text-center">Productos</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3">Creación</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(categoria => (
                  <tr 
                    key={categoria.id_categoria} 
                    className={`border-b border-slate-200 hover:bg-slate-50 ${
                      !categoria.activa ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        {categoria.nombre}
                        {!categoria.activa && (
                          <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                            Inactiva
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 line-clamp-2">
                        {categoria.descripcion || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => {
                          // Si hay una función de navegación, usarla
                          if (onNavigateToProducts) {
                            onNavigateToProducts(categoria.nombre);
                          } else {
                            // Fallback: navegación directa
                            console.log('Navegar a productos con categoría:', categoria.nombre);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                        title={`Ver productos de ${categoria.nombre}`}
                      >
                        <Package size={16} />
                        <span className="font-semibold">{categoria.total_productos || categoria._count?.productos || 0}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(categoria)}
                        disabled={categoria.loading}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          categoria.loading
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : categoria.activa 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={categoria.activa ? 'Desactivar categoría' : 'Reactivar categoría'}
                      >
                        {categoria.loading ? (
                          <span className="flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" />
                            Procesando...
                          </span>
                        ) : (
                          categoria.activa ? 'Activa' : 'Inactiva'
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDate(categoria.fecha_creacion)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(categoria)}
                          className="p-1.5 hover:bg-gray-200 rounded"
                          title="Editar categoría"
                        >
                          <Edit2 size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(categoria)}
                          className="p-1.5 hover:bg-red-100 rounded"
                          title={
                            categoria.activa 
                              ? 'Desactivar categoría' 
                              : 'Categoría ya desactivada'
                          }
                          disabled={
                            (categoria.activa && (categoria.total_productos > 0 || categoria._count?.productos > 0)) ||
                            !categoria.activa
                          }
                        >
                          <Trash2 
                            size={16} 
                            className={
                              !categoria.activa
                                ? "text-gray-300"
                                : (categoria.total_productos > 0 || categoria._count?.productos > 0)
                                  ? "text-gray-400" 
                                  : "text-red-500"
                            } 
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Formulario */}
      <CategoriaFormModal
        isOpen={showFormModal}
        categoria={categoriaToEdit}
        onClose={() => {
          setShowFormModal(false);
          setCategoriaToEdit(null);
        }}
        onSave={async (data) => {
          try {
            const response = categoriaToEdit
              ? await ApiService.updateCategoria(categoriaToEdit.id_categoria, data)
              : await ApiService.createCategoria(data);
              
            if (response.success) {
              setShowFormModal(false);
              setCategoriaToEdit(null);
              showNotification(
                categoriaToEdit ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente'
              );
              loadCategorias(searchValue);
            }
          } catch (error) {
            console.error('Error guardando categoría:', error);
            alert('Error al guardar la categoría');
          }
        }}
      />

      {/* Modal de Confirmación de Eliminación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        categoria={categoriaToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setCategoriaToDelete(null);
        }}
        onConfirm={async () => {
          try {
            // Desactivar la categoría (no eliminar)
            const response = await ApiService.updateCategoria(categoriaToDelete.id_categoria, {
              nombre: categoriaToDelete.nombre,
              descripcion: categoriaToDelete.descripcion,
              activa: false
            });
            
            if (response.success) {
              setShowDeleteModal(false);
              setCategoriaToDelete(null);
              showNotification('Categoría desactivada correctamente');
              loadCategorias(searchValue);
            }
          } catch (error) {
            console.error('Error desactivando categoría:', error);
            alert('Error al desactivar la categoría');
          }
        }}
      />
    </div>
  );
};

// Modal de Formulario
const CategoriaFormModal = ({ isOpen, categoria, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activa: true
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categoria) {
      setFormData({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        activa: categoria.activa ?? true
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        activa: true
      });
    }
    setErrors({});
  }, [categoria, isOpen]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.nombre.length > 50) {
      newErrors.nombre = 'El nombre no puede exceder 50 caracteres';
    }
    
    if (formData.descripcion && formData.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      await onSave({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
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
          <h3 className="text-lg font-semibold text-slate-800">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
        </div>

        <div className="p-5 space-y-4">
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
              placeholder="Ej: TELAS"
              autoFocus
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.nombre.length}/50 caracteres
            </p>
          </div>

          {/* Campo Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.descripcion ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Descripción opcional de la categoría"
              rows={3}
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.descripcion.length}/500 caracteres
            </p>
          </div>

          {/* Campo Estado */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Estado
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm text-gray-600">
                {formData.activa ? 'Activa' : 'Inactiva'}
              </span>
            </label>
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
                {categoria ? 'Actualizar' : 'Crear'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Confirmación de Eliminación
const DeleteConfirmModal = ({ isOpen, categoria, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !categoria) return null;

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
                Desactivar Categoría
              </h3>
              <div className="mt-2 text-sm text-slate-600">
                <p>¿Estás seguro de que deseas desactivar la categoría <strong>{categoria.nombre}</strong>?</p>
                
                {/* Solo mostrar si la categoría está activa */}
                {categoria.activa && (
                  <>
                    {(categoria.total_productos > 0 || categoria._count?.productos > 0) && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-amber-800 font-medium">
                          ⚠️ Esta categoría tiene {categoria.total_productos || categoria._count?.productos || 0} productos asociados
                        </p>
                        <p className="text-amber-700 text-xs mt-1">
                          No se puede desactivar una categoría con productos
                        </p>
                      </div>
                    )}
                    {(categoria.activa && categoria.total_productos === 0 && (!categoria._count || categoria._count.productos === 0)) && (
                      <p className="mt-2 text-amber-600 font-medium text-xs">
                        La categoría será desactivada y podrá reactivarse después.
                      </p>
                    )}
                  </>
                )}
                
                {/* Si la categoría ya está inactiva */}
                {!categoria.activa && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-gray-600">
                      Esta categoría ya está desactivada.
                    </p>
                  </div>
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
          {(categoria.total_productos === 0 && (!categoria._count || categoria._count.productos === 0)) && (
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

export default CategoriasPage;