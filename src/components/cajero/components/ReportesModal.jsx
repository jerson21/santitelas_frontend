// /src/components/cajero/components/ReportesModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
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
  MapPin,
  TrendingUp,
  DollarSign,
  Eye,
  Printer
} from 'lucide-react';
import apiService from '../../../services/api';

const ReportesModal = ({ isOpen, onClose, onValeSelect, onVerDetalle, onReimprimir }) => {
  const [activeTab, setActiveTab] = useState('cobrados'); // cobrados, por-cobrar, resumen
  const [loading, setLoading] = useState(false);

  // Estados para Vales Cobrados
  const [valesCobrados, setValesCobrados] = useState([]);
  const [resumenCobrados, setResumenCobrados] = useState(null);
  const [filtrosCobrados, setFiltrosCobrados] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    limite: 50
  });

  // Estados para Vales Por Cobrar
  const [valesPorCobrar, setValesPorCobrar] = useState([]);
  const [resumenPorCobrar, setResumenPorCobrar] = useState(null);
  const [filtrosPorCobrar, setFiltrosPorCobrar] = useState({
    dias_atras: 30,
    solo_con_cliente: false,
    fecha_desde: '',
    fecha_hasta: '',
    usar_rango_fechas: false
  });
  const [vistaClientes, setVistaClientes] = useState(true); // true = vista por cliente, false = vista por vale

  // Estados para Resumen del Día
  const [resumenDelDia, setResumenDelDia] = useState(null);
  const [fechaResumen, setFechaResumen] = useState(new Date().toISOString().split('T')[0]);

  // Búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen, activeTab]);

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
    // Construir el objeto de filtros según el modo seleccionado
    const filtros = {
      soloConCliente: filtrosPorCobrar.solo_con_cliente
    };

    if (filtrosPorCobrar.usar_rango_fechas) {
      // Modo: búsqueda por rango de fechas
      filtros.fechaDesde = filtrosPorCobrar.fecha_desde;
      filtros.fechaHasta = filtrosPorCobrar.fecha_hasta;
    } else {
      // Modo: búsqueda por días hacia atrás
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'alta': return 'text-red-600 bg-red-100';
      case 'media': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleValeClick = (numeroVale) => {
    if (onValeSelect) {
      onValeSelect(numeroVale);
      onClose(); // Cerrar el modal después de seleccionar
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800">Reportes de Caja</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tabs - scrolleable en móvil */}
        <div className="flex border-b border-gray-200 px-2 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cobrados')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'cobrados'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1 sm:gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm sm:text-base">Cobrados</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('por-cobrar')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'por-cobrar'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1 sm:gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm sm:text-base">Por Cobrar</span>
              {resumenPorCobrar?.totales?.cantidad_total > 0 && (
                <span className="bg-orange-100 text-orange-800 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold">
                  {resumenPorCobrar.totales.cantidad_total}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'resumen'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1 sm:gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm sm:text-base">Resumen</span>
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* TAB: VALES COBRADOS */}
              {activeTab === 'cobrados' && (
                <div className="space-y-3 sm:space-y-4">
                  {/* Filtros y búsqueda */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Fecha Inicio
                        </label>
                        <input
                          type="date"
                          value={filtrosCobrados.fecha_inicio}
                          onChange={(e) => setFiltrosCobrados({...filtrosCobrados, fecha_inicio: e.target.value})}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Fecha Fin
                        </label>
                        <input
                          type="date"
                          value={filtrosCobrados.fecha_fin}
                          onChange={(e) => setFiltrosCobrados({...filtrosCobrados, fecha_fin: e.target.value})}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Límite
                        </label>
                        <select
                          value={filtrosCobrados.limite}
                          onChange={(e) => setFiltrosCobrados({...filtrosCobrados, limite: parseInt(e.target.value)})}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={25}>25 vales</option>
                          <option value={50}>50 vales</option>
                          <option value={100}>100 vales</option>
                          <option value={200}>200 vales</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={cargarValesCobrados}
                          className="w-full bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm"
                        >
                          <Filter className="w-4 h-4" />
                          <span className="hidden sm:inline">Aplicar</span>
                        </button>
                      </div>
                    </div>

                    {/* Búsqueda */}
                    <div className="mt-2 sm:mt-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar vale, cliente o RUT..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 sm:pl-10 pr-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumen de cobrados */}
                  {resumenCobrados && (
                    <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs text-blue-600 font-medium mb-1">Cantidad</p>
                          <p className="text-xl sm:text-3xl font-bold text-blue-900">{resumenCobrados.totales.cantidad_vales}</p>
                        </div>
                        <div className="text-center border-x border-gray-200">
                          <p className="text-[10px] sm:text-xs text-green-600 font-medium mb-1">Total Cobrado</p>
                          <p className="text-lg sm:text-3xl font-bold text-green-900">${formatCurrency(calcularBruto(resumenCobrados.totales.monto_total_cobrado))}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">Neto: ${formatCurrency(resumenCobrados.totales.monto_total_cobrado)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs text-purple-600 font-medium mb-1">Descuentos</p>
                          <p className="text-lg sm:text-3xl font-bold text-purple-900">${formatCurrency(resumenCobrados.totales.descuentos_aplicados)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tabla de vales cobrados */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vale</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {valesCobradosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-3 py-8 text-center text-gray-500">
                                No se encontraron vales cobrados
                              </td>
                            </tr>
                          ) : (
                            valesCobradosFiltrados.map((vale) => (
                              <tr key={vale.id_pedido} className="hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <div className="font-medium text-gray-900">{vale.numero_display}</div>
                                  <div className="text-xs text-gray-500">Venta: {vale.numero_venta}</div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="text-sm text-gray-900">{formatDate(vale.fecha_cobro)}</div>
                                  <div className="text-xs text-gray-500">{vale.hora_cobro}</div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="text-sm text-gray-900">{vale.cliente?.nombre || 'Sin cliente'}</div>
                                  <div className="text-xs text-gray-500">{vale.vendedor?.nombre || 'Sin vendedor'}</div>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <div className="font-bold text-green-700">
                                    ${formatCurrency(calcularBruto(vale.total_venta))}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ${formatCurrency(vale.total_venta)}
                                  </div>
                                  {vale.descuento > 0 && (
                                    <div className="text-xs text-red-600">
                                      -${formatCurrency(calcularBruto(vale.descuento))}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onVerDetalle) {
                                          onVerDetalle(vale.numero_pedido);
                                        }
                                      }}
                                      className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                      title="Ver detalle"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    {vale.numero_venta && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onReimprimir) {
                                            onReimprimir(vale.numero_venta);
                                          }
                                        }}
                                        className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                        title="Reimprimir boleta"
                                      >
                                        <Printer className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
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

              {/* TAB: VALES POR COBRAR */}
              {activeTab === 'por-cobrar' && (
                <div className="space-y-3 sm:space-y-4">
                  {/* Filtros */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Modo
                        </label>
                        <select
                          value={filtrosPorCobrar.usar_rango_fechas ? 'rango' : 'dias'}
                          onChange={(e) => setFiltrosPorCobrar({
                            ...filtrosPorCobrar,
                            usar_rango_fechas: e.target.value === 'rango'
                          })}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                          <option value="dias">Por Días</option>
                          <option value="rango">Rango Fechas</option>
                        </select>
                      </div>

                      {!filtrosPorCobrar.usar_rango_fechas ? (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Días atrás
                          </label>
                          <select
                            value={filtrosPorCobrar.dias_atras}
                            onChange={(e) => setFiltrosPorCobrar({...filtrosPorCobrar, dias_atras: parseInt(e.target.value)})}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
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
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Desde
                            </label>
                            <input
                              type="date"
                              value={filtrosPorCobrar.fecha_desde}
                              onChange={(e) => setFiltrosPorCobrar({...filtrosPorCobrar, fecha_desde: e.target.value})}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Hasta
                            </label>
                            <input
                              type="date"
                              value={filtrosPorCobrar.fecha_hasta}
                              onChange={(e) => setFiltrosPorCobrar({...filtrosPorCobrar, fecha_hasta: e.target.value})}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex items-end">
                        <button
                          onClick={cargarValesPorCobrar}
                          className="w-full bg-orange-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm"
                        >
                          <Filter className="w-4 h-4" />
                          <span className="hidden sm:inline">Buscar</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3 flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filtrosPorCobrar.solo_con_cliente}
                          onChange={(e) => setFiltrosPorCobrar({...filtrosPorCobrar, solo_con_cliente: e.target.checked})}
                          className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Solo con cliente</span>
                      </label>
                    </div>

                    {/* Toggle vista */}
                    <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar vale, cliente..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 sm:pl-10 pr-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="flex bg-gray-200 rounded-lg p-0.5 sm:p-1 flex-shrink-0">
                        <button
                          onClick={() => setVistaClientes(true)}
                          className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                            vistaClientes
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Cliente
                        </button>
                        <button
                          onClick={() => setVistaClientes(false)}
                          className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                            !vistaClientes
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Vale
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de pendientes */}
                  {resumenPorCobrar && (
                    <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs text-orange-600 font-medium mb-1">Pendientes</p>
                          <p className="text-xl sm:text-3xl font-bold text-orange-900">{resumenPorCobrar.totales.cantidad_total}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">C: {resumenPorCobrar.totales.con_cliente} | S: {resumenPorCobrar.totales.sin_cliente}</p>
                        </div>
                        <div className="text-center border-x border-gray-200">
                          <p className="text-[10px] sm:text-xs text-red-600 font-medium mb-1">Total</p>
                          <p className="text-lg sm:text-3xl font-bold text-red-900">${formatCurrency(calcularBruto(resumenPorCobrar.totales.monto_total_pendiente))}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">Neto: ${formatCurrency(resumenPorCobrar.totales.monto_total_pendiente)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs text-blue-600 font-medium mb-1">Con Cliente</p>
                          <p className="text-lg sm:text-3xl font-bold text-blue-900">${formatCurrency(calcularBruto(resumenPorCobrar.totales.monto_con_cliente))}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">Neto: ${formatCurrency(resumenPorCobrar.totales.monto_con_cliente)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {resumenPorCobrar?.alertas && resumenPorCobrar.alertas.length > 0 && (
                    <div className="space-y-2">
                      {resumenPorCobrar.alertas.map((alerta, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border flex items-center space-x-2 ${
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
                        <div className="text-center py-8 text-gray-500">
                          No hay clientes con vales pendientes
                        </div>
                      ) : (
                        <table className="min-w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vale</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Días</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resumenPorCobrar.clientes_con_deuda.map((clienteData, idx) => (
                              <React.Fragment key={idx}>
                                {/* Header del cliente */}
                                <tr className="bg-gray-100 border-t-2 border-gray-300">
                                  <td colSpan="5" className="px-3 py-2">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-600" />
                                        <span className="font-semibold text-gray-900">
                                          {clienteData.cliente.nombre || 'Cliente sin nombre'}
                                        </span>
                                        {clienteData.cliente.rut && (
                                          <span className="text-xs text-gray-600">RUT: {clienteData.cliente.rut}</span>
                                        )}
                                        {clienteData.cliente.telefono && (
                                          <span className="text-xs text-gray-600 flex items-center">
                                            <Phone className="w-3 h-3 mr-1" />
                                            {clienteData.cliente.telefono}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <span className="text-sm font-bold text-red-600">
                                          ${formatCurrency(calcularBruto(clienteData.monto_total))}
                                        </span>
                                        <span className="text-xs text-gray-600 ml-2">
                                          ({clienteData.cantidad_vales} vale{clienteData.cantidad_vales !== 1 ? 's' : ''})
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                                {/* Vales del cliente */}
                                {clienteData.vales.map((vale, vIdx) => (
                                  <tr
                                    key={vIdx}
                                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                                  >
                                    <td className="px-3 py-2">
                                      <span className="font-medium text-blue-600">
                                        {vale.numero_diario ? `#${String(vale.numero_diario).padStart(3, '0')}` : vale.numero_pedido}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {formatDate(vale.fecha_creacion)}
                                    </td>
                                    <td className="px-3 py-2 text-center">
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
                                    <td className="px-3 py-2 text-right">
                                      <div className="font-bold text-green-700">
                                        ${formatCurrency(calcularBruto(vale.total))}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        ${formatCurrency(vale.total)}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onVerDetalle) {
                                              onVerDetalle(vale.numero_pedido);
                                            }
                                          }}
                                          className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                          title="Ver detalle"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleValeClick(vale.numero_pedido);
                                          }}
                                          className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
                                          title="Cobrar"
                                        >
                                          💵
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
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
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vale</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Días</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {valesPorCobrarFiltrados.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="px-3 py-8 text-center text-gray-500">
                                  No se encontraron vales pendientes
                                </td>
                              </tr>
                            ) : (
                              valesPorCobrarFiltrados.map((vale) => (
                                <tr
                                  key={vale.id_pedido}
                                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                                  onClick={() => handleValeClick(vale.numero_pedido)}
                                  title="Click para cobrar este vale"
                                >
                                  <td className="px-3 py-2">
                                    <div className="font-medium text-blue-600 hover:text-blue-800">{vale.numero_display}</div>
                                    <div className="text-xs text-gray-500">{vale.vendedor?.nombre || 'Sin vendedor'}</div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="text-sm text-gray-900">{formatDate(vale.fecha_creacion)}</div>
                                  </td>
                                  <td className="px-3 py-2">
                                    {vale.cliente ? (
                                      <>
                                        <div className="text-sm text-gray-900">{vale.cliente.nombre}</div>
                                        {vale.cliente.telefono && (
                                          <div className="text-xs text-gray-500">{vale.cliente.telefono}</div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-sm text-gray-400 italic">Sin cliente</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
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
                                  <td className="px-3 py-2 text-right">
                                    <div className="font-bold text-green-700">
                                      ${formatCurrency(calcularBruto(vale.total))}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ${formatCurrency(vale.total)}
                                    </div>
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

              {/* TAB: RESUMEN DEL DÍA */}
              {activeTab === 'resumen' && resumenDelDia && (
                <div className="space-y-3 sm:space-y-4">
                  {/* Selector de fecha */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">
                        Fecha:
                      </label>
                      <input
                        type="date"
                        value={fechaResumen}
                        onChange={(e) => setFechaResumen(e.target.value)}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={cargarResumenDelDia}
                        className="bg-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Actualizar
                      </button>
                    </div>
                    <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Exportar</span>
                    </button>
                  </div>

                  {/* Resumen General */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
                      <p className="text-[10px] sm:text-sm text-blue-600 font-medium">Vales</p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-900">{resumenDelDia.resumen_general.total_vales}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4">
                      <p className="text-[10px] sm:text-sm text-green-600 font-medium">Listos</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-900">{resumenDelDia.resumen_general.completados}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-4">
                      <p className="text-[10px] sm:text-sm text-yellow-600 font-medium">Pend.</p>
                      <p className="text-lg sm:text-2xl font-bold text-yellow-900">{resumenDelDia.resumen_general.pendientes}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-4 hidden sm:block">
                      <p className="text-[10px] sm:text-sm text-purple-600 font-medium">Eficiencia</p>
                      <p className="text-lg sm:text-2xl font-bold text-purple-900">{resumenDelDia.resumen_general.eficiencia}%</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-4 hidden sm:block">
                      <p className="text-[10px] sm:text-sm text-gray-600 font-medium">Cancelados</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{resumenDelDia.resumen_general.cancelados}</p>
                    </div>
                  </div>

                  {/* Montos */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h4 className="text-sm sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                      Montos del Día
                    </h4>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div>
                        <p className="text-[10px] sm:text-sm text-gray-600">Recaudado</p>
                        <p className="text-sm sm:text-xl font-bold text-green-600">${formatCurrency(calcularBruto(resumenDelDia.montos.total_recaudado))}</p>
                        <p className="text-[10px] sm:text-xs text-green-700 hidden sm:block">Neto: ${formatCurrency(resumenDelDia.montos.total_recaudado)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-sm text-gray-600">Pendiente</p>
                        <p className="text-sm sm:text-xl font-bold text-orange-600">${formatCurrency(calcularBruto(resumenDelDia.montos.total_pendiente))}</p>
                        <p className="text-[10px] sm:text-xs text-orange-700 hidden sm:block">Neto: ${formatCurrency(resumenDelDia.montos.total_pendiente)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-sm text-gray-600">Descuentos</p>
                        <p className="text-sm sm:text-xl font-bold text-purple-600">${formatCurrency(resumenDelDia.montos.total_descuentos)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Por Vendedor */}
                  {resumenDelDia.por_vendedor && resumenDelDia.por_vendedor.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                      <h4 className="text-sm sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Por Vendedor
                      </h4>
                      <div className="overflow-x-auto -mx-3 sm:mx-0">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                              <th className="px-2 sm:px-4 py-2 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Vales</th>
                              <th className="px-2 sm:px-4 py-2 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">OK</th>
                              <th className="px-2 sm:px-4 py-2 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Pend</th>
                              <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {resumenDelDia.por_vendedor.map((vendedor, idx) => (
                              <tr key={idx}>
                                <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-900">{vendedor.vendedor}</td>
                                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-gray-900">{vendedor.cantidad}</td>
                                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-green-600 hidden sm:table-cell">{vendedor.completados}</td>
                                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-yellow-600 hidden sm:table-cell">{vendedor.pendientes}</td>
                                <td className="px-2 sm:px-4 py-2 text-right">
                                  <div className="text-xs sm:text-sm font-bold text-green-700">
                                    ${formatCurrency(calcularBruto(vendedor.monto_total))}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                                    Neto: ${formatCurrency(vendedor.monto_total)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportesModal;
