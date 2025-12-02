// /src/components/admin/ClientesAdmin.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
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
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Save,
  Upload,
  Download,
  CreditCard,
  Percent,
  Clock,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import apiService from '../../services/api';
import * as XLSX from 'xlsx';

const ClientesAdmin = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroActivo, setFiltroActivo] = useState('todos');

  // Modal de crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [activeTab, setActiveTab] = useState('basicos');
  const [formData, setFormData] = useState(getEmptyFormData());
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Modal de detalle
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [valesCliente, setValesCliente] = useState([]);
  const [loadingVales, setLoadingVales] = useState(false);

  // Modal de importación
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importMode, setImportMode] = useState('crear_actualizar');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  function getEmptyFormData() {
    return {
      rut: '',
      tipo_cliente: 'persona',
      nombre: '',
      nombre_fantasia: '',
      codigo_cliente: '',
      telefono: '',
      celular: '',
      email: '',
      razon_social: '',
      direccion: '',
      ciudad: '',
      comuna: '',
      giro: '',
      contacto_pago: '',
      email_pago: '',
      telefono_pago: '',
      contacto_comercial: '',
      email_comercial: '',
      descuento_default: 0,
      linea_credito: 0,
      dias_credito: 0,
      forma_pago_default: '',
      lista_precios: '',
      restringir_si_vencido: false,
      dias_adicionales_morosidad: 0
    };
  }

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
    setFormData(getEmptyFormData());
    setFormErrors({});
    setActiveTab('basicos');
    setShowModal(true);
  };

  const handleOpenEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      rut: cliente.rut || '',
      tipo_cliente: cliente.tipo_cliente || 'persona',
      nombre: cliente.nombre || '',
      nombre_fantasia: cliente.nombre_fantasia || '',
      codigo_cliente: cliente.codigo_cliente || '',
      telefono: cliente.telefono || '',
      celular: cliente.celular || '',
      email: cliente.email || '',
      razon_social: cliente.razon_social || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      comuna: cliente.comuna || '',
      giro: cliente.giro || '',
      contacto_pago: cliente.contacto_pago || '',
      email_pago: cliente.email_pago || '',
      telefono_pago: cliente.telefono_pago || '',
      contacto_comercial: cliente.contacto_comercial || '',
      email_comercial: cliente.email_comercial || '',
      descuento_default: cliente.descuento_default || 0,
      linea_credito: cliente.linea_credito || 0,
      dias_credito: cliente.dias_credito || 0,
      forma_pago_default: cliente.forma_pago_default || '',
      lista_precios: cliente.lista_precios || '',
      restringir_si_vencido: cliente.restringir_si_vencido || false,
      dias_adicionales_morosidad: cliente.dias_adicionales_morosidad || 0
    });
    setFormErrors({});
    setActiveTab('basicos');
    setShowModal(true);
  };

  const validarFormulario = () => {
    const errors = {};
    if (!formData.rut.trim()) {
      errors.rut = 'RUT es obligatorio';
    }
    if (formData.tipo_cliente === 'persona' && !formData.nombre.trim()) {
      errors.nombre = 'Nombre es obligatorio';
    }
    if (formData.tipo_cliente === 'empresa') {
      if (!formData.razon_social.trim()) errors.razon_social = 'Razón social es obligatoria';
      if (!formData.giro.trim()) errors.giro = 'Giro es obligatorio';
      if (!formData.direccion.trim()) errors.direccion = 'Dirección es obligatoria';
      if (!formData.comuna.trim()) errors.comuna = 'Comuna es obligatoria';
    }
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
      const rutLimpio = formData.rut.replace(/\./g, '');
      const dataToSend = {
        ...formData,
        rut: rutLimpio,
        datos_completos: formData.tipo_cliente === 'empresa'
          ? !!(formData.razon_social && formData.direccion && formData.comuna && formData.giro)
          : !!formData.nombre
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
        setFormErrors({ general: response.message || 'Error al guardar' });
      }
    } catch (error) {
      setFormErrors({ general: error.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (cliente) => {
    try {
      await apiService.toggleClienteAdmin(cliente.id_cliente, !cliente.activo);
      cargarClientes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleVerDetalle = async (cliente) => {
    setClienteDetalle(cliente);
    setShowDetalleModal(true);
    setLoadingVales(true);
    try {
      const response = await apiService.getValesCliente(cliente.rut);
      setValesCliente(response.success ? response.data || [] : []);
    } catch (error) {
      setValesCliente([]);
    } finally {
      setLoadingVales(false);
    }
  };

  // Importación Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Mapear campos del Excel
        const mappedData = data.map(row => ({
          rut: row['RUT'] || row.rut || '',
          tipo_cliente: (row['Tipo'] || row.tipo || '').toLowerCase() === 'empresa' ? 'empresa' : 'persona',
          nombre_fantasia: row['Nombre fantasía'] || row.nombre_fantasia || '',
          razon_social: row['Nombre/Razón social'] || row.razon_social || '',
          nombre: row['Nombre/Razón social'] || row.nombre || '',
          codigo_cliente: row['Código'] || row.codigo_cliente || '',
          giro: row['Giro'] || row.giro || '',
          direccion: row['Dirección'] || row.direccion || '',
          ciudad: row['Ciudad'] || row.ciudad || '',
          comuna: row['Comuna'] || row.comuna || '',
          telefono: row['Teléfono'] || row.telefono || '',
          celular: row['Celular'] || row.celular || '',
          email: row['Correo electrónico'] || row.email || '',
          contacto_pago: row['Contacto pago'] || row.contacto_pago || '',
          email_pago: row['Correo electrónico pago'] || row.email_pago || '',
          telefono_pago: row['Teléfono pago'] || row.telefono_pago || '',
          contacto_comercial: row['Contacto comercial'] || row.contacto_comercial || '',
          email_comercial: row['Correo(s) electrónico(s) comercial'] || row.email_comercial || '',
          descuento_default: parseFloat(row['Descuento'] || row.descuento_default || 0) || 0,
          linea_credito: parseFloat(row['Línea de crédito asignada'] || row.linea_credito || 0) || 0,
          dias_credito: parseInt(row['Crédito'] || row.dias_credito || 0) || 0,
          forma_pago_default: row['Forma de pago'] || row.forma_pago_default || '',
          lista_precios: row['Lista de precios'] || row.lista_precios || '',
          restringir_si_vencido: row['Restringir si existe un documento vencido'] === 'SI',
          dias_adicionales_morosidad: parseInt(row['Días adicionales de morosidad'] || 0) || 0,
          estado: row['Estado'] || 'Vigente'
        }));

        setImportData(mappedData);
        setImportPreview(mappedData.slice(0, 10));
        setImportResult(null);
      } catch (error) {
        console.error('Error leyendo Excel:', error);
        alert('Error al leer el archivo Excel');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (importData.length === 0) return;
    setImporting(true);
    try {
      const response = await apiService.importarClientesAdmin(importData, importMode);
      setImportResult(response.data);
      if (response.success) {
        cargarClientes();
      }
    } catch (error) {
      setImportResult({ error: error.message });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'RUT': '12345678-9',
        'Tipo': 'Empresa',
        'Nombre fantasía': 'Mi Empresa',
        'Nombre/Razón social': 'Mi Empresa SpA',
        'Código': 'CLI001',
        'Giro': 'Venta de productos',
        'Dirección': 'Av. Principal 123',
        'Ciudad': 'Santiago',
        'Comuna': 'Providencia',
        'Teléfono': '+56 2 1234567',
        'Celular': '+56 9 12345678',
        'Correo electrónico': 'contacto@empresa.cl',
        'Contacto pago': 'Juan Pérez',
        'Correo electrónico pago': 'pagos@empresa.cl',
        'Teléfono pago': '+56 9 87654321',
        'Contacto comercial': 'María López',
        'Correo(s) electrónico(s) comercial': 'ventas@empresa.cl',
        'Descuento': 5,
        'Línea de crédito asignada': 1000000,
        'Crédito': 30,
        'Forma de pago': '30 días',
        'Lista de precios': 'Lista A',
        'Restringir si existe un documento vencido': 'NO',
        'Días adicionales de morosidad': 0,
        'Estado': 'Vigente'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'plantilla_clientes.xlsx');
  };

  const formatCurrency = (amount) => Number(amount || 0).toLocaleString('es-CL');
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('es-CL') : 'N/A';
  const formatRut = (rut) => {
    if (!rut) return '';
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);
    let formateado = '';
    for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
      formateado = cuerpo[i] + formateado;
      if ((j + 1) % 3 === 0 && i > 0) formateado = '.' + formateado;
    }
    return `${formateado}-${dv.toUpperCase()}`;
  };

  const clientesFiltrados = clientes.filter(cliente => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = cliente.rut?.toLowerCase().includes(term) ||
        cliente.nombre?.toLowerCase().includes(term) ||
        cliente.razon_social?.toLowerCase().includes(term) ||
        cliente.nombre_fantasia?.toLowerCase().includes(term) ||
        cliente.codigo_cliente?.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (filtroTipo !== 'todos' && cliente.tipo_cliente !== filtroTipo) return false;
    if (filtroActivo === 'activos' && !cliente.activo) return false;
    if (filtroActivo === 'inactivos' && cliente.activo) return false;
    return true;
  });

  const stats = {
    total: clientes.length,
    personas: clientes.filter(c => c.tipo_cliente === 'persona').length,
    empresas: clientes.filter(c => c.tipo_cliente === 'empresa').length,
    activos: clientes.filter(c => c.activo).length
  };

  // Componente de tabs para el formulario
  const FormTabs = () => (
    <div className="flex border-b border-gray-200 mb-4">
      {[
        { id: 'basicos', label: 'Datos Básicos', icon: User },
        { id: 'facturacion', label: 'Facturación', icon: FileText },
        { id: 'contactos', label: 'Contactos', icon: Phone },
        { id: 'credito', label: 'Crédito', icon: CreditCard }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-cyan-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h1>
            <p className="text-sm text-gray-500">Administrar datos de clientes y facturación</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImportModal(true); setImportData([]); setImportPreview([]); setImportResult(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="w-4 h-4" />
            Importar Excel
          </button>
          <button onClick={cargarClientes} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total</p>
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
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por RUT, nombre, código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['todos', 'persona', 'empresa'].map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  filtroTipo === tipo ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                }`}
              >
                {tipo === 'todos' ? 'Todos' : tipo === 'persona' ? 'Personas' : 'Empresas'}
              </button>
            ))}
          </div>
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crédito</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientesFiltrados.map(cliente => (
                  <tr key={cliente.id_cliente} className="hover:bg-gray-50">
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
                            {cliente.nombre_fantasia || cliente.razon_social || cliente.nombre || 'Sin nombre'}
                          </p>
                          <p className="text-sm text-gray-500">{formatRut(cliente.rut)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cliente.codigo_cliente || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {cliente.telefono && <div className="flex items-center gap-1 text-gray-600"><Phone className="w-3 h-3" />{cliente.telefono}</div>}
                        {cliente.email && <div className="flex items-center gap-1 text-gray-600 truncate max-w-[200px]"><Mail className="w-3 h-3" />{cliente.email}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {cliente.linea_credito > 0 && (
                          <div className="text-green-600 font-medium">${formatCurrency(cliente.linea_credito)}</div>
                        )}
                        {cliente.descuento_default > 0 && (
                          <div className="text-blue-600">{cliente.descuento_default}% dto</div>
                        )}
                        {cliente.dias_credito > 0 && (
                          <div className="text-gray-500 text-xs">{cliente.dias_credito} días</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        cliente.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleVerDetalle(cliente)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(cliente)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(cliente)}
                          className={`p-1.5 rounded ${cliente.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={cliente.activo ? 'Desactivar' : 'Activar'}
                        >
                          {cliente.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {formErrors.general}
                </div>
              )}

              <FormTabs />

              {/* Tab: Datos Básicos */}
              {activeTab === 'basicos' && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    {['persona', 'empresa'].map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo_cliente: tipo })}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 ${
                          formData.tipo_cliente === tipo
                            ? tipo === 'empresa' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {tipo === 'empresa' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        {tipo === 'empresa' ? 'Empresa' : 'Persona'}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
                      <input
                        type="text"
                        value={formData.rut}
                        onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                        placeholder="12345678-9"
                        disabled={!!editingCliente}
                        className={`w-full px-3 py-2 border rounded-lg ${formErrors.rut ? 'border-red-300' : 'border-gray-300'} ${editingCliente ? 'bg-gray-100' : ''}`}
                      />
                      {formErrors.rut && <p className="text-red-500 text-sm mt-1">{formErrors.rut}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código Cliente</label>
                      <input
                        type="text"
                        value={formData.codigo_cliente}
                        onChange={(e) => setFormData({ ...formData, codigo_cliente: e.target.value })}
                        placeholder="CLI001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {formData.tipo_cliente === 'empresa' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                        <input
                          type="text"
                          value={formData.razon_social}
                          onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg ${formErrors.razon_social ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {formErrors.razon_social && <p className="text-red-500 text-sm mt-1">{formErrors.razon_social}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Fantasía</label>
                        <input
                          type="text"
                          value={formData.nombre_fantasia}
                          onChange={(e) => setFormData({ ...formData, nombre_fantasia: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${formErrors.nombre ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      {formErrors.nombre && <p className="text-red-500 text-sm mt-1">{formErrors.nombre}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                      <input
                        type="text"
                        value={formData.celular}
                        onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${formErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                  </div>
                </div>
              )}

              {/* Tab: Facturación */}
              {activeTab === 'facturacion' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giro {formData.tipo_cliente === 'empresa' && '*'}</label>
                    <input
                      type="text"
                      value={formData.giro}
                      onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${formErrors.giro ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {formErrors.giro && <p className="text-red-500 text-sm mt-1">{formErrors.giro}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección {formData.tipo_cliente === 'empresa' && '*'}</label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${formErrors.direccion ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {formErrors.direccion && <p className="text-red-500 text-sm mt-1">{formErrors.direccion}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                      <input
                        type="text"
                        value={formData.ciudad}
                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comuna {formData.tipo_cliente === 'empresa' && '*'}</label>
                      <input
                        type="text"
                        value={formData.comuna}
                        onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${formErrors.comuna ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      {formErrors.comuna && <p className="text-red-500 text-sm mt-1">{formErrors.comuna}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Contactos */}
              {activeTab === 'contactos' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Contacto de Pago</h4>
                  <div className="grid grid-cols-3 gap-4 pl-4">
                    <input type="text" placeholder="Nombre contacto" value={formData.contacto_pago}
                      onChange={(e) => setFormData({ ...formData, contacto_pago: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="email" placeholder="Email" value={formData.email_pago}
                      onChange={(e) => setFormData({ ...formData, email_pago: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Teléfono" value={formData.telefono_pago}
                      onChange={(e) => setFormData({ ...formData, telefono_pago: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>

                  <h4 className="font-medium text-gray-700 flex items-center gap-2 mt-4"><ShoppingCart className="w-4 h-4" /> Contacto Comercial</h4>
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <input type="text" placeholder="Nombre contacto" value={formData.contacto_comercial}
                      onChange={(e) => setFormData({ ...formData, contacto_comercial: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="email" placeholder="Email(s)" value={formData.email_comercial}
                      onChange={(e) => setFormData({ ...formData, email_comercial: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              )}

              {/* Tab: Crédito */}
              {activeTab === 'credito' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descuento por defecto (%)</label>
                      <input type="number" min="0" max="100" step="0.5" value={formData.descuento_default}
                        onChange={(e) => setFormData({ ...formData, descuento_default: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Línea de crédito ($)</label>
                      <input type="number" min="0" value={formData.linea_credito}
                        onChange={(e) => setFormData({ ...formData, linea_credito: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Días de crédito</label>
                      <input type="number" min="0" value={formData.dias_credito}
                        onChange={(e) => setFormData({ ...formData, dias_credito: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label>
                      <select value={formData.forma_pago_default}
                        onChange={(e) => setFormData({ ...formData, forma_pago_default: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">Seleccionar...</option>
                        <option value="Contado">Contado</option>
                        <option value="30 días">30 días</option>
                        <option value="60 días">60 días</option>
                        <option value="90 días">90 días</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lista de precios</label>
                      <input type="text" value={formData.lista_precios}
                        onChange={(e) => setFormData({ ...formData, lista_precios: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Días adicionales morosidad</label>
                      <input type="number" min="0" value={formData.dias_adicionales_morosidad}
                        onChange={(e) => setFormData({ ...formData, dias_adicionales_morosidad: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="restringir" checked={formData.restringir_si_vencido}
                      onChange={(e) => setFormData({ ...formData, restringir_si_vencido: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <label htmlFor="restringir" className="text-sm text-gray-700">Restringir si existe documento vencido</label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingCliente ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetalleModal && clienteDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  clienteDetalle.tipo_cliente === 'empresa' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {clienteDetalle.tipo_cliente === 'empresa' ? <Building2 className="w-5 h-5 text-purple-600" /> : <User className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{clienteDetalle.nombre_fantasia || clienteDetalle.razon_social || clienteDetalle.nombre}</h3>
                  <p className="text-sm text-gray-500">{formatRut(clienteDetalle.rut)} {clienteDetalle.codigo_cliente && `• ${clienteDetalle.codigo_cliente}`}</p>
                </div>
              </div>
              <button onClick={() => setShowDetalleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Facturación</h4>
                  <div className="space-y-1 text-sm">
                    {clienteDetalle.giro && <p><span className="text-gray-500">Giro:</span> {clienteDetalle.giro}</p>}
                    {clienteDetalle.direccion && <p><span className="text-gray-500">Dirección:</span> {clienteDetalle.direccion}</p>}
                    {clienteDetalle.comuna && <p><span className="text-gray-500">Comuna:</span> {clienteDetalle.comuna}</p>}
                    {clienteDetalle.ciudad && <p><span className="text-gray-500">Ciudad:</span> {clienteDetalle.ciudad}</p>}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Crédito</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Línea:</span> ${formatCurrency(clienteDetalle.linea_credito)}</p>
                    <p><span className="text-gray-500">Descuento:</span> {clienteDetalle.descuento_default || 0}%</p>
                    <p><span className="text-gray-500">Días:</span> {clienteDetalle.dias_credito || 0}</p>
                    <p><span className="text-gray-500">Forma pago:</span> {clienteDetalle.forma_pago_default || 'No definido'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Historial de Compras</h4>
                {loadingVales ? (
                  <div className="flex justify-center py-4"><RefreshCw className="w-6 h-6 text-blue-600 animate-spin" /></div>
                ) : valesCliente.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Sin compras registradas</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Vale</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {valesCliente.slice(0, 10).map((vale, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-2 text-sm text-blue-600">{vale.numero_pedido}</td>
                          <td className="px-2 py-2 text-sm">{formatDate(vale.fecha_creacion)}</td>
                          <td className="px-2 py-2"><span className={`text-xs px-2 py-1 rounded-full ${vale.estado === 'completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{vale.estado}</span></td>
                          <td className="px-2 py-2 text-sm text-right font-medium">${formatCurrency(vale.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={() => { setShowDetalleModal(false); handleOpenEdit(clienteDetalle); }} className="px-4 py-2 text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 flex items-center gap-2">
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => setShowDetalleModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                Importar Clientes desde Excel
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!importResult && (
                <>
                  <div className="flex gap-4">
                    <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">
                      <Download className="w-4 h-4" />
                      Descargar Plantilla
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Upload className="w-4 h-4" />
                      Seleccionar Archivo
                    </button>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                  </div>

                  {importData.length > 0 && (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 font-medium">{importData.length} clientes encontrados en el archivo</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Modo de importación</label>
                        <select value={importMode} onChange={(e) => setImportMode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option value="crear_actualizar">Crear nuevos y actualizar existentes</option>
                          <option value="solo_crear">Solo crear nuevos (omitir existentes)</option>
                          <option value="solo_actualizar">Solo actualizar existentes (no crear nuevos)</option>
                        </select>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa (primeros 10)</h4>
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left">RUT</th>
                                <th className="px-3 py-2 text-left">Tipo</th>
                                <th className="px-3 py-2 text-left">Nombre/Razón Social</th>
                                <th className="px-3 py-2 text-left">Comuna</th>
                                <th className="px-3 py-2 text-right">Línea Crédito</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {importPreview.map((c, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2">{c.rut}</td>
                                  <td className="px-3 py-2">{c.tipo_cliente}</td>
                                  <td className="px-3 py-2">{c.razon_social || c.nombre}</td>
                                  <td className="px-3 py-2">{c.comuna}</td>
                                  <td className="px-3 py-2 text-right">${formatCurrency(c.linea_credito)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  {importResult.error ? (
                    <p className="text-red-800">{importResult.error}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium text-green-800">Importación completada</p>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div><span className="text-gray-600">Enviados:</span> {importResult.total_enviados}</div>
                        <div><span className="text-green-600">Creados:</span> {importResult.creados}</div>
                        <div><span className="text-blue-600">Actualizados:</span> {importResult.actualizados}</div>
                        <div><span className="text-red-600">Errores:</span> {importResult.errores}</div>
                      </div>
                      {importResult.detalle_errores?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Errores:</p>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {importResult.detalle_errores.map((e, i) => (
                              <li key={i}>RUT {e.rut}: {e.error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              {!importResult ? (
                <>
                  <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Cancelar
                  </button>
                  <button onClick={handleImport} disabled={importing || importData.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                    {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Importar {importData.length} clientes
                  </button>
                </>
              ) : (
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesAdmin;
