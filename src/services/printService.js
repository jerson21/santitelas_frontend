// Servicio para conectar con el servidor de impresión local
const PRINT_SERVER_URL = 'http://localhost:3005';

const printService = {
  // Verificar si el servidor de impresión está disponible
  async checkConnection() {
    try {
      const response = await fetch(`${PRINT_SERVER_URL}/health`, {
        method: 'GET',
        timeout: 2000
      });
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.log('Servidor de impresión no disponible:', error.message);
      return false;
    }
  },

  // Imprimir boleta/ticket después de un pago
  async printBoleta(datosVenta) {
    try {
      console.log('🖨️ Enviando a print-server:', JSON.stringify(datosVenta, null, 2));
      const response = await fetch(`${PRINT_SERVER_URL}/print/boleta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ boleta: datosVenta })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al imprimir');
      }

      return result;
    } catch (error) {
      console.error('Error al enviar a imprimir:', error);
      throw error;
    }
  },

  // Formatear datos del vale para impresión
  formatBoletaData(vale, paymentData, totales) {
    // Formatear número de vale: VP20251203 04 (código + número diario separado)
    let numeroValeFormateado = '';
    // numero_pedido viene de detalle.numero_vale del backend (ej: VP20251203-0004)
    const codigoCompleto = vale.numero_pedido || vale.numero;
    if (codigoCompleto && codigoCompleto.includes('VP')) {
      // Extraer la parte base (VP20251203) del código completo
      const partes = codigoCompleto.split('-');
      const codigoBase = partes[0]; // VP20251203
      // numero_diario viene como número (4), lo formateamos con padding (04)
      const numeroDiario = vale.numero_diario
        ? String(vale.numero_diario).padStart(2, '0')
        : (partes[1] ? String(parseInt(partes[1], 10)).padStart(2, '0') : '');
      numeroValeFormateado = `${codigoBase} ${numeroDiario}`;
    } else {
      numeroValeFormateado = vale.numero_display || vale.numero || '';
    }

    return {
      // Info del vale
      numero_vale: numeroValeFormateado,
      fecha: new Date().toISOString(),

      // Info del cliente
      cliente: {
        nombre: paymentData.nombre_cliente || vale.cliente || 'Cliente General',
        rut: paymentData.rut_cliente || '',
        direccion: paymentData.direccion || ''
      },

      // Productos
      productos: vale.productos.map(p => ({
        nombre: p.descripcion_completa || p.producto || p.nombre || 'Producto',
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        subtotal: p.cantidad * p.precio_unitario
      })),

      // Totales
      neto: totales.neto,
      iva: totales.iva,
      descuento: totales.descuento || 0,
      total: totales.total,

      // Pago
      tipo_documento: paymentData.tipo_documento,
      metodo_pago: paymentData.metodo_pago,
      monto_pagado: totales.montoPagado,
      vuelto: totales.vuelto || 0,

      // Vendedor
      vendedor: vale.vendedor || vale.detalles_originales?.vendedor || '',

      // DTE (Documento Tributario Electrónico)
      folio_dte: totales.folioDTE || null,
      modo_prueba_dte: totales.modoPruebaDTE || false,
      timbre_ted: totales.timbreTED || null  // Timbre electrónico para código de barras PDF417
    };
  },

  // =============================================
  // IMPRESIÓN DE VALES (para módulo vendedor)
  // =============================================

  /**
   * Imprimir vale de pedido (automático al crear)
   * @param {Object} vale - Datos del vale
   */
  async printVale(vale) {
    try {
      // Verificar disponibilidad
      const disponible = await this.checkConnection();
      if (!disponible) {
        console.warn('⚠️ Print Server no disponible - Vale no se imprimió');
        return {
          success: false,
          error: 'Servidor de impresión no disponible',
          needsManualPrint: true
        };
      }

      console.log('🖨️ Enviando vale a imprimir:', vale.numero_diario || vale.numero_pedido);

      const response = await fetch(`${PRINT_SERVER_URL}/print/vale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vale })
      });

      // Verificar que la respuesta sea JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Print Server devolvió respuesta no-JSON');
        return {
          success: false,
          error: 'Servidor de impresión no disponible',
          needsManualPrint: true
        };
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Vale impreso correctamente');
      } else {
        console.error('❌ Error imprimiendo vale:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error de conexión con Print Server:', error);
      return {
        success: false,
        error: error.message,
        needsManualPrint: true
      };
    }
  },

  /**
   * Transformar respuesta del backend al formato de vale para impresión
   * @param {Object} pedidoResponse - Respuesta de createPedidoRapido
   * @param {Object} datosLocales - Datos del carrito y cliente local
   */
  formatValeFromPedido(pedidoResponse, datosLocales) {
    const data = pedidoResponse.data || pedidoResponse;

    return {
      numero_diario: data.numero_diario || null,
      numero_pedido: data.numero_pedido || data.numero_vale,
      fecha: data.fecha_creacion || new Date().toISOString(),
      vendedor: data.vendedor?.nombre || datosLocales?.vendedor || 'Vendedor',
      tipo_documento: data.tipo_documento || datosLocales?.documentType || 'ticket',
      cliente: {
        nombre: data.cliente?.nombre || datosLocales?.cliente?.nombre || null,
        rut: data.cliente?.rut || datosLocales?.cliente?.rut || null
      },
      productos: datosLocales?.cart?.map(item => ({
        nombre: item.product?.nombre || item.nombre,
        variante: item.variante?.color || item.color || item.variante?.medida,
        modalidad: item.modalidad,
        unidad_medida: item.product?.unidad_medida || 'metros',
        cantidad: parseFloat(item.quantity),
        precio_unitario: parseFloat(item.price),
        subtotal: parseFloat(item.total) || (item.quantity * item.price)
      })) || [],
      total: parseFloat(data.total) || datosLocales?.cartTotal || 0,
      descuento: parseFloat(data.descuento) || 0
    };
  },

  /**
   * Reimprimir vale existente (desde UltimosVales)
   * @param {Object} vale - Vale a reimprimir
   * @param {Array} detalles - Productos del vale
   */
  async reimprimirVale(vale, detalles = []) {
    try {
      const disponible = await this.checkConnection();
      if (!disponible) {
        return {
          success: false,
          error: 'Servidor de impresión no disponible. Verifique que Print Server esté ejecutándose.',
          needsManualPrint: true
        };
      }

      // Transformar al formato esperado
      const valeParaImprimir = {
        numero_diario: vale.numero_diario,
        numero_pedido: vale.numero_pedido || vale.numero_vale,
        fecha: vale.fecha_creacion,
        vendedor: vale.vendedor?.nombre || vale.vendedor_nombre || 'Vendedor',
        tipo_documento: vale.tipo_documento || 'ticket',
        cliente: {
          nombre: vale.nombre_cliente || vale.cliente?.nombre || vale.cliente_nombre,
          rut: vale.cliente_rut || vale.cliente?.rut || vale.rut_cliente
        },
        productos: detalles.map(d => ({
          nombre: d.nombre_producto || d.producto?.nombre,
          variante: d.color_variante || d.variante?.color || d.medida_variante,
          modalidad: d.modalidad_nombre || d.modalidad?.nombre,
          unidad_medida: d.unidad_medida || 'metros',
          cantidad: parseFloat(d.cantidad),
          precio_unitario: parseFloat(d.precio_unitario),
          subtotal: parseFloat(d.subtotal) || (parseFloat(d.cantidad) * parseFloat(d.precio_unitario))
        })),
        total: parseFloat(vale.total) || detalles.reduce((sum, d) =>
          sum + (parseFloat(d.subtotal) || parseFloat(d.cantidad) * parseFloat(d.precio_unitario)), 0
        ),
        descuento: 0
      };

      console.log('🖨️ Reimprimiendo vale:', valeParaImprimir.numero_pedido);

      const response = await fetch(`${PRINT_SERVER_URL}/print/vale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vale: valeParaImprimir })
      });

      // Verificar que la respuesta sea JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Print Server devolvió respuesta no-JSON:', contentType);
        return {
          success: false,
          error: 'El servidor de impresión no está disponible o no responde correctamente',
          needsManualPrint: true
        };
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error reimprimiendo vale:', error);
      return {
        success: false,
        error: error.message,
        needsManualPrint: true
      };
    }
  },

  /**
   * Imprimir prueba
   */
  async printTest() {
    try {
      const disponible = await this.checkConnection();
      if (!disponible) {
        return { success: false, error: 'Servidor de impresión no disponible' };
      }

      const response = await fetch(`${PRINT_SERVER_URL}/print/test`, {
        method: 'POST'
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // =============================================
  // IMPRESIÓN DE CIERRE DE TURNO
  // =============================================

  /**
   * Imprimir ticket de cierre de turno
   * @param {Object} datosCierre - Datos del cierre de turno
   */
  async printCierreTurno(datosCierre) {
    try {
      const disponible = await this.checkConnection();
      if (!disponible) {
        console.warn('⚠️ Print Server no disponible - Cierre no se imprimió');
        return {
          success: false,
          error: 'Servidor de impresión no disponible',
          needsManualPrint: true
        };
      }

      console.log('🖨️ Enviando cierre de turno a imprimir');

      const response = await fetch(`${PRINT_SERVER_URL}/print/cierre-turno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cierre: datosCierre })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Print Server devolvió respuesta no-JSON');
        return {
          success: false,
          error: 'Servidor de impresión no disponible',
          needsManualPrint: true
        };
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Cierre de turno impreso correctamente');
      } else {
        console.error('❌ Error imprimiendo cierre:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error de conexión con Print Server:', error);
      return {
        success: false,
        error: error.message,
        needsManualPrint: true
      };
    }
  },

  /**
   * Formatear datos de cierre para impresión
   * @param {Object} data - Datos del cierre del backend
   */
  formatCierreTurnoData(data) {
    const formatCurrency = (amount) => {
      return Number(amount || 0).toLocaleString('es-CL');
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return {
      titulo: 'CIERRE DE TURNO',
      cajero: data.cajero || 'Cajero',
      caja: data.caja || 'Caja Principal',
      fecha_apertura: formatDate(data.fecha_apertura),
      fecha_cierre: formatDate(data.fecha_cierre),

      // Movimiento de caja
      monto_inicial: formatCurrency(data.monto_inicial),
      ventas_efectivo: formatCurrency(data.ventas_efectivo),
      total_retiros: formatCurrency(data.total_retiros),
      cantidad_retiros: data.cantidad_retiros || 0,
      dinero_teorico: formatCurrency(data.dinero_teorico),
      dinero_real: formatCurrency(data.dinero_real),
      diferencia: formatCurrency(Math.abs(data.diferencia)),
      diferencia_tipo: data.estado_diferencia,

      // Ventas
      cantidad_ventas: data.cantidad_ventas || 0,
      total_ventas: formatCurrency(data.total_ventas),
      ventas_transferencia: formatCurrency(data.ventas_transferencia),
      ventas_tarjeta: formatCurrency(data.ventas_tarjeta),

      // Retiros detallados
      retiros: (data.retiros || []).map(r => ({
        monto: formatCurrency(r.monto),
        motivo: r.motivo || 'Retiro',
        hora: new Date(r.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      }))
    };
  }
};

export default printService;
