// /src/components/cajero/components/ClientesModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Loader,
  ShoppingCart,
  CheckCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import apiService from '../../../services/api';

const ClientesModal = ({ isOpen, onClose, onClienteSelect }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('total_comprado');
  const [clienteExpandido, setClienteExpandido] = useState(null);
  const [valesCliente, setValesCliente] = useState({});
  const [loadingVales, setLoadingVales] = useState({});
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 20;

  useEffect(() => {
    if (isOpen) {
      cargarClientes();
    } else {
      setClienteExpandido(null);
      setValesCliente({});
      setLoadingVales({});
      setSearchTerm('');
      setPaginaActual(1);
    }
  }, [isOpen]);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm]);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllClientes();
      if (response.success && response.data) {
        setClientes(response.data);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarValesCliente = async (cliente) => {
    if (!cliente.rut) return;
    setLoadingVales(prev => ({ ...prev, [cliente.rut]: true }));
    try {
      const response = await apiService.getValesCliente(cliente.rut);
      if (response.success && response.data) {
        setValesCliente(prev => ({
          ...prev,
          [cliente.rut]: response.data
        }));
      }
    } catch (error) {
      console.error('Error cargando vales del cliente:', error);
    } finally {
      setLoadingVales(prev => ({ ...prev, [cliente.rut]: false }));
    }
  };

  const toggleCliente = (cliente) => {
    if (clienteExpandido === cliente.rut) {
      setClienteExpandido(null);
    } else {
      setClienteExpandido(cliente.rut);
      if (!valesCliente[cliente.rut]) {
        cargarValesCliente(cliente);
      }
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
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const clientesFiltrados = clientes.filter(c => {
    const termino = searchTerm.toLowerCase();
    const nombre = c.nombre?.toLowerCase() || '';
    const rut = c.rut?.toLowerCase() || '';
    const razonSocial = c.razon_social?.toLowerCase() || '';
    return nombre.includes(termino) || rut.includes(termino) || razonSocial.includes(termino);
  });

  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    switch (sortBy) {
      case 'total_comprado':
        return (b.total_comprado || 0) - (a.total_comprado || 0);
      case 'pendientes':
        return (b.total_pendiente || 0) - (a.total_pendiente || 0);
      case 'nombre':
        return (a.nombre || '').localeCompare(b.nombre || '');
      default:
        return 0;
    }
  });

  // Paginación
  const totalPaginas = Math.ceil(clientesOrdenados.length / clientesPorPagina);
  const indiceInicio = (paginaActual - 1) * clientesPorPagina;
  const indiceFin = indiceInicio + clientesPorPagina;
  const clientesPaginados = clientesOrdenados.slice(indiceInicio, indiceFin);

  const totales = clientes.reduce((acc, c) => ({
    clientes: acc.clientes + 1,
    totalComprado: acc.totalComprado + Number(c.total_comprado || 0),
    totalPendiente: acc.totalPendiente + Number(c.total_pendiente || 0),
    totalPagado: acc.totalPagado + Number(c.total_pagado || 0)
  }), {
    clientes: 0,
    totalComprado: 0,
    totalPendiente: 0,
    totalPagado: 0
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
              <Users className="w-7 h-7 mr-2 text-blue-600" />
              Clientes
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Resumen Cards */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Clientes</p>
                <p className="text-2xl font-bold text-blue-600">{totales.clientes}</p>
              </div>
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Vendido</p>
                <p className="text-base font-bold text-green-600">
                  ${formatCurrency(calcularBruto(totales.totalComprado))}
                </p>
              </div>
              <ShoppingCart className="w-7 h-7 text-green-400" />
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Por Cobrar</p>
                <p className="text-base font-bold text-orange-600">
                  ${formatCurrency(calcularBruto(totales.totalPendiente))}
                </p>
              </div>
              <Clock className="w-7 h-7 text-orange-400" />
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Pagado</p>
                <p className="text-base font-bold text-purple-600">
                  ${formatCurrency(calcularBruto(totales.totalPagado))}
                </p>
              </div>
              <CheckCircle className="w-7 h-7 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="px-5 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, RUT o razón social..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="total_comprado">Mayor Comprado</option>
              <option value="pendientes">Mayor Pendiente</option>
              <option value="nombre">A-Z</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Cargando clientes...</span>
            </div>
          ) : clientesOrdenados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-sm">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-sm">RUT</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-sm">Teléfono</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 text-sm">Total Comprado</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 text-sm">Pendiente</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesPaginados.map((cliente, idx) => {
                  const isExpanded = clienteExpandido === cliente.rut;
                  const vales = valesCliente[cliente.rut];
                  const isLoadingVales = loadingVales[cliente.rut];

                  return (
                    <React.Fragment key={idx}>
                      {/* Fila del Cliente */}
                      <tr
                        className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                          isExpanded ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{cliente.nombre}</div>
                          {cliente.direccion && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {cliente.direccion}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{cliente.rut || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{cliente.telefono || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-green-600">
                            ${formatCurrency(calcularBruto(cliente.total_comprado || 0))}
                          </div>
                          <div className="text-xs text-gray-500">
                            Neto: ${formatCurrency(cliente.total_comprado || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {Number(cliente.total_pendiente || 0) > 0 ? (
                            <>
                              <div className="font-semibold text-orange-600">
                                ${formatCurrency(calcularBruto(cliente.total_pendiente || 0))}
                              </div>
                              <div className="text-xs text-gray-500">
                                Neto: ${formatCurrency(cliente.total_pendiente || 0)}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleCliente(cliente)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Fila Expandida - Vales */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" className="bg-gray-50 px-4 py-3">
                            {isLoadingVales ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                                <span className="ml-3 text-gray-600">Cargando vales...</span>
                              </div>
                            ) : vales ? (
                              <div className="grid grid-cols-2 gap-4">
                                {/* Vales Pendientes */}
                                <div>
                                  <h5 className="text-sm font-bold text-orange-700 mb-2 flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Vales Pendientes ({vales.pendientes?.length || 0})
                                  </h5>
                                  {vales.pendientes && vales.pendientes.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {vales.pendientes.map((vale, vIdx) => (
                                        <div
                                          key={vIdx}
                                          className="bg-orange-50 border border-orange-200 rounded-lg p-2 flex justify-between items-center"
                                        >
                                          <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                              Vale #{vale.numero_pedido}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                              {formatDate(vale.fecha_creacion)}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-bold text-orange-600">
                                              ${formatCurrency(calcularBruto(vale.total || 0))}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              Neto: ${formatCurrency(vale.total || 0)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">Sin vales pendientes</p>
                                  )}
                                </div>

                                {/* Vales Pagados */}
                                <div>
                                  <h5 className="text-sm font-bold text-green-700 mb-2 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Vales Pagados ({vales.pagados?.length || 0})
                                  </h5>
                                  {vales.pagados && vales.pagados.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {vales.pagados.map((vale, vIdx) => (
                                        <div
                                          key={vIdx}
                                          className="bg-green-50 border border-green-200 rounded-lg p-2 flex justify-between items-center"
                                        >
                                          <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                              Vale #{vale.numero_pedido}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                              {formatDate(vale.fecha_creacion)}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-bold text-green-600">
                                              ${formatCurrency(calcularBruto(vale.total || 0))}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              Neto: ${formatCurrency(vale.total || 0)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">Sin vales pagados</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-500">
                                No se pudieron cargar los vales
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer con Paginación */}
        <div className="border-t border-gray-200 px-5 py-3 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicio + 1}-{Math.min(indiceFin, clientesOrdenados.length)} de {clientesOrdenados.length} clientes
              {searchTerm && ` (filtrados de ${clientes.length} totales)`}
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-1">
                  {[...Array(totalPaginas)].map((_, i) => {
                    const pageNum = i + 1;
                    // Mostrar solo algunas páginas alrededor de la actual
                    if (
                      pageNum === 1 ||
                      pageNum === totalPaginas ||
                      (pageNum >= paginaActual - 1 && pageNum <= paginaActual + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPaginaActual(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            paginaActual === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === paginaActual - 2 ||
                      pageNum === paginaActual + 2
                    ) {
                      return <span key={pageNum} className="text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientesModal;
