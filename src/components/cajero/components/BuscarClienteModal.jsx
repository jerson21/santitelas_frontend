// /src/components/cajero/components/BuscarClienteModal.jsx
import React, { useState } from 'react';
import {
  X,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Clock,
  DollarSign,
  Eye
} from 'lucide-react';
import apiService from '../../../services/api';

const BuscarClienteModal = ({ isOpen, onClose, onValeSelect, onCobrarMultiples, onVerDetalle }) => {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [valesPendientes, setValesPendientes] = useState([]);
  const [valesSeleccionados, setValesSeleccionados] = useState([]);
  const [error, setError] = useState('');

  // Nuevos estados para búsqueda múltiple
  const [resultadosMultiples, setResultadosMultiples] = useState([]);
  const [mostrandoMultiples, setMostrandoMultiples] = useState(false);

  const formatRut = (value) => {
    // Eliminar todo excepto números y K
    const clean = value.replace(/[^0-9kK]/g, '');

    if (clean.length <= 1) return clean;

    // Separar cuerpo y dígito verificador
    const cuerpo = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Formatear cuerpo con puntos
    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${cuerpoFormateado}-${dv}`;
  };

  const esRut = (texto) => {
    // Detectar si el texto parece un RUT (contiene principalmente números, guiones o puntos)
    const textoLimpio = texto.trim();
    const caracteresRut = textoLimpio.replace(/[0-9.\-kK]/g, '');
    return caracteresRut.length === 0 && textoLimpio.length > 0;
  };

  const handleBusquedaChange = (e) => {
    const valor = e.target.value;

    // Si parece un RUT, formatear automáticamente
    if (esRut(valor)) {
      const formatted = formatRut(valor);
      setTerminoBusqueda(formatted);
    } else {
      // Si es texto/nombre, dejar sin formatear
      setTerminoBusqueda(valor);
    }

    setError('');
  };

  const buscarCliente = async () => {
    if (!terminoBusqueda.trim()) {
      setError('Ingrese un RUT o nombre para buscar');
      return;
    }

    setLoading(true);
    setError('');
    setMostrandoMultiples(false);
    setResultadosMultiples([]);

    try {
      // Obtener todos los vales pendientes (sin límite de días, sin filtro de cliente)
      const response = await apiService.getValesPorCobrar({
        diasAtras: 9999,
        soloConCliente: false
      });

      console.log('📊 Respuesta de búsqueda:', response);

      if (response.success && response.data?.resumen) {
        const terminoLimpio = terminoBusqueda.trim().toLowerCase();
        const clientesConDeuda = response.data.resumen.clientes_con_deuda || [];
        console.log('👥 Clientes con deuda encontrados:', clientesConDeuda.length);

        if (esRut(terminoBusqueda)) {
          // Búsqueda por RUT (exacta, 1 resultado)
          const rutLimpio = terminoBusqueda.replace(/\./g, '').replace(/-/g, '');
          console.log('🔍 Buscando RUT:', rutLimpio);

          const clienteData = clientesConDeuda.find(c => {
            const rutCliente = c.cliente?.rut?.replace(/\./g, '').replace(/-/g, '').toLowerCase();
            console.log('  Comparando con:', rutCliente);
            return rutCliente === rutLimpio.toLowerCase();
          });

          if (clienteData) {
            console.log('✅ Cliente encontrado:', clienteData.cliente);
            setClienteEncontrado(clienteData.cliente);
            setValesPendientes(clienteData.vales);
            setMostrandoMultiples(false);
          } else {
            console.log('❌ No se encontró cliente para el RUT');
            setError('No se encontraron vales pendientes para el RUT ingresado');
            setClienteEncontrado(null);
            setValesPendientes([]);
          }
        } else {
          // Búsqueda por nombre (múltiple, todos los resultados)
          console.log('🔍 Buscando nombre:', terminoLimpio);

          const resultados = clientesConDeuda.filter(c => {
            const nombre = c.cliente?.nombre?.toLowerCase() || '';
            const razonSocial = c.cliente?.razon_social?.toLowerCase() || '';
            return nombre.includes(terminoLimpio) || razonSocial.includes(terminoLimpio);
          });

          console.log(`✅ Encontrados ${resultados.length} clientes`);

          if (resultados.length === 0) {
            setError('No se encontraron clientes con ese nombre');
            setClienteEncontrado(null);
            setValesPendientes([]);
            setMostrandoMultiples(false);
          } else if (resultados.length === 1) {
            // Solo 1 resultado, mostrarlo directamente
            setClienteEncontrado(resultados[0].cliente);
            setValesPendientes(resultados[0].vales);
            setMostrandoMultiples(false);
          } else {
            // Múltiples resultados, mostrar lista para elegir
            setResultadosMultiples(resultados);
            setMostrandoMultiples(true);
            setClienteEncontrado(null);
            setValesPendientes([]);
          }
        }
      } else {
        console.error('❌ Respuesta sin datos:', response);
        setError('Error al buscar el cliente');
      }
    } catch (err) {
      console.error('❌ Error buscando cliente:', err);
      setError('Error al buscar el cliente. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCliente = (clienteData) => {
    setClienteEncontrado(clienteData.cliente);
    setValesPendientes(clienteData.vales);
    setMostrandoMultiples(false);
    setResultadosMultiples([]);
  };

  const handleValeClick = (numeroVale) => {
    if (onValeSelect) {
      onValeSelect(numeroVale);
      handleClose();
    }
  };

  const handleToggleVale = (vale) => {
    setValesSeleccionados(prev => {
      const yaSeleccionado = prev.find(v => v.numero_pedido === vale.numero_pedido);
      if (yaSeleccionado) {
        return prev.filter(v => v.numero_pedido !== vale.numero_pedido);
      } else {
        return [...prev, vale];
      }
    });
  };

  const handleSeleccionarTodos = () => {
    if (valesSeleccionados.length === valesPendientes.length) {
      setValesSeleccionados([]);
    } else {
      setValesSeleccionados([...valesPendientes]);
    }
  };

  const handleCobrarSeleccionados = () => {
    if (valesSeleccionados.length > 0 && onCobrarMultiples) {
      onCobrarMultiples({
        cliente: clienteEncontrado,
        vales: valesSeleccionados
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTerminoBusqueda('');
    setClienteEncontrado(null);
    setValesPendientes([]);
    setValesSeleccionados([]);
    setResultadosMultiples([]);
    setMostrandoMultiples(false);
    setError('');
    onClose();
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarCliente();
    }
  };

  if (!isOpen) return null;

  const totalDeuda = valesPendientes.reduce((sum, vale) => sum + Number(vale.total || 0), 0);
  const totalSeleccionado = valesSeleccionados.reduce((sum, vale) => sum + Number(vale.total || 0), 0);
  const todosSeleccionados = valesSeleccionados.length === valesPendientes.length && valesPendientes.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Search className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-800">Buscar Cliente</h3>
              <p className="text-sm text-gray-500">Busca vales pendientes por RUT o nombre del cliente</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Búsqueda */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUT o Nombre del Cliente
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={terminoBusqueda}
                  onChange={handleBusquedaChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ej: 12.345.678-9 o Juan Pérez"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  autoFocus
                />
              </div>
              <button
                onClick={buscarCliente}
                disabled={loading || !terminoBusqueda}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Buscar</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Múltiples resultados - Seleccionar cliente */}
          {mostrandoMultiples && resultadosMultiples.length > 0 && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">
                  ✨ Se encontraron {resultadosMultiples.length} clientes. Selecciona uno:
                </p>
              </div>

              <div className="space-y-2">
                {resultadosMultiples.map((clienteData, idx) => {
                  const totalDeuda = clienteData.vales.reduce((sum, vale) => sum + Number(vale.total || 0), 0);

                  return (
                    <div
                      key={idx}
                      onClick={() => seleccionarCliente(clienteData)}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-gray-600" />
                            <h4 className="font-bold text-gray-900">{clienteData.cliente.nombre}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            {clienteData.cliente.rut && (
                              <div>
                                <span className="font-medium">RUT:</span> {clienteData.cliente.rut}
                              </div>
                            )}
                            {clienteData.cliente.telefono && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {clienteData.cliente.telefono}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-500">Deuda</p>
                          <p className="text-xl font-bold text-red-600">
                            ${formatCurrency(calcularBruto(totalDeuda))}
                          </p>
                          <p className="text-xs text-gray-500">
                            {clienteData.vales.length} vale{clienteData.vales.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resultados - Cliente único */}
          {!mostrandoMultiples && clienteEncontrado && valesPendientes.length > 0 && (
            <div className="space-y-4">
              {/* Información del Cliente */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="w-6 h-6 text-blue-600" />
                      <h4 className="text-xl font-bold text-gray-900">
                        {clienteEncontrado.nombre}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium mr-2">RUT:</span>
                        <span>{clienteEncontrado.rut}</span>
                      </div>

                      {clienteEncontrado.telefono && (
                        <div className="flex items-center text-gray-700">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{clienteEncontrado.telefono}</span>
                        </div>
                      )}

                      {clienteEncontrado.email && (
                        <div className="flex items-center text-gray-700">
                          <Mail className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="truncate">{clienteEncontrado.email}</span>
                        </div>
                      )}

                      {clienteEncontrado.direccion && (
                        <div className="flex items-center text-gray-700">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="truncate">{clienteEncontrado.direccion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-600 font-medium">Deuda Total</p>
                    <p className="text-3xl font-bold text-red-600">${formatCurrency(calcularBruto(totalDeuda))}</p>
                    <p className="text-xs text-gray-500">Neto: ${formatCurrency(totalDeuda)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {valesPendientes.length} vale{valesPendientes.length !== 1 ? 's' : ''} pendiente{valesPendientes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Vales Pendientes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-600" />
                    Vales Pendientes de Cobro
                  </h5>
                  <button
                    onClick={handleSeleccionarTodos}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {todosSeleccionados ? '☑ Deseleccionar Todos' : '☐ Seleccionar Todos'}
                  </button>
                </div>

                <div className="space-y-2">
                  {valesPendientes.map((vale, idx) => {
                    const isSelected = valesSeleccionados.find(v => v.numero_pedido === vale.numero_pedido);
                    return (
                      <div
                        key={idx}
                        className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Checkbox */}
                          <div className="flex-shrink-0 pt-1">
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleVale(vale);
                              }}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          {/* Contenido del Vale */}
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="text-lg font-bold text-blue-600 group-hover:text-blue-800">
                                    {vale.numero_diario ? `#${String(vale.numero_diario).padStart(3, '0')}` : vale.numero_pedido}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    vale.dias_pendiente > 7
                                      ? 'bg-red-100 text-red-800'
                                      : vale.dias_pendiente > 3
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {vale.dias_pendiente} día{vale.dias_pendiente !== 1 ? 's' : ''} pendiente{vale.dias_pendiente !== 1 ? 's' : ''}
                                  </span>
                                  {vale.tipo_documento && (
                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                      {vale.tipo_documento}
                                    </span>
                                  )}
                                </div>

                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Fecha:</span> {formatDate(vale.fecha_creacion)}
                                </div>
                              </div>

                              <div className="text-right ml-4 flex items-center space-x-3">
                                <div>
                                  <div className="flex items-center justify-end space-x-2">
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-gray-900">
                                        ${formatCurrency(calcularBruto(vale.total))}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Neto: ${formatCurrency(vale.total)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onVerDetalle) {
                                        onVerDetalle(vale.numero_pedido);
                                      }
                                    }}
                                    className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                                    title="Ver detalle del vale"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Ver
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleValeClick(vale.numero_pedido);
                                    }}
                                    className="inline-flex items-center justify-center px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs font-medium"
                                    title="Cobrar este vale"
                                  >
                                    💵 Cobrar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen de Selección */}
                {valesSeleccionados.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">
                          ✓ {valesSeleccionados.length} vale{valesSeleccionados.length !== 1 ? 's' : ''} seleccionado{valesSeleccionados.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          Total a cobrar: ${formatCurrency(calcularBruto(totalSeleccionado))}
                        </p>
                        <p className="text-xs text-green-700">
                          Neto: ${formatCurrency(totalSeleccionado)}
                        </p>
                      </div>
                      <button
                        onClick={handleCobrarSeleccionados}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg font-semibold text-lg"
                      >
                        <DollarSign className="w-5 h-5" />
                        <span>Cobrar Seleccionados</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay resultados después de buscar */}
          {!loading && !error && !mostrandoMultiples && clienteEncontrado === null && terminoBusqueda && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ingrese un RUT o nombre y presione buscar</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            💡 <span className="font-medium">Tip:</span> Busca por RUT (único) o nombre (múltiple). Presiona Enter para buscar.
          </div>
          <button
            onClick={handleClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuscarClienteModal;
