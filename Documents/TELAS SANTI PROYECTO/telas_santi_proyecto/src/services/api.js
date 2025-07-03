// services/api.js – VERSIÓN CORREGIDA CON ENDPOINTS DE PRODUCTOS ACTUALIZADOS

class ApiService {
  constructor() {
    this.baseURL = window.API_BASE_URL || 'http://localhost:5000/api';
    this.token = localStorage.getItem('token');
  }

  // Configurar headers comunes
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Método genérico para hacer requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ===========================
  // AUTH ENDPOINTS
  // ===========================
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('token', this.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.token = null;
      localStorage.removeItem('token');
    }
  }

  async verifyToken() {
    return await this.request('/auth/verify');
  }

  
  // ===========================
  // 🔧 PRODUCTOS - ENDPOINTS CORREGIDOS CON STOCK POR BODEGA
  // ===========================
  
  /**
     * Obtener catálogo de productos con estructura jerárquica
   * ✅ CORREGIDO: Calcula stock total sumando todas las bodegas
   */
  async getProductosCatalogo(filtros = {}) {
    const queryParams = new URLSearchParams(filtros).toString();
    const response = await this.request(`/productos/catalogo${queryParams ? `?${queryParams}` : ''}`);
    
    if (response.success && response.data) {
      // Transformar productos para calcular stock correctamente
      response.data = response.data.map(producto => this.transformarProductoConStock(producto));
    }
    
    return response;
  }

  /**
   * Obtener SOLO la estructura jerárquica (categorías, tipos, modelos)
   * Útil para construir filtros y plantillas
   */
  async getEstructuraCatalogo() {
    return await this.request('/productos/estructura');
  }

  /**
   * Obtener producto específico con todas sus variantes y modalidades
   */
  async getProductoDetalle(productoId) {
    const response = await this.request(`/productos/${productoId}`);
    
    if (response.success && response.data) {
      response.data = this.transformarProductoConStock(response.data);
    }
    
    return response;
  }

  /**
   * ✅ NUEVA FUNCIÓN: Transformar producto calculando stock total desde variantes
   */
  transformarProductoConStock(producto) {
    if (!producto) return producto;
  
    // Calcular stock total del producto sumando todas las variantes
    let stockTotalProducto = 0;
    let stockPorBodegaProducto = new Map();
  
    // Procesar cada variante
    const variantesTransformadas = (producto.variantes || producto.opciones || []).map(variante => {
      let stockTotalVariante = 0;
      const distribucionBodegas = [];
  
      // PRIMERO: Verificar si ya viene stock_total en la variante
      if (variante.stock_total !== undefined && variante.stock_total !== null) {
        // Si es string (como "096.00"), parsearlo
        if (typeof variante.stock_total === 'string') {
          stockTotalVariante = parseFloat(variante.stock_total) || 0;
          console.log(`📦 Stock desde API para ${variante.sku}: "${variante.stock_total}" -> ${stockTotalVariante}`);
        } else if (typeof variante.stock_total === 'number') {
          stockTotalVariante = variante.stock_total;
        }
      }
      
      // SEGUNDO: Solo si no hay stock_total o es 0, intentar calcularlo desde stockPorBodega
      if (stockTotalVariante === 0 && variante.stockPorBodega && Array.isArray(variante.stockPorBodega)) {
        console.log(`⚠️ Calculando stock desde bodegas para ${variante.sku}`);
        variante.stockPorBodega.forEach(stock => {
          const cantidadDisponible = Number(stock.cantidad_disponible) || 0;
          stockTotalVariante += cantidadDisponible;
  
          // Agregar a distribución
          distribucionBodegas.push({
            id_bodega: stock.id_bodega,
            nombre_bodega: stock.bodega?.nombre || `Bodega ${stock.id_bodega}`,
            codigo_bodega: stock.bodega?.codigo,
            es_punto_venta: stock.bodega?.es_punto_venta,
            cantidad_disponible: cantidadDisponible,
            cantidad_reservada: Number(stock.cantidad_reservada) || 0,
            porcentaje: 0 // Se calculará después
          });
  
          // Acumular para el producto total
          const bodegaKey = stock.id_bodega;
          if (!stockPorBodegaProducto.has(bodegaKey)) {
            stockPorBodegaProducto.set(bodegaKey, {
              id_bodega: stock.id_bodega,
              nombre_bodega: stock.bodega?.nombre || `Bodega ${stock.id_bodega}`,
              cantidad_total: 0
            });
          }
          stockPorBodegaProducto.get(bodegaKey).cantidad_total += cantidadDisponible;
        });
      } else if (stockTotalVariante > 0 && !variante.stockPorBodega) {
        // Si hay stock pero no hay detalle por bodega, crear una entrada genérica
        distribucionBodegas.push({
          id_bodega: 'general',
          nombre_bodega: 'Stock General',
          codigo_bodega: 'GENERAL',
          es_punto_venta: false,
          cantidad_disponible: stockTotalVariante,
          cantidad_reservada: 0,
          porcentaje: 100
        });
      }
  
      // Calcular porcentajes de distribución
      if (stockTotalVariante > 0 && distribucionBodegas.length > 0) {
        distribucionBodegas.forEach(dist => {
          dist.porcentaje = Math.round((dist.cantidad_disponible / stockTotalVariante) * 100);
        });
      }
  
      stockTotalProducto += stockTotalVariante;
  
      // Retornar variante con stock calculado
      return {
        ...variante,
        stock_total: stockTotalVariante, // IMPORTANTE: Ahora preserva el stock_total original si existe
        stock_disponible: stockTotalVariante,
        tiene_stock: stockTotalVariante > 0,
        distribucion_bodegas: distribucionBodegas,
        // Mantener compatibilidad
        por_bodega: distribucionBodegas
      };
    });
  
    // Convertir Map a Array para distribución del producto
    const distribucionProducto = Array.from(stockPorBodegaProducto.values())
      .sort((a, b) => b.cantidad_total - a.cantidad_total);
  
    // Retornar producto transformado
    return {
      ...producto,
      // ✅ NUEVO: Resumen de stock calculado
      resumen: {
        stock_total: stockTotalProducto,
        tiene_stock: stockTotalProducto > 0,
        total_bodegas: distribucionProducto.length,
        distribucion_general: distribucionProducto
      },
      // Mantener compatibilidad con nombres antiguos
      stock_total: stockTotalProducto,
      variantes: variantesTransformadas,
      opciones: variantesTransformadas
    };
  }

  /**
   * Búsqueda rápida de productos (para autocomplete)
   */
  async buscarProductosRapido(query, limite = 10) {
    const params = new URLSearchParams({ q: query, limit: limite }).toString();
    return await this.request(`/productos/buscar/rapida?${params}`);
  }

  
  // ===========================
  // 🔧 PRODUCTOS ADMIN - ENDPOINTS CORREGIDOS
  // ===========================

  /**
   * Crear producto completo con variantes y modalidades
   */
  async createProductoCompleto(productoData) {
    return await this.request('/productos-admin', {
      method: 'POST',
      body: JSON.stringify(productoData),
    });
  }

  /**
   * Actualizar información básica del producto
   */
  async updateProducto(productoId, productoData) {
    return await this.request(`/productos-admin/${productoId}`, {
      method: 'PUT',
      body: JSON.stringify(productoData),
    });
  }

  /**
   * Activar/Desactivar producto
   */
  async toggleProductoStatus(productoId, activo) {
    return await this.request(`/productos-admin/${productoId}/activar`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  }

  /**
   * Agregar nueva variante a un producto existente
   */
  async addVarianteProducto(productoId, varianteData) {
    return await this.request(`/productos-admin/${productoId}/variante`, {
      method: 'POST',
      body: JSON.stringify(varianteData),
    });
  }

  /**
   * Agregar modalidad a una variante específica
   * IMPORTANTE: Las modalidades ahora pertenecen a las variantes, no al producto
   */
  async addModalidadVariante(productoId, varianteId, modalidadData) {
    return await this.request(`/productos-admin/${productoId}/variante/${varianteId}/modalidad`, {
      method: 'POST',
      body: JSON.stringify(modalidadData),
    });
  }


  // Agregar estos métodos en tu ApiService.js en la sección de PRODUCTOS ADMIN

/**
 * Eliminar variante específica (soft delete)
 */
async deleteVariante(varianteId) {
  return await this.request(`/productos-admin/variante/${varianteId}`, {
    method: 'DELETE',
  });
}

/**
 * Eliminar modalidad específica (soft delete)
 */
async deleteModalidad(modalidadId) {
  return await this.request(`/productos-admin/modalidad/${modalidadId}`, {
    method: 'DELETE',
  });
}

/**
 * Duplicar producto completo con todas sus variantes y modalidades
 */
async duplicarProducto(productoId, datosNuevoProducto = {}) {
  return await this.request(`/productos-admin/${productoId}/duplicar`, {
    method: 'POST',
    body: JSON.stringify(datosNuevoProducto),
  });
}

// ===========================
// VENDEDOR - CLIENTES
// ===========================

/**
 * Buscar cliente por RUT para autocompletar datos
 */
async buscarClientePorRut(rut) {
  try {
    // Limpiar RUT antes de enviar
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    const response = await this.request(`/vendedor/buscar-cliente/${rutLimpio}`);
    return response;
  } catch (error) {
    console.error('Error buscando cliente:', error);
    return { success: false, data: null };
  }
}

/**
 * Validar formato de RUT chileno
 */
async validarRut(rut) {
  try {
    const response = await this.request('/vendedor/validar-rut', {
      method: 'POST',
      body: JSON.stringify({ rut })
    });
    return response;
  } catch (error) {
    console.error('Error validando RUT:', error);
    return { success: false, data: { valido: false } };
  }
}

/**
 * Crear pedido rápido con datos del cliente
 * ACTUALIZADO para incluir cliente
 */
// ===========================
// ✅ MÉTODO createPedidoRapido MEJORADO EN ApiService
// ===========================
async createPedidoRapido(pedidoData) {
  try {
    // ✅ VALIDACIÓN Y DEBUGGING COMPLETO
    console.log('🚀 =================================');
    console.log('🚀 CREANDO PEDIDO RÁPIDO');
    console.log('🚀 =================================');
    console.log('📦 Datos recibidos:', {
      tipo_documento: pedidoData.tipo_documento,
      cliente: pedidoData.cliente,
      detalles_count: pedidoData.detalles?.length || 0
    });

    // ✅ VALIDACIONES PRE-ENVÍO
    if (pedidoData.tipo_documento === 'factura') {
      console.log('📋 Validando factura...');
      
      if (!pedidoData.cliente?.rut) {
        console.error('❌ VALIDACIÓN: Factura sin RUT');
        return { 
          success: false, 
          message: 'ERROR LOCAL: RUT es obligatorio para facturas' 
        };
      }
      
      // Verificar formato del RUT (sin puntos)
      const rutFormat = /^[0-9]{7,8}-[0-9K]$/i.test(pedidoData.cliente.rut);
      console.log('🔍 Validación formato RUT:', {
        rut: pedidoData.cliente.rut,
        formatoValido: rutFormat,
        tienePuntos: pedidoData.cliente.rut.includes('.'),
        patron: '/^[0-9]{7,8}-[0-9K]$/i'
      });
      
      if (!rutFormat) {
        console.error('❌ VALIDACIÓN: Formato de RUT inválido para factura');
        return { 
          success: false, 
          message: `ERROR LOCAL: Formato de RUT inválido para factura. Recibido: "${pedidoData.cliente.rut}" - Esperado: sin puntos (ej: 12345678-9)` 
        };
      }
      
      console.log('✅ Factura válida - RUT formato correcto');
    }

    // ✅ PREPARAR PAYLOAD LIMPIO
    const payload = {
      tipo_documento: pedidoData.tipo_documento,
      cliente: pedidoData.cliente || null,
      detalles: pedidoData.detalles || []
    };

    console.log('📤 Enviando al servidor:', JSON.stringify(payload, null, 2));

    // ✅ ENVIAR REQUEST
    const response = await this.request('/vendedor/pedido-rapido', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      }
    });

    console.log('📥 Respuesta del servidor:', {
      success: response.success,
      message: response.message,
      data: response.data ? 'Presente' : 'Ausente'
    });

    // ✅ ANÁLISIS DE RESPUESTA
    if (!response.success && response.message?.includes('RUT')) {
      console.error('❌ ERROR ESPECÍFICO DE RUT:', {
        mensaje: response.message,
        rutEnviado: payload.cliente?.rut,
        tipoDocumento: payload.tipo_documento
      });
    }

    console.log('🚀 =================================');
    
    return response;
  } catch (error) {
    console.error('❌ ERROR EN createPedidoRapido:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3), // Solo primeras 3 líneas del stack
      datosOriginales: pedidoData
    });
    
    return { 
      success: false, 
      message: `Error de comunicación: ${error.message}` 
    };
  }
}

// ===========================
// ✅ MÉTODO HELPER PARA VERIFICAR RUT
// ===========================
verificarFormatoRut(rut) {
  if (!rut) return { valido: false, mensaje: 'RUT vacío' };
  
  const checks = {
    tienePuntos: rut.includes('.'),
    tieneGuion: rut.includes('-'),
    soloNumeros: /^[0-9-K]+$/i.test(rut),
    formatoCorrecto: /^[0-9]{7,8}-[0-9K]$/i.test(rut)
  };
  
  return {
    valido: checks.formatoCorrecto && !checks.tienePuntos,
    checks: checks,
    mensaje: checks.formatoCorrecto && !checks.tienePuntos 
      ? 'Formato correcto' 
      : 'Formato incorrecto - debe ser sin puntos (ej: 12345678-9)'
  };
}


  // ===========================
  // 🆕 MÉTODOS ADICIONALES PARA ADMIN DE PRODUCTOS
  // ===========================

  /**
   * Obtener productos para el panel de administración
   * Este método puede evolucionar según necesidades específicas del admin
   */
  async getProductosAdmin(filtros = {}) {
    // Por ahora usa el mismo endpoint del catálogo
    // En el futuro podría tener su propio endpoint con info adicional
    return await this.getProductosCatalogo(filtros);
  }

  /**
   * Validar si un código de producto ya existe
   */
  async validarCodigoProducto(codigo) {
    try {
      const response = await this.buscarProductosRapido(codigo, 1);
      if (response.success && response.data.length > 0) {
        return response.data.some(prod => prod.codigo === codigo);
      }
      return false;
    } catch (error) {
      console.error('Error validando código:', error);
      return false;
    }
  }

  /**
   * Generar código automático para producto
   * Útil para sugerir códigos basados en categoría y tipo
   */
  generarCodigoProducto(categoria, tipo, modelo) {
    const catPrefix = categoria.substring(0, 3).toUpperCase();
    const tipoPrefix = tipo ? tipo.substring(0, 3).toUpperCase() : 'GEN';
    const modeloPrefix = modelo.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${catPrefix}-${tipoPrefix}-${modeloPrefix}-${timestamp}`;
  }


  // ===========================
// 🔧 PRODUCTOS ADMIN - MÉTODOS FALTANTES
// ===========================

/**
 * Actualizar modalidad específica
 * IMPORTANTE: Este es el método que tu componente React está usando
 */
async updateModalidad(modalidadId, modalidadData) {
  return await this.request(`/productos-admin/modalidad/${modalidadId}`, {
    method: 'PUT',
    body: JSON.stringify(modalidadData),
  });
}

/**
 * Actualizar variante específica
 */
async updateVariante(varianteId, varianteData) {
  return await this.request(`/productos-admin/variante/${varianteId}`, {
    method: 'PUT',
    body: JSON.stringify(varianteData),
  });
}

/**
 * Eliminar producto (soft delete)
 */
async deleteProducto(productoId) {
  return await this.request(`/productos-admin/${productoId}`, {
    method: 'DELETE',
  });
}

/**
 * Obtener detalle completo de un producto con todas sus relaciones
 */
async getProductoDetalleAdmin(productoId) {
  return await this.request(`/productos/${productoId}`);
}

/**
 * Eliminar variante específica
 */
async deleteVariante(varianteId) {
  return await this.request(`/productos-admin/variante/${varianteId}`, {
    method: 'DELETE',
  });
}

/**
 * Eliminar modalidad específica
 */
async deleteModalidad(modalidadId) {
  return await this.request(`/productos-admin/modalidad/${modalidadId}`, {
    method: 'DELETE',
  });
}

/**
 * Duplicar producto completo
 */
async duplicarProducto(productoId) {
  return await this.request(`/productos-admin/${productoId}/duplicar`, {
    method: 'POST',
  });
}

/**
 * Importar productos desde archivo (CSV/Excel)
 */
async importarProductos(formData) {
  const headers = {};
  if (this.token) {
    headers.Authorization = `Bearer ${this.token}`;
  }
  
  return await this.request('/productos-admin/importar', {
    method: 'POST',
    headers: headers,
    body: formData,
  });
}

/**
 * Exportar productos a Excel
 */
async exportarProductos(filtros = {}) {
  const queryParams = new URLSearchParams(filtros).toString();
  const url = `${this.baseURL}/productos-admin/exportar${queryParams ? `?${queryParams}` : ''}`;
  
  window.open(url, '_blank');
}

/**
 * Actualizar precios masivamente
 */
async actualizarPreciosMasivo(actualizacionData) {
  return await this.request('/productos-admin/precios-masivo', {
    method: 'PUT',
    body: JSON.stringify(actualizacionData),
  });
}




  // ===========================
  // CATEGORÍAS
  // ===========================
  async getCategorias(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/categorias${queryParams ? `?${queryParams}` : ''}`);
  }

  async getCategoriaDetalle(categoriaId) {
    return await this.request(`/categorias/${categoriaId}`);
  }

  async createCategoria(categoriaData) {
    return await this.request('/categorias', {
      method: 'POST',
      body: JSON.stringify(categoriaData),
    });
  }

  async updateCategoria(categoriaId, categoriaData) {
    return await this.request(`/categorias/${categoriaId}`, {
      method: 'PUT',
      body: JSON.stringify(categoriaData),
    });
  }

  async deleteCategoria(categoriaId) {
    return await this.request(`/categorias/${categoriaId}`, {
      method: 'DELETE',
    });
  }

  // ===========================
  // BODEGAS
  // ===========================
  async getBodegas(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/bodegas${queryParams ? `?${queryParams}` : ''}`);
  }

  async getBodegaDetalle(bodegaId) {
    return await this.request(`/bodegas/${bodegaId}`);
  }

  async createBodega(bodegaData) {
    return await this.request('/bodegas', {
      method: 'POST',
      body: JSON.stringify(bodegaData),
    });
  }

  async updateBodega(bodegaId, bodegaData) {
    return await this.request(`/bodegas/${bodegaId}`, {
      method: 'PUT',
      body: JSON.stringify(bodegaData),
    });
  }

  async deleteBodega(bodegaId) {
    return await this.request(`/bodegas/${bodegaId}`, {
      method: 'DELETE',
    });
  }

  // ===========================
  // STOCK
  // ===========================
  async getStock(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/stock${queryParams ? `?${queryParams}` : ''}`);
  }

  async getStockProducto(productoId) {
    return await this.request(`/stock/producto/${productoId}`);
  }

  async getStockBodega(bodegaId) {
    return await this.request(`/stock/bodega/${bodegaId}`);
  }

  // ===========================
  // USUARIOS ADMIN
  // ===========================
  async getUsuarios() {
    return await this.request('/admin/usuarios');
  }
// Obtener lista de roles
 async getRoles() {
  try {
    const response = await this.request('/admin/roles', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
}




  async createUsuario(userData) {
    return await this.request('/admin/usuarios', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUsuario(userId, userData) {
    return await this.request(`/admin/usuarios/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async toggleUsuarioStatus(userId, activo) {
    return await this.request(`/admin/usuarios/${userId}/activar`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  }

  // ===========================
  // VENDEDOR ENDPOINTS (sin cambios)
  // ===========================
  async getVendedorProductos(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/vendedor/productos?${queryParams}`);
  }

async getProductsByCategory(categoryId) {
    try {
      console.log(`🔍 Obteniendo productos de categoría ${categoryId}...`);
      const response = await this.request(`/vendedor/productos?categoria=${categoryId}`);

      if (response.success && Array.isArray(response.data)) {
        const transformedData = response.data.map((producto) => {
          // ✅ CALCULAR STOCK TOTAL SUMANDO TODAS LAS VARIANTES
          let stockTotalCalculado = 0;
          const variantesList = producto.variantes || [];

          variantesList.forEach(variante => {
            if (typeof variante.stock_disponible === 'number') {
              stockTotalCalculado += variante.stock_disponible;
            }
          });

          const nombreProducto = producto.nombre || '';
          const resumenPrecios = producto.precios || {};

          return {
            id_producto: producto.id_producto,
            codigo: producto.codigo,
            nombre: nombreProducto,
            tipo: producto.tipo,
            categoria: producto.categoria,
            descripcion: producto.descripcion,
            unidad_medida: producto.unidad_medida || 'metros',
            precio_neto_base: Number(resumenPrecios.desde) || 0,
            precio_neto_factura_base: Number(resumenPrecios.desde) || 0,
            // ✅ RESUMEN CON STOCK CALCULADO
            resumen: {
              stock_total: stockTotalCalculado,
              tiene_stock: stockTotalCalculado > 0,
            },
            variantes: variantesList.map((variante) => {
              const modalidadesArr = variante.modalidades || [];
              return {
                id_variante_producto: variante.id_variante,
                sku: variante.sku,
                color: variante.color,
                medida: variante.medida,
                material: variante.material,
                descripcion: variante.descripcion || '',
                stock_total: variante.stock_disponible || 0,
                stock_disponible: variante.stock_disponible || 0,
                tiene_stock: (variante.stock_disponible || 0) > 0,
                modalidades: modalidadesArr.map((modalidad) => ({
                  id_modalidad: modalidad.id_modalidad,
                  nombre: modalidad.nombre,
                  descripcion: modalidad.descripcion,
                  cantidad_base: Number(modalidad.cantidad_base) || 0,
                  es_cantidad_variable: modalidad.es_variable || false,
                  minimo_cantidad: Number(modalidad.minimo) || 0,
                  precio_costo: 0,
                  precio_neto: Number(modalidad.precio_neto) || 0,
                  precio_neto_factura: Number(modalidad.precio_neto) || 0,
                  con_iva: modalidad.precio_con_iva || Math.round((modalidad.precio_neto || 0) * 1.19),
                })),
                // No tenemos distribución por bodega en esta vista simplificada
                distribucion_bodegas: []
              };
            })
          };
        });

        return { success: true, data: transformedData };
      }

      return {
        success: false,
        data: [],
        message: 'No se encontraron productos para esta categoría',
      };
    } catch (error) {
      console.error('❌ Error obteniendo productos por categoría:', error);
      return { success: false, data: [], message: error.message };
    }
  }


  // Reemplaza el método getProduct() en tu ApiService con esta versión corregida:

/**
   * ✅ MEJORADO: Obtener producto con distribución completa de stock
   */
async getProduct(productId) {
  try {
    console.log('🔍 ApiService.getProduct - Solicitando producto:', productId);
    
    // Usar el endpoint correcto del vendedor
    const response = await this.request(`/vendedor/producto/${productId}`);
    
    if (!response.success || !response.data) {
      console.error('❌ Respuesta inválida del servidor:', response);
      return { success: false, data: null, message: response.message || 'Producto no encontrado' };
    }

    console.log('📦 Respuesta original del backend:', response.data);

    const productData = response.data;
    
    // ✅ CALCULAR STOCK TOTAL DEL PRODUCTO
    let stockTotalProducto = 0;
    const distribucionGeneralBodegas = new Map();

    // Transformar cada variante con distribución de stock
    const variantesTransformadas = (productData.variantes || productData.opciones || []).map(variante => {
      let stockTotalVariante = 0;
      const distribucionBodegas = [];

      // Procesar stock por bodega si existe
      if (variante.stock_por_bodega && Array.isArray(variante.stock_por_bodega)) {
        variante.stock_por_bodega.forEach(stockBodega => {
          const cantidadDisponible = Number(stockBodega.cantidad_disponible) || 0;
          stockTotalVariante += cantidadDisponible;

          distribucionBodegas.push({
            id_bodega: stockBodega.bodega_id,
            nombre_bodega: stockBodega.bodega || stockBodega.bodega_nombre || `Bodega ${stockBodega.bodega_id}`,
            codigo_bodega: stockBodega.codigo_bodega,
            es_punto_venta: stockBodega.es_punto_venta,
            cantidad_disponible: cantidadDisponible,
            cantidad_reservada: Number(stockBodega.cantidad_reservada) || 0,
            stock_total: Number(stockBodega.stock_total) || cantidadDisponible
          });

          // Acumular para distribución general
          const bodegaKey = stockBodega.bodega || stockBodega.bodega_nombre;
          if (!distribucionGeneralBodegas.has(bodegaKey)) {
            distribucionGeneralBodegas.set(bodegaKey, {
              nombre: bodegaKey,
              cantidad: 0,
              es_punto_venta: stockBodega.es_punto_venta
            });
          }
          distribucionGeneralBodegas.get(bodegaKey).cantidad += cantidadDisponible;
        });
      } else {
        // Si no hay info por bodega, usar el stock_disponible directo
        stockTotalVariante = Number(variante.stock_disponible) || 0;
      }

      stockTotalProducto += stockTotalVariante;

      return {
        id_variante: variante.id_variante,
        id_variante_producto: variante.id_variante,
        sku: variante.sku,
        color: variante.color,
        medida: variante.medida,
        material: variante.material,
        descripcion: variante.descripcion || '',
        stock_disponible: stockTotalVariante,
        stock_total: stockTotalVariante,
        tiene_stock: stockTotalVariante > 0,
        distribucion_bodegas: distribucionBodegas,
        modalidades: (variante.modalidades || []).map(modalidad => ({
          id_modalidad: modalidad.id_modalidad,
          nombre: modalidad.nombre,
          descripcion: modalidad.descripcion,
          cantidad_base: modalidad.cantidad_base,
          es_cantidad_variable: modalidad.es_cantidad_variable,
          minimo_cantidad: modalidad.minimo_cantidad,
          precios: {
            costo: modalidad.precios?.costo || 0,
            neto: modalidad.precios?.neto || 0,
            factura: modalidad.precios?.factura || modalidad.precios?.neto || 0,
            con_iva: modalidad.precios?.con_iva || Math.round((modalidad.precios?.factura || modalidad.precios?.neto || 0) * 1.19)
          }
        }))
      };
    });

    // ✅ TRANSFORMAR RESPUESTA COMPLETA
    const transformedProduct = {
      id_producto: productData.id_producto,
      codigo: productData.codigo,
      nombre: productData.nombre || productData.modelo,
      descripcion: productData.descripcion || '',
      tipo: productData.tipo,
      categoria: productData.categoria,
      unidad_medida: productData.unidad_medida || 'metros',
      
      // ✅ VARIANTES TRANSFORMADAS
      variantes: variantesTransformadas,
      opciones: variantesTransformadas, // Alias para compatibilidad
      
      // ✅ RESUMEN DE STOCK CALCULADO
      resumen: {
        stock_total: stockTotalProducto,
        tiene_stock: stockTotalProducto > 0,
        total_opciones: variantesTransformadas.length,
        distribucion_general: Array.from(distribucionGeneralBodegas.values())
          .sort((a, b) => b.cantidad - a.cantidad)
      },
      
      // ✅ RESUMEN DE PRECIOS
      resumen_precios: productData.resumen_precios || {
        precio_minimo: 0,
        precio_maximo: 0,
        rango_precios: '$0'
      },
      
      // ✅ MODALIDADES DEL PRODUCTO
      modalidades_producto: productData.modalidades || []
    };

    console.log('✅ Producto transformado con distribución de stock:', {
      id: transformedProduct.id_producto,
      stock_total: transformedProduct.resumen.stock_total,
      distribucion: transformedProduct.resumen.distribucion_general
    });

    return { 
      success: true, 
      data: transformedProduct 
    };
    
  } catch (error) {
    console.error('❌ Error en ApiService.getProduct:', error);
    return { 
      success: false, 
      data: null, 
      message: error.message || 'Error al obtener producto' 
    };
  }
}

/**
   * ✅ NUEVO: Obtener distribución de stock detallada
   */
async getStockDistribucion(varianteId) {
  try {
    const response = await this.request(`/stock/variante/${varianteId}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          variante: response.data.variante,
          distribucion: response.data.stock_por_bodega || [],
          resumen: response.data.resumen
        }
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error obteniendo distribución de stock:', error);
    return { success: false, data: null };
  }
}



  async getProductStock(productId) {
    try {
      const response = await this.request(`/vendedor/stock/${productId}`);
      if (response.success && response.data) {
        const stockData = response.data;
        const resumen = stockData.resumen || {};
        const porVariante = stockData.por_variante || [];

        const transformedData = {
          resumen: {
            stock_total: Number(resumen.stock_total) || 0,
            tiene_stock: resumen.tiene_stock || false,
          },
          por_variante: porVariante.map((variante) => ({
            id_variante_producto: variante.id_modalidad || variante.id_variante_producto,
            sku: variante.sku,
            descripcion: variante.descripcion,
            stock_total: variante.stock_total,
            por_bodega: variante.por_bodega || [],
          })),
        };

        return { success: true, data: transformedData };
      }

      return {
        success: false,
        data: {
          resumen: { stock_total: 0, tiene_stock: false },
          por_variante: [],
        },
      };
    } catch (error) {
      console.error('❌ Error obteniendo stock de producto:', error);
      return {
        success: false,
        data: {
          resumen: { stock_total: 0, tiene_stock: false },
          por_variante: [],
        },
      };
    }
  }

  async searchProductos(query, filters = {}) {
    const allFilters = { q: query, ...filters };
    const queryParams = new URLSearchParams(allFilters).toString();
    return await this.request(`/vendedor/buscar?${queryParams}`);
  }

  async getVendedorCategorias() {
    return await this.request('/vendedor/categorias');
  }

  // ===========================
// 🔍 MÉTODO createPedidoRapido CON DEBUGGING EXTREMO
// ===========================
async createPedidoRapido(pedidoData) {
  try {
    console.log('🚀 =================================');
    console.log('🚀 ApiService.createPedidoRapido INICIADO');
    console.log('🚀 =================================');
    
    // ✅ DEBUGGING EXTREMO DE ENTRADA
    console.log('📥 DATOS RECIBIDOS EN ApiService:');
    console.log('📥 pedidoData completo:', pedidoData);
    console.log('📥 pedidoData.cliente:', pedidoData.cliente);
    console.log('📥 pedidoData.cliente?.rut:', pedidoData.cliente?.rut);
    console.log('📥 pedidoData.tipo_documento:', pedidoData.tipo_documento);
    console.log('📥 pedidoData.detalles.length:', pedidoData.detalles?.length);

    // ✅ VERIFICAR SI EL CLIENTE TIENE RUT
    if (pedidoData.cliente) {
      console.log('👤 ANÁLISIS DEL OBJETO CLIENTE:');
      console.log('👤 Object.keys(cliente):', Object.keys(pedidoData.cliente));
      console.log('👤 cliente.nombre:', pedidoData.cliente.nombre);
      console.log('👤 cliente.rut:', pedidoData.cliente.rut);
      console.log('👤 cliente.rut tipo:', typeof pedidoData.cliente.rut);
      console.log('👤 cliente.rut length:', pedidoData.cliente.rut?.length);
      console.log('👤 cliente.rut es null:', pedidoData.cliente.rut === null);
      console.log('👤 cliente.rut es undefined:', pedidoData.cliente.rut === undefined);
      console.log('👤 cliente.rut es falsy:', !pedidoData.cliente.rut);
    } else {
      console.error('❌ NO HAY OBJETO CLIENTE EN pedidoData');
    }

    // ✅ VALIDACIONES PRE-ENVÍO CON LOGGING DETALLADO
    if (pedidoData.tipo_documento === 'factura') {
      console.log('📋 VALIDANDO FACTURA...');
      
      if (!pedidoData.cliente) {
        console.error('❌ FALLA: Factura sin objeto cliente');
        return { 
          success: false, 
          message: 'ERROR ApiService: Factura sin datos de cliente' 
        };
      }
      
      if (!pedidoData.cliente.rut) {
        console.error('❌ FALLA: Factura sin RUT en objeto cliente');
        console.error('❌ cliente completo:', pedidoData.cliente);
        return { 
          success: false, 
          message: `ERROR ApiService: RUT faltante en factura. Cliente recibido: ${JSON.stringify(pedidoData.cliente)}` 
        };
      }
      
      // Verificar formato del RUT (sin puntos)
      const rutFormat = /^[0-9]{7,8}-[0-9K]$/i.test(pedidoData.cliente.rut);
      console.log('🔍 VALIDACIÓN FORMATO RUT:');
      console.log('🔍 RUT a validar:', pedidoData.cliente.rut);
      console.log('🔍 Formato válido:', rutFormat);
      console.log('🔍 Tiene puntos:', pedidoData.cliente.rut.includes('.'));
      console.log('🔍 Patrón usado:', '/^[0-9]{7,8}-[0-9K]$/i');
      
      if (!rutFormat) {
        console.error('❌ FALLA: Formato de RUT inválido para factura');
        return { 
          success: false, 
          message: `ERROR ApiService: RUT con formato inválido: "${pedidoData.cliente.rut}". Debe ser sin puntos (ej: 12345678-9)` 
        };
      }
      
      console.log('✅ Factura válida - RUT formato correcto');
    }

    // ✅ PREPARAR PAYLOAD CON VERIFICACIÓN
    const payload = {
      tipo_documento: pedidoData.tipo_documento,
      cliente: pedidoData.cliente || null,
      detalles: pedidoData.detalles || []
    };

    console.log('📤 PAYLOAD FINAL PARA ENVIAR:');
    console.log('📤 JSON.stringify(payload):', JSON.stringify(payload, null, 2));
    
    // ✅ VERIFICACIÓN FINAL DEL PAYLOAD
    if (payload.tipo_documento === 'factura' && !payload.cliente?.rut) {
      console.error('❌ FALLA CRÍTICA: Payload final sin RUT para factura');
      return {
        success: false,
        message: `ERROR CRÍTICO: RUT se perdió en payload final. Payload: ${JSON.stringify(payload.cliente)}`
      };
    }

    console.log('🌐 ENVIANDO REQUEST AL SERVIDOR...');
    console.log('🌐 URL:', `${this.baseURL}/vendedor/pedido-rapido`);
    console.log('🌐 Headers:', this.getHeaders());

    // ✅ ENVIAR REQUEST CON LOGGING
    const response = await this.request('/vendedor/pedido-rapido', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      }
    });

    console.log('📥 RESPUESTA DEL SERVIDOR:');
    console.log('📥 response.success:', response.success);
    console.log('📥 response.message:', response.message);
    console.log('📥 response.data:', response.data ? 'Presente' : 'Ausente');
    console.log('📥 response completa:', response);

    // ✅ ANÁLISIS DE RESPUESTA DE ERROR
    if (!response.success && response.message?.includes('RUT')) {
      console.error('❌ ERROR ESPECÍFICO DE RUT DEL SERVIDOR:');
      console.error('❌ Mensaje del servidor:', response.message);
      console.error('❌ RUT que enviamos:', payload.cliente?.rut);
      console.error('❌ Payload completo enviado:', JSON.stringify(payload, null, 2));
    }

    console.log('🚀 =================================');
    console.log('🚀 ApiService.createPedidoRapido TERMINADO');
    console.log('🚀 =================================');
    
    return response;
  } catch (error) {
    console.error('❌ EXCEPCIÓN EN ApiService.createPedidoRapido:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Datos originales:', pedidoData);
    
    return { 
      success: false, 
      message: `Error de comunicación en ApiService: ${error.message}` 
    };
  }
}

  async getEstadisticasDia(fecha = null) {
    const queryParams = fecha ? `?fecha=${fecha}` : '';
    return await this.request(`/vendedor/estadisticas-dia${queryParams}`);
  }

  async getValesDelDia(fecha) {
    const endpoint = `/vendedor/mis-vales?fecha=${encodeURIComponent(fecha)}`;
    return await this.request(endpoint, { method: 'GET' });
  }

  // ===========================
  // CAJERO ENDPOINTS
  // ===========================
  async getValeDetalles(numeroVale) {
    try {
      const response = await this.request(`/cajero/vale/${numeroVale}/detalles`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo detalles del vale:', error);
      return { success: false, message: error.message };
    }
  }

  async getValeBasico(numeroVale) {
    try {
      const response = await this.request(`/cajero/vale/${numeroVale}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo info básica del vale:', error);
      return { success: false, message: error.message };
    }
  }

  

async procesarVale(numeroVale, datosVenta) {
  try {
    console.log('📨 Procesando vale:', numeroVale);
    console.log('📋 Datos de venta:', datosVenta);
    
    // Validar que tenemos los datos mínimos requeridos
    if (!datosVenta.tipo_documento) {
      throw new Error('tipo_documento es requerido');
    }
    if (!datosVenta.metodo_pago) {
      throw new Error('metodo_pago es requerido');
    }
    if (datosVenta.monto_pagado === undefined || datosVenta.monto_pagado === null) {
      throw new Error('monto_pagado es requerido');
    }
    
    const response = await this.request('/cajero/procesar-vale/' + numeroVale, {
      method: 'POST',
      body: JSON.stringify(datosVenta)  // ✅ CAMBIO: usar 'body' en lugar de 'data'
    });
    
    console.log('✅ Respuesta del servidor:', response);
    return response;
  } catch (error) {
    console.error('❌ Error procesando vale:', error);
    
    // Intentar extraer más información del error
    if (error.response) {
      console.error('Detalles del error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Si el backend envía detalles específicos
      if (error.response.data?.errors) {
        console.error('Errores de validación:', error.response.data.errors);
      }
    }
    
    throw error;
  }
}

  async anularVale(numeroVale, motivo) {
    try {
      const response = await this.request(`/cajero/anular-vale/${numeroVale}`, {
        method: 'POST',
        body: JSON.stringify({ motivo_anulacion: motivo }),
      });
      return response;
    } catch (error) {
      console.error('❌ Error anulando vale:', error);
      return { success: false, message: error.message };
    }
  }

  async actualizarPreciosVale(numeroVale, actualizaciones) {
  try {
    console.log('📝 Actualizando precios del vale:', numeroVale);
    console.log('📋 Actualizaciones:', actualizaciones);
    
    // Validar que tenemos actualizaciones
    if (!actualizaciones || !actualizaciones.actualizaciones || !Array.isArray(actualizaciones.actualizaciones)) {
      throw new Error('Se requiere un array de actualizaciones');
    }
    
    // Validar cada actualización
    actualizaciones.actualizaciones.forEach((update, idx) => {
      if (update.index === undefined || update.index === null) {
        throw new Error(`Actualización ${idx}: falta el índice del producto`);
      }
      if (update.precio === undefined || update.precio === null || update.precio <= 0) {
        throw new Error(`Actualización ${idx}: precio inválido`);
      }
    });
    
    const response = await this.request(`/cajero/vale/${numeroVale}/actualizar-precios`, {
      method: 'PUT',
      body: JSON.stringify(actualizaciones)
    });
    
    console.log('✅ Precios actualizados:', response);
    return response;
  } catch (error) {
    console.error('❌ Error actualizando precios del vale:', error);
    return { 
      success: false, 
      message: error.message || 'Error al actualizar precios' 
    };
  }
}



  async abrirTurno(turnoData) {
    try {
      const response = await this.request('/cajero/abrir-turno', {
        method: 'POST',
        body: JSON.stringify(turnoData),
      });
      return response;
    } catch (error) {
      console.error('❌ Error abriendo turno:', error);
      return { success: false, message: error.message };
    }
  }

  async cerrarTurno(cierreData) {
    try {
      const response = await this.request('/cajero/cerrar-turno', {
        method: 'POST',
        body: JSON.stringify(cierreData),
      });
      return response;
    } catch (error) {
      console.error('❌ Error cerrando turno:', error);
      return { success: false, message: error.message };
    }
  }

  async arqueoIntermedio(arqueoData) {
    try {
      const response = await this.request('/cajero/arqueo-intermedio', {
        method: 'POST',
        body: JSON.stringify(arqueoData),
      });
      return response;
    } catch (error) {
      console.error('❌ Error en arqueo intermedio:', error);
      return { success: false, message: error.message };
    }
  }

  async getEstadoTurno() {
    try {
      const response = await this.request('/cajero/estado-turno');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estado del turno:', error);
      return { success: false, message: error.message };
    }
  }

  async getEstadisticasCajero(fecha = null) {
    try {
      const queryParams = fecha ? `?fecha=${fecha}` : '';
      const response = await this.request(`/cajero/estadisticas${queryParams}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del cajero:', error);
      return { success: false, message: error.message };
    }
  }

  async getHistorialArqueos() {
    try {
      const response = await this.request('/cajero/historial-arqueos');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo historial de arqueos:', error);
      return { success: false, message: error.message };
    }
  }

  async getUltimoArqueo() {
    try {
      const response = await this.request('/cajero/ultimo-arqueo');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo último arqueo:', error);
      return { success: false, message: error.message };
    }
  }

  async buscarValeInteligente(numeroCliente) {
    try {
      const resultado = await this.getValeDetalles(numeroCliente);
      
      if (resultado.success) {
        return {
          success: true,
          data: resultado.data,
          tipo_busqueda: 'detalles_directos',
          mensaje: 'Vale encontrado'
        };
      }

      const resultadoBasico = await this.getValeBasico(numeroCliente);
      
      return {
        success: resultadoBasico.success,
        data: resultadoBasico.data,
        tipo_busqueda: 'basico',
        mensaje: resultadoBasico.message || 'Vale no encontrado'
      };

    } catch (error) {
      console.error('❌ Error en búsqueda inteligente:', error);
      return {
        success: false,
        mensaje: 'Error al buscar el vale. Intente nuevamente.'
      };
    }
  }

  validarNumeroVale(input) {
    if (!input || typeof input !== 'string') {
      return { valido: false, mensaje: 'Ingrese un número de vale' };
    }

    const inputLimpio = input.trim().toUpperCase();
    const numeroSimple = inputLimpio.replace(/[#\s]/g, '');
    
    if (/^\d{1,4}$/.test(numeroSimple)) {
      const numero = parseInt(numeroSimple);
      if (numero >= 1 && numero <= 9999) {
        return {
          valido: true,
          tipo: 'simple',
          valor: numero,
          mensaje: `Buscando vale #${String(numero).padStart(3, '0')}`
        };
      }
    }

    if (/^VP\d{8}-\d{4}$/.test(inputLimpio)) {
      return {
        valido: true,
        tipo: 'completo',
        valor: inputLimpio,
        mensaje: `Buscando vale ${inputLimpio}`
      };
    }

    return {
      valido: false,
      mensaje: 'Formato inválido. Use: 87 o VP20250602-0087'
    };
  }

  formatearNumeroVale(numero, tipo = 'simple') {
    if (tipo === 'simple') {
      return `#${String(numero).padStart(3, '0')}`;
    }
    return numero;
  }

  // Legacy - mantener compatibilidad
  async buscarVale(criterios) {
    const numero = criterios.numero_cliente || criterios.numero_completo;
    return await this.buscarValeInteligente(numero);
  }

  async getValesPendientesHistoricos(diasAtras = 7, limite = 50) {
    try {
      const estadisticas = await this.getEstadisticasCajero();
      return {
        success: true,
        data: {
          resumen: estadisticas.data?.pendientes_historicos || {
            total: 0,
            monto_total: 0,
            dias_con_pendientes: 0
          }
        }
      };
    } catch (error) {
      return { success: false, data: { resumen: { total: 0, monto_total: 0, dias_con_pendientes: 0 } } };
    }
  }
// ===========================
// 🔧 STOCK MANAGEMENT - Funciones para gestión avanzada de stock
// ===========================

/**
 * Actualizar stock de una variante específica
 */
/**
 * @param {number} varianteId
 * @param {number} nuevoStock
 * @param {string|null} [motivo]     // 👈 aquí declaramos que acepta string ó null
 * @param {number|null} [bodegaId]
 * @returns {Promise<{success:boolean,message?:string,data?:any}>}
 */
async updateVarianteStock(varianteId, nuevoStock, motivo = null, bodegaId = null) {
  return await this.request(`/stock/variante/${varianteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ 
      stock: nuevoStock,
      motivo: motivo,
      id_bodega: bodegaId
    }),
  });
}

/**
 * Actualización masiva de stock para múltiples variantes
 */
async updateMassiveStock(variantes, operation, amount, reason = null, bodegaId = null) {
  return await this.request('/stock/masivo', {
    method: 'PATCH',
    body: JSON.stringify({
      variantes,        // Array de IDs de variantes
      operation,        // 'set', 'add', 'subtract'
      amount,          // Cantidad
      reason,          // Motivo opcional
      id_bodega: bodegaId
    }),
  });
}

/**
 * Obtener historial de movimientos de stock para una variante
 */
async getStockMovements(varianteId, limit = 50, offset = 0) {
  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() }).toString();
  return await this.request(`/stock/movimientos/${varianteId}?${params}`);
}

/**
 * Obtener alertas de stock (productos bajo mínimo o sin stock)
 */
async getStockAlerts() {
  return await this.request('/stock/alertas');
}

// ===========================
// 🏪 STOCK POR BODEGA - Funcionalidades avanzadas
// ===========================

/**
 * Transferir stock entre bodegas
 */
async transferirStock(data) {
  return await this.request('/stock-bodega/transferir', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Reposición automática de stock
 */
async reposicionAutomatica(bodegaId = null, forzarTodas = false) {
  return await this.request('/stock-bodega/reposicion-auto', {
    method: 'POST',
    body: JSON.stringify({ 
      id_bodega_destino: bodegaId, 
      forzar_todas: forzarTodas 
    }),
  });
}

/**
 * Obtener alertas de stock agrupadas por bodega
 */
async getAlertasPorBodega(bodegaId = null, soloPuntoVenta = false) {
  const params = new URLSearchParams();
  if (bodegaId) params.append('id_bodega', bodegaId);
  if (soloPuntoVenta) params.append('solo_punto_venta', 'true');
  
  return await this.request(`/stock-bodega/alertas-por-bodega?${params}`);
}

/**
 * Obtener dashboard específico de una bodega
 */
async getDashboardBodega(bodegaId) {
  return await this.request(`/stock-bodega/dashboard/${bodegaId}`);
}

/**
 * Consultar disponibilidad de una variante en todas las bodegas
 */
async getDisponibilidadVariante(varianteId, incluirInactivas = false) {
  const params = new URLSearchParams({
    para_venta: 'false',
    incluir_inactivas: incluirInactivas ? 'true' : 'false'
  }).toString();

  return await this.request(`/stock-unified/disponibilidad/${varianteId}?${params}`);
}



  // ===========================
  // DEBUG ENDPOINTS
  // ===========================
  async debugLogin(credentials) {
    return await this.request('/debug/login-test', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async debugFixUser() {
    return await this.request('/debug/fix-user', {
      method: 'POST',
    });
  }

  async debugGetAllUsers() {
    return await this.request('/debug/all-users');
  }

  // ===========================
  // HEALTH CHECK
  // ===========================
  async healthCheck() {
    return await this.request('/test');
  }

  // ===========================
  // MÉTODOS HELPERS
  // ===========================
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // ===========================
  // FORMATTERS ÚTILES
  // ===========================
  formatPrice(price) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price || 0);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(date) {
    return new Date(date).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}




// Crear instancia única
const apiService = new ApiService();
export default apiService;