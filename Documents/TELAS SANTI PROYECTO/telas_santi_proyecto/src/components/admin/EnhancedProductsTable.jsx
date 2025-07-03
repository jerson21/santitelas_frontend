// EnhancedProductsTable.jsx - Tabla mejorada con gestión de bodegas
import React, { useState } from 'react';
import { 
  Warehouse, Package, AlertTriangle, Eye, EyeOff, 
  ArrowRightLeft, Plus, Settings, BarChart3, MapPin 
} from 'lucide-react';

const EnhancedProductsTable = ({ productos, onStockUpdate }) => {
  const [expandedVariants, setExpandedVariants] = useState(new Set());
  const [stockViewMode, setStockViewMode] = useState('summary'); // 'summary' | 'detailed'

  const toggleVariantExpansion = (varianteId) => {
    const newExpanded = new Set(expandedVariants);
    if (newExpanded.has(varianteId)) {
      newExpanded.delete(varianteId);
    } else {
      newExpanded.add(varianteId);
    }
    setExpandedVariants(newExpanded);
  };

  // 1. HEADER DE TABLA MEJORADO
  const TableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left">Producto/Variante</th>
        <th className="px-4 py-3 text-left">SKU</th>
        <th className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span>Stock</span>
            <button
              onClick={() => setStockViewMode(stockViewMode === 'summary' ? 'detailed' : 'summary')}
              className="p-1 hover:bg-gray-200 rounded"
              title={stockViewMode === 'summary' ? 'Ver distribución detallada' : 'Ver resumen'}
            >
              {stockViewMode === 'summary' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </th>
        <th className="px-4 py-3 text-center">Alertas</th>
        <th className="px-4 py-3 text-center">Acciones</th>
      </tr>
    </thead>
  );

  // 2. FILA DE VARIANTE MEJORADA
  const VariantRow = ({ producto, variante }) => {
    const isExpanded = expandedVariants.has(variante.id_variante);
    const stockData = variante.distribucion_bodegas || [];
    const stockTotal = variante.stock_total || 0;
    const hasLowStock = stockData.some(b => b.cantidad_disponible > 0 && b.cantidad_disponible < 10);
    const hasNoStock = stockData.some(b => b.cantidad_disponible === 0);

    return (
      <>
        <tr className="border-b hover:bg-gray-50">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleVariantExpansion(variante.id_variante)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <div>
                <div className="font-medium">{variante.descripcion_opcion}</div>
                <div className="text-sm text-gray-500">{producto.nombre}</div>
              </div>
            </div>
          </td>
          
          <td className="px-4 py-3 font-mono text-sm">{variante.sku}</td>
          
          <td className="px-4 py-3">
            {stockViewMode === 'summary' ? (
              <StockSummaryView stockTotal={stockTotal} stockData={stockData} />
            ) : (
              <StockDetailedView stockData={stockData} unidadMedida={producto.unidad_medida} />
            )}
          </td>
          
          <td className="px-4 py-3 text-center">
            <StockAlerts hasLowStock={hasLowStock} hasNoStock={hasNoStock} />
          </td>
          
          <td className="px-4 py-3 text-center">
            <VariantActions variante={variante} producto={producto} />
          </td>
        </tr>
        
        {/* FILA EXPANDIDA CON GESTIÓN DETALLADA */}
        {isExpanded && (
          <tr>
            <td colSpan="5" className="px-6 py-4 bg-gray-50">
              <ExpandedVariantManager 
                variante={variante} 
                producto={producto}
                onStockUpdate={onStockUpdate}
              />
            </td>
          </tr>
        )}
      </>
    );
  };

  // 3. VISTA RESUMEN DE STOCK
  const StockSummaryView = ({ stockTotal, stockData }) => (
    <div className="flex items-center justify-center gap-2">
      <div className="text-center">
        <div className="text-lg font-bold">{stockTotal}</div>
        <div className="text-xs text-gray-500">
          {stockData.filter(b => b.cantidad_disponible > 0).length} bodegas
        </div>
      </div>
      <StockDistributionMini stockData={stockData} />
    </div>
  );

  // 4. VISTA DETALLADA DE STOCK
  const StockDetailedView = ({ stockData, unidadMedida }) => (
    <div className="space-y-1 max-w-xs">
      {stockData.slice(0, 3).map((bodega, idx) => (
        <div key={idx} className="flex justify-between text-xs">
          <span className="truncate">{bodega.nombre_bodega}</span>
          <span className="font-medium">{bodega.cantidad_disponible}</span>
        </div>
      ))}
      {stockData.length > 3 && (
        <div className="text-xs text-gray-500 text-center">
          +{stockData.length - 3} más...
        </div>
      )}
    </div>
  );

  // 5. MINI GRÁFICO DE DISTRIBUCIÓN
  const StockDistributionMini = ({ stockData }) => {
    const total = stockData.reduce((sum, b) => sum + b.cantidad_disponible, 0);
    
    return (
      <div className="flex flex-col gap-1">
        {stockData.slice(0, 3).map((bodega, idx) => {
          const percentage = total > 0 ? (bodega.cantidad_disponible / total) * 100 : 0;
          return (
            <div key={idx} className="flex items-center gap-1">
              <div className="w-8 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">
                {bodega.cantidad_disponible}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // 6. ALERTAS DE STOCK
  const StockAlerts = ({ hasLowStock, hasNoStock }) => (
    <div className="flex justify-center gap-1">
      {hasNoStock && (
        <div className="w-3 h-3 bg-red-500 rounded-full" title="Sin stock en alguna bodega" />
      )}
      {hasLowStock && (
        <div className="w-3 h-3 bg-orange-500 rounded-full" title="Stock bajo en alguna bodega" />
      )}
      {!hasNoStock && !hasLowStock && (
        <div className="w-3 h-3 bg-green-500 rounded-full" title="Stock normal" />
      )}
    </div>
  );

  // 7. ACCIONES DE VARIANTE
  const VariantActions = ({ variante, producto }) => (
    <div className="flex items-center justify-center gap-1">
      <button
        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
        title="Gestionar stock por bodega"
      >
        <Warehouse className="w-4 h-4" />
      </button>
      <button
        className="p-1 text-green-600 hover:bg-green-100 rounded"
        title="Transferir entre bodegas"
      >
        <ArrowRightLeft className="w-4 h-4" />
      </button>
      <button
        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
        title="Ver reportes"
      >
        <BarChart3 className="w-4 h-4" />
      </button>
    </div>
  );

  // 8. GESTOR EXPANDIDO DE VARIANTE
  const ExpandedVariantManager = ({ variante, producto, onStockUpdate }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800">
          Gestión de Stock por Bodega - {variante.descripcion_opcion}
        </h4>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
            <ArrowRightLeft className="w-4 h-4 inline mr-1" />
            Nueva Transferencia
          </button>
          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">
            <Plus className="w-4 h-4 inline mr-1" />
            Agregar Stock
          </button>
        </div>
      </div>

      {/* TABLA DE BODEGAS */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Bodega</th>
              <th className="px-3 py-2 text-center">Disponible</th>
              <th className="px-3 py-2 text-center">Reservado</th>
              <th className="px-3 py-2 text-center">Estado</th>
              <th className="px-3 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {variante.distribucion_bodegas?.map((bodega, idx) => (
              <BodegaStockRow 
                key={idx}
                bodega={bodega}
                varianteId={variante.id_variante}
                onStockUpdate={onStockUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* RESUMEN Y ACCIONES MASIVAS */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {variante.stock_total || 0}
            </div>
            <div className="text-sm text-gray-600">Stock Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {variante.distribucion_bodegas?.filter(b => b.cantidad_disponible > 0).length || 0}
            </div>
            <div className="text-sm text-gray-600">Bodegas con Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {variante.distribucion_bodegas?.reduce((sum, b) => sum + (b.cantidad_reservada || 0), 0) || 0}
            </div>
            <div className="text-sm text-gray-600">Total Reservado</div>
          </div>
        </div>
      </div>
    </div>
  );

  // 9. FILA DE BODEGA EN TABLA EXPANDIDA
  const BodegaStockRow = ({ bodega, varianteId, onStockUpdate }) => {
    const [editingStock, setEditingStock] = useState(false);
    const [newStock, setNewStock] = useState(bodega.cantidad_disponible);

    const handleStockSave = () => {
      onStockUpdate(varianteId, bodega.id_bodega, newStock);
      setEditingStock(false);
    };

    return (
      <tr className="border-b">
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-gray-500" />
            <div>
              <div className="font-medium">{bodega.nombre_bodega}</div>
              {bodega.es_punto_venta && (
                <span className="text-xs text-green-600">Punto de Venta</span>
              )}
            </div>
          </div>
        </td>
        
        <td className="px-3 py-2 text-center">
          {editingStock ? (
            <div className="flex items-center gap-1 justify-center">
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 border rounded text-center"
              />
              <button
                onClick={handleStockSave}
                className="text-green-600 hover:text-green-800"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingStock(true)}
              className="font-medium hover:text-blue-600"
            >
              {bodega.cantidad_disponible}
            </button>
          )}
        </td>
        
        <td className="px-3 py-2 text-center text-orange-600">
          {bodega.cantidad_reservada || 0}
        </td>
        
        <td className="px-3 py-2 text-center">
          <StockStatusBadge cantidad={bodega.cantidad_disponible} />
        </td>
        
        <td className="px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Ajustar stock"
            >
              <Settings className="w-3 h-3" />
            </button>
            <button
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Transferir"
            >
              <ArrowRightLeft className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // 10. BADGE DE ESTADO DE STOCK
  const StockStatusBadge = ({ cantidad }) => {
    const getStatus = () => {
      if (cantidad === 0) return { bg: 'bg-red-100', text: 'text-red-800', label: 'Sin stock' };
      if (cantidad < 10) return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Bajo' };
      if (cantidad < 50) return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medio' };
      return { bg: 'bg-green-100', text: 'text-green-800', label: 'Normal' };
    };

    const status = getStatus();
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${status.bg} ${status.text}`}>
        {status.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <TableHeader />
        <tbody>
          {productos.map(producto => 
            producto.opciones?.map(variante => (
              <VariantRow 
                key={variante.id_variante}
                producto={producto}
                variante={variante}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EnhancedProductsTable;