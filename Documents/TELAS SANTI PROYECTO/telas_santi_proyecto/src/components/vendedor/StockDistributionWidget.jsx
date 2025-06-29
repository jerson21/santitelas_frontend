import React, { useState, useEffect } from 'react';
import { Warehouse, Package, TrendingUp, AlertTriangle, BarChart3, Info } from 'lucide-react';
import ApiService from '../../services/api';

// ✅ Widget para mostrar distribución de stock en el dashboard
const StockDistributionWidget = ({ selectedCategory, selectedProduct }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('resumen'); // 'resumen' | 'detalle'

  useEffect(() => {
    if (selectedProduct) {
      loadStockDistribution();
    }
  }, [selectedProduct]);

  const loadStockDistribution = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const response = await ApiService.getProduct(selectedProduct.id_producto);
      if (response.success && response.data) {
        setStockData(response.data);
      }
    } catch (error) {
      console.error('Error cargando distribución:', error);
    }
    setLoading(false);
  };

  if (!stockData || loading) {
    return null;
  }

  const stockTotal = stockData.resumen?.stock_total || 0;
  const distribucionGeneral = stockData.resumen?.distribucion_general || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Warehouse className="w-5 h-5 mr-2 text-blue-600" />
          Distribución de Stock
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('resumen')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'resumen' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setViewMode('detalle')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'detalle' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Por Variante
          </button>
        </div>
      </div>

      {viewMode === 'resumen' ? (
        <StockResumenView 
          stockTotal={stockTotal} 
          distribucion={distribucionGeneral}
          unidadMedida={stockData.unidad_medida}
        />
      ) : (
        <StockDetalleView 
          variantes={stockData.variantes || []}
          unidadMedida={stockData.unidad_medida}
        />
      )}
    </div>
  );
};

// ✅ Vista de resumen general
const StockResumenView = ({ stockTotal, distribucion, unidadMedida = 'unidades' }) => {
  if (!distribucion || distribucion.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Sin información de distribución</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total general */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Stock Total:</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600">
              {stockTotal.toLocaleString('es-CL')}
            </span>
            <span className="text-sm text-gray-600 ml-1">{unidadMedida}</span>
          </div>
        </div>
      </div>

      {/* Distribución por bodega */}
      <div className="space-y-2">
        {distribucion.map((bodega, idx) => {
          const porcentaje = stockTotal > 0 
            ? Math.round((bodega.cantidad / stockTotal) * 100)
            : 0;

          return (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {bodega.nombre}
                  {bodega.es_punto_venta && (
                    <span className="ml-2 text-xs text-green-600">(Punto Venta)</span>
                  )}
                </span>
                <span className="text-sm font-semibold">
                  {bodega.cantidad.toLocaleString('es-CL')} ({porcentaje}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    bodega.es_punto_venta ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicadores rápidos */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-xs text-gray-600">Bodegas con Stock</p>
          <p className="text-lg font-bold text-green-600">
            {distribucion.filter(b => b.cantidad > 0).length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Mayor Concentración</p>
          <p className="text-sm font-bold text-blue-600">
            {distribucion[0]?.nombre || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ✅ Vista detallada por variante
const StockDetalleView = ({ variantes, unidadMedida = 'unidades' }) => {
  const [selectedVariante, setSelectedVariante] = useState(variantes[0]);

  if (!variantes || variantes.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No hay variantes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de variante */}
      <div className="flex flex-wrap gap-2">
        {variantes.map((variante, idx) => {
          const descripcion = [variante.color, variante.medida, variante.material]
            .filter(Boolean).join(' - ') || 'Estándar';
          const isSelected = selectedVariante?.id_variante === variante.id_variante;

          return (
            <button
              key={variante.id_variante || idx}
              onClick={() => setSelectedVariante(variante)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                isSelected 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div>
                <span className="font-medium">{descripcion}</span>
                <span className={`ml-2 text-xs ${
                  isSelected ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  ({variante.stock_total || 0} {unidadMedida})
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Distribución de la variante seleccionada */}
      {selectedVariante && (
        <div className="border-t pt-4">
          <div className="mb-3">
            <h4 className="font-medium text-gray-700">
              {[selectedVariante.color, selectedVariante.medida, selectedVariante.material]
                .filter(Boolean).join(' - ') || 'Estándar'}
            </h4>
            {selectedVariante.sku && (
              <p className="text-xs text-gray-500">SKU: {selectedVariante.sku}</p>
            )}
          </div>

          {selectedVariante.distribucion_bodegas && selectedVariante.distribucion_bodegas.length > 0 ? (
            <div className="space-y-2">
              {selectedVariante.distribucion_bodegas
                .filter(b => b.cantidad_disponible > 0)
                .map((bodega, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Warehouse className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{bodega.nombre_bodega}</span>
                      {bodega.es_punto_venta && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          PV
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm">
                        {bodega.cantidad_disponible}
                      </span>
                      {bodega.cantidad_reservada > 0 && (
                        <span className="text-xs text-orange-600 block">
                          ({bodega.cantidad_reservada} reserv.)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Sin stock disponible</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ✅ Componente mini para mostrar en la lista de productos
export const StockIndicator = ({ producto }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const stockTotal = producto.resumen?.stock_total || producto.stock_total || 0;
  const tienePocasUnidades = stockTotal > 0 && stockTotal < 10;
  const sinStock = stockTotal === 0;

  const getColorClass = () => {
    if (sinStock) return 'text-red-600 bg-red-50';
    if (tienePocasUnidades) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getIcon = () => {
    if (sinStock) return <AlertTriangle className="w-4 h-4" />;
    if (tienePocasUnidades) return <TrendingUp className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getColorClass()}`}
      >
        {getIcon()}
        <span>{stockTotal}</span>
      </button>

      {showTooltip && producto.resumen?.distribucion_general && (
        <div className="absolute z-50 bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-3 min-w-[200px]">
          <div className="text-xs space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Distribución:</p>
            {producto.resumen.distribucion_general.slice(0, 3).map((bodega, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-600">{bodega.nombre}:</span>
                <span className="font-medium">{bodega.cantidad}</span>
              </div>
            ))}
            {producto.resumen.distribucion_general.length > 3 && (
              <p className="text-gray-500 text-center pt-1">
                +{producto.resumen.distribucion_general.length - 3} más...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDistributionWidget;