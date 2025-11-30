// /src/components/cajero/components/ValeSearch.jsx
import React from 'react';
import { Search, Loader, X } from 'lucide-react';

const ValeSearch = ({ valeNumber, setValeNumber, onSearch, loading, turnoAbierto, currentVale, onClear }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={valeNumber}
            onChange={(e) => setValeNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Número del vale (ej: 87 o VP20250604-0001)"
            onKeyPress={handleKeyPress}
            disabled={loading}
            autoFocus
          />
        </div>
        <button
          onClick={onSearch}
          disabled={loading || !valeNumber.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{loading ? 'Buscando...' : 'Buscar'}</span>
        </button>
        
        {currentVale && (
          <button
            onClick={onClear}
            className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {!turnoAbierto && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-red-600 text-sm text-center">
            ⚠️ Turno cerrado - Solo puedes consultar vales
          </p>
        </div>
      )}
    </div>
  );
};

export default ValeSearch;