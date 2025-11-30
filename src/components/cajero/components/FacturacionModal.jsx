// /src/components/cajero/components/FacturacionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, FileText, Building2, MapPin, Briefcase, Mail, Phone } from 'lucide-react';

const FacturacionModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [formData, setFormData] = useState({
    razon_social: '',
    rut: '',
    direccion: '',
    comuna: '',
    giro: '',
    correo: '',
    telefono: ''
  });

  const [errors, setErrors] = useState({});
  const [datosDesdeDB, setDatosDesdeDB] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Verificar si los datos vienen de la BD (si tiene RUT y al menos un campo más)
      const tieneRut = initialData.rut && initialData.rut.trim() !== '';
      const tieneDatosCompletos = tieneRut && (
        (initialData.razon_social && initialData.razon_social.trim() !== '') ||
        (initialData.direccion && initialData.direccion.trim() !== '') ||
        (initialData.comuna && initialData.comuna.trim() !== '')
      );

      setDatosDesdeDB(tieneDatosCompletos);

      setFormData({
        razon_social: initialData.razon_social || '',
        rut: initialData.rut || '',
        direccion: initialData.direccion || '',
        comuna: initialData.comuna || '',
        giro: initialData.giro || '',
        correo: initialData.correo || '',
        telefono: initialData.telefono || ''
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo cuando se edita
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Campos obligatorios
    if (!formData.razon_social.trim()) {
      newErrors.razon_social = 'Nombre o Razón Social es obligatorio';
    }

    if (!formData.rut.trim()) {
      newErrors.rut = 'RUT es obligatorio';
    } else {
      // Validación básica de formato RUT chileno (XX.XXX.XXX-X)
      const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
      const rutSimple = /^\d{7,8}-[\dkK]$/;
      if (!rutRegex.test(formData.rut) && !rutSimple.test(formData.rut)) {
        newErrors.rut = 'Formato inválido. Ej: 12.345.678-9';
      }
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'Dirección es obligatoria';
    }

    if (!formData.comuna.trim()) {
      newErrors.comuna = 'Comuna es obligatoria';
    }

    if (!formData.giro.trim()) {
      newErrors.giro = 'Giro es obligatorio';
    }

    // Validar email si existe
    if (formData.correo && formData.correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        newErrors.correo = 'Email inválido';
      }
    }

    // Validar teléfono si existe
    if (formData.telefono && formData.telefono.trim()) {
      const phoneRegex = /^(\+?56)?(\s?)(0?9)(\s?)[9876543]\d{7}$/;
      if (!phoneRegex.test(formData.telefono.replace(/\s/g, ''))) {
        newErrors.telefono = 'Teléfono inválido. Ej: +56912345678';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleCancel = () => {
    if (Object.values(formData).some(val => val.trim() !== '')) {
      if (window.confirm('¿Seguro que quieres cancelar? Los datos ingresados se perderán.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center sticky top-0">
          <div className="flex items-center">
            <FileText className="w-6 h-6 mr-3" />
            <h2 className="text-xl font-bold">Datos de Facturación</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {datosDesdeDB && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Datos cargados desde registros anteriores
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Este cliente ya tiene datos guardados. Puedes editarlos si es necesario.
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-gray-600 mb-6">
            Complete los siguientes datos para emitir la factura. Los campos marcados con * son obligatorios.
          </p>

          <div className="space-y-4">
            {/* Nombre o Razón Social */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                Nombre o Razón Social <span className="text-red-600 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.razon_social}
                onChange={(e) => handleChange('razon_social', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.razon_social ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Juan Pérez o COMERCIAL XYZ LTDA"
              />
              {errors.razon_social && (
                <p className="text-red-600 text-xs mt-1">{errors.razon_social}</p>
              )}
            </div>

            {/* RUT */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                RUT <span className="text-red-600 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => handleChange('rut', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.rut ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 12.345.678-9"
              />
              {errors.rut && (
                <p className="text-red-600 text-xs mt-1">{errors.rut}</p>
              )}
            </div>

            {/* Dirección y Comuna */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  Dirección <span className="text-red-600 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.direccion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Providencia 1234"
                />
                {errors.direccion && (
                  <p className="text-red-600 text-xs mt-1">{errors.direccion}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  Comuna <span className="text-red-600 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.comuna}
                  onChange={(e) => handleChange('comuna', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.comuna ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Santiago"
                />
                {errors.comuna && (
                  <p className="text-red-600 text-xs mt-1">{errors.comuna}</p>
                )}
              </div>
            </div>

            {/* Giro */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 mr-2 text-blue-600" />
                Giro <span className="text-red-600 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.giro}
                onChange={(e) => handleChange('giro', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.giro ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Venta al por mayor de telas"
              />
              {errors.giro && (
                <p className="text-red-600 text-xs mt-1">{errors.giro}</p>
              )}
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleChange('correo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.correo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="cliente@ejemplo.cl"
                />
                {errors.correo && (
                  <p className="text-red-600 text-xs mt-1">{errors.correo}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.telefono ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+56912345678"
                />
                {errors.telefono && (
                  <p className="text-red-600 text-xs mt-1">{errors.telefono}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 sticky bottom-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Guardar Datos
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacturacionModal;
