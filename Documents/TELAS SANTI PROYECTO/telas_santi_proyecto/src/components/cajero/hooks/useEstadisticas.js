// /src/components/cajero/hooks/useEstadisticas.js
import { useState, useCallback, useEffect } from 'react';
import apiService from '../../../services/api';

const useEstadisticas = () => {
  // Estados principales
  const [estadisticas, setEstadisticas] = useState({
    dia_actual: {
      fecha: '',
      total_vales: 0,
      pendientes: 0,
      procesando: 0,
      completados: 0,
      monto_total: 0,
      monto_pendiente: 0,
      monto_completado: 0,
    },
    pendientes_historicos: {
      total: 0,
      monto_total: 0,
      dias_con_pendientes: 0,
      vales_por_dia: []
    },
    turno_actual: {
      vales_procesados: 0,
      monto_recaudado: 0,
      tiempo_promedio_procesamiento: 0,
      ultimo_arqueo: null
    },
    rendimiento: {
      eficiencia_dia: 0,
      promedio_por_vale: 0,
      vales_por_hora: 0,
      comparacion_dia_anterior: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Obtener estadísticas del cajero
  const fetchEstadisticas = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await apiService.getEstadisticasCajero();
      if (resp.success && resp.data) {
        setEstadisticas(prev => ({
          ...prev,
          ...resp.data
        }));
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas del cajero:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estadísticas del turno actual
  const fetchEstadisticasTurno = useCallback(async () => {
    try {
      const resp = await apiService.getEstadisticasTurno();
      if (resp.success && resp.data) {
        setEstadisticas(prev => ({
          ...prev,
          turno_actual: resp.data
        }));
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas del turno:', error);
    }
  }, []);

  // Obtener métricas de rendimiento
  const fetchRendimiento = useCallback(async () => {
    try {
      const resp = await apiService.getRendimientoCajero();
      if (resp.success && resp.data) {
        setEstadisticas(prev => ({
          ...prev,
          rendimiento: resp.data
        }));
      }
    } catch (error) {
      console.error('Error obteniendo métricas de rendimiento:', error);
    }
  }, []);

  // Refresh completo de todas las estadísticas
  const refreshEstadisticas = useCallback(async () => {
    await Promise.all([
      fetchEstadisticas(),
      fetchEstadisticasTurno(),
      fetchRendimiento()
    ]);
  }, [fetchEstadisticas, fetchEstadisticasTurno, fetchRendimiento]);

  // Calcular métricas derivadas
  const calcularMetricas = useCallback(() => {
    const { dia_actual, pendientes_historicos, turno_actual } = estadisticas;

    // Eficiencia del día (porcentaje de vales completados)
    const eficiencia_dia = dia_actual.total_vales > 0 
      ? Math.round(((dia_actual.total_vales - dia_actual.pendientes) / dia_actual.total_vales) * 100)
      : 100;

    // Promedio por vale
    const promedio_por_vale = dia_actual.total_vales > 0
      ? dia_actual.monto_total / dia_actual.total_vales
      : 0;

    // Total de pendientes (día + históricos)
    const total_pendientes = dia_actual.pendientes + pendientes_historicos.total;
    const monto_total_pendiente = dia_actual.monto_pendiente + pendientes_historicos.monto_total;

    return {
      eficiencia_dia,
      promedio_por_vale,
      total_pendientes,
      monto_total_pendiente,
      tiene_pendientes: total_pendientes > 0,
      estado_general: total_pendientes === 0 ? 'excelente' : 'pendientes'
    };
  }, [estadisticas]);

  // Obtener resumen para dashboard
  const getResumenDashboard = useCallback(() => {
    const metricas = calcularMetricas();
    
    return {
      vales_hoy: estadisticas.dia_actual.total_vales,
      recaudado_hoy: estadisticas.dia_actual.monto_total,
      pendientes_hoy: estadisticas.dia_actual.pendientes,
      pendientes_historicos: estadisticas.pendientes_historicos.total,
      eficiencia: metricas.eficiencia_dia,
      promedio_vale: metricas.promedio_por_vale,
      estado: metricas.estado_general
    };
  }, [estadisticas, calcularMetricas]);

  // Obtener datos para gráficos
  const getDatosGraficos = useCallback(() => {
    return {
      vales_por_estado: [
        { name: 'Completados', value: estadisticas.dia_actual.completados, color: '#10B981' },
        { name: 'Pendientes', value: estadisticas.dia_actual.pendientes, color: '#F59E0B' },
        { name: 'Procesando', value: estadisticas.dia_actual.procesando, color: '#3B82F6' }
      ],
      tendencia_semanal: estadisticas.rendimiento.tendencia_semanal || [],
      comparacion_metodos_pago: estadisticas.rendimiento.metodos_pago || []
    };
  }, [estadisticas]);

  // Verificar si necesita actualización (cada 5 minutos)
  const necesitaActualizacion = useCallback(() => {
    if (!lastUpdate) return true;
    const ahora = new Date();
    const diferencia = ahora - lastUpdate;
    return diferencia > 5 * 60 * 1000; // 5 minutos
  }, [lastUpdate]);

  // Auto-refresh cada cierto tiempo
  useEffect(() => {
    const interval = setInterval(() => {
      if (necesitaActualizacion()) {
        fetchEstadisticas();
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [necesitaActualizacion, fetchEstadisticas]);

  // Formatear currency
  const formatCurrency = useCallback((amount) => {
    return Number(amount || 0).toLocaleString('es-CL');
  }, []);

  // Formatear fecha
  const formatDate = useCallback((dateString) => {
    if (!dateString) return new Date().toLocaleDateString('es-CL');
    return new Date(dateString).toLocaleDateString('es-CL');
  }, []);

  // Obtener alertas basadas en estadísticas
  const getAlertas = useCallback(() => {
    const alertas = [];
    const metricas = calcularMetricas();

    // Alerta por vales pendientes del día
    if (estadisticas.dia_actual.pendientes > 0) {
      alertas.push({
        tipo: 'warning',
        mensaje: `Tienes ${estadisticas.dia_actual.pendientes} vales pendientes del día actual`,
        accion: 'procesar_pendientes'
      });
    }

    // Alerta por vales históricos
    if (estadisticas.pendientes_historicos.total > 0) {
      alertas.push({
        tipo: 'info',
        mensaje: `Hay ${estadisticas.pendientes_historicos.total} vales pendientes de días anteriores`,
        accion: 'revisar_historicos'
      });
    }

    // Alerta por baja eficiencia
    if (metricas.eficiencia_dia < 80 && estadisticas.dia_actual.total_vales > 5) {
      alertas.push({
        tipo: 'warning',
        mensaje: `Eficiencia del día: ${metricas.eficiencia_dia}%. Considera procesar más vales.`,
        accion: 'mejorar_eficiencia'
      });
    }

    // Alerta por alto volumen pendiente
    if (metricas.monto_total_pendiente > 100000) {
      alertas.push({
        tipo: 'error',
        mensaje: `Alto monto pendiente: $${formatCurrency(metricas.monto_total_pendiente)}`,
        accion: 'revision_urgente'
      });
    }

    return alertas;
  }, [estadisticas, calcularMetricas, formatCurrency]);

  return {
    // Estados
    estadisticas,
    loading,
    lastUpdate,

    // Acciones
    refreshEstadisticas,
    fetchEstadisticas,
    fetchEstadisticasTurno,
    fetchRendimiento,

    // Cálculos y utilidades
    calcularMetricas,
    getResumenDashboard,
    getDatosGraficos,
    getAlertas,
    formatCurrency,
    formatDate,
    necesitaActualizacion
  };
};

export default useEstadisticas;