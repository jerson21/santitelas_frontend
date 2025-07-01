// src/components/admin/productos/ProductosFilters.jsx
import React from 'react';
import { Search, Loader2, X } from 'lucide-react';

const ProductosFilters = ({
  searchValue,
  searching,
  filtros,
  categorias,
  onSearchChange,
  onClearSearch,
  onFilterChange
}) => {
  return (
    <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="relative w-full sm:w-auto">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        {searching && (
          <Loader2 size={14} className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
        )}
        {searchValue && (
          <button
            onClick={onClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
          >
            <X size={14} className="text-gray-500" />
          </button>
        )}
        <input
          type="text"
          placeholder="Buscar por modelo, código, color, medida..."
          className="w-full sm:w-72 pl-9 pr-14 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            onFilterChange({ ...filtros, categoria: '', tipo: '', page: 1 });
            onClearSearch();
          }}
          className={`px-3 py-1 text-xs font-semibold rounded-md ${
            !filtros.categoria 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
          }`}
        >
          Todos
        </button>
        {categorias.map(cat => cat.nombre && (
          <button
            key={cat.id_categoria || cat.nombre}
            onClick={() => {
              onFilterChange({ ...filtros, categoria: cat.nombre, tipo: '', page: 1 });
              onClearSearch();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md ${
              filtros.categoria === cat.nombre 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductosFilters;