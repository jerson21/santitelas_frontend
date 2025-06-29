import React, { useState, useEffect, useMemo, useCallback } from 'react';
import VendedorHeader from './VendedorHeader';
import ProductModal from './ProductModal';
import ValeModal from './ValeModal';
import ClienteModal from './ClienteModal';
import ApiService from '../../services/api';
import { Plus, ArrowLeft, Loader2, UserCheck, Home, ChevronRight, Search, Package, Layers, Palette, X, Warehouse } from 'lucide-react'; // Íconos ajustados
// ✅ ELIMINADO: StockDistributionWidget y StockIndicator/StockIndicatorDot

// Función debounce para optimizar búsquedas
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Componente de búsqueda separado (CON CAMBIOS)
const SearchBox = ({ onProductSelect }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const queryNormalizada = query.trim().toLowerCase();
      const terminos = queryNormalizada.split(/\s+/);
      
      const terminoMasLargo = terminos.reduce((a, b) => a.length >= b.length ? a : b);
      const ultimoTermino = terminos[terminos.length - 1];
      const terminoBusqueda = terminoMasLargo.length > 4 ? terminoMasLargo : ultimoTermino;
      
      const response = await ApiService.getVendedorProductos({ 
        search: terminoBusqueda,
        limit: 100
      });
      
      let productosEncontrados = response.data || [];
      
      if (productosEncontrados.length === 0 && terminoBusqueda !== terminos[0]) {
        const response2 = await ApiService.getVendedorProductos({ 
          search: terminos[0],
          limit: 100
        });
        productosEncontrados = response2.data || [];
      }
      
      let resultadosProcesados = [];
      
      productosEncontrados.forEach(producto => {
        const textoProducto = [
          producto.nombre,
          producto.codigo,
          producto.tipo,
          producto.categoria
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (terminos.length === 1) {
          if (!textoProducto.includes(terminos[0])) return;
          
          if (producto.variantes && producto.variantes.length > 0) {
            producto.variantes.forEach(variante => {
              resultadosProcesados.push({
                ...producto,
                varianteCoincidente: variante,
                descripcion_busqueda: `${producto.nombre} - ${variante.color || variante.medida || variante.material || variante.descripcion}`,
                uniqueId: `${producto.id_producto}-${variante.id_variante}`,
                // ✅ Aseguramos que los datos de stock estén disponibles si son necesarios en el modal
                stock_total: variante.stock_total || 0,
                distribucion_general: variante.distribucion_bodegas?.map(b => ({
                    nombre: b.nombre_bodega,
                    cantidad: b.cantidad_disponible,
                    es_punto_venta: b.es_punto_venta
                })) || []
              });
            });
          } else {
            // Si no tiene variantes pero el producto coincide con el término
            resultadosProcesados.push({
              ...producto,
              descripcion_busqueda: producto.nombre,
              uniqueId: `${producto.id_producto}-single`,
              // ✅ Aseguramos los datos de stock del producto base si no hay variantes
              stock_total: producto.stock_total || 0,
              distribucion_general: producto.distribucion_general?.map(b => ({
                  nombre: b.nombre_bodega,
                  cantidad: b.cantidad,
                  es_punto_venta: b.es_punto_venta
              })) || []
            });
          }
        } else {
          if (producto.variantes && producto.variantes.length > 0) {
            producto.variantes.forEach(variante => {
              const textoVariante = [
                variante.color,
                variante.medida,
                variante.material,
                variante.sku
              ].filter(Boolean).join(' ').toLowerCase();
              
              const textoCompleto = textoProducto + ' ' + textoVariante;
              
              const todosTerminosPresentes = terminos.every(termino => 
                textoCompleto.includes(termino)
              );
              
              if (todosTerminosPresentes) {
                let descripcion = `${producto.nombre}`;
                
                if (producto.tipo && terminos.some(t => producto.tipo.toLowerCase().includes(t))) {
                  descripcion += ` (${producto.tipo})`;
                }
                
                const detallesVariante = [
                  variante.color,
                  variante.medida,
                  variante.material
                ].filter(Boolean).join(' - ');
                
                if (detallesVariante) {
                  descripcion += ` - ${detallesVariante}`;
                }
                
                resultadosProcesados.push({
                  ...producto,
                  varianteCoincidente: variante,
                  descripcion_busqueda: descripcion,
                  uniqueId: `${producto.id_producto}-${variante.id_variante}`,
                  // ✅ Aseguramos que los datos de stock de la VARIANTE se pasen correctamente
                  stock_total: variante.stock_total || 0,
                  distribucion_general: variante.distribucion_bodegas?.map(b => ({
                    nombre: b.nombre_bodega,
                    cantidad: b.cantidad_disponible,
                    es_punto_venta: b.es_punto_venta
                  })) || []
                });
              }
            });
          }
        }
      });
      
      setSearchResults(resultadosProcesados);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 700),
    []
  );

  const handleSearchChange = (value) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSelectProduct = (product) => {
    setShowSearchResults(false);
    handleClearSearch();
    onProductSelect(product);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchResults]);

  return (
    <div className="relative w-96 search-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar: LINO GUCCI o GUCCI CRUDO..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => searchValue.trim().length >= 2 && searchResults.length > 0 && setShowSearchResults(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
        {searchLoading && (
          <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
        )}
        {searchValue && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSearchResults && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
          {searchLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="animate-spin w-6 h-6 mx-auto text-blue-600" />
              <p className="text-sm text-gray-500 mt-2">Buscando...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600">
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              </div>
              <div className="py-2 max-h-80 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.uniqueId || product.id_producto}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full px-4 py-3 hover:bg-gray-50 text-left border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {product.descripcion_busqueda || product.nombre}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <span>Código: {product.codigo}</span>
                          {product.tipo && <span>• {product.tipo}</span>}
                          {product.categoria && <span>• {product.categoria}</span>}
                        </div>
                      </div>
                      
                      {/* ✅ ELIMINADO: StockIndicator aquí */}
                    </div>
                    
                    {product.varianteCoincidente && (
                      <div className="text-xs text-blue-600 mt-1">
                        <span className="inline-flex items-center gap-2">
                          <span className="bg-blue-100 px-2 py-0.5 rounded">
                            {product.varianteCoincidente.color && `Color: ${product.varianteCoincidente.color}`}
                            {product.varianteCoincidente.medida && ` Medida: ${product.varianteCoincidente.medida}`}
                            {product.varianteCoincidente.material && ` Material: ${product.varianteCoincidente.material}`}
                          </span>
                          <span className="text-gray-500">
                            Stock: {product.varianteCoincidente.stock_disponible || 0}
                          </span>
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No se encontraron productos para "{searchValue}"</p>
              <p className="text-xs mt-2">
                Intenta buscar por: modelo (ej: GUCCI), modelo + color (ej: GUCCI CRUDO), código o SKU
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de navegación mejorado (mantener sin cambios)
const NavigationBar = React.memo(({ 
  currentLevel, selectedCategory, selectedType, selectedModel, currentVariantType,
  breadcrumb, goToCategories, onProductSelect
}) => {
  const getIcon = (level) => {
    switch(level) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'categories': return <Package className="w-5 h-5" />;
      case 'types': return <Layers className="w-5 h-5" />;
      case 'models': return <Palette className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 flex-1">
            <button
              onClick={goToCategories}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentLevel === 'categories' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Inicio</span>
            </button>

            {breadcrumb.length > 0 && (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}

            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <button
                  onClick={item.action}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-all"
                >
                  {getIcon(index === 0 ? 'categories' : index === 1 ? 'types' : 'models')}
                  <span>{item.label}</span>
                </button>
                {index < breadcrumb.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </React.Fragment>
            ))}

            {currentLevel !== 'categories' && (
              <>
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md">
                  {currentLevel === 'types' && (
                    <>
                      <Layers className="w-5 h-5" />
                      <span>Tipos de {selectedCategory?.nombre}</span>
                    </>
                  )}
                  {currentLevel === 'models' && (
                    <>
                      <Palette className="w-5 h-5" />
                      <span>Modelos de {selectedType?.name}</span>
                    </>
                  )}
                  {currentLevel === 'options' && (
                    <>
                      <Palette className="w-5 h-5" />
                      <span>{currentVariantType.charAt(0).toUpperCase() + currentVariantType.slice(1)} de {selectedModel?.name}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <SearchBox onProductSelect={onProductSelect} />
        </div>
      </div>
    </div>
  );
});

// Componente de info del cliente (mantener sin cambios)
const ClienteInfoDisplay = ({ clienteActual, documentType, onNewClient }) => {
  if (!clienteActual) return null;

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCheck className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-700">Cliente actual:</p>
            <div className="flex items-center space-x-4">
              <p className="text-lg font-bold text-gray-900">
                {clienteActual.nombre || 'Cliente sin identificar'}
              </p>
              {clienteActual.rut && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">RUT:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded border text-sm font-semibold">
                    {clienteActual.rut}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-2">
            Documento: <span className="font-bold capitalize text-blue-600">{documentType}</span>
          </div>
          <button
            onClick={onNewClient}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
          >
            Nuevo Cliente
          </button>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE PRINCIPAL
const VendedorDashboard = () => {
  // Estados principales
  const [showClienteModal, setShowClienteModal] = useState(true);
  const [clienteActual, setClienteActual] = useState(null);
  const [documentType, setDocumentType] = useState('ticket');
  
  const [categories, setCategories] = useState([]);
  const [currentLevel, setCurrentLevel] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [types, setTypes] = useState([]);
  const [models, setModels] = useState([]);
  const [options, setOptions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // ✅ ELIMINADO: selectedProductForStock y showStockWidget (ya no se usan aquí)

  // Carrito con persistencia localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('carrito_venta_actual');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        return Array.isArray(parsedCart) ? parsedCart : [];
      }
    } catch (error) {
      console.error('Error al cargar carrito desde localStorage:', error);
      localStorage.removeItem('carrito_venta_actual');
    }
    return [];
  });

  const [showProductModal, setShowProductModal] = useState(false);
  const [showValeModal, setShowValeModal] = useState(false);
  const [valeData, setValeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [currentVariantType, setCurrentVariantType] = useState('opción');

  // Manejar confirmación de cliente
  const handleClienteConfirm = (cliente) => {
    setClienteActual(cliente);
    setDocumentType(cliente.tipo_documento);
    setShowClienteModal(false);
    
    if (cart.length > 0) {
      const continuar = window.confirm(
        `Hay ${cart.length} productos en el carrito de una venta anterior.\n\n¿Desea continuar con esa venta o comenzar una nueva?`
      );
      
      if (!continuar) {
        setCart([]);
      }
    }
  };

  // Función para reiniciar venta
  const reiniciarVenta = () => {
    setClienteActual(null);
    setCart([]);
    setCurrentLevel('categories');
    setSelectedCategory(null);
    setSelectedType(null);
    setSelectedModel(null);
    setSelectedOption(null);
    setTypes([]);
    setModels([]);
    setOptions([]);
    setAllProducts([]);
    setBreadcrumb([]);
    setCurrentVariantType('opción');
    // ✅ ELIMINADO: setSelectedProductForStock(null); setShowStockWidget(false);
    setShowClienteModal(true);
  };

  // Función para manejar producto seleccionado desde búsqueda
  const handleProductSelectFromSearch = async (product) => {
    try {
      const response = await ApiService.getProduct(product.id_producto);
      
      if (response.success && response.data) {
        const prodData = response.data;
        const varianteAUsar = product.varianteCoincidente;
        
        if (varianteAUsar) {
          let varianteDetallada = prodData.variantes?.find(v => 
            (varianteAUsar.id_variante && v.id_variante === varianteAUsar.id_variante) ||
            (varianteAUsar.id_variante_producto && v.id_variante_producto === varianteAUsar.id_variante_producto)
          );
          
          if (!varianteDetallada) {
            varianteDetallada = prodData.variantes?.[0];
          }
          
          if (varianteDetallada) {
            const productForModal = {
              ...prodData,
              selectedVariant: varianteDetallada,
              modalidades_producto: varianteDetallada.modalidades || prodData.modalidades || [],
              preselectedOption: varianteDetallada.color || varianteDetallada.medida || varianteDetallada.material || 'Estándar',
            };

            setSelectedProduct(productForModal);
            setShowProductModal(true);
          }
        } else {
            // Si el producto no tiene variantes pero se seleccionó desde la búsqueda (producto único)
            const productForModal = {
                ...prodData,
                selectedVariant: prodData.variantes?.[0] || null, // Podría no tener variantes
                modalidades_producto: prodData.modalidades || [],
                preselectedOption: 'Estándar', // Valor por defecto
            };
            setSelectedProduct(productForModal);
            setShowProductModal(true);
        }
      } else {
        alert('Error al cargar el producto. Por favor intente nuevamente.');
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      alert('Error al cargar el producto. Por favor intente nuevamente.');
    }
  };

  // Persistir carrito en localStorage
  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem('carrito_venta_actual', JSON.stringify(cart));
      } else {
        localStorage.removeItem('carrito_venta_actual');
      }
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }, [cart]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Cargar categorías
  const loadCategories = async () => {
    try {
      const response = await ApiService.getVendedorCategorias();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  // Helpers (mantener todos los helpers sin cambios)
  const extractTypeFromProduct = (product) => {
    return product.tipo || 'General';
  };

  const extractModelFromProduct = (product) => {
    return product.nombre || 'General';
  };

  const getVariantAttribute = (products) => {
    if (!products || products.length === 0) return 'opción';
    const sampleProduct = products[0];
    if (!sampleProduct.variantes || sampleProduct.variantes.length === 0) return 'opción';
    const sampleVariant = sampleProduct.variantes[0];
    if (sampleVariant.color && sampleVariant.color !== null) return 'color';
    if (sampleVariant.medida && sampleVariant.medida !== null) return 'medida';
    if (sampleVariant.material && sampleVariant.material !== null) return 'material';
    if (sampleVariant.descripcion && sampleVariant.descripcion !== null) return 'descripción';
    return 'opción';
  };

  const getVariantValue = (variant, attribute) => {
    switch (attribute) {
      case 'color':
        return variant.color || 'Sin Color';
      case 'medida':
        return variant.medida || 'Sin Medida';
      case 'material':
        return variant.material || 'Sin Material';
      case 'descripción':
        return variant.descripcion || 'Sin Descripción';
      default:
        return variant.color || variant.medida || variant.material || variant.descripcion || 'Estándar';
    }
  };

  const getUniqueVariants = (products, attribute) => {
    const variants = new Set();
    products.forEach((product) => {
      if (product.variantes && Array.isArray(product.variantes)) {
        product.variantes.forEach((variante) => {
          const value = getVariantValue(variante, attribute);
          variants.add(value);
        });
      }
    });
    return Array.from(variants);
  };

  const groupProductsByType = (products) => {
    const grouped = {};
    products.forEach((product) => {
      const tipo = extractTypeFromProduct(product);
      if (!grouped[tipo]) {
        grouped[tipo] = {
          name: tipo,
          products: [],
          count: 0,
        };
      }
      grouped[tipo].products.push(product);
      grouped[tipo].count++;
    });
    return Object.values(grouped);
  };

  const groupProductsByModel = (products) => {
    const grouped = {};
    products.forEach((product) => {
      const modelo = extractModelFromProduct(product);
      if (!grouped[modelo]) {
        grouped[modelo] = {
          name: modelo,
          products: [],
          count: 0,
          totalVariants: 0,
        };
      }
      grouped[modelo].products.push(product);
      grouped[modelo].count++;
    });

    const variantAttribute = getVariantAttribute(products);
    Object.values(grouped).forEach((group) => {
      const uniqueVariants = getUniqueVariants(group.products, variantAttribute);
      group.totalVariants = uniqueVariants.length;
    });

    return Object.values(grouped);
  };

  const groupProductsByVariants = (products) => {
    const grouped = {};
    const variantAttribute = getVariantAttribute(products);

    products.forEach((product) => {
      if (product.variantes && Array.isArray(product.variantes)) {
        product.variantes.forEach((variante) => {
          const variantValue = getVariantValue(variante, variantAttribute);
          if (!grouped[variantValue]) {
            grouped[variantValue] = {
              name: variantValue,
              products: [],
              variants: [], // Para almacenar las variantes completas para cálculo de stock
              count: 0,
              attribute: variantAttribute,
            };
          }
          const exists = grouped[variantValue].products.find(
            (p) => p.id_producto === product.id_producto
          );
          if (!exists) {
            grouped[variantValue].products.push(product);
            grouped[variantValue].count++;
          }
          grouped[variantValue].variants.push({ // Agregamos la variante completa
            ...variante,
            product: product, // Referencia al producto padre
          });
        });
      }
    });

    return Object.values(grouped);
  };

  const getVariantIcon = (variantName, attribute) => {
    if (attribute === 'color') {
      return (
        <div className="w-16 h-16 rounded-xl mb-4 border-4 border-gray-300 shadow-lg bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-700 text-center px-1">
            {variantName}
          </span>
        </div>
      );
    }

    let iconBg = 'from-blue-100 to-blue-300';
    let iconText = variantName.charAt(0).toUpperCase();
    let textColor = 'text-blue-600';

    switch (attribute) {
      case 'medida':
        iconBg = 'from-green-100 to-green-300';
        textColor = 'text-green-600';
        iconText = variantName;
        break;
      case 'material':
        iconBg = 'from-yellow-100 to-yellow-300';
        textColor = 'text-yellow-600';
        iconText = variantName.substring(0, 3).toUpperCase();
        break;
      case 'descripción':
        iconBg = 'from-purple-100 to-purple-300';
        textColor = 'text-purple-600';
        iconText = variantName.charAt(0).toUpperCase();
        break;
    }

    return (
      <div
        className={`w-16 h-16 rounded-xl mb-4 border-4 border-gray-300 shadow-lg bg-gradient-to-br ${iconBg} flex items-center justify-center`}
      >
        <span className={`text-sm font-bold ${textColor} text-center px-1`}>
          {iconText}
        </span>
      </div>
    );
  };

  // Navegación entre niveles
  const goToCategories = useCallback(() => {
    setCurrentLevel('categories');
    setSelectedCategory(null);
    setSelectedType(null);
    setSelectedModel(null);
    setSelectedOption(null);
    setTypes([]);
    setModels([]);
    setOptions([]);
    setAllProducts([]);
    setBreadcrumb([]);
    setCurrentVariantType('opción');
    // ✅ ELIMINADO: setSelectedProductForStock(null); setShowStockWidget(false);
  }, []);

  const goToTypes = useCallback(() => {
    if (!selectedCategory) return;
    setCurrentLevel('types');
    setSelectedType(null);
    setSelectedModel(null);
    setSelectedOption(null);
    setModels([]);
    setOptions([]);
    setBreadcrumb([{ label: 'Categorías', action: goToCategories }]);
    setCurrentVariantType('opción');
    // ✅ ELIMINADO: setSelectedProductForStock(null); setShowStockWidget(false);
  }, [selectedCategory, goToCategories]);

  const goToModels = useCallback(() => {
    if (!selectedType) return;
    setCurrentLevel('models');
    setSelectedModel(null);
    setSelectedOption(null);
    setOptions([]);
    setBreadcrumb([
      { label: 'Categorías', action: goToCategories },
      { label: `Tipos de ${selectedCategory.nombre}`, action: goToTypes },
    ]);
    setCurrentVariantType('opción');
    // ✅ ELIMINADO: setSelectedProductForStock(null); setShowStockWidget(false);
  }, [selectedType, selectedCategory, goToCategories, goToTypes]);

  // Cargar datos por nivel
  const loadTypesByCategory = async (categoryId, categoryName) => {
    setLoading(true);
    try {
      const response = await ApiService.getVendedorProductos({ categoria: categoryId });

      if (response.success && Array.isArray(response.data)) {
        const productos = response.data;
        const productsByType = groupProductsByType(productos);
        setTypes(productsByType);
        setAllProducts(productos);
        setSelectedCategory({ id: categoryId, nombre: categoryName });
        setCurrentLevel('types');
        setBreadcrumb([{ label: 'Categorías', action: goToCategories }]);
        // ✅ ELIMINADO: setSelectedProductForStock(null); setShowStockWidget(false);
      }
    } catch (error) {
      console.error('Error cargando tipos:', error);
    }
    setLoading(false);
  };

  const loadModelsByType = (typeData, typeName) => {
    const products = typeData.products;
    const modelsByGroup = groupProductsByModel(products);
    setModels(modelsByGroup);
    setSelectedType({ name: typeName, products: products });
    setCurrentLevel('models');
    setBreadcrumb([
      { label: 'Categorías', action: goToCategories },
      { label: `Tipos de ${selectedCategory.nombre}`, action: goToTypes },
    ]);
    // ✅ ELIMINADO: setSelectedProductForStock(null); setShowStockWidget(false);
  };

  const loadVariantsByModel = (modelData, modelName) => {
    const products = modelData.products;
    const variantsByGroup = groupProductsByVariants(products);
    const variantAttribute = getVariantAttribute(products);

    setOptions(variantsByGroup);
    setSelectedModel({ name: modelName, products: products });
    setCurrentVariantType(variantAttribute);
    setCurrentLevel('options');
    setBreadcrumb([
      { label: 'Categorías', action: goToCategories },
      { label: `Tipos de ${selectedCategory.nombre}`, action: goToTypes },
      { label: `Modelos de ${selectedType.name}`, action: goToModels },
    ]);
    
    // ✅ ELIMINADO: selectedProductForStock logic and setShowStockWidget(false);
  };

  const selectVariant = async (variantData, variantName) => {
    const productWithVariant = variantData.products[0];
    const specificVariant = variantData.variants.find(
      (v) => getVariantValue(v, variantData.attribute) === variantName
    );

    if (productWithVariant && specificVariant) {
      setSelectedOption(variantName);
      try {
        const response = await ApiService.getProduct(productWithVariant.id_producto);

        if (response.success && response.data) {
          const prodData = response.data;
          
          let varianteDetallada = null;
          
          // ✅ CORREGIDO: Buscamos la variante exacta por su ID si está disponible
          varianteDetallada = prodData.variantes?.find(v => 
            v.id_variante_producto === specificVariant.id_variante_producto
          );

          if (!varianteDetallada) {
            // Fallback si no se encuentra por ID, buscar por atributos
            if (variantData.attribute === 'color') {
              varianteDetallada = prodData.variantes?.find(v => v.color === variantName);
            } else if (variantData.attribute === 'medida') {
              varianteDetallada = prodData.variantes?.find(v => v.medida === variantName);
            } else if (variantData.attribute === 'material') {
              varianteDetallada = prodData.variantes?.find(v => v.material === variantName);
            } else {
                // Si ninguna de las anteriores, tomar la primera o la que tenga stock
                varianteDetallada = prodData.variantes?.find(v => v.stock_total > 0) || prodData.variantes?.[0];
            }
          }

          if (varianteDetallada) {
            const productForModal = {
              ...prodData,
              selectedVariant: varianteDetallada,
              modalidades_producto: varianteDetallada.modalidades || prodData.modalidades || [],
              preselectedOption: variantName,
              variantAttribute: variantData.attribute,
            };

            setSelectedProduct(productForModal);
            // ✅ ELIMINADO: setSelectedProductForStock logic and setShowStockWidget(false);
            setShowProductModal(true);
          }
        } else {
          alert('Error al cargar los datos del producto');
        }
      } catch (error) {
        console.error('Error obteniendo producto:', error);
        alert('Error al cargar el producto. Intenta nuevamente.');
      }
    }
  };

  // Agregar al carrito
  const addToCart = (product, variant, quantity, modalidad, price) => {
    const modalidadCompleta = product.selectedVariant?.modalidades_disponibles?.find(
      m => m.nombre === modalidad || m.id_modalidad === modalidad
    ) || product.modalidades_producto?.find(
      m => m.nombre === modalidad || m.id_modalidad === modalidad
    );

    const item = {
      id: `${product.selectedVariant?.id_variante_producto}-${modalidad}-${Date.now()}`,
      product: {
        id_producto: product.id_producto,
        nombre: product.nombre,
        codigo: product.codigo,
        tipo: product.tipo,
        unidad_medida: product.unidad_medida,
      },
      variante: {
        id_variante_producto: product.selectedVariant?.id_variante_producto,
        sku: product.selectedVariant?.sku,
        color: product.selectedVariant?.color,
        medida: product.selectedVariant?.medida,
        material: product.selectedVariant?.material,
      },
      color: variant,
      quantity,
      modalidad,
      price,
      total: quantity * price,
      id_variante_producto: product.selectedVariant?.id_variante_producto,
      id_modalidad: modalidadCompleta?.id_modalidad,
    };

    setCart([...cart, item]);
    setShowProductModal(false);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  // Crear Vale
  const createVale = async () => {
    if (cart.length === 0) return;
    if (!clienteActual) {
      alert('Error: No hay datos del cliente');
      return;
    }

    setLoading(true);
    try {
      if (documentType === 'factura' && !clienteActual.rut) {
        alert('Error: RUT es obligatorio para facturas');
        setLoading(false);
        return;
      }

      const pedidoData = {
        tipo_documento: documentType,
        cliente: {
          nombre: clienteActual.nombre || null,
          rut: clienteActual.rut || null
        },
        detalles: cart.map((item) => ({
          id_variante_producto: item.id_variante_producto,
          id_modalidad: item.id_modalidad,
          cantidad: item.quantity,
          precio_unitario: item.price,
          observaciones: `${item.color} - ${item.modalidad}`,
        })),
      };

      const response = await ApiService.createPedidoRapido(pedidoData);

      if (response.success) {
        setValeData(response.data);
        setShowValeModal(true);
        setCart([]);
      } else {
        console.error('Error al crear vale:', response);
        alert('Error al crear el vale: ' + (response.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error creando vale:', error);
      alert('Error al crear el vale. Intente nuevamente.');
    }
    setLoading(false);
  };

  const handleValeModalClose = () => {
    setShowValeModal(false);
    reiniciarVenta();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Cliente */}
      <ClienteModal
        isOpen={showClienteModal}
        onConfirm={handleClienteConfirm}
        onCancel={null}
      />

      {/* Header */}
      <VendedorHeader
        cartItems={cart}
        cartTotal={cart.reduce((sum, item) => sum + item.total, 0)}
        onRemoveItem={removeFromCart}
        onCreateVale={createVale}
        documentType={documentType}
        loading={loading}
        clienteActual={clienteActual}
        onNewClient={reiniciarVenta}
      />

      {/* Barra de navegación */}
      {!showClienteModal && (
        <NavigationBar 
          currentLevel={currentLevel}
          selectedCategory={selectedCategory}
          selectedType={selectedType}
          selectedModel={selectedModel}
          currentVariantType={currentVariantType}
          breadcrumb={breadcrumb}
          goToCategories={goToCategories}
          onProductSelect={handleProductSelectFromSearch}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info del cliente actual */}
        <ClienteInfoDisplay 
          clienteActual={clienteActual}
          documentType={documentType}
          onNewClient={reiniciarVenta}
        />

        {/* ✅ ELIMINADO: Botón para el widget de distribución de stock */}
        {/* ✅ ELIMINADO: Widget de Distribución de Stock (StockDistributionWidget) */}

        {/* 1. CATEGORÍAS */}
        {currentLevel === 'categories' && (
          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              Seleccione una Categoría
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {categories.map((category) => (
                <button
                  key={category.id_categoria}
                  onClick={() => loadTypesByCategory(category.id_categoria, category.nombre)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold py-12 px-6 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  {category.nombre.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. TIPOS */}
        {currentLevel === 'types' && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                Seleccione Tipo en {selectedCategory?.nombre}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-6" />
                <p className="text-xl text-gray-600">Cargando tipos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {types.map((type, index) => (
                  <button
                    key={index}
                    onClick={() => loadModelsByType(type, type.name)}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-2xl font-bold py-16 px-8 rounded-3xl shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="mb-3">{type.name.toUpperCase()}</div>
                    <div className="text-base font-normal opacity-90">
                      {type.count} modelo{type.count !== 1 ? 's' : ''} disponible{type.count !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ✅ ACTUALIZADO: MODELOS sin StockIndicator */}
        {currentLevel === 'models' && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                Seleccione Modelo en {selectedType?.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {models.map((model, index) => {
                return (
                  <button
                    key={index}
                    onClick={() => loadVariantsByModel(model, model.name)}
                    className="relative bg-green-600 hover:bg-green-700 text-white text-2xl font-bold py-16 px-8 rounded-3xl shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="mb-3">{model.name.toUpperCase()}</div>
                    <div className="text-base font-normal opacity-90">
                      {model.totalVariants} variante{model.totalVariants !== 1 ? 's' : ''} disponible{model.totalVariants !== 1 ? 's' : ''}
                    </div>
                    {/* ✅ ELIMINADO: Indicador de stock del modelo */}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ✅ ACTUALIZADO: VARIANTES sin StockIndicatorDot */}
        {currentLevel === 'options' && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                Seleccione {currentVariantType.charAt(0).toUpperCase() + currentVariantType.slice(1)} en {selectedModel?.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {options.map((option, index) => {
                return (
                  <div key={index} className="relative">
                    <button
                      onClick={() => {
                        selectVariant(option, option.name);
                      }}
                      className="w-full bg-white hover:bg-gray-50 border-4 hover:border-purple-400 text-gray-800 p-8 rounded-3xl shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[160px] flex flex-col justify-center items-center"
                    >
                      {getVariantIcon(option.name, option.attribute)}
                      <div className="text-xl font-bold mb-2 text-center">
                        {option.name.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {option.count} producto{option.count !== 1 ? 's' : ''}
                      </div>
                    </button>
                    {/* ✅ ELIMINADO: Indicador de stock en la esquina */}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modales */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          documentType={documentType}
          preselectedOption={selectedProduct.preselectedOption}
          onAdd={addToCart}
          onClose={() => setShowProductModal(false)}
        />
      )}

      {showValeModal && (
        <ValeModal 
          valeData={valeData} 
          onClose={handleValeModalClose}
        />
      )}
    </div>
  );
};

export default VendedorDashboard;