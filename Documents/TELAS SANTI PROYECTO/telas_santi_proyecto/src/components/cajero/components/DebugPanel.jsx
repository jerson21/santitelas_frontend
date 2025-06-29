// /src/components/cajero/components/DebugPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Bug,
  RefreshCw,
  Receipt,
  Loader,
  Search,
  Calendar,
  Clock,
  User,
  DollarSign,
  Filter,
  Download
} from 'lucide-react';
import apiService from '../../../services/api';

const DebugPanel = ({ isOpen, onClose }) => {
  const [valesDelDia, setValesDelDia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    fecha: new Date().toISOString().split('T')[0],
    busqueda: ''
  });
  const [estadisticasDebug, setEstadisticasDebug] = useState({
    total: 0,
    pendientes: 0,
    completados: 0,
    cancelados: 0
  });

  const fetchValesDelDia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fecha: filtros.fecha,
        estado: filtros.estado !== 'todos' ? filtros.estado : '',
        busqueda: filtros.busqueda
      });

      const response = await fetch(`${apiService.baseURL}/cajero/debug/vales-del-dia?${params}`, {
        headers: apiService.getHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setValesDelDia(data.vales || []);
        setEstadisticasDebug(data.estadisticas || {
          total: 0,
          pendientes: 0,
          completados: 0,
          cancelados: 0
        });
      }
    } catch (error) {
      console.error('Error obteniendo vales del día:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarDatos = () => {
    const csvContent = [
      ['Número Diario', 'Número Completo', 'Estado', 'Total', 'Cliente', 'Vendedor', 'Fecha', 'Hora'],
      ...valesDelDia.map(vale => [
        vale.numero_diario,
        vale.numero_pedido,
        vale.estado,
        vale.total,
        vale.cliente || 'N/A',
        vale.vendedor || 'N/A',
        vale.fecha_vale,
        vale.hora_vale
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `vales_debug_${filtros.fecha}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isOpen) {
      fetchValesDelDia();
    }
  }, [isOpen, filtros]);

  const getEstadoBadge = (estado) => {
    const badges = {
      'vale_pendiente': 'bg-yellow-100 text-yellow-800',
      'procesando_caja': 'bg-blue-100 text-blue-800',
      'completado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };

    const labels = {
      'vale_pendiente': 'Pendiente',
      'procesando_caja': 'Procesando',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[estado] || 'bg-gray-100 text-gray-800'}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('es-CL');
  };

  const valesFiltrados = valesDelDia.filter(vale => {
    const cumpleBusqueda = !filtros.busqueda || 
      vale.numero_pedido.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      (vale.cliente && vale.cliente.toLowerCase().includes(filtros.busqueda.toLowerCase())) ||
      (vale.vendedor && vale.vendedor.toLowerCase().includes(filtros.busqueda.toLowerCase()));
    
    return cumpleBusqueda;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Bug className="w-6 h-6 mr-2 text-blue-600" />
            Panel de Debug - Vales del Sistema
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-600 text-sm font-medium">Total</div>
            <div className="text-2xl font-bold text-blue-900">{estadisticasDebug.total}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-yellow-600 text-sm font-medium">Pendientes</div>
            <div className="text-2xl font-bold text-yellow-900">{estadisticasDebug.pendientes}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-green-600 text-sm font-medium">Completados</div>
            <div className="text-2xl font-bold text-green-900">{estadisticasDebug.completados}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-600 text-sm font-medium">Cancelados</div>
            <div className="text-2xl font-bold text-red-900">{estadisticasDebug.cancelados}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <Filter className="w-5 h-5 mr-2 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Filtros</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={filtros.fecha}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                <option value="vale_pendiente">Pendientes</option>
                <option value="procesando_caja">Procesando</option>
                <option value="completado">Completados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar vale, cliente..."
                />
              </div>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={fetchValesDelDia}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
              
              <button
                onClick={exportarDatos}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de vales */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-800">
                Vales encontrados: {valesFiltrados.length}
              </h4>
              {loading && (
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : valesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay vales que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      # Diario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vale Completo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {valesFiltrados.map((vale, index) => (
                    <tr key={vale.id_pedido || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-blue-600">#{vale.numero_diario}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs">{vale.numero_pedido}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getEstadoBadge(vale.estado)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-medium">${formatCurrency(vale.total)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {vale.cliente || <span className="text-gray-400 italic">Sin datos</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {vale.vendedor || <span className="text-gray-400 italic">N/A</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-xs">
                          <div className="flex items-center justify-center mb-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {vale.fecha_vale}
                          </div>
                          <div className="flex items-center justify-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {vale.hora_vale}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Nota:</strong> Este panel muestra información de debugging del sistema. 
            Los datos se actualizan en tiempo real y permiten verificar el estado de todos los vales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;