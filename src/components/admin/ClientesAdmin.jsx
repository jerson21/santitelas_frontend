// /src/components/admin/ClientesAdmin.jsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Save
} from 'lucide-react';
import apiService from '../../services/api';

const ClientesAdmin = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // todos, persona, empresa
  const [filtroActivo, setFiltroActivo] = useState('todos'); // todos, activos, inactivos

  // Modal de crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    rut: '',
    tipo_cliente: 'persona',
    nombre: '',
    telefono: '',
    email: '',
    razon_social: '',
    direccion: '',
    comuna: '',
    giro: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Modal de detalle/vales
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [valesCliente, setValesCliente] = useState([]);
  const [loadingVales, setLoadingVales] = useState(false);

  // Expandir cliente
  const [clientesExpandidos, setClientesExpandidos] = useState({});

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await apiService.getClientesAdmin();
      if (response.success) {
        setClientes(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCliente(null);
    setFormData({
      rut: '',
      tipo_cliente: 'persona',
      nombre: '',
      telefono: '',
      email: '',
      razon_social: '',
      direccion: '',
      comuna: '',
      giro: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      rut: cliente.rut || '',
      tipo_cliente: cliente.tipo_cliente || 'persona',
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      razon_social: cliente.razon_social || '',
      direccion: cliente.direccion || '',
      comuna: cliente.comuna || '',
      giro: cliente.giro || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validarFormulario = () => {
    const errors = {};

    // Validar RUT
    if (!formData.rut.trim()) {
      errors.rut = 'RUT es obligatorio';
    } else {
      // Validar formato RUT (sin puntos, con guión)
      const rutRegex = /^[0-9]{7,8}-[0-9Kk]$/;
      if (!rutRegex.test(formData.rut.replace(/\./g, ''))) {
        errors.rut = 'Formato de RUT inválido (ej: 12345678-9)';
      }
    }

    // Validar nombre para persona
    if (formData.tipo_cliente === 'persona' && !formData.nombre.trim()) {
      errors.nombre = 'Nombre es obligatorio';
    }

    // Validar datos de empresa
    if (formData.tipo_cliente === 'empresa') {
      if (!formData.razon_social.trim()) {
        errors.razon_social = 'Razón social es obligatoria para empresas';
      }
      if (!formData.giro.trim()) {
        errors.giro = 'Giro es obligatorio para empresas';
      }
      if (!formData.direccion.trim()) {
        errors.direccion = 'Dirección es obligatoria para empresas';
      }
      if (!formData.comuna.trim()) {
        errors.comuna = 'Comuna es obligatoria para empresas';
      }
    }

    // Validar email si se proporciona
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validarFormulario()) return;

    setSaving(true);
    try {
      // Limpiar RUT de puntos
      const rutLimpio = formData.rut.replace(/\./g, '');

      const dataToSend = {
        ...formData,
        rut: rutLimpio,
        datos_completos: formData.tipo_cliente === 'empresa'
          ? !!(formData.razon_social && formData.direccion && formData.comuna && formData.giro)
          : !!(formData.nombre)
      };

      let response;
      if (editingCliente) {
        response = await apiService.updateClienteAdmin(editingCliente.id_cliente, dataToSend);
      } else {
        response = await apiService.createClienteAdmin(dataToSend);
      }

      if (response.success) {
        setShowModal(false);
        cargarClientes();
      } else {
        setFormErrors({ general: response.message || 'Error al guardar cliente' });
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
      setFormErrors({ general: error.message || 'Error al guardar cliente' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (cliente) => {
    try {
      const response = await apiService.toggleClienteAdmin(cliente.id_cliente, !cliente.activo);
      if (response.success) {
        cargarClientes();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const handleVerDetalle = async (cliente) => {
    setClienteDetalle(cliente);
    setShowDetalleModal(true);
    setLoadingVales(true);

    try {
      const response = await apiService.getValesCliente(cliente.rut);
      if (response.success) {
        setValesCliente(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando vales:', error);
      setValesCliente([]);
    } finally {
      setLoadingVales(false);
    }
  };

  const toggleExpandido = (id) => {
    setClientesExpandidos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const formatRut = (rut) => {
    if (!rut) return '';
    // Quitar puntos y guión
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    // Agregar puntos y guión
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);
    let formateado = '';
    for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
      formateado = cuerpo[i] + formateado;
      if ((j + 1) % 3 === 0 && i > 0) {
        formateado = '.' + formateado;
      }
    }
    return `${formateado}-${dv.toUpperCase()}`;
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        cliente.rut?.toLowerCase().includes(term) ||
        cliente.nombre?.toLowerCase().includes(term) ||
        cliente.razon_social?.toLowerCase().includes(term) ||
        cliente.email?.toLowerCase().includes(term) ||
        cliente.telefono?.includes(term);
      if (!matchSearch) return false;
    }

    // Filtro de tipo
    if (filtroTipo !== 'todos' && cliente.tipo_cliente !== filtroTipo) {
      return false;
    }

    // Filtro de activo
    if (filtroActivo === 'activos' && !cliente.activo) return false;
    if (filtroActivo === 'inactivos' && cliente.activo) return false;

    return true;
  });

  // Estadísticas
  const stats = {
    total: clientes.length,
    personas: clientes.filter(c => c.tipo_cliente === 'persona').length,
    empresas: clientes.filter(c => c.tipo_cliente === 'empresa').length,
    activos: clientes.filter(c => c.activo).length,
    conDatosCompletos: clientes.filter(c => c.datos_completos).length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h1>
            <p className="text-sm text-gray-500">Administrar datos de clientes y facturación</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cargarClientes}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Clientes</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Personas</p>
          <p className="text-2xl font-bold text-green-900">{stats.personas}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Empresas</p>
          <p className="text-2xl font-bold text-purple-900">{stats.empresas}</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <p className="text-sm text-teal-600 font-medium">Activos</p>
          <p className="text-2xl font-bold text-teal-900">{stats.activos}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Datos Completos</p>
          <p className="text-2xl font-bold text-orange-900">{stats.conDatosCompletos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por RUT, nombre, razón social..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro tipo */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filtroTipo === 'todos' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('persona')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                filtroTipo === 'persona' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              <User className="w-4 h-4" />
              Personas
            </button>
            <button
              onClick={() => setFiltroTipo('empresa')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                filtroTipo === 'empresa' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Empresas
            </button>
          </div>

          {/* Filtro activo */}
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron clientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Compras</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => (
                  <React.Fragment key={cliente.id_cliente}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            cliente.tipo_cliente === 'empresa' ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            {cliente.tipo_cliente === 'empresa' ? (
                              <Building2 className="w-5 h-5 text-purple-600" />
                            ) : (
                              <User className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {cliente.razon_social || cliente.nombre || 'Sin nombre'}
                            </p>
                            <p className="text-sm text-gray-500">{formatRut(cliente.rut)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          cliente.tipo_cliente === 'empresa'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {cliente.tipo_cliente === 'empresa' ? 'Empresa' : 'Persona'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {cliente.telefono && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone className="w-3 h-3" />
                              {cliente.telefono}
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Mail className="w-3 h-3" />
                              {cliente.email}
                            </div>
                          )}
                          {!cliente.telefono && !cliente.email && (
                            <span className="text-gray-400 italic">Sin contacto</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {cliente.direccion ? (
                          <div className="text-sm text-gray-600">
                            <div className="flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{cliente.direccion}</span>
                            </div>
                            {cliente.comuna && (
                              <span className="text-xs text-gray-500">{cliente.comuna}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Sin dirección</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            cliente.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {cliente.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          {cliente.datos_completos && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Datos OK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{cliente.total_compras || 0}</p>
                          <p className="text-xs text-gray-500">compras</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleVerDetalle(cliente)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(cliente)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActivo(cliente)}
                            className={`p-1.5 rounded transition-colors ${
                              cliente.activo
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={cliente.activo ? 'Desactivar' : 'Activar'}
                          >
                            {cliente.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {formErrors.general}
                </div>
              )}

              {/* Tipo de cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cliente *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo_cliente: 'persona' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      formData.tipo_cliente === 'persona'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Persona Natural
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo_cliente: 'empresa' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      formData.tipo_cliente === 'empresa'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    Empresa
                  </button>
                </div>
              </div>

              {/* RUT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="12345678-9"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.rut ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={!!editingCliente}
                />
                {formErrors.rut && <p className="text-red-500 text-sm mt-1">{formErrors.rut}</p>}
              </div>

              {/* Nombre (persona) o Razón Social (empresa) */}
              {formData.tipo_cliente === 'persona' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Juan Pérez González"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      formErrors.nombre ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.nombre && <p className="text-red-500 text-sm mt-1">{formErrors.nombre}</p>}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                    <input
                      type="text"
                      value={formData.razon_social}
                      onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                      placeholder="Empresa S.A."
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        formErrors.razon_social ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {formErrors.razon_social && <p className="text-red-500 text-sm mt-1">{formErrors.razon_social}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giro *</label>
                    <input
                      type="text"
                      value={formData.giro}
                      onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                      placeholder="Venta de productos textiles"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        formErrors.giro ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {formErrors.giro && <p className="text-red-500 text-sm mt-1">{formErrors.giro}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Contacto</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre del contacto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Contacto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@ejemplo.cl"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>
              </div>

              {/* Dirección (obligatoria para empresa) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección {formData.tipo_cliente === 'empresa' && '*'}
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Av. Principal 123, Of. 456"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.direccion ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {formErrors.direccion && <p className="text-red-500 text-sm mt-1">{formErrors.direccion}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comuna {formData.tipo_cliente === 'empresa' && '*'}
                </label>
                <input
                  type="text"
                  value={formData.comuna}
                  onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                  placeholder="Santiago"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.comuna ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {formErrors.comuna && <p className="text-red-500 text-sm mt-1">{formErrors.comuna}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Cliente */}
      {showDetalleModal && clienteDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  clienteDetalle.tipo_cliente === 'empresa' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {clienteDetalle.tipo_cliente === 'empresa' ? (
                    <Building2 className="w-5 h-5 text-purple-600" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {clienteDetalle.razon_social || clienteDetalle.nombre || 'Cliente'}
                  </h3>
                  <p className="text-sm text-gray-500">{formatRut(clienteDetalle.rut)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetalleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Datos del cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Datos de Facturación
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Tipo:</span> {clienteDetalle.tipo_cliente === 'empresa' ? 'Empresa' : 'Persona Natural'}</p>
                    <p><span className="text-gray-500">RUT:</span> {formatRut(clienteDetalle.rut)}</p>
                    {clienteDetalle.razon_social && (
                      <p><span className="text-gray-500">Razón Social:</span> {clienteDetalle.razon_social}</p>
                    )}
                    {clienteDetalle.giro && (
                      <p><span className="text-gray-500">Giro:</span> {clienteDetalle.giro}</p>
                    )}
                    {clienteDetalle.direccion && (
                      <p><span className="text-gray-500">Dirección:</span> {clienteDetalle.direccion}</p>
                    )}
                    {clienteDetalle.comuna && (
                      <p><span className="text-gray-500">Comuna:</span> {clienteDetalle.comuna}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contacto
                  </h4>
                  <div className="space-y-2 text-sm">
                    {clienteDetalle.nombre && (
                      <p><span className="text-gray-500">Nombre:</span> {clienteDetalle.nombre}</p>
                    )}
                    {clienteDetalle.telefono && (
                      <p><span className="text-gray-500">Teléfono:</span> {clienteDetalle.telefono}</p>
                    )}
                    {clienteDetalle.email && (
                      <p><span className="text-gray-500">Email:</span> {clienteDetalle.email}</p>
                    )}
                    <p>
                      <span className="text-gray-500">Estado:</span>{' '}
                      <span className={clienteDetalle.activo ? 'text-green-600' : 'text-red-600'}>
                        {clienteDetalle.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </p>
                    <p><span className="text-gray-500">Creado:</span> {formatDate(clienteDetalle.fecha_creacion)}</p>
                  </div>
                </div>
              </div>

              {/* Historial de compras */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Historial de Compras
                </h4>

                {loadingVales ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                ) : valesCliente.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Este cliente no tiene compras registradas</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vale</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {valesCliente.slice(0, 10).map((vale, idx) => (
                          <tr key={idx} className="hover:bg-white">
                            <td className="px-4 py-2 text-sm font-medium text-blue-600">
                              {vale.numero_pedido || vale.numero_display}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {formatDate(vale.fecha_creacion || vale.fecha)}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                vale.estado === 'completado'
                                  ? 'bg-green-100 text-green-800'
                                  : vale.estado === 'vale_pendiente'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {vale.estado === 'completado' ? 'Pagado' : vale.estado === 'vale_pendiente' ? 'Pendiente' : vale.estado}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-medium text-green-700">
                              ${formatCurrency(vale.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {valesCliente.length > 10 && (
                      <div className="text-center py-2 text-sm text-gray-500 bg-gray-100">
                        Mostrando 10 de {valesCliente.length} compras
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetalleModal(false);
                  handleOpenEdit(clienteDetalle);
                }}
                className="px-4 py-2 text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => setShowDetalleModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesAdmin;
