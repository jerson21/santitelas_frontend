import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ProductModal = ({ product, documentType, preselectedOption, onAdd, onClose }) => {
  const [inputValue, setInputValue] = useState('0');
  const [selectedModalidad, setSelectedModalidad] = useState(null);
  const formatter = new Intl.NumberFormat('es-CL');

  // ✅ USAR DIRECTAMENTE LAS MODALIDADES DE LA API
  useEffect(() => {
    console.log('🔍 ProductModal - Producto recibido:', product);
    
    // ✅ MODALIDADES DIRECTAS DE LA API - SIN TRANSFORMAR
    const modalidades = product.selectedVariant?.modalidades_disponibles || 
                       product.modalidades_producto || 
                       [];

    console.log('✅ MODALIDADES DIRECTAS DE LA API:', modalidades);

    if (modalidades && modalidades.length > 0) {
      setSelectedModalidad(modalidades[0]);
      console.log('✅ Modalidad seleccionada por defecto:', modalidades[0]);
    } else {
      setSelectedModalidad(null);
      console.warn('⚠️ No hay modalidades configuradas');
    }
  }, [product]);

  // ✅ PRECIO DIRECTO DE LA API - SIN TRANSFORMAR
  const getPriceForDocument = (modalidad) => {
    if (!modalidad || !modalidad.precios) return 0;

    // ✅ USAR DIRECTAMENTE LOS PRECIOS DE LA API
    switch (documentType) {
      case 'factura':
        return parseFloat(modalidad.precios.factura) || parseFloat(modalidad.precios.neto) || 0;
      default:
        return parseFloat(modalidad.precios.neto) || 0;
    }
  };

  // ✅ MOVER ESTAS FUNCIONES ANTES DE getValidationMessage
  const getUnidadDisplay = (modalidad) => {
    if (!modalidad) return 'metro';
    
    switch (modalidad.nombre.toLowerCase()) {
      case 'metro': 
        return 'metro(s)';
      case 'rollo': 
        return 'metro(s)'; // ✅ CORREGIDO: ROLLO vende metros, no rollos
      case 'unidad': 
        return 'unidad(es)';
      case 'embalaje': 
        return 'embalaje(s)';
      case 'caja': 
        return 'caja(s)';
      case 'set': 
        return 'set(s)';
      default: 
        return modalidad.nombre.toLowerCase() + '(s)';
    }
  };

  const getModalidadDescription = (modalidad) => {
    if (!modalidad) return '';
    
    switch (modalidad.nombre.toLowerCase()) {
      case 'metro': 
        return 'Precio por metro';
      case 'rollo': 
        return 'Precio por rollo (se vende en metros)'; // ✅ ACLARACIÓN
      case 'unidad': 
        return 'Precio por unidad';
      case 'embalaje': 
        return 'Precio por embalaje';
      default: 
        return `Precio por ${modalidad.nombre.toLowerCase()}`;
    }
  };

  const finalPricePerUnit = getPriceForDocument(selectedModalidad);
  const totalStock = product.resumen?.stock_total ?? 0;
  const quantity = parseFloat(inputValue) || 0;
  const totalPrice = quantity * finalPricePerUnit;

  // ✅ VALIDACIONES MEJORADAS para modalidad ROLLO - AHORA DESPUÉS DE getUnidadDisplay
  const getValidationMessage = () => {
    if (!selectedModalidad) return 'No hay modalidades configuradas';
    if (quantity <= 0) return 'La cantidad debe ser mayor a 0';
    if (quantity > totalStock && documentType !== 'factura') 
      return `La cantidad supera el stock disponible (${totalStock} metros)`;

    const minimoRequerido = parseFloat(selectedModalidad.minimo_cantidad) || 1;
    if (quantity < minimoRequerido) {
      // ✅ MENSAJE CORREGIDO para ROLLO
      if (selectedModalidad.nombre.toLowerCase() === 'rollo') {
        return `La cantidad mínima es ${minimoRequerido} metros (modalidad rollo)`;
      } else {
        return `La cantidad mínima es ${minimoRequerido} ${getUnidadDisplay(selectedModalidad)}`;
      }
    }

    if (!selectedModalidad.es_cantidad_variable && quantity % 1 !== 0) {
      return 'Esta modalidad requiere cantidades enteras';
    }

    return null;
  };

  const validationMessage = getValidationMessage();
  const isValid = !validationMessage;

  // Manejadores de eventos
  const handleNumberClick = (num) => {
    if (inputValue === '0') setInputValue(num);
    else setInputValue(inputValue + num);
  };

  const handleDecimalClick = () => {
    if (!selectedModalidad) return;
    // ✅ USAR DIRECTAMENTE es_cantidad_variable DE LA API
    if (selectedModalidad.es_cantidad_variable && !inputValue.includes('.')) {
      setInputValue(inputValue + '.');
    }
  };

  const handleBackspaceClick = () => {
    setInputValue(inputValue.length > 1 ? inputValue.slice(0, -1) : '0');
  };

  const handleClearClick = () => setInputValue('0');

  const handleAddClick = () => {
    if (isValid && selectedModalidad) {
      console.log('🛒 Agregando producto con modalidad de API:', selectedModalidad);
      const enrichedProduct = { ...product, selectedModalidad };
      onAdd(enrichedProduct, preselectedOption, quantity, selectedModalidad.nombre, finalPricePerUnit);
    }
  };

  const getPriceDescription = () => documentType === 'factura' ? 'Neto Factura' : 'Neto';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center z-[100] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] flex flex-col my-2 sm:my-0">
        {/* Header */}
        <header className="flex justify-between items-start pb-3 sm:pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1">
            {/* ✅ TÍTULO CON VARIANTE AL LADO - RESPONSIVE */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{product.nombre}</h3>
              <span className="text-base sm:text-lg md:text-xl font-semibold text-purple-600 bg-purple-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg inline-block w-fit">
                {preselectedOption}
              </span>
            </div>

            {/* ✅ INFO COMPACTA - RESPONSIVE */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              <div>
                <span className="font-medium">Código:</span> {product.codigo}
              </div>
              {product.selectedVariant?.sku && (
                <div>
                  <span className="font-medium">SKU:</span>
                  <span className="ml-1 font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                    {product.selectedVariant.sku}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium">Stock:</span>
                <span className="font-medium text-green-600">{totalStock}</span> {product.unidad_medida || 'unidades'}
              </div>
            </div>

            {/* ✅ PRECIO - RESPONSIVE */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-base sm:text-lg text-gray-700">
                <span className="font-semibold text-blue-600">
                  ${formatter.format(finalPricePerUnit)}
                </span> / {getUnidadDisplay(selectedModalidad)}
                <span className="text-xs sm:text-sm ml-2 text-gray-400 block sm:inline">
                  ({getPriceDescription()}{selectedModalidad?.nombre.toLowerCase() === 'rollo' ? ' - modalidad rollo' : ''})
                </span>
              </p>
              {selectedModalidad?.descripcion && (
                <span className="text-xs sm:text-sm text-gray-500">
                  {selectedModalidad.descripcion}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-7 h-7" />
          </button>
        </header>

        {/* Main Content - CON SCROLL INTERNO */}
        <main className="flex-grow py-3 sm:py-4 grid md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4 overflow-y-auto">
          {/* Left Column */}
          <div className="space-y-4 flex flex-col">
            {/* Modalidades */}
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3">Modalidad de Venta</label>
              <div className="grid grid-cols-1 gap-2">
                {(() => {
                  // ✅ MODALIDADES DIRECTAS DE LA API
                  const modalidades = product.selectedVariant?.modalidades_disponibles || 
                                     product.modalidades_producto || 
                                     [];

                  console.log('🔍 RENDER - Modalidades directas de API:', modalidades);

                  if (!modalidades || modalidades.length === 0) {
                    return (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-center">
                        <p className="font-semibold">No hay modalidades configuradas</p>
                      </div>
                    );
                  }

                  return modalidades.map((modalidad, index) => {
                    // ✅ PRECIO ESPECÍFICO DE ESTA MODALIDAD (no de la seleccionada)
                    const modalidadPrice = getPriceForDocument(modalidad);
                    const minimoRequerido = parseFloat(modalidad.minimo_cantidad) || 1;
                    const esVariable = modalidad.es_cantidad_variable;
                    const isSelected = selectedModalidad?.id_modalidad === modalidad.id_modalidad;

                    console.log(`🔍 RENDER Modalidad ${modalidad.nombre}:`, {
                      id: modalidad.id_modalidad,
                      precio_propio: modalidadPrice, // ✅ Precio específico de esta modalidad
                      precio_seleccionada: finalPricePerUnit, // Para comparar
                      esVariable,
                      isSelected,
                      modalidad_completa: modalidad
                    });

                    return (
                      <button
                        key={modalidad.id_modalidad || index}
                        onClick={() => {
                          console.log('🔄 Seleccionando modalidad de API:', modalidad);
                          setSelectedModalidad(modalidad);
                        }}
                        className={`px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-semibold text-base flex items-center gap-2">
                              {modalidad.nombre}
                              {!esVariable && (
                                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Fija</span>
                              )}
                            </div>
                            <div className={`text-sm mt-1 flex items-center gap-3 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                              {/* ✅ MOSTRAR EL PRECIO ESPECÍFICO DE ESTA MODALIDAD */}
                              <span className="font-medium">${formatter.format(modalidadPrice)}</span>
                              {/* ✅ DESCRIPCIÓN MEJORADA PARA ROLLO */}
                              <span className="text-xs">
                                {modalidad.nombre.toLowerCase() === 'rollo' 
                                  ? 'por metro (precio rollo)' 
                                  : modalidad.descripcion || getModalidadDescription(modalidad)
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* ✅ CANTIDAD MEJORADA - RESPONSIVE */}
            <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm sm:text-base font-medium text-gray-600 mb-2">
                Cantidad de metros
                {selectedModalidad?.nombre.toLowerCase() === 'rollo' && (
                  <span className="text-xs text-blue-600 block">
                    (modalidad {selectedModalidad.nombre})
                  </span>
                )}
              </h4>
              <div className="w-full text-2xl sm:text-3xl md:text-4xl text-center py-2 border-2 border-gray-200 rounded-lg bg-white font-mono mb-2">
                {inputValue}
              </div>
              {quantity > 0 && (
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    Total: ${formatter.format(totalPrice)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {quantity} metros × ${formatter.format(finalPricePerUnit)} ({getPriceDescription()})
                    {selectedModalidad?.nombre.toLowerCase() === 'rollo' && (
                      <div className="text-xs text-blue-600 mt-1">
                        Modalidad: {selectedModalidad.nombre} (precio por rollo)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ✅ VALIDACIÓN COMPACTA */}
            {validationMessage && (
              <div className="text-center text-red-600 font-medium p-2 bg-red-50 rounded-lg text-sm">
                ⚠️ {validationMessage}
              </div>
            )}
          </div>

          {/* Right Column - Keypad RESPONSIVE */}
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[...Array(9).keys()].map(i => i + 1).map(num => (
                <button key={num} onClick={() => handleNumberClick(num.toString())}
                        className="h-12 sm:h-14 bg-gray-100 hover:bg-gray-200 rounded-lg text-xl sm:text-2xl font-bold transition-colors active:scale-95">
                  {num}
                </button>
              ))}
              <button onClick={handleDecimalClick}
                      disabled={!selectedModalidad || !selectedModalidad.es_cantidad_variable}
                      className={`h-12 sm:h-14 rounded-lg text-xl sm:text-2xl font-bold transition-colors active:scale-95 ${
                        selectedModalidad?.es_cantidad_variable ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}>
                .
              </button>
              <button onClick={() => handleNumberClick('0')}
                      className="h-12 sm:h-14 bg-gray-100 hover:bg-gray-200 rounded-lg text-xl sm:text-2xl font-bold transition-colors active:scale-95">
                0
              </button>
              <button onClick={handleBackspaceClick}
                      className="h-12 sm:h-14 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-lg text-xl sm:text-2xl font-bold flex items-center justify-center active:scale-95">
                ←
              </button>
            </div>

            <button onClick={handleClearClick}
                    className="w-full h-10 sm:h-12 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-bold text-sm sm:text-base transition-colors active:scale-95">
              LIMPIAR
            </button>

            {/* ✅ BOTONES SIEMPRE VISIBLES - RESPONSIVE */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-4">
              <button onClick={onClose}
                      className="h-12 sm:h-14 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-base sm:text-lg transition-colors active:scale-95">
                CANCELAR
              </button>
              <button onClick={handleAddClick} disabled={!isValid || !selectedModalidad}
                      className={`h-12 sm:h-14 ${isValid && selectedModalidad ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'} rounded-lg font-bold text-base sm:text-lg transition-colors active:scale-95`}>
                AGREGAR
              </button>
            </div>

            {/* ✅ INFO MODALIDAD MEJORADA PARA ROLLO */}
            {selectedModalidad && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-700">
                  <strong>{selectedModalidad.nombre}</strong> - {selectedModalidad.es_cantidad_variable ? 'Variable' : 'Fija'}
                  {selectedModalidad.nombre.toLowerCase() === 'rollo' && (
                    <> (se vende en metros)</>
                  )}
                  {selectedModalidad.minimo_cantidad > 1 && (
                    <> (Mín: {selectedModalidad.minimo_cantidad} {
                      selectedModalidad.nombre.toLowerCase() === 'rollo' ? 'metros' : getUnidadDisplay(selectedModalidad)
                    })</>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductModal;