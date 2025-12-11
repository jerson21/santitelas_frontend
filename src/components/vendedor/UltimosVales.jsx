import React, { useState, useEffect } from 'react';
import { X, FileText, User, Calendar, Printer, Loader2, Plus } from 'lucide-react';
import ApiService from '../../services/api';
import printService from '../../services/printService';

/**
 * Componente simple para mostrar los últimos 3 vales creados por el vendedor
 * Sin información de dinero - solo para reimprimir si el cliente pierde el ticket
 */
const UltimosVales = ({ isOpen, onClose, onAgregarProductos }) => {
  const [vales, setVales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadUltimosVales();
    }
  }, [isOpen]);

  const loadUltimosVales = async () => {
    setLoading(true);
    try {
      // Obtener solo los últimos 3 vales de hoy
      const hoy = new Date().toISOString().split('T')[0];
      console.log('🔍 Cargando vales del día:', hoy);

      const response = await ApiService.getValesDelDia(hoy);

      console.log('📥 Respuesta del backend:', response);

      if (response.success && response.data) {
        // La respuesta puede venir en diferentes formatos
        let valesArray = [];

        // Opción 1: response.data.vales
        if (response.data.vales && Array.isArray(response.data.vales)) {
          valesArray = response.data.vales;
        }
        // Opción 2: response.data es array directamente
        else if (Array.isArray(response.data)) {
          valesArray = response.data;
        }

        console.log(`✅ Vales encontrados: ${valesArray.length}`);

        // Tomar solo los últimos 3 y ordenar por más reciente
        const ultimosTres = valesArray
          .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
          .slice(0, 3);

        console.log('📋 Últimos 3 vales:', ultimosTres);
        setVales(ultimosTres);
      } else {
        console.warn('⚠️ No hay vales o respuesta no exitosa:', response);
        setVales([]);
      }
    } catch (error) {
      console.error('❌ Error cargando últimos vales:', error);
      console.error('Error completo:', error.message, error.stack);
      setVales([]);
    }
    setLoading(false);
  };

  const handleReimprimir = async (vale) => {
    setImprimiendo(vale.id_pedido);
    try {
      console.log('🖨️ Reimprimiendo vale:', vale.numero_pedido || vale.numero_vale);

      // Obtener detalles del vale para imprimir
      let detalles = [];
      try {
        const detallesResponse = await ApiService.getDetallesValeVendedor(vale.id_pedido);
        if (detallesResponse.success && detallesResponse.data) {
          detalles = detallesResponse.data.productos || detallesResponse.data.detalles || [];
        }
      } catch (e) {
        console.warn('No se pudieron obtener detalles del vale, imprimiendo sin productos');
      }

      // Imprimir usando el servicio
      const result = await printService.reimprimirVale(vale, detalles);

      if (result.success) {
        // Mostrar mensaje de éxito breve
        console.log('✅ Vale reimpreso correctamente');
      } else {
        // Mostrar error
        alert(result.error || 'No se pudo imprimir el vale. Verifique que Print Server esté ejecutándose.');
      }
    } catch (error) {
      console.error('❌ Error reimprimiendo vale:', error);
      alert('Error al reimprimir vale: ' + error.message);
    }
    setImprimiendo(null);
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText className="w-7 h-7" />
              <div>
                <h2 className="text-2xl font-bold">Últimos Vales Creados</h2>
                <p className="text-blue-100 text-sm">Para reimprimir si el cliente perdió el ticket</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Cargando vales...</p>
            </div>
          ) : vales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg font-medium">No hay vales recientes</p>
              <p className="text-gray-400 text-sm mt-2">
                Los vales creados hoy aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vales.map((vale, index) => (
                <div
                  key={vale.id_pedido || index}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Número de Vale */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {vale.numero_pedido || vale.numero_vale}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vale.estado === 'vale_pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : vale.estado === 'completado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {vale.estado === 'vale_pendiente' ? 'Pendiente en Caja' :
                           vale.estado === 'completado' ? 'Procesado' : vale.estado}
                        </span>
                      </div>

                      {/* Información del Cliente */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* Cliente - puede venir como cliente_nombre o cliente.nombre */}
                        <div className="flex items-center text-gray-600">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <span className="font-medium">Cliente:</span>
                            <div className="text-gray-800 font-semibold">
                              {vale.nombre_cliente ||
                               vale.cliente?.nombre ||
                               vale.cliente_nombre ||
                               'Sin cliente'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <span className="font-medium">Hora:</span>
                            <div className="text-gray-800 font-semibold">
                              {formatFecha(vale.fecha_creacion)}
                            </div>
                          </div>
                        </div>

                        {/* RUT - puede venir de diferentes formas */}
                        {(vale.cliente_rut || vale.cliente?.rut || vale.rut_cliente) && (
                          <div className="text-gray-600">
                            <span className="font-medium">RUT:</span>
                            <span className="ml-2 text-gray-800 font-mono">
                              {vale.cliente_rut || vale.cliente?.rut || vale.rut_cliente}
                            </span>
                          </div>
                        )}

                        <div className="text-gray-600">
                          <span className="font-medium">Documento:</span>
                          <span className="ml-2 text-gray-800 capitalize">
                            {vale.tipo_documento}
                          </span>
                        </div>
                      </div>

                      {/* Cantidad de productos (sin mostrar montos) */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">
                            {vale.total_productos || vale.cantidad_productos || 0} producto{(vale.total_productos || vale.cantidad_productos) !== 1 ? 's' : ''} en el vale
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="ml-4 flex flex-col gap-2">
                      {/* Botón Agregar Productos - Solo si el vale está pendiente */}
                      {vale.estado === 'vale_pendiente' && (
                        <button
                          onClick={() => {
                            onAgregarProductos(vale);
                            onClose();
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
                        >
                          <Plus className="w-5 h-5" />
                          <span className="text-sm font-medium">Agregar Productos</span>
                        </button>
                      )}

                      {/* Botón Reimprimir */}
                      <button
                        onClick={() => handleReimprimir(vale)}
                        disabled={imprimiendo === vale.id_pedido}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md"
                      >
                        {imprimiendo === vale.id_pedido ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">Imprimiendo...</span>
                          </>
                        ) : (
                          <>
                            <Printer className="w-5 h-5" />
                            <span className="text-sm font-medium">Reimprimir</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Mostrando últimos {vales.length} vale{vales.length !== 1 ? 's' : ''} de hoy
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltimosVales;
