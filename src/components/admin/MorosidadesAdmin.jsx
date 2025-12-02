// /src/components/admin/MorosidadesAdmin.jsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Search,
  User,
  Phone,
  Mail,
  TrendingUp,
  DollarSign,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import apiService from '../../services/api';

const MorosidadesAdmin = () => {
  const [activeTab, setActiveTab] = useState('por-cobrar'); // cobrados, por-cobrar, resumen
  const [loading, setLoading] = useState(false);

  // Estados para Vales Cobrados
  const [valesCobrados, setValesCobrados] = useState([]);
  const [resumenCobrados, setResumenCobrados] = useState(null);
  const [filtrosCobrados, setFiltrosCobrados] = useState({
    fecha_inicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // últimos 7 días
    fecha_fin: new Date().toISOString().split('T')[0],
    limite: 100
  });

  // Estados para Vales Por Cobrar
  const [valesPorCobrar, setValesPorCobrar] = useState([]);
  const [resumenPorCobrar, setResumenPorCobrar] = useState(null);
  const [filtrosPorCobrar, setFiltrosPorCobrar] = useState({
    dias_atras: 60,
    solo_con_cliente: false,
    fecha_desde: '',
    fecha_hasta: '',
    usar_rango_fechas: false
  });
  const [vistaClientes, setVistaClientes] = useState(true);

  // Estados para Resumen del Día
  const [resumenDelDia, setResumenDelDia] = useState(null);
  const [fechaResumen, setFechaResumen] = useState(new Date().toISOString().split('T')[0]);

  // Búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');

  // Clientes expandidos
  const [clientesExpandidos, setClientesExpandidos] = useState({});

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === 'cobrados') {
        await cargarValesCobrados();
      } else if (activeTab === 'por-cobrar') {
        await cargarValesPorCobrar();
      } else if (activeTab === 'resumen') {
        await cargarResumenDelDia();
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarValesCobrados = async () => {
    const response = await apiService.getValesCobrados(
      filtrosCobrados.fecha_inicio,
      filtrosCobrados.fecha_fin,
      filtrosCobrados.limite
    );
    if (response.success) {
      setValesCobrados(response.data.vales);
      setResumenCobrados(response.data.resumen);
    }
  };

  const cargarValesPorCobrar = async () => {
    const filtros = {
      soloConCliente: filtrosPorCobrar.solo_con_cliente
    };

    if (filtrosPorCobrar.usar_rango_fechas) {
      filtros.fechaDesde = filtrosPorCobrar.fecha_desde;
      filtros.fechaHasta = filtrosPorCobrar.fecha_hasta;
    } else {
      filtros.diasAtras = filtrosPorCobrar.dias_atras;
    }

    const response = await apiService.getValesPorCobrar(filtros);
    if (response.success) {
      setValesPorCobrar(response.data.vales);
      setResumenPorCobrar(response.data.resumen);
    }
  };

  const cargarResumenDelDia = async () => {
    const response = await apiService.getResumenDelDia(fechaResumen);
    if (response.success) {
      setResumenDelDia(response.data);
    }
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const calcularBruto = (neto) => {
    return Number(neto || 0) * 1.19;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const toggleClienteExpandido = (rut) => {
    setClientesExpandidos(prev => ({
      ...prev,
      [rut]: !prev[rut]
    }));
  };

  // Filtrar vales cobrados por búsqueda
  const valesCobradosFiltrados = valesCobrados.filter(vale => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      vale.numero_pedido?.toLowerCase().includes(term) ||
      vale.numero_venta?.toLowerCase().includes(term) ||
      vale.cliente?.nombre?.toLowerCase().includes(term) ||
      vale.cliente?.rut?.toLowerCase().includes(term)
    );
  });

  // Filtrar vales por cobrar por búsqueda
  const valesPorCobrarFiltrados = valesPorCobrar.filter(vale => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      vale.numero_pedido?.toLowerCase().includes(term) ||
      vale.cliente?.nombre?.toLowerCase().includes(term) ||
      vale.cliente?.rut?.toLowerCase().includes(term) ||
      vale.vendedor?.nombre?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Morosidades y Reportes</h1>
            <p className="text-sm text-gray-500">Control de vales pendientes y cobrados</p>
          </div>
        </div>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('por-cobrar')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'por-cobrar'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Por Cobrar (Morosidades)
            {resumenPorCobrar?.totales?.cantidad_total > 0 && (
              <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                {resumenPorCobrar.totales.cantidad_total}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('cobrados')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'cobrados'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Vales Cobrados
          </span>
        </button>
        <button
          onClick={() => setActiveTab('resumen')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'resumen'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resumen del Día
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* TAB: VALES POR COBRAR (MOROSIDADES) */}
          {activeTab === 'por-cobrar' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modo de búsqueda
                    </label>
                    <select
                      value={filtrosPorCobrar.usar_rango_fechas ? 'rango' : 'dias'}
                      onChange={(e) => setFiltrosPorCobrar({
                        ...filtrosPorCobrar,
                        usar_rango_fechas: e.target.value === 'rango'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="dias">Por Días Atrás</option>
                      <option value="rango">Rango de Fechas</option>
                    </select>
                  </div>

                  {!filtrosPorCobrar.usar_rango_fechas ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Días hacia atrás
                      </label>
                      <select
                        value={filtrosPorCobrar.dias_atras}
                        onChange={(e) => setFiltrosPorCobrar({...filtrosPorCobrar, dias_atras: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value={7}>7 días</option>
                        <option value={15}>15 días</option>
                        <option value={30}>30 días</option>
                        <option value={60}>60 días</option>
                        <option value={90}>90 días</option>
                        <option value={180}>6 meses</option>
                        <option value={365}>1 año</option>
                        <option value={999999}>Todos</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Desde
                        </label>
                        <input
                          type="date"
                          value={filtrosPorCobrar.fecha_desde}
                          onChange={(e) => setFiltrosPorCobrar({...filtrosPorCobrar, fecha_desde: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={filtrosPorCobrar.fecha_hasta}
                          onChange={(e) => setFiltrosPorCobrar({...filtrosPorCobrar, fecha_hasta: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtrosPorCobrar.solo_con_cliente}
                        onChange={(e) => setFiltrosPorCobrar({...filtrosPorCobrar, solo_con_cliente: e.target.checked})}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Solo con cliente</span>
                    </label>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={cargarValesPorCobrar}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Buscar
                    </button>
                  </div>
                </div>

                {/* Búsqueda y toggle vista */}
                <div className="mt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar vale, cliente, RUT..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex bg-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setVistaClientes(true)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        vistaClientes
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Por Cliente
                    </button>
                    <button
                      onClick={() => setVistaClientes(false)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !vistaClientes
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Por Vale
                    </button>
                  </div>
                </div>
              </div>

              {/* Resumen de pendientes */}
              {resumenPorCobrar && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-600 font-medium">Vales Pendientes</p>
                    <p className="text-3xl font-bold text-orange-900">{resumenPorCobrar.totales.cantidad_total}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Con cliente: {resumenPorCobrar.totales.con_cliente} | Sin: {resumenPorCobrar.totales.sin_cliente}
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-medium">Monto Total Pendiente</p>
                    <p className="text-2xl font-bold text-red-900">${formatCurrency(calcularBruto(resumenPorCobrar.totales.monto_total_pendiente))}</p>
                    <p className="text-xs text-gray-500 mt-1">Neto: ${formatCurrency(resumenPorCobrar.totales.monto_total_pendiente)}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Con Cliente Identificado</p>
                    <p className="text-2xl font-bold text-blue-900">${formatCurrency(calcularBruto(resumenPorCobrar.totales.monto_con_cliente))}</p>
                    <p className="text-xs text-gray-500 mt-1">{resumenPorCobrar.totales.con_cliente} vales</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium">Sin Cliente</p>
                    <p className="text-2xl font-bold text-gray-900">${formatCurrency(calcularBruto(resumenPorCobrar.totales.monto_sin_cliente))}</p>
                    <p className="text-xs text-gray-500 mt-1">{resumenPorCobrar.totales.sin_cliente} vales</p>
                  </div>
                </div>
              )}

              {/* Alertas */}
              {resumenPorCobrar?.alertas && resumenPorCobrar.alertas.length > 0 && (
                <div className="space-y-2">
                  {resumenPorCobrar.alertas.map((alerta, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border flex items-center gap-2 ${
                        alerta.tipo === 'error'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : alerta.tipo === 'warning'
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{alerta.mensaje}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Vista por Cliente */}
              {vistaClientes && resumenPorCobrar?.clientes_con_deuda && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {resumenPorCobrar.clientes_con_deuda.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay clientes con vales pendientes</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {resumenPorCobrar.clientes_con_deuda.map((clienteData, idx) => (
                        <div key={idx} className="bg-white">
                          {/* Header del cliente - clickeable */}
                          <div
                            onClick={() => toggleClienteExpandido(clienteData.cliente.rut || idx)}
                            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {clienteData.cliente.nombre || 'Cliente sin nombre'}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  {clienteData.cliente.rut && (
                                    <span>RUT: {clienteData.cliente.rut}</span>
                                  )}
                                  {clienteData.cliente.telefono && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {clienteData.cliente.telefono}
                                    </span>
                                  )}
                                  {clienteData.cliente.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {clienteData.cliente.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-lg font-bold text-red-600">
                                  ${formatCurrency(calcularBruto(clienteData.monto_total))}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {clienteData.cantidad_vales} vale{clienteData.cantidad_vales !== 1 ? 's' : ''}
                                </p>
                              </div>
                              {clientesExpandidos[clienteData.cliente.rut || idx] ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Vales del cliente (expandible) */}
                          {clientesExpandidos[clienteData.cliente.rut || idx] && (
                            <div className="bg-gray-50 px-4 pb-4">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="text-xs text-gray-500 uppercase">
                                    <th className="py-2 text-left">Vale</th>
                                    <th className="py-2 text-left">Fecha</th>
                                    <th className="py-2 text-center">Días</th>
                                    <th className="py-2 text-right">Total Bruto</th>
                                    <th className="py-2 text-right">Total Neto</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {clienteData.vales.map((vale, vIdx) => (
                                    <tr key={vIdx} className="hover:bg-white transition-colors">
                                      <td className="py-2">
                                        <span className="font-medium text-blue-600">
                                          {vale.numero_diario ? `#${String(vale.numero_diario).padStart(3, '0')}` : vale.numero_pedido}
                                        </span>
                                      </td>
                                      <td className="py-2 text-sm text-gray-900">
                                        {formatDate(vale.fecha_creacion)}
                                      </td>
                                      <td className="py-2 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          vale.dias_pendiente > 7
                                            ? 'bg-red-100 text-red-800'
                                            : vale.dias_pendiente > 3
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {vale.dias_pendiente}d
                                        </span>
                                      </td>
                                      <td className="py-2 text-right font-bold text-green-700">
                                        ${formatCurrency(calcularBruto(vale.total))}
                                      </td>
                                      <td className="py-2 text-right text-sm text-gray-500">
                                        ${formatCurrency(vale.total)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vista por Vale */}
              {!vistaClientes && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vale</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Días</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Bruto</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Neto</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {valesPorCobrarFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              No se encontraron vales pendientes
                            </td>
                          </tr>
                        ) : (
                          valesPorCobrarFiltrados.map((vale) => (
                            <tr key={vale.id_pedido} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-medium text-blue-600">{vale.numero_display}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(vale.fecha_creacion)}
                              </td>
                              <td className="px-4 py-3">
                                {vale.cliente ? (
                                  <>
                                    <div className="text-sm font-medium text-gray-900">{vale.cliente.nombre}</div>
                                    {vale.cliente.telefono && (
                                      <div className="text-xs text-gray-500">{vale.cliente.telefono}</div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">Sin cliente</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {vale.vendedor?.nombre || 'Sin vendedor'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  vale.dias_pendiente > 7
                                    ? 'bg-red-100 text-red-800'
                                    : vale.dias_pendiente > 3
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {vale.dias_pendiente}d
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="font-bold text-green-700">
                                  ${formatCurrency(calcularBruto(vale.total))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-500">
                                ${formatCurrency(vale.total)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: VALES COBRADOS */}
          {activeTab === 'cobrados' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={filtrosCobrados.fecha_inicio}
                      onChange={(e) => setFiltrosCobrados({...filtrosCobrados, fecha_inicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={filtrosCobrados.fecha_fin}
                      onChange={(e) => setFiltrosCobrados({...filtrosCobrados, fecha_fin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Límite
                    </label>
                    <select
                      value={filtrosCobrados.limite}
                      onChange={(e) => setFiltrosCobrados({...filtrosCobrados, limite: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value={50}>50 vales</option>
                      <option value={100}>100 vales</option>
                      <option value={200}>200 vales</option>
                      <option value={500}>500 vales</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={cargarValesCobrados}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Aplicar
                    </button>
                  </div>
                  <div className="flex items-end">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de cobrados */}
              {resumenCobrados && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Cantidad Vales</p>
                    <p className="text-3xl font-bold text-blue-900">{resumenCobrados.totales.cantidad_vales}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Total Cobrado (Bruto)</p>
                    <p className="text-2xl font-bold text-green-900">${formatCurrency(calcularBruto(resumenCobrados.totales.monto_total_cobrado))}</p>
                    <p className="text-xs text-gray-500 mt-1">Neto: ${formatCurrency(resumenCobrados.totales.monto_total_cobrado)}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">Descuentos Aplicados</p>
                    <p className="text-2xl font-bold text-purple-900">${formatCurrency(resumenCobrados.totales.descuentos_aplicados)}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium">Monto sin Descuentos</p>
                    <p className="text-2xl font-bold text-gray-900">${formatCurrency(calcularBruto(resumenCobrados.totales.monto_sin_descuentos))}</p>
                  </div>
                </div>
              )}

              {/* Tabla de vales cobrados */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vale</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venta</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Cobro</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Doc</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {valesCobradosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            No se encontraron vales cobrados
                          </td>
                        </tr>
                      ) : (
                        valesCobradosFiltrados.map((vale) => (
                          <tr key={vale.id_pedido} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{vale.numero_display}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-blue-600">
                              {vale.numero_venta}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">{formatDate(vale.fecha_cobro)}</div>
                              <div className="text-xs text-gray-500">{vale.hora_cobro}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">{vale.cliente?.nombre || 'Sin cliente'}</div>
                              {vale.cliente?.rut && (
                                <div className="text-xs text-gray-500">{vale.cliente.rut}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {vale.vendedor?.nombre || 'Sin vendedor'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                vale.tipo_documento === 'factura'
                                  ? 'bg-blue-100 text-blue-800'
                                  : vale.tipo_documento === 'boleta'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {vale.tipo_documento || 'ticket'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-bold text-green-700">
                                ${formatCurrency(calcularBruto(vale.total_venta))}
                              </div>
                              <div className="text-xs text-gray-500">
                                ${formatCurrency(vale.total_venta)}
                              </div>
                              {vale.descuento > 0 && (
                                <div className="text-xs text-red-600">
                                  -{formatCurrency(vale.descuento)}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RESUMEN DEL DÍA */}
          {activeTab === 'resumen' && (
            <div className="space-y-4">
              {/* Selector de fecha */}
              <div className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha del reporte:
                  </label>
                  <input
                    type="date"
                    value={fechaResumen}
                    onChange={(e) => setFechaResumen(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={cargarResumenDelDia}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Cargar
                  </button>
                </div>
              </div>

              {resumenDelDia ? (
                <>
                  {/* Resumen General */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">Total Vales</p>
                      <p className="text-3xl font-bold text-blue-900">{resumenDelDia.resumen_general?.total_vales || 0}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">Completados</p>
                      <p className="text-3xl font-bold text-green-900">{resumenDelDia.resumen_general?.completados || 0}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
                      <p className="text-3xl font-bold text-yellow-900">{resumenDelDia.resumen_general?.pendientes || 0}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-600 font-medium">Eficiencia</p>
                      <p className="text-3xl font-bold text-purple-900">{resumenDelDia.resumen_general?.eficiencia || 0}%</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium">Cancelados</p>
                      <p className="text-3xl font-bold text-gray-900">{resumenDelDia.resumen_general?.cancelados || 0}</p>
                    </div>
                  </div>

                  {/* Montos */}
                  {resumenDelDia.montos && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Montos del Día
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Total Recaudado (Bruto)</p>
                          <p className="text-2xl font-bold text-green-600">${formatCurrency(calcularBruto(resumenDelDia.montos.total_recaudado))}</p>
                          <p className="text-xs text-gray-500">Neto: ${formatCurrency(resumenDelDia.montos.total_recaudado)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Pendiente por Cobrar</p>
                          <p className="text-2xl font-bold text-orange-600">${formatCurrency(calcularBruto(resumenDelDia.montos.total_pendiente))}</p>
                          <p className="text-xs text-gray-500">Neto: ${formatCurrency(resumenDelDia.montos.total_pendiente)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Descuentos Otorgados</p>
                          <p className="text-2xl font-bold text-purple-600">${formatCurrency(resumenDelDia.montos.total_descuentos)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Por Vendedor */}
                  {resumenDelDia.por_vendedor && resumenDelDia.por_vendedor.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Resumen por Vendedor
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vales</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completados</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pendientes</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto (Bruto)</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto (Neto)</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {resumenDelDia.por_vendedor.map((vendedor, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900">{vendedor.vendedor}</td>
                                <td className="px-4 py-3 text-center text-gray-900">{vendedor.cantidad}</td>
                                <td className="px-4 py-3 text-center text-green-600">{vendedor.completados}</td>
                                <td className="px-4 py-3 text-center text-yellow-600">{vendedor.pendientes}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-700">
                                  ${formatCurrency(calcularBruto(vendedor.monto_total))}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500">
                                  ${formatCurrency(vendedor.monto_total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona una fecha para ver el resumen</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MorosidadesAdmin;
