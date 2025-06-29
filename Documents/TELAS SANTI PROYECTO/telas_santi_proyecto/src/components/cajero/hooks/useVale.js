// /src/components/cajero/hooks/useVale.js
import { useState, useCallback } from 'react';
import apiService from '../../../services/api';
import { validarNumeroVale } from '../utils/validators';

const useVale = (showToast, refreshEstadisticas) => {
  // Estados principales
  const [valeNumber, setValeNumber] = useState('');
  const [currentVale, setCurrentVale] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para vales antiguos
  const [showValeAntiguoModal, setShowValeAntiguoModal] = useState(false);
  const [valeAntiguo, setValeAntiguo] = useState(null);
  const [confirmandoValeAntiguo, setConfirmandoValeAntiguo] = useState(false);

  // Procesar vale encontrado
  const processValeEncontrado = useCallback(async (detalle, numeroOriginal, esValeAntiguo = false) => {
    // Mapear productos con la nueva estructura
    const productosFormateados = detalle.productos?.map(producto => ({
      producto: producto.producto || 'Producto',
      codigo: producto.codigo,
      tipo: producto.tipo,
      descripcion: producto.descripcion_completa || 
                  `${producto.variante?.color || ''} ${producto.variante?.medida || ''}`.trim(),
      cantidad: producto.cantidad,
      precio_unitario: producto.precio_unitario,
      subtotal: producto.subtotal,
      unidad_medida: producto.unidad || producto.variante?.unidad_medida || '',
      modalidad: producto.modalidad?.nombre,
      variante: producto.variante
    })) || [];

    // Formatear vale completo
    const valeFormateado = {
      numero: detalle.numero_vale || numeroOriginal,
      numero_display: detalle.numero_display || numeroOriginal,
      cliente: detalle.cliente_info?.nombre || 
               detalle.cliente_info?.razon_social || 
               'Cliente sin datos',
      vendedor: detalle.vendedor || 'Vendedor',
      fecha: detalle.fecha_creacion || new Date().toISOString(),
      total: Number(detalle.totales?.total || 0),
      productos: productosFormateados,
      estado: detalle.estado || 'vale_pendiente',
      notas_vendedor: detalle.notas_vendedor,
      // Campos específicos para vales antiguos
      es_vale_antiguo: esValeAntiguo || detalle.es_vale_antiguo || false,
      dias_atras: detalle.dias_atras || 0,
      advertencia: detalle.advertencia,
      // Datos originales por si se necesitan
      detalles_originales: detalle
    };

    setCurrentVale(valeFormateado);

    // Mostrar mensaje
    let mensaje = `Vale ${numeroOriginal} cargado correctamente`;
    if (esValeAntiguo) {
      mensaje += `\n⚠️ Vale antiguo confirmado - Proceder con precaución`;
    }
    
    showToast(mensaje, esValeAntiguo ? 'warning' : 'success');
  }, [showToast]);

  // Buscar vale
  const searchVale = useCallback(async () => {
    const validacion = validarNumeroVale(valeNumber);
    if (!validacion.valido) {
      showToast(validacion.mensaje, 'error');
      return;
    }

    setLoading(true);
    try {
      const resultado = await apiService.getValeDetalles(validacion.numero);
      
      if (resultado.success && resultado.data) {
        await processValeEncontrado(resultado.data, validacion.numero);
        
      } else if (resultado.requiresConfirmation) {
        // Vale antiguo detectado - mostrar modal de confirmación
        console.log('🕒 Vale antiguo detectado:', resultado);
        setValeAntiguo({
          numero_original: validacion.numero,
          numero_pedido: resultado.data.numero_vale,
          dias_atras: resultado.data.dias_atras
        });
        setShowValeAntiguoModal(true);
        
      } else {
        showToast(resultado.message || 'No se encontró el vale', 'error');
        setCurrentVale(null);
      }
    } catch (error) {
      console.error('Error buscando detalles del vale:', error);
      showToast('Error al buscar el vale. Verifica tu conexión.', 'error');
      setCurrentVale(null);
    } finally {
      setLoading(false);
    }
  }, [valeNumber, showToast, processValeEncontrado]);

  // Confirmar vale antiguo
  const confirmarValeAntiguo = useCallback(async () => {
    if (!valeAntiguo) return;
    
    setConfirmandoValeAntiguo(true);
    try {
      // Confirmar vale antiguo en el backend
      const confirmacion = await fetch(`${apiService.baseURL}/cajero/vale/${valeAntiguo.numero_original}/confirmar-antiguo`, {
        method: 'POST',
        headers: apiService.getHeaders(),
        body: JSON.stringify({ confirmar: true })
      });

      if (confirmacion.ok) {
        // Buscar los detalles del vale confirmado
        const resultado = await apiService.getValeDetalles(valeAntiguo.numero_pedido);
        
        if (resultado.success && resultado.data) {
          await processValeEncontrado(resultado.data, valeAntiguo.numero_original, true);
          setShowValeAntiguoModal(false);
          setValeAntiguo(null);
        } else {
          showToast('Error obteniendo detalles del vale confirmado', 'error');
        }
      } else {
        showToast('Error confirmando vale antiguo', 'error');
      }
    } catch (error) {
      console.error('Error confirmando vale antiguo:', error);
      showToast('Error de conexión al confirmar vale', 'error');
    } finally {
      setConfirmandoValeAntiguo(false);
    }
  }, [valeAntiguo, showToast, processValeEncontrado]);

  // Anular vale
  const anularVale = useCallback(async () => {
    if (!currentVale) return;
    
    let mensaje = `¿Cuál es el motivo para anular el vale ${currentVale.numero}?`;
    if (currentVale.es_vale_antiguo) {
      mensaje += `\n\n⚠️ Nota: Este vale es de hace ${currentVale.dias_atras} días`;
    }
    
    const motivo = prompt(mensaje);
    if (!motivo || motivo.trim() === '') return;

    try {
      const resp = await apiService.anularVale(currentVale.numero, motivo.trim());
      if (resp.success) {
        showToast(`✅ Vale ${currentVale.numero} anulado correctamente`, 'success');
        clearVale();
        refreshEstadisticas();
      } else {
        showToast(resp.message || 'No se pudo anular el vale', 'error');
      }
    } catch (error) {
      console.error('Error anulando el vale:', error);
      showToast('Error al anular el vale. Intenta nuevamente.', 'error');
    }
  }, [currentVale, showToast, refreshEstadisticas]);

  // Actualizar precios de productos
  const updatePrices = useCallback(async (numeroVale, updates) => {
    try {
      // updates es un array de objetos: [{ index: 0, precio: 1000 }, ...]
      const response = await apiService.actualizarPreciosVale(numeroVale, { actualizaciones: updates });
      
      if (response.success) {
        // Actualizar el vale actual con los nuevos precios
        if (currentVale && currentVale.numero === numeroVale) {
          const valeActualizado = { ...currentVale };
          
          // Actualizar cada producto con su nuevo precio
          updates.forEach(update => {
            if (valeActualizado.productos[update.index]) {
              const producto = valeActualizado.productos[update.index];
              producto.precio_unitario = update.precio;
              producto.subtotal = producto.cantidad * update.precio;
            }
          });
          
          // Recalcular el total
          valeActualizado.total = valeActualizado.productos.reduce((sum, producto) => {
            return sum + (producto.cantidad * producto.precio_unitario);
          }, 0);
          
          setCurrentVale(valeActualizado);
          
          // Actualizar estadísticas si es necesario
          if (refreshEstadisticas) {
            refreshEstadisticas();
          }
        }
        
        return true;
      } else {
        showToast(response.message || 'Error al actualizar precios', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error actualizando precios:', error);
      showToast('Error al actualizar los precios. Intenta nuevamente.', 'error');
      return false;
    }
  }, [currentVale, showToast, refreshEstadisticas]);

  // Limpiar vale
  const clearVale = useCallback(() => {
    setCurrentVale(null);
    setValeNumber('');
    setValeAntiguo(null);
    setShowValeAntiguoModal(false);
  }, []);

  return {
    // Estados
    valeNumber,
    setValeNumber,
    currentVale,
    loading,
    
    // Acciones principales
    searchVale,
    clearVale,
    anularVale,
    updatePrices,
    
    // Estados y acciones para vales antiguos
    showValeAntiguoModal,
    setShowValeAntiguoModal,
    valeAntiguo,
    confirmarValeAntiguo,
    confirmandoValeAntiguo
  };
};

export default useVale;