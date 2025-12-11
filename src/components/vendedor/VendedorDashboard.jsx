import React, { useState, useEffect, useMemo, useCallback } from 'react';
import VendedorHeader from './VendedorHeader';
import ProductModal from './ProductModal';
import ValeModal from './ValeModal';
import ClienteModal from './ClienteModal';
import ApiService from '../../services/api';
import printService from '../../services/printService';
import { Loader2, UserCheck, ChevronRight, Search, X, Edit, UserPlus } from 'lucide-react';

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

// Componente de búsqueda separado
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
    // Normalizar y separar términos
    const queryNormalizada = query.trim().toLowerCase();
    const terminos = queryNormalizada.split(/\s+/);
    
    console.log('🔍 Búsqueda:', { query, terminos });
    
    // Estrategia: buscar por el término más largo (probablemente el modelo)
    // o si todos son cortos, buscar por el último término
    const terminoMasLargo = terminos.reduce((a, b) => a.length >= b.length ? a : b);
    const ultimoTermino = terminos[terminos.length - 1];
    
    // Decidir qué término usar para la búsqueda principal
    const terminoBusqueda = terminoMasLargo.length > 4 ? terminoMasLargo : ultimoTermino;
    
    console.log('🔍 Término principal de búsqueda:', terminoBusqueda);
    
    // Buscar productos
    const response = await ApiService.getVendedorProductos({ 
      search: terminoBusqueda,
      limit: 100
    });
    
    // Si no hay resultados con el término principal, buscar con el primer término
    let productosEncontrados = response.data || [];
    
    if (productosEncontrados.length === 0 && terminoBusqueda !== terminos[0]) {
      console.log('🔍 Sin resultados, intentando con primer término:', terminos[0]);
      const response2 = await ApiService.getVendedorProductos({ 
        search: terminos[0],
        limit: 100
      });
      productosEncontrados = response2.data || [];
    }
    
    // Si aún no hay resultados, buscar todos los productos para filtrar por tipo
    if (productosEncontrados.length === 0) {
      console.log('🔍 Sin resultados, obteniendo todos los productos');
      const responseTodos = await ApiService.getVendedorProductos({ 
        limit: 200
      });
      productosEncontrados = responseTodos.data || [];
    }
    
    // Procesar resultados
    let resultadosProcesados = [];
    
    productosEncontrados.forEach(producto => {
      // Crear texto completo del producto
      const textoProducto = [
        producto.nombre,
        producto.codigo,
        producto.tipo,
        producto.categoria
      ].filter(Boolean).join(' ').toLowerCase();
      
      // Para búsqueda de un solo término
      if (terminos.length === 1) {
        // Verificar si el término está en el producto
        if (!textoProducto.includes(terminos[0])) return;
        
        // Mostrar todas las variantes
        if (producto.variantes && producto.variantes.length > 0) {
          producto.variantes.forEach(variante => {
            resultadosProcesados.push({
              ...producto,
              varianteCoincidente: variante,
              descripcion_busqueda: `${producto.nombre} - ${variante.color || variante.medida || variante.material || variante.descripcion}`,
              uniqueId: `${producto.id_producto}-${variante.id_variante}`
            });
          });
        } else {
          resultadosProcesados.push({
            ...producto,
            varianteCoincidente: null,
            descripcion_busqueda: producto.nombre,
            uniqueId: `${producto.id_producto}-0`
          });
        }
      } else {
        // Para múltiples términos
        if (producto.variantes && producto.variantes.length > 0) {
          producto.variantes.forEach(variante => {
            // Crear texto completo incluyendo variante
            const textoVariante = [
              variante.color,
              variante.medida,
              variante.material,
              variante.sku
            ].filter(Boolean).join(' ').toLowerCase();
            
            const textoCompleto = textoProducto + ' ' + textoVariante;
            
            // Verificar que TODOS los términos estén presentes
            const todosTerminosPresentes = terminos.every(termino => 
              textoCompleto.includes(termino)
            );
            
            if (todosTerminosPresentes) {
              // Construir descripción destacando coincidencias
              let descripcion = `${producto.nombre}`;
              
              // Agregar tipo si coincide con búsqueda
              if (producto.tipo && terminos.some(t => producto.tipo.toLowerCase().includes(t))) {
                descripcion += ` (${producto.tipo})`;
              }
              
              // Agregar detalles de variante
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
                uniqueId: `${producto.id_producto}-${variante.id_variante}`
              });
            }
          });
        } else {
          // Para productos sin variantes
          const todosTerminosEnProducto = terminos.every(termino => 
            textoProducto.includes(termino)
          );
          
          if (todosTerminosEnProducto) {
            let descripcion = producto.nombre;
            if (producto.tipo && terminos.some(t => producto.tipo.toLowerCase().includes(t))) {
              descripcion += ` (${producto.tipo})`;
            }
            
            resultadosProcesados.push({
              ...producto,
              varianteCoincidente: null,
              descripcion_busqueda: descripcion,
              uniqueId: `${producto.id_producto}-0`
            });
          }
        }
      }
    });
    
    console.log('✅ Resultados procesados:', resultadosProcesados.length, 'items');
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
    <div className="relative w-full search-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => searchValue.trim().length >= 2 && searchResults.length > 0 && setShowSearchResults(true)}
          className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Resultados de búsqueda */}
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
                    <div className="font-medium text-gray-900">
                      {product.descripcion_busqueda || product.nombre}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <span>Código: {product.codigo}</span>
                      {product.tipo && <span>• {product.tipo}</span>}
                      {product.categoria && <span>• {product.categoria}</span>}
                    </div>
                    {product.varianteCoincidente && (
                      <div className="text-xs text-blue-600 mt-1">
                        <span className="inline-flex items-center gap-2">
                          <span className="bg-blue-100 px-2 py-0.5 rounded">
                            {product.varianteCoincidente.color && `Color: ${product.varianteCoincidente.color}`}
                            {product.varianteCoincidente.medida && `Medida: ${product.varianteCoincidente.medida}`}
                            {product.varianteCoincidente.material && `Material: ${product.varianteCoincidente.material}`}
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

const VendedorDashboard = () => {
  // Estado para el modal de cliente y datos del cliente
  const [showClienteModal, setShowClienteModal] = useState(true);
  const [clienteActual, setClienteActual] = useState(null);
  const [documentType, setDocumentType] = useState('ticket');
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado para "Agregar a Vale Existente"
  const [valeEnEdicion, setValeEnEdicion] = useState(null); // Vale al que se agregarán productos
  
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
  const [lastCartItems, setLastCartItems] = useState([]); // Para reimprimir
  const [loading, setLoading] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [currentVariantType, setCurrentVariantType] = useState('opción');

  // Manejar confirmación de cliente
  const handleClienteConfirm = (cliente) => {
    setClienteActual(cliente);
    setDocumentType(cliente.tipo_documento);
    setShowClienteModal(false);
    setModoEdicion(false); // Resetear modo edición

    // Si hay un carrito pendiente Y NO está en modo edición, preguntar si continuar
    if (cart.length > 0 && !modoEdicion) {
      const continuar = window.confirm(
        `Hay ${cart.length} productos en el carrito de una venta anterior.\n\n¿Desea continuar con esa venta o comenzar una nueva?`
      );

      if (!continuar) {
        setCart([]);
      }
    }
  };

  // Función para editar cliente (sin perder el carrito)
  const handleEditarCliente = () => {
    setModoEdicion(true);
    setShowClienteModal(true);
  };

  // Función para agregar productos a un vale existente
  const handleAgregarProductosAVale = async (vale) => {
    console.log('📝 Agregando productos al vale:', vale);

    setLoading(true);

    try {
      // Cargar datos del cliente del vale
      const clienteDelVale = {
        nombre: vale.nombre_cliente || vale.cliente?.nombre || vale.cliente_nombre || null,
        rut: vale.cliente_rut || vale.cliente?.rut || vale.rut_cliente || null,
        tipo_documento: vale.tipo_documento || 'ticket'
      };

      // Obtener detalles completos del vale (productos)
      const detallesResponse = await ApiService.getDetallesValeVendedor(vale.id_pedido);

      if (!detallesResponse.success) {
        alert('Error al cargar los productos del vale: ' + detallesResponse.message);
        setLoading(false);
        return;
      }

      console.log('📦 Productos del vale:', detallesResponse.data);

      // Convertir los productos del vale al formato del carrito
      const productosExistentes = (detallesResponse.data.detalles || []).map((detalle, index) => ({
        id: `existing-${detalle.id_detalle_pedido || index}`,
        product: {
          id_producto: detalle.id_producto,
          nombre: detalle.nombre_producto || detalle.producto_nombre,
          codigo: detalle.codigo_producto,
          tipo: detalle.tipo_producto,
          unidad_medida: detalle.unidad_medida || 'metros',
        },
        variante: {
          id_variante_producto: detalle.id_variante_producto,
          sku: detalle.sku,
          color: detalle.color_variante,
          medida: detalle.medida_variante,
          material: detalle.material_variante,
        },
        color: detalle.color_variante || 'N/A',
        quantity: parseFloat(detalle.cantidad),
        modalidad: detalle.modalidad_nombre || detalle.modalidad,
        price: parseFloat(detalle.precio_unitario),
        total: parseFloat(detalle.cantidad) * parseFloat(detalle.precio_unitario),
        id_variante_producto: detalle.id_variante_producto,
        id_modalidad: detalle.id_modalidad,
        esProductoExistente: true, // ✅ MARCAR como producto existente
        id_detalle_pedido: detalle.id_detalle_pedido // Para referencia
      }));

      console.log('✅ Productos existentes convertidos:', productosExistentes);

      // Establecer el vale en edición
      setValeEnEdicion(vale);

      // Cargar datos del cliente
      setClienteActual(clienteDelVale);
      setDocumentType(clienteDelVale.tipo_documento);

      // Cargar productos existentes al carrito
      setCart(productosExistentes);

      // NO abrir modal de cliente, ir directo a selección de productos
      setShowClienteModal(false);

      console.log('✅ Vale cargado con productos existentes:', {
        vale: vale.numero_pedido || vale.numero_vale,
        cliente: clienteDelVale,
        productosExistentes: productosExistentes.length
      });

    } catch (error) {
      console.error('❌ Error cargando vale:', error);
      alert('Error al cargar el vale. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para reiniciar venta (Nueva Venta)
  const reiniciarVenta = () => {
    // Confirmación si hay productos en el carrito
    if (cart.length > 0) {
      const confirmar = window.confirm(
        `⚠️ Hay ${cart.length} productos en el carrito.\n\n¿Está seguro que desea iniciar una nueva venta?\n\nSe perderán todos los productos agregados.`
      );

      if (!confirmar) {
        return; // Cancelar si el usuario no confirma
      }
    }

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
    setModoEdicion(false);
    setShowClienteModal(true);
  };

  // Función para manejar producto seleccionado desde búsqueda
  // En VendedorDashboard - Reemplazar handleProductSelectFromSearch completo:

const handleProductSelectFromSearch = async (product) => {
  try {
    // SIEMPRE cargar el producto completo para obtener todas las modalidades
    const response = await ApiService.getProduct(product.id_producto);
    
    if (response.success && response.data) {
      const prodData = response.data;
      
      // Si el producto viene con una variante específica del buscador, usarla
      const varianteAUsar = product.varianteCoincidente;
      
      if (varianteAUsar) {
        // Buscar la variante completa en los datos del producto
        let varianteDetallada = null;
        
        // Primero intentar buscar por ID exacto
        if (varianteAUsar.id_variante || varianteAUsar.id_variante_producto) {
          varianteDetallada = prodData.variantes?.find(v => 
            (varianteAUsar.id_variante && v.id_variante === varianteAUsar.id_variante) ||
            (varianteAUsar.id_variante_producto && v.id_variante_producto === varianteAUsar.id_variante_producto) ||
            (varianteAUsar.id_variante && v.id_variante_producto === varianteAUsar.id_variante) ||
            (varianteAUsar.id_variante_producto && v.id_variante === varianteAUsar.id_variante_producto)
          );
        }
        
        // Si no se encuentra por ID, buscar por SKU
        if (!varianteDetallada && varianteAUsar.sku) {
          varianteDetallada = prodData.variantes?.find(v => v.sku === varianteAUsar.sku);
        }
        
        // Si aún no se encuentra, buscar por combinación de atributos
        if (!varianteDetallada) {
          varianteDetallada = prodData.variantes?.find(v => {
            // Verificar coincidencia exacta de atributos
            const colorCoincide = (!varianteAUsar.color && !v.color) || 
                                  (varianteAUsar.color && v.color && varianteAUsar.color.toLowerCase() === v.color.toLowerCase());
            const medidaCoincide = (!varianteAUsar.medida && !v.medida) || 
                                   (varianteAUsar.medida && v.medida && varianteAUsar.medida.toLowerCase() === v.medida.toLowerCase());
            const materialCoincide = (!varianteAUsar.material && !v.material) || 
                                     (varianteAUsar.material && v.material && varianteAUsar.material.toLowerCase() === v.material.toLowerCase());
            
            return colorCoincide && medidaCoincide && materialCoincide;
          });
        }
        
        // Si aún no se encuentra, usar la primera variante como fallback
        if (!varianteDetallada) {
          console.warn('⚠️ No se encontró la variante exacta, usando la primera disponible');
          varianteDetallada = prodData.variantes?.[0];
        }
        
        if (varianteDetallada) {
          console.log('✅ Variante encontrada:', {
            buscada: varianteAUsar,
            encontrada: varianteDetallada
          });
          
          // Calcular stock de la variante
          let stockVariante = 0;
          if (varianteDetallada.stock_disponible !== undefined) {
            stockVariante = varianteDetallada.stock_disponible;
          } else if (varianteDetallada.stockPorBodega && Array.isArray(varianteDetallada.stockPorBodega)) {
            stockVariante = varianteDetallada.stockPorBodega.reduce((total, stock) => 
              total + (Number(stock.cantidad_disponible) || 0), 0
            );
          }
          
          const productForModal = {
            id_producto: prodData.id_producto,
            codigo: prodData.codigo,
            nombre: prodData.nombre,
            descripcion: prodData.descripcion || '',
            tipo: prodData.tipo,
            categoria: prodData.categoria,
            unidad_medida: prodData.unidad_medida || 'metros',
            
            selectedVariant: {
              id_variante_producto: varianteDetallada.id_variante || varianteDetallada.id_variante_producto,
              sku: varianteDetallada.sku,
              color: varianteDetallada.color,
              medida: varianteDetallada.medida,
              material: varianteDetallada.material,
              descripcion: varianteDetallada.descripcion,
              modalidades_disponibles: varianteDetallada.modalidades || prodData.modalidades || [],
            },

            resumen: {
              stock_total: stockVariante,
              tiene_stock: stockVariante > 0,
            },

            modalidades_producto: varianteDetallada.modalidades || prodData.modalidades || [],
            preselectedOption: varianteDetallada.color || varianteDetallada.medida || varianteDetallada.material || 'Estándar',
            variantAttribute: varianteDetallada.color ? 'color' : varianteDetallada.medida ? 'medida' : varianteDetallada.material ? 'material' : 'descripción',
          };

          setSelectedProduct(productForModal);
          setShowProductModal(true);
        }
      } else {
        // Si no hay variante específica, usar la primera
        const primeraVariante = prodData.variantes?.[0];
        if (primeraVariante) {
          // ... código para la primera variante ...
        }
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

  // Limpieza automática de carrito inactivo (30 minutos)
  useEffect(() => {
    if (cart.length === 0) return;

    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        const shouldClear = window.confirm(
          '⏰ Has estado inactivo por 30 minutos.\n\n¿Deseas continuar con esta venta o limpiar el carrito?'
        );
        
        if (!shouldClear) {
          setCart([]);
          reiniciarVenta();
        }
      }, INACTIVITY_TIME);
    };

    // Eventos que reinician el timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Iniciar timer

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [cart.length]);

  useEffect(() => {
    loadCategories();
  }, []);

  // ✅ LISTENER PARA SESIÓN EXPIRADA - Redirigir al login
  useEffect(() => {
    const handleSessionExpired = (event) => {
      console.warn('🚪 Sesión expirada detectada en VendedorDashboard');
      alert(event.detail?.message || 'Su sesión ha expirado. Será redirigido al login.');
      // Recargar la página para que el App detecte que no hay sesión y muestre login
      window.location.reload();
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  // Cargar categorías del endpoint /vendedor/categorias
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

  // Helpers para extraer campos de producto
  const extractTypeFromProduct = (product) => {
    return product.tipo || 'General';
  };

  const extractModelFromProduct = (product) => {
    return product.nombre || 'General';
  };

  // Determinar atributo de variante
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

  // Obtener valor de un atributo de variante
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
        return (
          variant.color ||
          variant.medida ||
          variant.material ||
          variant.descripcion ||
          'Estándar'
        );
    }
  };

  // Obtener variantes únicas
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

  // Agrupar productos por tipo
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

  // Agrupar productos por modelo
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

  // Agrupar productos por variantes
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
              variants: [],
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
          grouped[variantValue].variants.push({
            ...variante,
            product: product,
          });
        });
      } else {
        const defaultValue = `Sin ${variantAttribute}`;
        if (!grouped[defaultValue]) {
          grouped[defaultValue] = {
            name: defaultValue,
            products: [],
            variants: [],
            count: 0,
            attribute: variantAttribute,
          };
        }
        grouped[defaultValue].products.push(product);
        grouped[defaultValue].count++;
      }
    });

    return Object.values(grouped);
  };

  // Generar icono para variante
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
      default:
        iconText = variantName.charAt(0).toUpperCase();
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
  }, [selectedCategory]);

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
  }, [selectedType, selectedCategory]);

  // Cargar datos por nivel
  const loadTypesByCategory = async (categoryId, categoryName) => {
    setLoading(true);
    try {
      const response = await ApiService.getVendedorProductos({ categoria: categoryId });

      if (response.success && Array.isArray(response.data)) {
        const productos = response.data;
        const productsByType = groupProductsByType(productos);

        // Guardar estado común
        setAllProducts(productos);
        setSelectedCategory({ id: categoryId, nombre: categoryName });

        // Si solo hay 1 tipo, saltar directamente a modelos
        if (productsByType.length === 1) {
          const unicoTipo = productsByType[0];
          setTypes(productsByType); // Guardar para referencia del breadcrumb
          loadModelsByType(unicoTipo, unicoTipo.name);
        } else {
          // Múltiples tipos, mostrar la pantalla de tipos
          setTypes(productsByType);
          setCurrentLevel('types');
          setBreadcrumb([{ label: 'Categorías', action: goToCategories }]);
        }
      } else {
        setTypes([]);
        setAllProducts([]);
      }
    } catch (error) {
      console.error('Error cargando tipos:', error);
      setTypes([]);
      setAllProducts([]);
    }
    setLoading(false);
  };

  const loadModelsByType = (typeData, typeName) => {
    const products = typeData.products;
    const modelsByGroup = groupProductsByModel(products);

    setModels(modelsByGroup);
    setSelectedType({ name: typeName, products: products });

    // Si solo hay 1 modelo, saltar directamente a variantes
    if (modelsByGroup.length === 1) {
      const unicoModelo = modelsByGroup[0];
      loadVariantsByModel(unicoModelo, unicoModelo.name);
    } else {
      setCurrentLevel('models');
      setBreadcrumb([
        { label: 'Categorías', action: goToCategories },
        { label: `Tipos de ${selectedCategory.nombre}`, action: goToTypes },
      ]);
    }
  };

  const loadVariantsByModel = (modelData, modelName) => {
    const products = modelData.products;
    const variantsByGroup = groupProductsByVariants(products);
    const variantAttribute = getVariantAttribute(products);

    setOptions(variantsByGroup);
    setSelectedModel({ name: modelName, products: products });
    setCurrentVariantType(variantAttribute);

    // Si solo hay 1 variante, abrir directamente el modal del producto
    if (variantsByGroup.length === 1) {
      const unicaVariante = variantsByGroup[0];
      selectVariant(unicaVariante, unicaVariante.name);
    } else {
      setCurrentLevel('options');
      setBreadcrumb([
        { label: 'Categorías', action: goToCategories },
        { label: `Tipos de ${selectedCategory.nombre}`, action: goToTypes },
        { label: `Modelos de ${selectedType.name}`, action: goToModels },
      ]);
    }
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
          
          if (variantData.attribute === 'color') {
            varianteDetallada = prodData.variantes?.find(v => v.color === variantName);
          } else if (variantData.attribute === 'medida') {
            varianteDetallada = prodData.variantes?.find(v => v.medida === variantName);
          } else if (variantData.attribute === 'material') {
            varianteDetallada = prodData.variantes?.find(v => v.material === variantName);
          } else {
            varianteDetallada = prodData.variantes?.find(v => 
              v.id_variante === specificVariant.id_variante ||
              v.id_variante_producto === specificVariant.id_variante_producto ||
              (v.sku === specificVariant.sku && v.sku)
            );
          }

          let stockVariante = 0;
          let tieneStockVariante = false;
          
          if (varianteDetallada) {
            if (varianteDetallada.stock_disponible !== undefined) {
              stockVariante = varianteDetallada.stock_disponible;
            } 
            else if (varianteDetallada.stockPorBodega && Array.isArray(varianteDetallada.stockPorBodega)) {
              stockVariante = varianteDetallada.stockPorBodega.reduce((total, stock) => 
                total + (Number(stock.cantidad_disponible) || 0), 0
              );
            }
            else if (varianteDetallada.stock_total !== undefined) {
              stockVariante = varianteDetallada.stock_total;
            }
            
            tieneStockVariante = stockVariante > 0;
          }

          const modalidadesDisponibles = varianteDetallada?.modalidades || prodData.modalidades || [];

          const productForModal = {
            id_producto: prodData.id_producto,
            codigo: prodData.codigo,
            nombre: prodData.nombre,
            descripcion: prodData.descripcion,
            tipo: prodData.tipo,
            categoria: prodData.categoria,
            unidad_medida: prodData.unidad_medida,
            
            selectedVariant: {
              id_variante_producto: varianteDetallada?.id_variante || specificVariant.id_variante_producto,
              sku: varianteDetallada?.sku || specificVariant.sku,
              color: varianteDetallada?.color || specificVariant.color,
              medida: varianteDetallada?.medida || specificVariant.medida,
              material: varianteDetallada?.material || specificVariant.material,
              descripcion: varianteDetallada?.descripcion || specificVariant.descripcion,
              modalidades_disponibles: modalidadesDisponibles,
            },

            resumen: {
              stock_total: stockVariante,
              tiene_stock: tieneStockVariante,
            },

            modalidades_producto: modalidadesDisponibles,
            preselectedOption: variantName,
            variantAttribute: variantData.attribute,
          };

          setSelectedProduct(productForModal);
          setShowProductModal(true);
        } else {
          alert('Error al cargar los datos del producto');
        }
      } catch (error) {
        console.error('Error obteniendo producto:', error);
        alert('Error al cargar el producto. Intenta nuevamente.');
      }
    } else {
      alert('Error: No se pudo encontrar la variante seleccionada');
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

  // Crear Vale o Agregar a Vale Existente
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

      // ✅ DETECTAR SI ESTAMOS AGREGANDO A UN VALE EXISTENTE
      if (valeEnEdicion) {
        console.log('📝 Agregando productos al vale existente:', valeEnEdicion.id_pedido);

        // ✅ FILTRAR SOLO LOS PRODUCTOS NUEVOS (que NO tienen esProductoExistente)
        const productosNuevos = cart
          .filter(item => !item.esProductoExistente)
          .map((item) => ({
            id_variante_producto: item.id_variante_producto,
            id_modalidad: item.id_modalidad,
            cantidad: item.quantity,
            precio_unitario: item.price,
            observaciones: `${item.color} - ${item.modalidad}`,
          }));

        console.log('📦 Productos nuevos a agregar:', productosNuevos.length);
        console.log('📦 Productos existentes (no se envían):', cart.filter(item => item.esProductoExistente).length);

        if (productosNuevos.length === 0) {
          alert('⚠️ No hay productos nuevos para agregar al vale');
          setLoading(false);
          return;
        }

        const response = await ApiService.agregarProductosAVale(
          valeEnEdicion.id_pedido,
          productosNuevos
        );

        if (response.success) {
          // ✅ IMPRESIÓN AUTOMÁTICA DEL VALE ACTUALIZADO
          try {
            const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
            const valeParaImprimir = printService.formatValeFromPedido(response, {
              cart,
              cartTotal,
              cliente: clienteActual,
              documentType,
              vendedor: 'Vendedor'
            });

            const printResult = await printService.printVale(valeParaImprimir);

            if (printResult.success) {
              console.log('✅ Vale actualizado impreso correctamente');
            } else {
              console.warn('⚠️ Vale actualizado pero no se pudo imprimir:', printResult.error);
            }
          } catch (printError) {
            console.error('Error en impresión automática:', printError);
          }

          alert(`✅ Productos agregados al vale ${valeEnEdicion.numero_pedido || valeEnEdicion.numero_vale}`);
          setCart([]);
          setValeEnEdicion(null); // Limpiar vale en edición
          reiniciarVenta(); // Resetear todo
        } else {
          console.error('Error agregando productos al vale:', response);
          alert('Error al agregar productos al vale: ' + (response.message || 'Error desconocido'));
        }
      } else {
        // ✅ CREAR NUEVO VALE (flujo original)
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
          // Guardar carrito para reimprimir
          setLastCartItems([...cart]);

          setValeData(response.data);
          setShowValeModal(true);

          // ✅ IMPRESIÓN AUTOMÁTICA DEL VALE
          try {
            const valeParaImprimir = printService.formatValeFromPedido(response, {
              cart,
              cartTotal: cart.reduce((sum, item) => sum + item.total, 0),
              cliente: clienteActual,
              documentType,
              vendedor: 'Vendedor' // TODO: obtener nombre del vendedor logueado
            });

            const printResult = await printService.printVale(valeParaImprimir);

            if (!printResult.success) {
              console.warn('⚠️ Vale creado pero no se pudo imprimir:', printResult.error);
              // No mostrar error al usuario, el modal tiene botón de reimprimir
            }
          } catch (printError) {
            console.error('Error en impresión automática:', printError);
            // No bloquear el flujo si falla la impresión
          }

          setCart([]);
        } else {
          console.error('Error al crear vale:', response);
          alert('Error al crear el vale: ' + (response.message || 'Error desconocido'));
        }
      }
    } catch (error) {
      console.error('Error creando/actualizando vale:', error);
      alert('Error al procesar el vale. Intente nuevamente.');
    }
    setLoading(false);
  };

  // Manejar cierre del modal de vale
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
        onCancel={modoEdicion ? () => { setShowClienteModal(false); setModoEdicion(false); } : null}
        initialData={modoEdicion ? clienteActual : null}
      />

      {/* Header con Inicio, Buscador y Carrito */}
      <VendedorHeader
        cartItems={cart}
        cartTotal={cart.reduce((sum, item) => sum + item.total, 0)}
        onRemoveItem={removeFromCart}
        onCreateVale={createVale}
        documentType={documentType}
        loading={loading}
        clienteActual={clienteActual}
        onNewClient={reiniciarVenta}
        onAgregarProductosAVale={handleAgregarProductosAVale}
        onGoHome={goToCategories}
        currentLevel={currentLevel}
        searchComponent={<SearchBox onProductSelect={handleProductSelectFromSearch} />}
      />

      {/* Breadcrumb de navegación */}
      {!showClienteModal && breadcrumb.length > 0 && (
        <div className="bg-gray-50 border-b px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Navegación:</span>
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={item.action}
                  className="px-2 py-1 bg-white hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
              {currentLevel === 'types' && selectedCategory?.nombre}
              {currentLevel === 'models' && selectedType?.name}
              {currentLevel === 'options' && selectedModel?.name}
            </span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Info del cliente compacta */}
        {clienteActual && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">
                <strong>{clienteActual.nombre || 'Sin identificar'}</strong>
                {clienteActual.rut && <span className="ml-2 font-mono text-xs bg-white px-2 py-0.5 rounded border">{clienteActual.rut}</span>}
                <span className="ml-3 text-blue-600 font-medium capitalize">({documentType})</span>
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleEditarCliente} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                <Edit className="w-3 h-3" /> Editar
              </button>
              <button onClick={reiniciarVenta} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Nueva
              </button>
            </div>
          </div>
        )}

        {/* 1. CATEGORÍAS */}
        {currentLevel === 'categories' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Seleccione una Categoría
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {categories.map((category) => (
                <button
                  key={category.id_categoria}
                  onClick={() =>
                    loadTypesByCategory(category.id_categoria, category.nombre)
                  }
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
                      {type.count} modelo{type.count !== 1 ? 's' : ''} disponible
                      {type.count !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. MODELOS */}
        {currentLevel === 'models' && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                Seleccione Modelo en {selectedType?.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {models.map((model, index) => (
                <button
                  key={index}
                  onClick={() => loadVariantsByModel(model, model.name)}
                  className="bg-green-600 hover:bg-green-700 text-white text-2xl font-bold py-16 px-8 rounded-3xl shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <div className="mb-3">{model.name.toUpperCase()}</div>
                  <div className="text-base font-normal opacity-90">
                    {model.totalVariants} variante{model.totalVariants !== 1 ? 's' : ''}{' '}
                    disponible{model.totalVariants !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. VARIANTES */}
        {currentLevel === 'options' && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                Seleccione{' '}
                {currentVariantType.charAt(0).toUpperCase() +
                  currentVariantType.slice(1)}{' '}
                en {selectedModel?.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => selectVariant(option, option.name)}
                  className="bg-white hover:bg-gray-50 border-4 hover:border-purple-400 text-gray-800 p-8 rounded-3xl shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[160px] flex flex-col justify-center items-center"
                >
                  {getVariantIcon(option.name, option.attribute)}
                  <div className="text-xl font-bold mb-2 text-center">
                    {option.name.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {option.count} producto{option.count !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
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
          cartItems={lastCartItems}
        />
      )}
    </div>
  );
};

export default VendedorDashboard;