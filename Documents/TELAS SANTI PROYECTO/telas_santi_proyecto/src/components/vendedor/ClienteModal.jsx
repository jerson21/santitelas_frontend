import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { X, User, FileText, CreditCard, UserCheck, Search, Loader, Keyboard, Check, Type, Info } from 'lucide-react';
import ApiService from '../../services/api';

// Componente de teclado virtual modal centrado
const VirtualKeyboardModal = memo(({ 
  mode, 
  value, 
  onKeyPress, 
  onClose,
  onAccept,
  capsLock,
  onToggleCaps,
  fieldName 
}) => {
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState(value || '');

  // Enfocar el input al abrir
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Sincronizar valor local con el prop
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Layout del teclado según el modo
  const layout = useMemo(() => {
    if (mode === 'rut') {
      return {
        title: 'Ingrese RUT del Cliente',
        rows: [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['K', '0', '⌫']
        ]
      };
    } else {
      const lowerRow1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
      const lowerRow2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'];
      const lowerRow3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
      
      const upperRow1 = lowerRow1.map(char => char.toUpperCase());
      const upperRow2 = lowerRow2.map(char => char.toUpperCase());
      const upperRow3 = lowerRow3.map(char => char.toUpperCase());
      
      return {
        title: 'Ingrese Nombre del Cliente',
        rows: [
          capsLock ? upperRow1 : lowerRow1,
          capsLock ? upperRow2 : lowerRow2,
          ['⇧', ...(capsLock ? upperRow3 : lowerRow3), '⌫'],
          ['espacio']
        ]
      };
    }
  }, [mode, capsLock]);

  const handleKey = useCallback((key) => {
    if (key === '⇧') {
      onToggleCaps();
    } else if (key === '⌫') {
      onKeyPress(key);
    } else if (key === 'espacio') {
      onKeyPress(' ');
    } else {
      onKeyPress(key);
    }
  }, [onKeyPress, onToggleCaps]);

  // Manejar input directo del teclado físico
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Notificar al componente padre del cambio
    if (mode === 'rut') {
      // Para RUT, aplicar formato
      const formatted = formatearRutParaUI(newValue);
      onKeyPress(formatted, true); // true indica que es input directo
    } else {
      onKeyPress(newValue, true);
    }
  };

  // Manejar tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAccept();
    }
  };

  // Formatear RUT para UI
  const formatearRutParaUI = (value) => {
    if (!value) return '';
    
    let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (rut.length <= 1) return rut;
    
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);
    
    let cuerpoFormateado = cuerpo;
    if (cuerpo.length > 6) {
      cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    return rut.length > 1 ? `${cuerpoFormateado}-${dv}` : rut;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[400] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{layout.title}</h3>
          <p className="text-gray-600">Use el teclado físico o toque las teclas virtuales</p>
        </div>

        {/* Input visible para teclado físico */}
        <div className="mb-8">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'rut' ? '12.345.678-9' : 'Escriba el nombre...'}
            className="w-full px-6 py-4 text-2xl font-medium text-center bg-gray-50 border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition-all"
            autoComplete="off"
            maxLength={mode === 'rut' ? 12 : 100}
          />
          <p className="text-center text-sm text-gray-500 mt-2">
            {mode === 'rut' ? 'Formato: 12.345.678-9' : `${localValue.length} caracteres`}
          </p>
        </div>

        {/* Teclado Virtual */}
        <div className="space-y-3 mb-8">
          {layout.rows.map((row, rowIndex) => (
            <div 
              key={`row-${rowIndex}`} 
              className="flex justify-center gap-2"
            >
              {row.map((key) => {
                let keyClass = "bg-gray-100 hover:bg-gray-200 text-gray-800 text-xl font-semibold py-4 px-6 rounded-xl shadow-md active:scale-95 transition-all min-w-[60px]";
                let displayKey = key;
                
                if (key === '⌫') {
                  keyClass = "bg-red-500 hover:bg-red-600 text-white text-xl font-bold py-4 px-6 rounded-xl shadow-md active:scale-95 transition-all min-w-[80px]";
                  displayKey = '← Borrar';
                } else if (key === '⇧') {
                  keyClass = `${capsLock ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'} hover:bg-blue-600 text-lg font-bold py-4 px-6 rounded-xl shadow-md active:scale-95 transition-all min-w-[80px]`;
                  displayKey = '⇧ Mayús';
                } else if (key === 'espacio') {
                  keyClass = "bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg font-semibold py-4 px-6 rounded-xl shadow-md active:scale-95 transition-all flex-1 max-w-xs";
                  displayKey = '⎵ Espacio';
                }

                return (
                  <button
                    key={`${mode}-${key}-${rowIndex}`}
                    onClick={() => handleKey(key)}
                    className={keyClass}
                    type="button"
                  >
                    {displayKey}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all text-lg active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-xl hover:shadow-2xl text-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
});

VirtualKeyboardModal.displayName = 'VirtualKeyboardModal';

const ClienteModalTouch = ({ isOpen, onConfirm, onCancel }) => {
  const [clienteData, setClienteData] = useState({
    nombre: '',
    rut: '',
    tipo_documento: 'ticket'
  });
  const [errors, setErrors] = useState({});
  const [buscando, setBuscando] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState('text');
  const [activeField, setActiveField] = useState(null);
  const [capsLock, setCapsLock] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Reset form cuando se abre
  useEffect(() => {
    if (isOpen) {
      setClienteData({
        nombre: '',
        rut: '',
        tipo_documento: 'ticket'
      });
      setErrors({});
      setBuscando(false);
      setClienteEncontrado(false);
      setShowVirtualKeyboard(false);
      setKeyboardMode('text');
      setActiveField(null);
      setCapsLock(true);
      setShowInfo(false);
    }
  }, [isOpen]);

  // Funciones de utilidad para RUT
  const limpiarRutParaServidor = (rut) => {
    if (!rut) return null;
    
    const rutLimpio = rut
      .replace(/\./g, '')
      .replace(/\s/g, '')
      .toUpperCase();
    
    if (/^[0-9]{7,8}-[0-9K]$/.test(rutLimpio)) {
      return rutLimpio;
    }
    
    return null;
  };

  const formatearRutParaUI = (value) => {
    if (!value) return '';
    
    let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (rut.length <= 1) return rut;
    
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);
    
    let cuerpoFormateado = cuerpo;
    if (cuerpo.length > 6) {
      cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    return rut.length > 1 ? `${cuerpoFormateado}-${dv}` : rut;
  };

  const validarRutLocal = (rut) => {
    if (!rut) return true;
    
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').replace(/\s/g, '');
    
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }
    
    if (!/^[0-9]+[0-9kK]$/.test(rutLimpio)) {
      return false;
    }
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toLowerCase();
    
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : (11 - resto).toString();
    
    return dv === dvCalculado;
  };

  // Manejar validación de RUT - sin useCallback para evitar dependencias circulares
  const handleRutValidation = async (formatted) => {
    if (errors.rut && validarRutLocal(formatted)) {
      setErrors(prev => ({ ...prev, rut: null }));
    }
    
    const rutLimpio = formatted.replace(/\./g, '').replace(/-/g, '');
    
    if (rutLimpio.length >= 8 && validarRutLocal(formatted)) {
      setBuscando(true);
      setClienteEncontrado(false);
      
      try {
        const rutParaBuscar = limpiarRutParaServidor(formatted);
        const response = await ApiService.buscarClientePorRut(rutParaBuscar);
        
        if (response.success && response.data) {
          setClienteData(prev => ({
            ...prev,
            nombre: response.data.nombre || prev.nombre,
            rut: formatted
          }));
          setClienteEncontrado(true);
          
          if (!response.data.datos_completos) {
            setErrors(prev => ({
              ...prev,
              info: 'Cliente encontrado pero faltan datos. El cajero deberá completarlos.'
            }));
          } else {
            setErrors(prev => ({
              ...prev,
              info: null
            }));
          }
        } else {
          setClienteEncontrado(false);
          setErrors(prev => ({
            ...prev,
            info: null
          }));
        }
      } catch (error) {
        console.error('Error buscando cliente:', error);
      } finally {
        setBuscando(false);
      }
    }
  };

  // Manejador de teclas del teclado virtual
  const handleVirtualKeyPress = (key, isDirect = false) => {
    if (isDirect) {
      // Input directo del teclado físico
      if (activeField === 'rut') {
        setClienteData(prev => ({ ...prev, rut: key }));
        // Validar y buscar si el RUT está completo
        const rutLimpio = key.replace(/[^0-9kK]/g, '');
        if (rutLimpio.length >= 8) {
          setTimeout(() => handleRutValidation(key), 100);
        }
      } else if (activeField === 'nombre') {
        setClienteData(prev => ({ ...prev, nombre: key }));
      }
    } else {
      // Teclas del teclado virtual
      if (key === '⌫') {
        if (activeField === 'rut') {
          setClienteData(prev => {
            const newRut = prev.rut.slice(0, -1);
            return { ...prev, rut: newRut };
          });
        } else if (activeField === 'nombre') {
          setClienteData(prev => ({ ...prev, nombre: prev.nombre.slice(0, -1) }));
        }
      } else if (key === ' ') {
        if (activeField === 'nombre') {
          setClienteData(prev => ({ ...prev, nombre: prev.nombre + ' ' }));
          setCapsLock(true);
        }
      } else {
        if (activeField === 'rut' && keyboardMode === 'rut') {
          setClienteData(prev => {
            const currentValue = prev.rut.replace(/[^0-9kK]/g, '');
            if (currentValue.length < 9) {
              const newValue = currentValue + key;
              const formatted = formatearRutParaUI(newValue);
              
              // Auto-buscar cuando esté completo
              if (newValue.length >= 8) {
                setTimeout(() => handleRutValidation(formatted), 100);
              }
              
              return { ...prev, rut: formatted };
            }
            return prev;
          });
        } else if (activeField === 'nombre' && keyboardMode === 'text') {
          setClienteData(prev => ({ ...prev, nombre: prev.nombre + key }));
        }
      }
    }
  };

  // Abrir teclado virtual
  const openVirtualKeyboard = useCallback((field) => {
    setActiveField(field);
    setKeyboardMode(field === 'rut' ? 'rut' : 'text');
    setShowVirtualKeyboard(true);
    
    if (field === 'nombre') {
      setCapsLock(true);
    }
  }, []);

  // Cerrar teclado virtual
  const closeVirtualKeyboard = useCallback(() => {
    setShowVirtualKeyboard(false);
    setActiveField(null);
  }, []);

  // Aceptar entrada del teclado virtual
  const acceptVirtualKeyboard = () => {
    // Si es RUT y tiene el formato completo, validar antes de cerrar
    if (activeField === 'rut' && clienteData.rut) {
      const rutLimpio = clienteData.rut.replace(/[^0-9kK]/g, '');
      if (rutLimpio.length >= 8) {
        handleRutValidation(clienteData.rut);
      }
    }
    setShowVirtualKeyboard(false);
    setActiveField(null);
  };

  // Toggle caps lock
  const toggleCapsLock = useCallback(() => {
    setCapsLock(prev => !prev);
  }, []);

  // Manejar envío del formulario
  const handleSubmit = async () => {
    const newErrors = {};
    
    if (clienteData.rut && clienteData.rut.trim()) {
      if (!validarRutLocal(clienteData.rut)) {
        newErrors.rut = 'RUT inválido. Verifique el formato y dígito verificador.';
      }
    }
    
    if (clienteData.tipo_documento === 'factura') {
      if (!clienteData.rut || !clienteData.rut.trim()) {
        newErrors.rut = 'RUT es obligatorio para facturas';
      } else {
        const rutLimpio = limpiarRutParaServidor(clienteData.rut);
        if (!rutLimpio) {
          newErrors.rut = 'RUT incompleto para factura. Use formato: 12345678-9';
        }
      }
    }
    
    if (clienteData.nombre && clienteData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const rutParaServidor = limpiarRutParaServidor(clienteData.rut);
    
    const datosFinales = {
      nombre: clienteData.nombre?.trim() || null,
      rut: rutParaServidor,
      tipo_documento: clienteData.tipo_documento
    };
    
    if (datosFinales.tipo_documento === 'factura' && !datosFinales.rut) {
      alert('Error: No se puede confirmar factura sin RUT válido');
      return;
    }
    
    onConfirm(datosFinales);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Nueva Venta</h2>
                <p className="text-sm text-gray-600">Ingrese los datos del cliente</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Información"
              >
                <Info className="w-5 h-5 text-gray-500" />
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Panel de información */}
          {showInfo && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl animate-fade-in">
              <h4 className="font-medium text-gray-700 mb-2 text-sm">ℹ️ Información de uso</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Toque los campos para abrir el teclado virtual</li>
                <li>• Puede usar teclado físico o virtual</li>
                <li>• Al ingresar 8+ dígitos de RUT se busca automáticamente</li>
                <li>• Presione Enter para aceptar</li>
                <li>• El RUT es obligatorio solo para facturas</li>
              </ul>
            </div>
          )}

          {/* Formulario */}
          <div className="space-y-6">
            {/* Nombre del Cliente */}
            <div className="relative">
              <label className="flex items-center space-x-2 text-base font-medium text-gray-700 mb-3">
                <User className="w-5 h-5" />
                <span>Nombre del Cliente</span>
                <span className="text-xs text-gray-500">(Opcional)</span>
              </label>
              
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={clienteData.nombre}
                    readOnly
                    onClick={() => openVirtualKeyboard('nombre')}
                    placeholder="Toque aquí para escribir..."
                    className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all text-lg cursor-pointer ${
                      errors.nombre ? 'border-red-300' : 'border-gray-300'
                    }`}
                    autoComplete="off"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => openVirtualKeyboard('nombre')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                  title="Teclado virtual"
                >
                  <Type className="w-5 h-5" />
                </button>
              </div>
              
              {errors.nombre && (
                <p className="mt-2 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* RUT */}
            <div>
              <label className="flex items-center space-x-2 text-base font-medium text-gray-700 mb-3">
                <CreditCard className="w-5 h-5" />
                <span>RUT del Cliente</span>
                <span className="text-xs text-gray-500">(Opcional, obligatorio para factura)</span>
                {buscando && (
                  <Loader className="w-4 h-4 animate-spin text-blue-500" />
                )}
                {clienteEncontrado && (
                  <span className="text-xs text-green-600 flex items-center bg-green-100 px-2 py-1 rounded-full">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Cliente encontrado
                  </span>
                )}
              </label>
              
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={clienteData.rut}
                    readOnly
                    onClick={() => openVirtualKeyboard('rut')}
                    placeholder="Toque aquí para escribir..."
                    className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all text-lg font-mono cursor-pointer ${
                      errors.rut ? 'border-red-300' : clienteEncontrado ? 'border-green-400 bg-green-50' : 'border-gray-300'
                    }`}
                  />
                  {buscando && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <Search className="w-5 h-5 text-blue-500 animate-pulse" />
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => openVirtualKeyboard('rut')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  <Keyboard className="w-5 h-5" />
                </button>
              </div>
              
              {errors.rut && (
                <p className="mt-2 text-sm text-red-600">{errors.rut}</p>
              )}
              {errors.info && (
                <p className="mt-2 text-sm text-amber-600 flex items-center">
                  <span className="mr-1">ℹ️</span>
                  {errors.info}
                </p>
              )}
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="flex items-center space-x-2 text-base font-medium text-gray-700 mb-3">
                <FileText className="w-5 h-5" />
                <span>Tipo de Documento</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setClienteData({ ...clienteData, tipo_documento: 'ticket' })}
                  className={`px-5 py-4 rounded-xl border-2 font-medium transition-all active:scale-95 ${
                    clienteData.tipo_documento === 'ticket'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <FileText className="w-6 h-6" />
                    <span className="text-lg">Ticket/Boleta</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    El cajero decidirá
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setClienteData({ ...clienteData, tipo_documento: 'factura' })}
                  className={`px-5 py-4 rounded-xl border-2 font-medium transition-all active:scale-95 ${
                    clienteData.tipo_documento === 'factura'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <FileText className="w-6 h-6" />
                    <span className="text-lg">Factura</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Requiere RUT
                  </p>
                </button>
              </div>
              
              {clienteData.tipo_documento === 'factura' && !clienteData.rut && (
                <div className="mt-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⚠️</span>
                    <span className="text-sm font-medium">La factura requiere RUT del cliente</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 mt-8">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all text-lg active:scale-95"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl disabled:bg-blue-300 disabled:cursor-not-allowed text-lg active:scale-95"
              disabled={clienteData.tipo_documento === 'factura' && !clienteData.rut}
            >
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5" />
                <span>Comenzar Venta</span>
              </div>
            </button>
          </div>

    
        </div>
      </div>

      {/* Teclado virtual modal */}
      {showVirtualKeyboard && (
        <VirtualKeyboardModal
          mode={keyboardMode}
          value={activeField === 'rut' ? clienteData.rut : clienteData.nombre}
          onKeyPress={handleVirtualKeyPress}
          onClose={closeVirtualKeyboard}
          onAccept={acceptVirtualKeyboard}
          capsLock={capsLock}
          onToggleCaps={toggleCapsLock}
          fieldName={activeField}
        />
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default ClienteModalTouch;