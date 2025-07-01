// src/components/admin/productos/ProductosHeader.jsx
import React from 'react';
import { Plus, Archive, RefreshCw, Home } from 'lucide-react';

const ProductosHeader = ({
  loading,
  searching,
  searchValue,
  paginacion,
  selectedVariants,
  stockConfirmation,
  onNewProduct,
  onToggleStockMode,
  onMassiveStock,
  onDeselectAll
}) => {
  return (
    <header className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
        {/* Botón Home */}
        <button
          onClick={() => window.location.href = '/admin'}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title="Volver al Dashboard"
        >
          <Home size={20} className="text-gray-600" />
        </button>
        


        </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Productos</h1>
        <p className="text-sm text-gray-500">
          {loading ? 'Cargando...' :
           searching ? 'Buscando...' :
           searchValue ? `${paginacion.total} resultados para "${searchValue}"` :
           `${paginacion.total} productos encontrados`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {selectedVariants.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedVariants.size} seleccionadas
            </span>
            <button
              onClick={onMassiveStock}
              className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm"
            >
              <Archive size={16} />
              Gestión Stock
            </button>
            <button
              onClick={onDeselectAll}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              Deseleccionar
            </button>
          </div>
        )}
        
        {/* Botón de Modo Rápido */}
        {selectedVariants.size === 0 && (
          <button
            onClick={onToggleStockMode}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
              stockConfirmation.skipConfirmation 
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={stockConfirmation.skipConfirmation ? 'Modo rápido activado' : 'Activar modo rápido'}
          >
            <RefreshCw size={16} />
            {stockConfirmation.skipConfirmation ? 'Modo Rápido' : 'Normal'}
          </button>
        )}
        
        <button
          onClick={onNewProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>
    </header>
  );
};

export default ProductosHeader;