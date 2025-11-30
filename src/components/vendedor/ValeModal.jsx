// ✅ ValeModal optimizado para pantallas táctiles
import React, { useState, useEffect } from 'react';
import { Check, Receipt, Copy, Calendar, Clock } from 'lucide-react';

const ValeModal = ({ valeData, onClose }) => {
  const [copiado, setCopiado] = useState(false);

  // Manejar ambas estructuras de datos
  const datos = valeData?.data ? valeData.data : valeData;
  
  // Extraer datos del vale
  const numeroCliente = datos?.numero_diario 
    ? String(datos.numero_diario).padStart(3, '0')
    : '000';
  
  const numeroCompleto = datos?.numero_pedido || '';
  const fechaCreacion = datos?.fecha_creacion ? new Date(datos.fecha_creacion) : new Date();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(numeroCliente);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
      // Fallback para navegadores sin soporte
      const textArea = document.createElement('textarea');
      textArea.value = numeroCliente;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const formatearFecha = () => {
    return fechaCreacion.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearHora = () => {
    return fechaCreacion.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(precio || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-8 text-center">
          {/* Icono de éxito */}
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          
          {/* Título */}
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Vale Creado Exitosamente!
          </h3>
          <p className="text-gray-600 mb-6">
            El vale ha sido registrado en el sistema
          </p>
          
          {/* NÚMERO PROMINENTE */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Receipt className="w-6 h-6 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Número de Vale:</p>
            </div>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="text-6xl font-bold text-blue-600 font-mono tracking-wider">
                #{numeroCliente}
              </div>
              <button
                onClick={copyToClipboard}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  copiado 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
                title={copiado ? 'Copiado!' : 'Copiar número'}
              >
                {copiado ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Información adicional */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatearFecha()}</span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatearHora()}</span>
              </div>
            </div>
          </div>

          {/* Total del vale si existe */}
          {datos?.total && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-600 mb-1">Total del Vale:</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatearPrecio(datos.total)}
              </p>
            </div>
          )}

          {/* Instrucción simple */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-amber-700 font-medium">
              Diríjase a caja con el número <strong>#{numeroCliente}</strong> para realizar el pago
            </p>
          </div>
          
          {/* Botón principal */}
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Continuar Vendiendo
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ EstadisticasDia para vendedores
const EstadisticasDia = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setCargando(true);
        setError(null);
        const response = await ApiService.getEstadisticasDia();
        if (response.success) {
          setEstadisticas(response.data);
        } else {
          setError('No se pudieron cargar las estadísticas');
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setError('Error al conectar con el servidor');
      } finally {
        setCargando(false);
      }
    };

    cargarEstadisticas();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarEstadisticas, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="text-center text-red-600">
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-xs underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(precio || 0);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-semibold text-gray-800 mb-3">📊 Estadísticas del Día</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">
            {estadisticas?.ultimo_numero || 0}
          </p>
          <p className="text-xs text-gray-600">Último Vale</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">
            {estadisticas?.total_vales || 0}
          </p>
          <p className="text-xs text-gray-600">Total Vales</p>
        </div>
        <div>
          <p className="text-lg font-bold text-purple-600">
            {formatearPrecio(estadisticas?.monto_total || 0)}
          </p>
          <p className="text-xs text-gray-600">Monto Total</p>
        </div>
      </div>
      
      {estadisticas?.fecha && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Fecha: {new Date(estadisticas.fecha).toLocaleDateString('es-CL')}
          </p>
        </div>
      )}
    </div>
  );
};

export { ValeModal, EstadisticasDia };
export default ValeModal;