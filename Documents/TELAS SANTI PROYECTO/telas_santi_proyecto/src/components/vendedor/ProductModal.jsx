import React, { useState, useEffect } from 'react';
import { X, Package, Warehouse, AlertCircle, TrendingUp, MapPin, Info } from 'lucide-react';

const ProductModal = ({ product, documentType, preselectedOption, onAdd, onClose }) => {
  const [inputValue, setInputValue] = useState('0');
  const [selectedModalidad, setSelectedModalidad] = useState(null);
  const [showStockDetails, setShowStockDetails] = useState(false);
  const formatter = new Intl.NumberFormat('es-CL');

  // ✅ OBTENER VARIANTE SELECCIONADA CON SU DISTRIBUCIÓN
  const varianteSeleccionada = product.selectedVariant || 
    (product.variantes?.find(v => 
      v.color === preselectedOption || 
      v.medida === preselectedOption || 
      v.material === preselectedOption
    )) || 
    product.variantes?.[0];

  useEffect(() => {
    console.log('🔍 ProductModal - Producto recibido:', product);
    console.log('📦 Variante seleccionada:', varianteSeleccionada);
    
    const modalidades = varianteSeleccionada?.modalidades || 
                       product.modalidades_producto || 
                       [];

    if (modalidades && modalidades.length > 0) {
      setSelectedModalidad(modalidades[0]);
    } else {
      setSelectedModalidad(null);
    }
  }, [product, varianteSeleccionada]);

  // ✅ OBTENER STOCK DE LA VARIANTE ESPECÍFICA
  const getStockVariante = () => {
    if (!varianteSeleccionada) return 0;
    return varianteSeleccionada.stock_total || 
           varianteSeleccionada.stock_disponible || 0;
  };

  // ✅ OBTENER PRECIO NETO SEGÚN TIPO DE DOCUMENTO
  const getPriceForDocument = (modalidad) => {
    if (!modalidad || !modalidad.precios) return 0;

    switch (documentType) {
      case 'factura':
        return parseFloat(modalidad.precios.factura) || parseFloat(modalidad.precios.neto) || 0;
      default:
        return parseFloat(modalidad.precios.neto) || 0;
    }
  };

  // ✅ NUEVA FUNCIÓN: OBTENER PRECIO CON IVA
  const getPriceWithIVA = (modalidad) => {
    if (!modalidad || !modalidad.precios) return 0;
    // El precio con IVA viene directo de la BD
    return parseFloat(modalidad.precios.con_iva) || 0;
  };

  const getUnidadDisplay = (modalidad) => {
    if (!modalidad) return 'metro';
    
    switch (modalidad.nombre.toLowerCase()) {
      case 'metro': 
        return 'metro(s)';
      case 'rollo': 
        return 'metro(s)';
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

  const finalPricePerUnit = getPriceForDocument(selectedModalidad);
  const priceWithIVA = getPriceWithIVA(selectedModalidad);
  const stockVariante = getStockVariante();
  const quantity = parseFloat(inputValue) || 0;
  const totalPriceNeto = quantity * finalPricePerUnit;
  const totalPriceWithIVA = quantity * priceWithIVA;

  const getValidationMessage = () => {
    if (!selectedModalidad) return 'No hay modalidades configuradas';
    if (quantity <= 0) return 'La cantidad debe ser mayor a 0';
    if (quantity > stockVariante && documentType !== 'factura') 
      return `La cantidad supera el stock disponible (${stockVariante} ${product.unidad_medida || 'unidades'})`;

    const minimoRequerido = parseFloat(selectedModalidad.minimo_cantidad) || 1;
    if (quantity < minimoRequerido) {
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
      const enrichedProduct = { 
        ...product, 
        selectedModalidad,
        selectedVariant: varianteSeleccionada 
      };
      onAdd(enrichedProduct, preselectedOption, quantity, selectedModalidad.nombre, finalPricePerUnit);
    }
  };

  const getPriceDescription = () => documentType === 'factura' ? 'Neto Factura' : 'Neto';

  // ✅ NUEVO: Componente para mostrar distribución de stock
  const StockDistribution = ({ variante }) => {
    if (!variante || !variante.distribucion_bodegas || variante.distribucion_bodegas.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No hay información de distribución de stock</p>
        </div>
      );
    }

    const stockTotal = variante.stock_total || variante.stock_disponible || 0;

    return (
      <div className="space-y-3">
        {/* Resumen Total */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Stock Total Disponible:</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {stockTotal} {product.unidad_medida || 'unidades'}
            </span>
          </div>
        </div>

        {/* Distribución por Bodega */}
        <div className="space-y-2">
          {variante.distribucion_bodegas
            .filter(bodega => bodega.cantidad_disponible > 0)
            .sort((a, b) => b.cantidad_disponible - a.cantidad_disponible)
            .map((bodega, idx) => {
              const porcentaje = stockTotal > 0 
                ? Math.round((bodega.cantidad_disponible / stockTotal) * 100)
                : 0;

              return (
                <div key={bodega.id_bodega || idx} 
                     className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Warehouse className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-800">
                        {bodega.nombre_bodega}
                      </span>
                      {bodega.es_punto_venta && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Punto Venta
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-lg">
                      {bodega.cantidad_disponible}
                    </span>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{porcentaje}% del total</span>
                    {bodega.cantidad_reservada > 0 && (
                      <span className="text-orange-600">
                        {bodega.cantidad_reservada} reservados
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Bodegas sin stock */}
        {variante.distribucion_bodegas.some(b => b.cantidad_disponible === 0) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Bodegas sin stock:</p>
            <div className="flex flex-wrap gap-2">
              {variante.distribucion_bodegas
                .filter(bodega => bodega.cantidad_disponible === 0)
                .map(bodega => (
                  <span key={bodega.id_bodega} 
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {bodega.nombre_bodega}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-3xl font-bold text-gray-800">{product.nombre}</h3>
              <span className="text-xl font-semibold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                {preselectedOption}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Código:</span> {product.codigo}
              </div>
              {varianteSeleccionada?.sku && (
                <div>
                  <span className="font-medium">SKU:</span> 
                  <span className="ml-1 font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                    {varianteSeleccionada.sku}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium">Stock:</span> 
                <span className={`font-bold ${stockVariante > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockVariante}
                </span> {product.unidad_medida || 'unidades'}
              </div>
              
              {/* ✅ NUEVO: Botón para ver distribución */}
              <button
                onClick={() => setShowStockDetails(!showStockDetails)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {showStockDetails ? 'Ocultar' : 'Ver'} distribución
                </span>
              </button>
            </div>

            {/* ✅ ACTUALIZADO: Mostrar precio NETO y precio CON IVA */}
            <div className="flex items-center gap-6 bg-gray-50 rounded-lg p-3">
              {/* Precio NETO */}
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Precio NETO ({getPriceDescription()})</p>
                <p className="text-xl font-bold text-blue-600">
                  ${formatter.format(finalPricePerUnit)}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    / {getUnidadDisplay(selectedModalidad)}
                  </span>
                </p>
              </div>

              {/* Precio CON IVA */}
              <div className="flex-1 border-l pl-6">
                <p className="text-xs text-gray-500 mb-1">Precio con IVA (Cliente Final)</p>
                <p className="text-xl font-bold text-green-600">
                  ${formatter.format(priceWithIVA)}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    / {getUnidadDisplay(selectedModalidad)}
                  </span>
                </p>
              </div>

              {/* Info adicional */}
              <div className="flex items-center text-xs text-gray-500">
                <Info className="w-4 h-4 mr-1" />
                <span>IVA incluido</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-7 h-7" />
          </button>
        </header>

        {/* ✅ NUEVO: Panel de distribución de stock */}
        {showStockDetails && varianteSeleccionada && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              <Warehouse className="w-5 h-5 mr-2" />
              Distribución de Stock por Bodega
            </h4>
            <StockDistribution variante={varianteSeleccionada} />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-grow py-4 grid md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4 flex flex-col">
            {/* Modalidades */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">Modalidad de Venta</label>
              <div className="grid grid-cols-1 gap-2">
                {(() => {
                  const modalidades = varianteSeleccionada?.modalidades || 
                                     product.modalidades_producto || 
                                     [];

                  if (!modalidades || modalidades.length === 0) {
                    return (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-center">
                        <p className="font-semibold">No hay modalidades configuradas</p>
                      </div>
                    );
                  }

                  return modalidades.map((modalidad, index) => {
                    const modalidadPriceNeto = getPriceForDocument(modalidad);
                    const modalidadPriceIVA = getPriceWithIVA(modalidad);
                    const isSelected = selectedModalidad?.id_modalidad === modalidad.id_modalidad;

                    return (
                      <button
                        key={modalidad.id_modalidad || index}
                        onClick={() => setSelectedModalidad(modalidad)}
                        className={`px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-semibold text-base flex items-center gap-2">
                              {modalidad.nombre}
                              {!modalidad.es_cantidad_variable && (
                                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Fija</span>
                              )}
                            </div>
                            <div className={`text-sm mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  Neto: ${formatter.format(modalidadPriceNeto)}
                                </span>
                                <span className="text-xs">|</span>
                                <span className="font-medium">
                                  c/IVA: ${formatter.format(modalidadPriceIVA)}
                                </span>
                              </div>
                              <div className="text-xs mt-1">
                                {modalidad.nombre.toLowerCase() === 'rollo' 
                                  ? 'Precio por metro (modalidad rollo)' 
                                  : modalidad.descripcion || ''
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Cantidad y Total */}
            <div className="space-y-3">
              {/* Input de cantidad */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <h4 className="text-base font-medium text-gray-600 mb-2">
                  Cantidad de {product.unidad_medida || 'metros'}
                  {selectedModalidad?.nombre.toLowerCase() === 'rollo' && (
                    <span className="text-xs text-blue-600 block">
                      (modalidad {selectedModalidad.nombre})
                    </span>
                  )}
                </h4>
                <div className="w-full text-4xl text-center py-2 border-2 border-gray-200 rounded-lg bg-white font-mono">
                  {inputValue}
                </div>
              </div>

              {/* Totales calculados */}
              {quantity > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total NETO */}
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Total NETO</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${formatter.format(totalPriceNeto)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {quantity} × ${formatter.format(finalPricePerUnit)}
                      </p>
                    </div>

                    {/* Total con IVA */}
                    <div className="text-center border-l">
                      <p className="text-xs text-gray-600 mb-1">Total con IVA</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${formatter.format(totalPriceWithIVA)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {quantity} × ${formatter.format(priceWithIVA)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Nota informativa */}
                  <div className="mt-3 pt-3 border-t border-gray-300 text-center">
                    <p className="text-xs text-gray-600 flex items-center justify-center">
                      <Info className="w-3 h-3 mr-1" />
                      El cliente paga: <span className="font-bold text-green-700 ml-1">${formatter.format(totalPriceWithIVA)}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Validación */}
            {validationMessage && (
              <div className="text-center text-red-600 font-medium p-2 bg-red-50 rounded-lg text-sm">
                ⚠️ {validationMessage}
              </div>
            )}
          </div>

          {/* Right Column - Keypad */}
          <div className="flex flex-col space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9).keys()].map(i => i + 1).map(num => (
                <button key={num} onClick={() => handleNumberClick(num.toString())} 
                        className="h-14 bg-gray-100 hover:bg-gray-200 rounded-lg text-2xl font-bold transition-colors">
                  {num}
                </button>
              ))}
              <button onClick={handleDecimalClick} 
                      disabled={!selectedModalidad || !selectedModalidad.es_cantidad_variable}
                      className={`h-14 rounded-lg text-2xl font-bold transition-colors ${
                        selectedModalidad?.es_cantidad_variable ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}>
                .
              </button>
              <button onClick={() => handleNumberClick('0')} 
                      className="h-14 bg-gray-100 hover:bg-gray-200 rounded-lg text-2xl font-bold transition-colors">
                0
              </button>
              <button onClick={handleBackspaceClick} 
                      className="h-14 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-lg text-2xl font-bold flex items-center justify-center">
                ←
              </button>
            </div>
            
            <button onClick={handleClearClick} 
                    className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-bold text-base transition-colors">
              LIMPIAR
            </button>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={onClose} 
                      className="h-14 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-lg transition-colors">
                CANCELAR
              </button>
              <button onClick={handleAddClick} disabled={!isValid || !selectedModalidad}
                      className={`h-14 ${isValid && selectedModalidad ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'} rounded-lg font-bold text-lg transition-colors`}>
                AGREGAR
              </button>
            </div>

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