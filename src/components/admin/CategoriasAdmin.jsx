import React, { useState, useEffect } from 'react';
import {
  FolderOpen, Plus, Edit2, Trash2, Search, RefreshCw, Check, X,
  AlertCircle, Package, ChevronDown, ChevronRight
} from 'lucide-react';
import ApiService from '../../services/api';

const CategoriasAdmin = ({ onBack }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [expandedCategoria, setExpandedCategoria] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activa: true
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getCategorias();
      if (response?.success) {
        setCategorias(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (categoria = null) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        activa: categoria.activa !== false
      });
    } else {
      setEditingCategoria(null);
      setFormData({ nombre: '', descripcion: '', activa: true });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategoria(null);
    setFormData({ nombre: '', descripcion: '', activa: true });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      let response;
      if (editingCategoria) {
        response = await ApiService.updateCategoria(editingCategoria.id_categoria, formData);
      } else {
        response = await ApiService.createCategoria(formData);
      }

      if (response?.success) {
        handleCloseModal();
        await loadCategorias();
      } else {
        setErrors({ general: response?.message || 'Error al guardar la categoría' });
      }
    } catch (error) {
      console.error('Error guardando categoría:', error);
      setErrors({ general: 'Error al guardar la categoría' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoria) => {
    try {
      const response = await ApiService.deleteCategoria(categoria.id_categoria);
      if (response?.success) {
        setConfirmDelete(null);
        await loadCategorias();
      } else {
        alert(response?.message || 'Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      alert('Error al eliminar la categoría. Puede que tenga productos asociados.');
    }
  };

  const handleToggleActive = async (categoria) => {
    try {
      const response = await ApiService.updateCategoria(categoria.id_categoria, {
        activa: !categoria.activa
      });
      if (response?.success) {
        await loadCategorias();
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
    }
  };

  const filteredCategorias = categorias.filter(cat =>
    cat.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoriasActivas = filteredCategorias.filter(c => c.activa);
  const categoriasInactivas = filteredCategorias.filter(c => !c.activa);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FolderOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Categorías</h1>
            <p className="text-gray-500 text-sm">Organiza los productos por categorías</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            onClick={loadCategorias}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Categorías</p>
              <p className="text-2xl font-bold text-gray-800">{categorias.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Activas</p>
              <p className="text-2xl font-bold text-green-600">{categoriasActivas.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactivas</p>
              <p className="text-2xl font-bold text-gray-500">{categoriasInactivas.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No se encontraron categorías</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCategorias.map(categoria => (
              <div key={categoria.id_categoria} className="hover:bg-gray-50">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => setExpandedCategoria(
                        expandedCategoria === categoria.id_categoria ? null : categoria.id_categoria
                      )}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedCategoria === categoria.id_categoria ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <div className={`p-2 rounded-lg ${categoria.activa ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <FolderOpen className={`w-5 h-5 ${categoria.activa ? 'text-indigo-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${categoria.activa ? 'text-gray-800' : 'text-gray-400'}`}>
                        {categoria.nombre}
                      </h3>
                      {categoria.descripcion && (
                        <p className="text-sm text-gray-500 line-clamp-1">{categoria.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {categoria.productos_count !== undefined && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                          <Package className="w-3 h-3" />
                          {categoria.productos_count} productos
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        categoria.activa
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {categoria.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(categoria)}
                      className={`p-2 rounded-lg transition-colors ${
                        categoria.activa
                          ? 'hover:bg-gray-200 text-gray-600'
                          : 'hover:bg-green-100 text-green-600'
                      }`}
                      title={categoria.activa ? 'Desactivar' : 'Activar'}
                    >
                      {categoria.activa ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenModal(categoria)}
                      className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(categoria)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Detalle expandido */}
                {expandedCategoria === categoria.id_categoria && (
                  <div className="px-4 pb-4 pl-16 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2 font-mono">{categoria.id_categoria}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Creada:</span>
                        <span className="ml-2">
                          {categoria.fecha_creacion
                            ? new Date(categoria.fecha_creacion).toLocaleDateString('es-CL')
                            : 'N/A'}
                        </span>
                      </div>
                      {categoria.descripcion && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Descripción:</span>
                          <p className="mt-1 text-gray-700">{categoria.descripcion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  {errors.general}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Telas, Corchetes, Hilos..."
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Descripción opcional..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
                <span className="text-sm text-gray-700">Categoría activa</span>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingCategoria ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Eliminar Categoría</h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar la categoría <strong>"{confirmDelete.nombre}"</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriasAdmin;
