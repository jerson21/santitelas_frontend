// /src/components/cajero/components/ClienteModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';

const ClienteModal = ({ isOpen, onClose, onSave, currentName = '' }) => {
  const [nombreCliente, setNombreCliente] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNombreCliente(currentName);
    }
  }, [isOpen, currentName]);

  const handleSave = () => {
    const nombre = nombreCliente.trim();
    if (nombre) {
      onSave(nombre);
      onClose();
    } else {
      alert('El nombre del cliente no puede estar vacío');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center">
            <User className="w-6 h-6 mr-3" />
            <h2 className="text-xl font-bold">Identificar Cliente</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Ingresa el nombre del cliente para este vale:
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Cliente
            </label>
            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-lg"
              placeholder="Ej: Juan Pérez"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClienteModal;
