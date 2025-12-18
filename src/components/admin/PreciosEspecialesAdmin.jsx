// src/components/admin/PreciosEspecialesAdmin.jsx
import React, { useState, useEffect } from 'react';
import {
  Tag,
  List,
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  RefreshCw,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  Calendar,
  Package,
  ChevronRight,
  AlertCircle,
  Save
} from 'lucide-react';
import apiService from '../../services/api';

const PreciosEspecialesAdmin = () => {
  // Tab activo: 'listas' o 'clientes'
  const [activeTab, setActiveTab] = useState('listas');

  // Estado para Listas de Precios
  const [listas, setListas] = useState([]);
  const [loadingListas, setLoadingListas] = useState(true);
  const [showListaModal, setShowListaModal] = useState(false);
  const [editingLista, setEditingLista] = useState(null);
  const [listaForm, setListaForm] = useState({ nombre: '', descripcion: '', prioridad: 0 });

  // Estado para detalle de lista
  const [selectedLista, setSelectedLista] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  // Estado para agregar precio a lista
  const [showAddPrecioModal, setShowAddPrecioModal] = useState(false);
  const [precioForm, setPrecioForm] = useState({
    id_producto: null,
    id_variante_producto: null,
    aplicar_todas_variantes: true,
    id_modalidad: 'todas',
    tipo_descuento: 'porcentaje',
    valor_descuento: '',
    cantidad_minima: 1,
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [productosBusqueda, setProductosBusqueda] = useState([]);
  const [searchProducto, setSearchProducto] = useState('');
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [selectedVariante, setSelectedVariante] = useState(null);
  const [searchingProductos, setSearchingProductos] = useState(false);

  // Estado para Precios por Cliente
  const [searchCliente, setSearchCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [preciosCliente, setPreciosCliente] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);

  // Estado general
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cargar listas al montar
  useEffect(() => {
    if (activeTab === 'listas') {
      cargarListas();
    }
  }, [activeTab]);

  const cargarListas = async () => {
    setLoadingListas(true);
    try {
      const response = await apiService.getListasPrecios();
      if (response.success) {
        setListas(response.data || []);
      }
    } catch (err) {
      console.error('Error cargando listas:', err);
    } finally {
      setLoadingListas(false);
    }
  };

  // Buscar productos para agregar precio
  const buscarProductos = async (query) => {
    if (!query || query.length < 2) {
      setProductosBusqueda([]);
      return;
    }
    setSearchingProductos(true);
    try {
      const response = await apiService.buscarProductosPrecios(query);
      if (response.success) {
        setProductosBusqueda(response.data || []);
      }
    } catch (err) {
      console.error('Error buscando productos:', err);
    } finally {
      setSearchingProductos(false);
    }
  };

  // Debounce para busqueda de productos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchProducto) {
        buscarProductos(searchProducto);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchProducto]);

  // Crear/Editar lista
  const handleSaveLista = async () => {
    if (!listaForm.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let response;
      if (editingLista) {
        response = await apiService.updateListaPrecios(editingLista.id_lista_precios, listaForm);
      } else {
        response = await apiService.createListaPrecios(listaForm);
      }
      if (response.success) {
        setShowListaModal(false);
        setEditingLista(null);
        setListaForm({ nombre: '', descripcion: '', prioridad: 0 });
        cargarListas();
      } else {
        setError(response.message || 'Error al guardar');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Abrir detalle de lista
  const handleVerLista = async (lista) => {
    try {
      const response = await apiService.getListaPreciosDetalle(lista.id_lista_precios);
      if (response.success) {
        setSelectedLista(response.data);
        setShowDetalleModal(true);
      }
    } catch (err) {
      console.error('Error cargando detalle:', err);
    }
  };

  // Desactivar lista
  const handleDeleteLista = async (lista) => {
    if (!confirm(`¿Desactivar la lista "${lista.nombre}"?`)) return;
    try {
      const response = await apiService.deleteListaPrecios(lista.id_lista_precios);
      if (response.success) {
        cargarListas();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Agregar precio a lista
  const handleAddPrecio = async () => {
    if (!selectedProducto || !precioForm.valor_descuento) {
      setError('Seleccione un producto y complete el valor del descuento');
      return;
    }

    // Validar segun modo
    if (!precioForm.aplicar_todas_variantes && !selectedVariante) {
      setError('Seleccione una variante');
      return;
    }
    if (!precioForm.aplicar_todas_variantes && precioForm.id_modalidad !== 'todas' && !precioForm.id_modalidad) {
      setError('Seleccione una modalidad');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Preparar payload segun modo
      const payload = {
        tipo_descuento: precioForm.tipo_descuento,
        valor_descuento: parseFloat(precioForm.valor_descuento),
        cantidad_minima: precioForm.cantidad_minima,
        fecha_inicio: precioForm.fecha_inicio || null,
        fecha_fin: precioForm.fecha_fin || null
      };

      if (precioForm.aplicar_todas_variantes) {
        // Modo masivo
        payload.id_producto = selectedProducto.id_producto;
        payload.aplicar_todas_variantes = true;
        payload.id_modalidad = precioForm.id_modalidad; // 'todas' o id especifico
      } else {
        // Modo individual
        payload.id_variante_producto = selectedVariante.id_variante_producto;
        payload.id_modalidad = precioForm.id_modalidad === 'todas'
          ? selectedVariante.modalidades?.[0]?.id_modalidad
          : parseInt(precioForm.id_modalidad);
      }

      const response = await apiService.addPrecioLista(selectedLista.id_lista_precios, payload);
      if (response.success) {
        setShowAddPrecioModal(false);
        resetPrecioForm();
        // Recargar detalle
        handleVerLista(selectedLista);
      } else {
        setError(response.message || 'Error al agregar precio');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar precio de lista
  const handleDeletePrecio = async (precio) => {
    if (!confirm('¿Eliminar este precio?')) return;
    try {
      const response = await apiService.deletePrecioLista(selectedLista.id_lista_precios, precio.id_precio_lista);
      if (response.success) {
        handleVerLista(selectedLista);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const resetPrecioForm = () => {
    setPrecioForm({
      id_producto: null,
      id_variante_producto: null,
      aplicar_todas_variantes: true,
      id_modalidad: 'todas',
      tipo_descuento: 'porcentaje',
      valor_descuento: '',
      cantidad_minima: 1,
      fecha_inicio: '',
      fecha_fin: ''
    });
    setSelectedProducto(null);
    setSelectedVariante(null);
    setSearchProducto('');
    setProductosBusqueda([]);
  };

  // Buscar cliente
  const handleBuscarCliente = async () => {
    if (!searchCliente.trim()) return;
    setLoadingCliente(true);
    try {
      // Primero buscar el cliente
      const clienteResp = await apiService.buscarClientePorRut(searchCliente);
      if (clienteResp.success && clienteResp.data) {
        setClienteSeleccionado(clienteResp.data);
        // Luego obtener sus precios especiales
        const preciosResp = await apiService.getPreciosEspecialesCliente(clienteResp.data.id_cliente);
        if (preciosResp.success) {
          setPreciosCliente(preciosResp.data);
        }
      } else {
        setClienteSeleccionado(null);
        setPreciosCliente(null);
        setError('Cliente no encontrado');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCliente(false);
    }
  };

  // Agregar precio especial a cliente
  const handleAddPrecioCliente = async () => {
    // Validar campos requeridos segun el modo
    if (!selectedProducto || !precioForm.valor_descuento) {
      setError('Seleccione un producto y complete el valor del descuento');
      return;
    }

    // Si es variante especifica, validar que este seleccionada
    if (!precioForm.aplicar_todas_variantes && !selectedVariante) {
      setError('Seleccione una variante');
      return;
    }

    // Validar modalidad
    if (!precioForm.id_modalidad) {
      setError('Seleccione una modalidad');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Preparar payload segun modo
      const payload = {
        tipo_descuento: precioForm.tipo_descuento,
        valor_descuento: parseFloat(precioForm.valor_descuento),
        cantidad_minima: precioForm.cantidad_minima,
        fecha_inicio: precioForm.fecha_inicio || null,
        fecha_fin: precioForm.fecha_fin || null
      };

      if (precioForm.aplicar_todas_variantes) {
        // Modo masivo - todas las variantes del producto
        payload.id_producto = selectedProducto.id_producto;
        payload.aplicar_todas_variantes = true;
        payload.id_modalidad = precioForm.id_modalidad; // 'todas' o nombre especifico
      } else {
        // Modo individual
        payload.id_variante_producto = selectedVariante.id_variante_producto;
        payload.id_modalidad = precioForm.id_modalidad === 'todas'
          ? selectedVariante.modalidades?.[0]?.id_modalidad
          : precioForm.id_modalidad;
      }

      const response = await apiService.addPrecioEspecialCliente(clienteSeleccionado.id_cliente, payload);
      if (response.success) {
        setShowAddPrecioModal(false);
        resetPrecioForm();
        // Recargar precios del cliente
        const preciosResp = await apiService.getPreciosEspecialesCliente(clienteSeleccionado.id_cliente);
        if (preciosResp.success) {
          setPreciosCliente(preciosResp.data);
        }
      } else {
        setError(response.message || 'Error al agregar precio');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar precio especial de cliente
  const handleDeletePrecioCliente = async (precio) => {
    if (!confirm('¿Eliminar este precio especial?')) return;
    try {
      const response = await apiService.deletePrecioEspecialCliente(
        clienteSeleccionado.id_cliente,
        precio.id_precio_especial
      );
      if (response.success) {
        const preciosResp = await apiService.getPreciosEspecialesCliente(clienteSeleccionado.id_cliente);
        if (preciosResp.success) {
          setPreciosCliente(preciosResp.data);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString('es-CL')}`;

  // ============ RENDER ============

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Tag className="w-8 h-8 text-rose-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Precios Especiales</h1>
            <p className="text-sm text-gray-500">Gestionar listas de precios y descuentos por cliente</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('listas')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'listas'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <List className="w-5 h-5" />
          Listas de Precios
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'clientes'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-5 h-5" />
          Precios por Cliente
        </button>
      </div>

      {/* Error global */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* TAB: LISTAS DE PRECIOS */}
      {activeTab === 'listas' && (
        <div>
          {/* Acciones */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => { setEditingLista(null); setListaForm({ nombre: '', descripcion: '', prioridad: 0 }); setShowListaModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              <Plus className="w-4 h-4" />
              Nueva Lista
            </button>
            <button onClick={cargarListas} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <RefreshCw className={`w-5 h-5 ${loadingListas ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tabla de listas */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loadingListas ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
              </div>
            ) : listas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay listas de precios. Crea una para comenzar.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lista</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Precios</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Clientes</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {listas.map(lista => (
                    <tr key={lista.id_lista_precios} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{lista.nombre}</p>
                          {lista.descripcion && <p className="text-sm text-gray-500">{lista.descripcion}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {lista.cantidad_precios || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {lista.cantidad_clientes || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          lista.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {lista.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleVerLista(lista)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver precios">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingLista(lista); setListaForm({ nombre: lista.nombre, descripcion: lista.descripcion || '', prioridad: lista.prioridad || 0 }); setShowListaModal(true); }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteLista(lista)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Desactivar">
                            <XCircle className="w-4 h-4" />
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
      )}

      {/* TAB: PRECIOS POR CLIENTE */}
      {activeTab === 'clientes' && (
        <div>
          {/* Buscador de cliente */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Cliente por RUT</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarCliente()}
                  placeholder="Ej: 12345678-9"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <button
                onClick={handleBuscarCliente}
                disabled={loadingCliente}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                {loadingCliente ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Info del cliente y precios */}
          {clienteSeleccionado && preciosCliente && (
            <div className="space-y-4">
              {/* Card del cliente */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {preciosCliente.cliente.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">{preciosCliente.cliente.rut}</p>
                    {preciosCliente.cliente.lista_precios && (
                      <p className="text-sm text-rose-600 mt-1">
                        Lista asignada: {preciosCliente.cliente.lista_precios.nombre}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { resetPrecioForm(); setShowAddPrecioModal(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Precio
                  </button>
                </div>
              </div>

              {/* Precios especiales vigentes */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Precios Especiales Vigentes</h4>
                </div>
                {preciosCliente.precios_especiales_vigentes?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tiene precios especiales configurados
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Modalidad</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Descuento</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Min.</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Origen</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {preciosCliente.precios_especiales_vigentes?.map((precio, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <p className="text-sm font-medium">{precio.nombre_producto}</p>
                            <p className="text-xs text-gray-500">{precio.variante_descripcion}</p>
                          </td>
                          <td className="px-4 py-2 text-sm">{precio.modalidad_nombre}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                              precio.tipo_descuento === 'porcentaje' ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {precio.tipo_descuento === 'porcentaje' ? (
                                <><Percent className="w-3 h-3" />{precio.valor_descuento}%</>
                              ) : (
                                <><DollarSign className="w-3 h-3" />{formatCurrency(precio.valor_descuento)}</>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-sm">{precio.cantidad_minima}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              precio.origen === 'precio_especial_cliente'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {precio.origen === 'precio_especial_cliente' ? 'Individual' : 'Lista'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {precio.origen === 'precio_especial_cliente' && (
                              <button
                                onClick={() => handleDeletePrecioCliente(precio)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Crear/Editar Lista */}
      {showListaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{editingLista ? 'Editar Lista' : 'Nueva Lista de Precios'}</h3>
              <button onClick={() => setShowListaModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={listaForm.nombre}
                  onChange={(e) => setListaForm({ ...listaForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder="Ej: Mayoristas Gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea
                  value={listaForm.descripcion}
                  onChange={(e) => setListaForm({ ...listaForm, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={2}
                  placeholder="Descripcion opcional..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <input
                  type="number"
                  value={listaForm.prioridad}
                  onChange={(e) => setListaForm({ ...listaForm, prioridad: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Menor numero = mayor prioridad</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={() => setShowListaModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancelar
              </button>
              <button onClick={handleSaveLista} disabled={saving} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalle de Lista con precios */}
      {showDetalleModal && selectedLista && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{selectedLista.nombre}</h3>
                {selectedLista.descripcion && <p className="text-sm text-gray-500">{selectedLista.descripcion}</p>}
              </div>
              <button onClick={() => setShowDetalleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">Precios: <strong>{selectedLista.precios?.length || 0}</strong></span>
                <span className="text-gray-600">Clientes: <strong>{selectedLista.clientes?.length || 0}</strong></span>
              </div>
              <button
                onClick={() => { resetPrecioForm(); setShowAddPrecioModal(true); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar Precio
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {selectedLista.precios?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay precios en esta lista. Agrega productos para comenzar.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Modalidad</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Tipo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Min.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Vigencia</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedLista.precios?.map(precio => (
                      <tr key={precio.id_precio_lista} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <p className="text-sm font-medium">{precio.varianteProducto?.producto?.nombre || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{precio.varianteProducto?.sku}</p>
                        </td>
                        <td className="px-4 py-2 text-sm">{precio.modalidad?.nombre}</td>
                        <td className="px-4 py-2 text-center">
                          {precio.tipo_descuento === 'porcentaje' ? (
                            <span className="inline-flex items-center text-blue-600"><Percent className="w-4 h-4" /></span>
                          ) : (
                            <span className="inline-flex items-center text-green-600"><DollarSign className="w-4 h-4" /></span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center font-medium">
                          {precio.tipo_descuento === 'porcentaje'
                            ? `${precio.valor_descuento}%`
                            : formatCurrency(precio.valor_descuento)
                          }
                        </td>
                        <td className="px-4 py-2 text-center text-sm">{precio.cantidad_minima}</td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500">
                          {precio.fecha_inicio || precio.fecha_fin ? (
                            <span>{precio.fecha_inicio || '∞'} - {precio.fecha_fin || '∞'}</span>
                          ) : (
                            <span className="text-green-600">Permanente</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => handleDeletePrecio(precio)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button onClick={() => setShowDetalleModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Agregar Precio */}
      {showAddPrecioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Agregar Precio</h3>
              <button onClick={() => { setShowAddPrecioModal(false); resetPrecioForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Buscador de producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Producto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchProducto}
                    onChange={(e) => setSearchProducto(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    placeholder="Buscar por nombre o codigo..."
                  />
                </div>
                {searchingProductos && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}

                {/* Resultados de busqueda (productos agrupados) */}
                {productosBusqueda.length > 0 && !selectedProducto && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-auto">
                    {productosBusqueda.map(prod => (
                      <button
                        key={prod.id_producto}
                        onClick={() => {
                          setSelectedProducto(prod);
                          setPrecioForm({ ...precioForm, id_producto: prod.id_producto });
                          setProductosBusqueda([]);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">{prod.nombre}</p>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {prod.cantidad_variantes} variantes
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{prod.codigo}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Producto seleccionado */}
              {selectedProducto && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedProducto.nombre}</p>
                      <p className="text-sm text-gray-500">{selectedProducto.codigo} - {selectedProducto.cantidad_variantes} variantes</p>
                    </div>
                    <button onClick={() => { setSelectedProducto(null); setSelectedVariante(null); resetPrecioForm(); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selector de aplicacion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aplicar a:</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100">
                        <input
                          type="radio"
                          checked={precioForm.aplicar_todas_variantes}
                          onChange={() => {
                            setPrecioForm({ ...precioForm, aplicar_todas_variantes: true });
                            setSelectedVariante(null);
                          }}
                          className="text-rose-600"
                        />
                        <span className="text-sm">Todas las variantes ({selectedProducto.cantidad_variantes})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100">
                        <input
                          type="radio"
                          checked={!precioForm.aplicar_todas_variantes}
                          onChange={() => setPrecioForm({ ...precioForm, aplicar_todas_variantes: false })}
                          className="text-rose-600"
                        />
                        <span className="text-sm">Variante especifica</span>
                      </label>
                    </div>
                  </div>

                  {/* Selector de variante (si no aplica a todas) */}
                  {!precioForm.aplicar_todas_variantes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Variante *</label>
                      <select
                        value={selectedVariante?.id_variante_producto || ''}
                        onChange={(e) => {
                          const variante = selectedProducto.variantes?.find(v => v.id_variante_producto === parseInt(e.target.value));
                          setSelectedVariante(variante);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="">Seleccionar variante...</option>
                        {selectedProducto.variantes?.map(v => (
                          <option key={v.id_variante_producto} value={v.id_variante_producto}>
                            {v.sku} - {v.color} {v.medida}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Selector de modalidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                    <select
                      value={precioForm.id_modalidad}
                      onChange={(e) => {
                        // En modo "todas las variantes" usar el nombre de la modalidad
                        // En modo variante especifica usar el ID
                        if (precioForm.aplicar_todas_variantes) {
                          setPrecioForm({ ...precioForm, id_modalidad: e.target.value });
                        } else {
                          setPrecioForm({ ...precioForm, id_modalidad: e.target.value === 'todas' ? 'todas' : parseInt(e.target.value) });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="todas">Todas las modalidades</option>
                      {(precioForm.aplicar_todas_variantes
                        ? selectedProducto.modalidades_disponibles
                        : selectedVariante?.modalidades
                      )?.map(mod => (
                        // En modo todas las variantes, usar el nombre como value (ya que cada variante tiene IDs diferentes)
                        // En modo variante especifica, usar el id_modalidad
                        <option
                          key={precioForm.aplicar_todas_variantes ? mod.nombre : mod.id_modalidad}
                          value={precioForm.aplicar_todas_variantes ? mod.nombre.toLowerCase() : mod.id_modalidad}
                        >
                          {mod.nombre} {mod.precio_neto ? `- ${formatCurrency(mod.precio_neto)}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Tipo de descuento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Descuento *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={precioForm.tipo_descuento === 'porcentaje'}
                      onChange={() => setPrecioForm({ ...precioForm, tipo_descuento: 'porcentaje' })}
                      className="text-rose-600"
                    />
                    <Percent className="w-4 h-4 text-blue-600" />
                    Porcentaje
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={precioForm.tipo_descuento === 'precio_fijo'}
                      onChange={() => setPrecioForm({ ...precioForm, tipo_descuento: 'precio_fijo' })}
                      className="text-rose-600"
                    />
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Precio Fijo
                  </label>
                </div>
              </div>

              {/* Valor del descuento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {precioForm.tipo_descuento === 'porcentaje' ? 'Porcentaje de descuento *' : 'Precio fijo *'}
                </label>
                <div className="relative">
                  {precioForm.tipo_descuento === 'porcentaje' ? (
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  )}
                  <input
                    type="number"
                    value={precioForm.valor_descuento}
                    onChange={(e) => setPrecioForm({ ...precioForm, valor_descuento: e.target.value })}
                    className={`w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 ${
                      precioForm.tipo_descuento === 'precio_fijo' ? 'pl-10 pr-4' : 'pl-4 pr-10'
                    }`}
                    placeholder={precioForm.tipo_descuento === 'porcentaje' ? '15' : '8500'}
                    min="0"
                  />
                </div>
              </div>

              {/* Cantidad minima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Minima</label>
                <input
                  type="number"
                  value={precioForm.cantidad_minima}
                  onChange={(e) => setPrecioForm({ ...precioForm, cantidad_minima: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  min="1"
                />
              </div>

              {/* Fechas de vigencia */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={precioForm.fecha_inicio}
                    onChange={(e) => setPrecioForm({ ...precioForm, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={precioForm.fecha_fin}
                    onChange={(e) => setPrecioForm({ ...precioForm, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={() => { setShowAddPrecioModal(false); resetPrecioForm(); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancelar
              </button>
              <button
                onClick={activeTab === 'listas' ? handleAddPrecio : handleAddPrecioCliente}
                disabled={saving || !precioForm.id_modalidad || !precioForm.valor_descuento}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreciosEspecialesAdmin;
