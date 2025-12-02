import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Search,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  MapPin,
  Store,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ApiService from '../../services/api';

const BodegasAdmin = () => {
  const [bodegas, setBodegas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBodega, setSelectedBodega] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    direccion: '',
    es_punto_venta: false
  });

  // Cargar bodegas
  const loadBodegas = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getBodegas();
      if (response.success && response.data) {
        setBodegas(response.data);
      } else {
        setBodegas([]);
      }
    } catch (error) {
      console.error('Error loading bodegas:', error);
      setBodegas([]);
      setErrors({ general: 'Error al cargar las bodegas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBodegas();
  }, []);

  // Filtrar bodegas
  const bodegasFiltradas = bodegas.filter(bodega => {
    if (!bodega) return false;

    const searchLower = searchTerm.toLowerCase();
    const matchSearch = bodega.nombre?.toLowerCase().includes(searchLower) ||
                       bodega.codigo?.toLowerCase().includes(searchLower) ||
                       bodega.direccion?.toLowerCase().includes(searchLower);

    const matchStatus = filterStatus === 'todos' ||
                       (filterStatus === 'activas' && bodega.activa) ||
                       (filterStatus === 'inactivas' && !bodega.activa);

    const matchTipo = filterTipo === 'todos' ||
                     (filterTipo === 'punto_venta' && bodega.es_punto_venta) ||
                     (filterTipo === 'almacen' && !bodega.es_punto_venta);

    return matchSearch && matchStatus && matchTipo;
  });

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido';
    } else if (formData.codigo.length > 20) {
      newErrors.codigo = 'El código no puede tener más de 20 caracteres';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      direccion: '',
      es_punto_venta: false
    });
    setErrors({});
  };

  // Abrir modal de crear
  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Abrir modal de editar
  const handleEdit = (bodega) => {
    setSelectedBodega(bodega);
    setFormData({
      codigo: bodega.codigo || '',
      nombre: bodega.nombre || '',
      descripcion: bodega.descripcion || '',
      direccion: bodega.direccion || '',
      es_punto_venta: bodega.es_punto_venta || false
    });
    setErrors({});
    setShowEditModal(true);
  };

  // Guardar bodega (crear o editar)
  const handleSave = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      let response;
      if (showEditModal && selectedBodega) {
        response = await ApiService.updateBodega(selectedBodega.id_bodega, formData);
      } else {
        response = await ApiService.createBodega(formData);
      }

      if (response.success) {
        setSuccessMessage(showEditModal ? 'Bodega actualizada exitosamente' : 'Bodega creada exitosamente');
        setShowCreateModal(false);
        setShowEditModal(false);
        loadBodegas();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: response.message || 'Error al guardar la bodega' });
      }
    } catch (error) {
      console.error('Error saving bodega:', error);
      setErrors({ general: 'Error al guardar la bodega' });
    } finally {
      setProcessing(false);
    }
  };

  // Eliminar/Desactivar bodega
  const handleDelete = async (bodega) => {
    if (!confirm(`¿Estás seguro de desactivar la bodega "${bodega.nombre}"?`)) return;

    setProcessing(true);
    try {
      const response = await ApiService.deleteBodega(bodega.id_bodega);
      if (response.success) {
        setSuccessMessage('Bodega desactivada exitosamente');
        loadBodegas();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: response.message || 'Error al desactivar la bodega' });
      }
    } catch (error) {
      console.error('Error deleting bodega:', error);
      setErrors({ general: error.message || 'Error al desactivar la bodega' });
    } finally {
      setProcessing(false);
    }
  };

  // Toggle expandir fila
  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Modal de formulario
  const FormModal = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-blue-600" />
              {isEdit ? 'Editar Bodega' : 'Nueva Bodega'}
            </h3>
            <button
              onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.codigo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: BOD01, SALA"
              disabled={isEdit}
            />
            {errors.codigo && <p className="text-red-500 text-sm mt-1">{errors.codigo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Bodega Principal, Sala de Ventas"
            />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Descripción opcional..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Dirección física de la bodega"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="es_punto_venta"
              checked={formData.es_punto_venta}
              onChange={(e) => setFormData({ ...formData, es_punto_venta: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="es_punto_venta" className="flex items-center gap-2 cursor-pointer">
              <Store className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-800">Es punto de venta</p>
                <p className="text-sm text-gray-500">Marcar si esta bodega se usa para vender directamente</p>
              </div>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={processing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isEdit ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Warehouse className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Bodegas</h1>
            <p className="text-gray-500">Administra tus bodegas y puntos de venta</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nueva Bodega
        </button>
      </div>

      {/* Mensajes */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {errors.general}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="activas">Activas</option>
            <option value="inactivas">Inactivas</option>
          </select>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los tipos</option>
            <option value="punto_venta">Puntos de Venta</option>
            <option value="almacen">Almacenes</option>
          </select>
          <button
            onClick={loadBodegas}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : bodegasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron bodegas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bodega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bodegasFiltradas.map((bodega) => (
                <React.Fragment key={bodega.id_bodega}>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleRow(bodega.id_bodega)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedRows.has(bodega.id_bodega) ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <div className={`p-2 rounded-lg ${bodega.es_punto_venta ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {bodega.es_punto_venta ? (
                            <Store className="w-5 h-5 text-green-600" />
                          ) : (
                            <Package className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{bodega.nombre}</p>
                          <p className="text-sm text-gray-500">{bodega.codigo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bodega.es_punto_venta
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {bodega.es_punto_venta ? 'Punto de Venta' : 'Almacén'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {bodega.direccion ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{bodega.direccion}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin dirección</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bodega.activa
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bodega.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(bodega)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {bodega.activa && (
                          <button
                            onClick={() => handleDelete(bodega)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Desactivar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(bodega.id_bodega) && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Descripción:</p>
                            <p className="text-gray-800">{bodega.descripcion || 'Sin descripción'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fecha de creación:</p>
                            <p className="text-gray-800">
                              {bodega.fecha_creacion
                                ? new Date(bodega.fecha_creacion).toLocaleDateString('es-CL')
                                : 'N/A'}
                            </p>
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

      {/* Resumen */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <p>
          Mostrando {bodegasFiltradas.length} de {bodegas.length} bodegas
        </p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            {bodegas.filter(b => b.activa).length} activas
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            {bodegas.filter(b => !b.activa).length} inactivas
          </span>
        </div>
      </div>

      {/* Modales */}
      {showCreateModal && <FormModal />}
      {showEditModal && <FormModal isEdit />}
    </div>
  );
};

export default BodegasAdmin;
