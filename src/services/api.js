// services/api.js – VERSIÓN CORREGIDA CON ENDPOINTS DE PRODUCTOS ACTUALIZADOS

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}), // ✅ Hacer merge de headers en lugar de sobrescribir
      },
    };

    try {
      const response = await fetch(url, config);

      // ✅ MANEJO ESPECIAL DE 401 - SESIÓN EXPIRADA
      if (response.status === 401) {
        console.warn('⚠️ Sesión expirada - Token inválido o expirado');

        // Limpiar token y datos de usuario
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Disparar evento personalizado para que los componentes puedan reaccionar
        window.dispatchEvent(new CustomEvent('session-expired', {
          detail: { message: 'Su sesión ha expirado. Por favor inicie sesión nuevamente.' }
        }));

        throw new Error('Sesión expirada. Redirigiendo al login...');
      }

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
  // 🔧 PRODUCTOS - ENDPOINTS CORREGIDOS
  // ===========================
  
  /**
   * Obtener catálogo de productos con estructura jerárquica
   * Incluye filtros, paginación y toda la información de productos
   */
  async getProductosCatalogo(filtros = {}) {
    const queryParams = new URLSearchParams(filtros).toString();
    return await this.request(`/productos/catalogo${queryParams ? `?${queryParams}` : ''}`);
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
    return await this.request(`/productos/${productoId}`);
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
  console.log('📤 API - Enviando actualización de modalidad:', {
    modalidadId,
    modalidadData,
    json: JSON.stringify(modalidadData)
  });

  const response = await this.request(`/productos-admin/modalidad/${modalidadId}`, {
    method: 'PUT',
    body: JSON.stringify(modalidadData),
  });

  console.log('📥 API - Respuesta del servidor:', response);
  return response;
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
  const url = `${this.baseURL}/productos-admin/importar`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        // NO incluir Content-Type - el browser lo establece automáticamente con el boundary
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error importando productos:', error);
    throw error;
  }
}

/**
 * Exportar productos a Excel
 */
async exportarProductos(filtros = {}) {
  const queryParams = new URLSearchParams(filtros).toString();
  const url = `${this.baseURL}/productos-admin/exportar${queryParams ? `?${queryParams}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    // Descargar el archivo
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    // Obtener nombre del archivo del header o usar default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'productos.xlsx';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true };
  } catch (error) {
    console.error('Error exportando productos:', error);
    throw error;
  }
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

  async getStockVariante(varianteId) {
    return await this.request(`/stock/variante/${varianteId}`);
  }

  // Entrada de stock (compras, devoluciones)
  async registrarEntradaStock(data) {
    return await this.request('/stock/entrada', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Salida de stock (mermas, ajustes negativos)
  async registrarSalidaStock(data) {
    return await this.request('/stock/salida', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Ajuste de inventario (toma de stock)
  async registrarAjusteStock(data) {
    return await this.request('/stock/ajuste', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transferencia entre bodegas
  async transferirStock(data) {
    return await this.request('/stock/transferencia', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Historial de movimientos
  async getMovimientosStock(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/stock/movimientos${queryParams ? `?${queryParams}` : ''}`);
  }

  // Productos bajo stock mínimo
  async getStockBajoMinimo(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/stock/bajo-minimo${queryParams ? `?${queryParams}` : ''}`);
  }

  // Entrada masiva de stock (para recepciones de contenedores)
  async registrarEntradaMasivaStock(data) {
    return await this.request('/stock/entrada-masiva', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Importar stock desde Excel
  async importarStockExcel(formData) {
    const url = `${this.baseURL}/stock/importar-excel`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error importando stock desde Excel:', error);
      throw error;
    }
  }

  // ===========================
  // USUARIOS ADMIN
  // ===========================
  async getUsuarios(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.activo !== undefined) queryParams.append('activo', params.activo);
    const queryString = queryParams.toString();
    return await this.request(`/admin/usuarios${queryString ? `?${queryString}` : ''}`);
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

  // ===========================
  // CLIENTES ADMIN
  // ===========================

  /**
   * Obtener lista de clientes con estadísticas y paginación
   * @param {Object} params - Parámetros de paginación y filtrado
   * @param {number} params.page - Número de página (default: 1)
   * @param {number} params.limit - Registros por página (default: 20)
   * @param {string} params.search - Término de búsqueda
   * @param {boolean} params.activo - Filtrar por estado activo/inactivo
   */
  async getClientesAdmin(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.activo !== undefined) queryParams.append('activo', params.activo);
    const queryString = queryParams.toString();
    return await this.request(`/admin/clientes${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Obtener detalle de un cliente
   */
  async getClienteDetalleAdmin(clienteId) {
    return await this.request(`/admin/clientes/${clienteId}`);
  }

  /**
   * Crear nuevo cliente
   */
  async createClienteAdmin(clienteData) {
    return await this.request('/admin/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  }

  /**
   * Actualizar cliente existente
   */
  async updateClienteAdmin(clienteId, clienteData) {
    return await this.request(`/admin/clientes/${clienteId}`, {
      method: 'PUT',
      body: JSON.stringify(clienteData),
    });
  }

  /**
   * Activar/Desactivar cliente
   */
  async toggleClienteAdmin(clienteId, activo) {
    return await this.request(`/admin/clientes/${clienteId}/activar`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  }

  /**
   * Importar clientes masivamente
   * @param {Array} clientes - Array de objetos cliente
   * @param {string} modo - 'solo_crear' | 'solo_actualizar' | 'crear_actualizar'
   */
  async importarClientesAdmin(clientes, modo = 'crear_actualizar') {
    return await this.request('/admin/clientes/importar', {
      method: 'POST',
      body: JSON.stringify({ clientes, modo }),
    });
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
          const nombreProducto = producto.modelo || producto.nombre || '';
          const resumenPrecios = producto.resumen_precios || {};
          const estadisticas = producto.estadisticas || {};
          const variantesList = producto.opciones || producto.variantes || [];

          return {
            id_producto: producto.id_producto,
            codigo: producto.codigo,
            nombre: nombreProducto,
            tipo: producto.tipo,
            categoria: producto.categoria,
            descripcion: producto.descripcion,
            unidad_medida: producto.unidad_medida || '',
            precio_neto_base: Number(resumenPrecios.precio_minimo) || 0,
            precio_neto_factura_base: Number(resumenPrecios.precio_minimo) || 0,
            variantes: variantesList.map((opcion) => {
              const modalidadesArr = opcion.modalidades || [];
              return {
                id_variante_producto: opcion.id_variante || opcion.id_variante_producto,
                sku: opcion.sku,
                color: opcion.color,
                medida: opcion.medida,
                material: opcion.material,
                descripcion: opcion.descripcion_opcion || opcion.descripcion,
                stock_total: opcion.stock_total,
                tiene_stock: opcion.tiene_stock,
                modalidades: modalidadesArr.map((modalidad) => ({
                  id_modalidad: modalidad.id_modalidad,
                  nombre: modalidad.nombre,
                  descripcion: modalidad.descripcion,
                  cantidad_base: Number(modalidad.cantidad_base) || 0,
                  es_cantidad_variable: modalidad.es_cantidad_variable || false,
                  minimo_cantidad: Number(modalidad.minimo_cantidad) || 0,
                  precio_costo: Number(modalidad.precios?.costo || modalidad.precio_costo) || 0,
                  precio_neto: Number(modalidad.precios?.neto || modalidad.precio_neto) || 0,
                  precio_neto_factura: Number(modalidad.precios?.factura || modalidad.precio_neto_factura) || 0,
                  con_iva: modalidad.precios?.con_iva ?? modalidad.precio_con_iva ?? null,
                })),
                stockPorBodega: opcion.por_bodega || [],
              };
            }),
            resumen: {
              stock_total: Number(estadisticas.stock_total) || 0,
              tiene_stock: estadisticas.tiene_stock || false,
            },
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

  /**
   * Obtener producto con sus variantes y modalidades
   * @param {number} productId - ID del producto
   * @param {string} clienteRut - RUT del cliente para obtener precios especiales (opcional)
   */
  async getProduct(productId, clienteRut = null) {
    try {
      let url = `/vendedor/producto/${productId}`;
      if (clienteRut) {
        url += `?cliente_rut=${encodeURIComponent(clienteRut)}`;
      }
      const response = await this.request(url);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo producto individual:', error);
      return { success: false, data: null, message: error.message };
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
  // AGREGAR PRODUCTOS A VALE EXISTENTE
  // ===========================

  // Obtener detalles completos de un pedido/vale para edición
  async getDetallesValeVendedor(idPedido) {
    try {
      console.log('🔍 Obteniendo detalles del pedido:', idPedido);

      const response = await this.request(`/vendedor/pedidos/${idPedido}/detalles`, {
        method: 'GET'
      });

      console.log('✅ Detalles del pedido obtenidos:', response);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo detalles del pedido:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener detalles del pedido'
      };
    }
  }

  async agregarProductosAVale(idPedido, productos) {
    try {
      console.log('📝 Agregando productos al vale:', idPedido);
      console.log('📦 Productos a agregar:', productos);

      // ✅ Usar el mismo formato de headers que createPedidoRapido para mantener consistencia
      const response = await this.request(`/vendedor/pedidos/${idPedido}/productos`, {
        method: 'PUT',
        body: JSON.stringify({ productos }),
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` })
        },
      });

      console.log('✅ Respuesta del servidor:', response);
      return response;
    } catch (error) {
      console.error('❌ Error agregando productos al vale:', error);
      return {
        success: false,
        message: error.message || 'Error al agregar productos al vale'
      };
    }
  }

  // ===========================
  // VENDEDOR - SISTEMA DE BLOQUEO (PIN)
  // ===========================

  /**
   * Verificar si el usuario tiene PIN configurado
   */
  async verificarTienePin() {
    try {
      const response = await this.request('/vendedor/tiene-pin');
      return response;
    } catch (error) {
      console.error('Error verificando PIN:', error);
      return { success: false, data: { tiene_pin: false } };
    }
  }

  /**
   * Validar PIN para desbloquear pantalla
   * @param {string} pin - PIN de 4 digitos
   */
  async validarPin(pin) {
    try {
      const response = await this.request('/vendedor/validar-pin', {
        method: 'POST',
        body: JSON.stringify({ pin })
      });
      return response;
    } catch (error) {
      console.error('Error validando PIN:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Configurar PIN de un usuario (solo admin)
   * @param {number} userId - ID del usuario
   * @param {string} pin - PIN de 4 digitos (null para eliminar)
   */
  async configurarPinUsuario(userId, pin) {
    try {
      const response = await this.request(`/admin/usuarios/${userId}/pin`, {
        method: 'PUT',
        body: JSON.stringify({ pin })
      });
      return response;
    } catch (error) {
      console.error('Error configurando PIN:', error);
      return { success: false, message: error.message };
    }
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

  // =============================================
  // RETIROS DE CAJA
  // =============================================

  async retiroCaja(monto, motivo = '') {
    try {
      const response = await this.request('/cajero/retiro-caja', {
        method: 'POST',
        body: JSON.stringify({ monto, motivo }),
      });
      return response;
    } catch (error) {
      console.error('❌ Error en retiro de caja:', error);
      return { success: false, message: error.message };
    }
  }

  async getRetirosTurno() {
    try {
      const response = await this.request('/cajero/retiros');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo retiros:', error);
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
  // GUARDAR CLIENTE (desde modal de facturación)
  // ===========================
  async guardarCliente(datosCliente) {
    try {
      console.log('💾 Guardando cliente en BD:', datosCliente);

      const response = await this.request('/cajero/guardar-cliente', {
        method: 'POST',
        body: JSON.stringify(datosCliente),
      });

      console.log('✅ Cliente guardado:', response);
      return response;
    } catch (error) {
      console.error('❌ Error guardando cliente:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener todos los clientes con sus estadísticas
   */
  async getAllClientes() {
    try {
      const response = await this.request('/cajero/clientes');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      return { success: false, message: error.message, data: [] };
    }
  }

  /**
   * Obtener vales de un cliente específico
   * @param {string} rutCliente - RUT del cliente (sin formato)
   */
  async getValesCliente(rutCliente) {
    try {
      const rutLimpio = rutCliente.replace(/\./g, '').replace(/-/g, '');
      const response = await this.request(`/cajero/clientes/${rutLimpio}/vales`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo vales del cliente:', error);
      return { success: false, message: error.message, data: [] };
    }
  }

  // ===========================
  // REPORTES CAJERO - NUEVOS ENDPOINTS
  // ===========================

  /**
   * Obtener historial de vales cobrados (completados) con filtros
   * @param {string} fechaInicio - Fecha de inicio (opcional, por defecto hoy)
   * @param {string} fechaFin - Fecha de fin (opcional, por defecto hoy)
   * @param {number} limite - Cantidad máxima de resultados (default: 50)
   */
  async getValesCobrados(fechaInicio = null, fechaFin = null, limite = 50) {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      if (limite) params.append('limite', limite.toString());

      const queryString = params.toString();
      const response = await this.request(`/cajero/reportes/vales-cobrados${queryString ? `?${queryString}` : ''}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo vales cobrados:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener vales pendientes de cobro con información del cliente
   * @param {Object} filtros - Objeto con los filtros a aplicar
   * @param {number} filtros.diasAtras - Cantidad de días hacia atrás (default: 30)
   * @param {boolean} filtros.soloConCliente - Filtrar solo vales con cliente (default: false)
   * @param {string} filtros.fechaDesde - Fecha inicio para búsqueda por rango (opcional)
   * @param {string} filtros.fechaHasta - Fecha fin para búsqueda por rango (opcional)
   */
  async getValesPorCobrar(filtros = {}) {
    try {
      const {
        diasAtras = 30,
        soloConCliente = false,
        fechaDesde = null,
        fechaHasta = null
      } = filtros;

      const params = new URLSearchParams();

      // Si hay rango de fechas, usar ese modo
      if (fechaDesde && fechaHasta) {
        params.append('fecha_desde', fechaDesde);
        params.append('fecha_hasta', fechaHasta);
      } else {
        // Modo por días hacia atrás
        params.append('dias_atras', diasAtras.toString());
      }

      if (soloConCliente) params.append('solo_con_cliente', 'true');

      const queryString = params.toString();
      const response = await this.request(`/cajero/reportes/vales-por-cobrar${queryString ? `?${queryString}` : ''}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo vales por cobrar:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener resumen completo del día con todas las métricas
   * @param {string} fecha - Fecha del reporte (opcional, por defecto hoy)
   */
  async getResumenDelDia(fecha = null) {
    try {
      const queryString = fecha ? `?fecha=${fecha}` : '';
      const response = await this.request(`/cajero/reportes/resumen-del-dia${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo resumen del día:', error);
      return { success: false, message: error.message };
    }
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
  // RELBASE SYNC - SINCRONIZACIÓN DE PRODUCTOS
  // ===========================

  /**
   * Obtener estado de sincronización de productos con Relbase
   * Retorna: total, sincronizadas, pendientes, porcentaje, alerta
   */
  async getRelbaseSyncEstado() {
    try {
      const response = await this.request('/relbase-sync/productos/estado');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estado de sincronización:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener configuración de sincronización Relbase de productos
   * Retorna: categoria_plataforma_id, modo_prueba
   */
  async getRelbaseSyncConfig() {
    try {
      const response = await this.request('/relbase-sync/productos/config');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo config de sincronización:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Sincronizar una variante específica con Relbase
   * @param {number} varianteId - ID de la variante a sincronizar
   */
  async sincronizarVarianteRelbase(varianteId) {
    try {
      console.log(`🔄 Sincronizando variante ${varianteId} con Relbase...`);
      const response = await this.request(`/relbase-sync/productos/${varianteId}/sincronizar`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Error sincronizando variante:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Sincronizar todas las variantes pendientes con Relbase
   * Retorna: sincronizados, errores, mensaje
   */
  async sincronizarTodasRelbase() {
    try {
      console.log('🔄 Sincronizando todas las variantes pendientes con Relbase...');
      const response = await this.request('/relbase-sync/productos/sincronizar', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Error sincronizando todas las variantes:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Limpiar todos los productos de categoría Plataforma en Relbase
   * ⚠️ PELIGROSO: Elimina productos de Relbase y resetea sincronización local
   */
  async limpiarProductosRelbase() {
    try {
      console.log('🗑️ Limpiando productos de Relbase...');
      const response = await this.request('/relbase-sync/productos/limpiar', {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('❌ Error limpiando productos de Relbase:', error);
      return { success: false, message: error.message };
    }
  }

  // ===========================
  // RELBASE SYNC - SINCRONIZACIÓN DE CLIENTES
  // ===========================

  /**
   * Obtener estado de sincronización de clientes con Relbase
   * Retorna: total, sincronizados, pendientes
   */
  async getClientesSyncEstado() {
    try {
      const response = await this.request('/relbase-sync/clientes/estado');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estado de sincronización de clientes:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Sincronizar todos los clientes pendientes con Relbase
   */
  async sincronizarClientesRelbase() {
    try {
      console.log('🔄 Sincronizando clientes con Relbase...');
      const response = await this.request('/relbase-sync/clientes/sincronizar', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Error sincronizando clientes:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Sincronizar un cliente específico con Relbase
   * @param {number} clienteId - ID del cliente a sincronizar
   */
  async sincronizarClienteRelbase(clienteId) {
    try {
      console.log(`🔄 Sincronizando cliente ${clienteId} con Relbase...`);
      const response = await this.request(`/relbase-sync/clientes/${clienteId}/sincronizar`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Error sincronizando cliente:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Limpiar todos los clientes sincronizados de Relbase
   * ⚠️ PELIGROSO: Elimina clientes de Relbase y resetea sincronización local
   */
  async limpiarClientesRelbase() {
    try {
      console.log('🗑️ Limpiando clientes de Relbase...');
      const response = await this.request('/relbase-sync/clientes/limpiar', {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('❌ Error limpiando clientes de Relbase:', error);
      return { success: false, message: error.message };
    }
  }

  // ===========================
  // DTE - DOCUMENTOS TRIBUTARIOS ELECTRÓNICOS (Relbase)
  // ===========================

  /**
   * Verificar conexión con Relbase
   */
  async verificarConexionDTE() {
    try {
      const response = await this.request('/dte/verificar');
      return response;
    } catch (error) {
      console.error('❌ Error verificando conexión DTE:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Emitir boleta electrónica
   * @param {Array} productos - Array de productos con name, price, quantity
   * @param {Object} opciones - Opciones adicionales (comment, type_payment_id)
   */
  async emitirBoleta(productos, opciones = {}) {
    try {
      console.log('🧾 Emitiendo boleta electrónica...');
      console.log('📦 Productos:', productos);

      const response = await this.request('/dte/boleta', {
        method: 'POST',
        body: JSON.stringify({
          productos,
          ...opciones
        })
      });

      console.log('📥 Respuesta DTE boleta:', response);
      return response;
    } catch (error) {
      console.error('❌ Error emitiendo boleta:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Emitir factura electrónica
   * @param {Array} productos - Array de productos con name, price, quantity
   * @param {Object} cliente - Datos del cliente (customer_id o rut, name, address, etc)
   * @param {Object} opciones - Opciones adicionales (comment, type_payment_id)
   */
  async emitirFactura(productos, cliente, opciones = {}) {
    try {
      console.log('🧾 Emitiendo factura electrónica...');
      console.log('📦 Productos:', productos);
      console.log('👤 Cliente:', cliente);

      // Extraer descuento y convertir a formato Relbase
      const { descuento, ...restoOpciones } = opciones;
      const bodyData = {
        productos,
        cliente,
        ...restoOpciones
      };

      // Agregar descuento global si existe (Relbase usa global_discount)
      if (descuento && descuento > 0) {
        bodyData.global_discount = descuento;
        bodyData.global_discount_type = '$';  // Monto fijo en pesos
        console.log(`💰 Descuento global: $${descuento}`);
      }

      const response = await this.request('/dte/factura', {
        method: 'POST',
        body: JSON.stringify(bodyData)
      });

      console.log('📥 Respuesta DTE factura:', response);
      return response;
    } catch (error) {
      console.error('❌ Error emitiendo factura:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener lista de boletas
   * @param {number} page - Número de página
   */
  async listarBoletas(page = 1) {
    try {
      const response = await this.request(`/dte/boletas?page=${page}`);
      return response;
    } catch (error) {
      console.error('❌ Error listando boletas:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener lista de facturas
   * @param {number} page - Número de página
   */
  async listarFacturas(page = 1) {
    try {
      const response = await this.request(`/dte/facturas?page=${page}`);
      return response;
    } catch (error) {
      console.error('❌ Error listando facturas:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Guardar datos DTE en la venta (para permitir reimpresión)
   * @param {string} numeroVenta - Número de la venta
   * @param {Object} datosdte - Datos del DTE (folio, timbre, etc)
   */
  async guardarDTEVenta(numeroVenta, datosDTE) {
    try {
      console.log(`💾 Guardando DTE para venta ${numeroVenta}...`);
      const response = await this.request(`/cajero/ventas/${numeroVenta}/dte`, {
        method: 'POST',
        body: JSON.stringify(datosDTE)
      });
      console.log('📥 Respuesta guardar DTE:', response);
      return response;
    } catch (error) {
      console.error('❌ Error guardando DTE:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener datos para reimprimir boleta
   * @param {string} numeroVenta - Número de la venta
   */
  async obtenerDatosReimprimir(numeroVenta) {
    try {
      console.log(`🖨️ Obteniendo datos para reimprimir venta ${numeroVenta}...`);
      const response = await this.request(`/cajero/ventas/${numeroVenta}/reimprimir`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo datos para reimprimir:', error);
      return { success: false, message: error.message };
    }
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
  // PRECIOS ESPECIALES - LISTAS Y DESCUENTOS
  // ===========================

  /**
   * Obtener todas las listas de precios
   */
  async getListasPrecios(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/admin/precios/listas${queryParams ? `?${queryParams}` : ''}`);
  }

  /**
   * Obtener detalle de una lista con sus precios
   */
  async getListaPreciosDetalle(id) {
    return await this.request(`/admin/precios/listas/${id}`);
  }

  /**
   * Crear nueva lista de precios
   */
  async createListaPrecios(data) {
    return await this.request('/admin/precios/listas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Actualizar lista de precios
   */
  async updateListaPrecios(id, data) {
    return await this.request(`/admin/precios/listas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Desactivar lista de precios
   */
  async deleteListaPrecios(id) {
    return await this.request(`/admin/precios/listas/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Agregar precio a una lista
   */
  async addPrecioLista(idLista, data) {
    return await this.request(`/admin/precios/listas/${idLista}/precios`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Actualizar precio en lista
   */
  async updatePrecioLista(idLista, idPrecio, data) {
    return await this.request(`/admin/precios/listas/${idLista}/precios/${idPrecio}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Eliminar precio de lista
   */
  async deletePrecioLista(idLista, idPrecio) {
    return await this.request(`/admin/precios/listas/${idLista}/precios/${idPrecio}`, {
      method: 'DELETE'
    });
  }

  /**
   * Obtener precios especiales de un cliente
   */
  async getPreciosEspecialesCliente(idCliente) {
    return await this.request(`/admin/precios/clientes/${idCliente}`);
  }

  /**
   * Agregar precio especial a un cliente
   */
  async addPrecioEspecialCliente(idCliente, data) {
    return await this.request(`/admin/precios/clientes/${idCliente}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Actualizar precio especial de un cliente
   */
  async updatePrecioEspecialCliente(idCliente, idPrecio, data) {
    return await this.request(`/admin/precios/clientes/${idCliente}/${idPrecio}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Eliminar precio especial de un cliente
   */
  async deletePrecioEspecialCliente(idCliente, idPrecio) {
    return await this.request(`/admin/precios/clientes/${idCliente}/${idPrecio}`, {
      method: 'DELETE'
    });
  }

  /**
   * Asignar o quitar lista de precios a un cliente
   */
  async asignarListaACliente(idCliente, idLista) {
    return await this.request(`/admin/precios/clientes/${idCliente}/asignar-lista`, {
      method: 'PUT',
      body: JSON.stringify({ id_lista_precios: idLista })
    });
  }

  /**
   * Buscar productos/variantes para agregar precios
   */
  async buscarProductosPrecios(query, limit = 20) {
    const params = new URLSearchParams({ q: query, limit }).toString();
    return await this.request(`/admin/precios/buscar-productos?${params}`);
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