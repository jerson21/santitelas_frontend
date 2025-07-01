// src/components/admin/productos/ProductosPagination.jsx
import React from 'react';

const ProductosPagination = ({ paginacion, onPageChange }) => {
  return (
    <div className="p-3 border-t border-slate-200 flex items-center justify-between">
      <div className="text-sm text-gray-500">
        Mostrando {((paginacion.page - 1) * paginacion.limit) + 1} - {Math.min(paginacion.page * paginacion.limit, paginacion.total)} de {paginacion.total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(paginacion.page - 1)}
          disabled={paginacion.page === 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="text-sm">
          Página {paginacion.page} de {paginacion.pages}
        </span>
        <button
          onClick={() => onPageChange(paginacion.page + 1)}
          disabled={paginacion.page === paginacion.pages}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ProductosPagination;