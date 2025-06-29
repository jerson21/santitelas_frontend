// /src/components/cajero/hooks/useTurno.js
import { useState, useCallback } from 'react';
import apiService from '../../../services/api';

const useTurno = (showToast) => {
  // Estados principales
  const [turnoAbierto, setTurnoAbierto] = useState(false);
  const [turnoInfo, setTurnoInfo] = useState(null);
  const [arqueoLoading, setArqueoLoading] = useState(false);

  // Verificar estado del turno
  const checkEstado = useCallback(async () => {
    try {
      const resp = await apiService.getEstadoTurno();
      if (resp.success && resp.data?.turno_abierto) {
        setTurnoAbierto(true);
        setTurnoInfo(resp.data);
        return resp.data;
      } else {
        setTurnoAbierto(false);
        setTurnoInfo(null);
        return null;
      }
    } catch (error) {
      console.log('No hay turno abierto actualmente');
      setTurnoAbierto(false);
      setTurnoInfo(null);
      return null;
    }
  }, []);

  // Abrir turno
  const abrirTurno = useCallback(async (montoInicial) => {
    try {
      const turnoData = {
        id_caja: 1, // ID de caja por defecto
        monto_inicial: montoInicial,
        observaciones_apertura: `Apertura de turno - ${new Date().toLocaleString('es-CL')}`
      };

      const resp = await apiService.abrirTurno(turnoData);
      if (resp.success) {
        setTurnoAbierto(true);
        await checkEstado(); // Actualizar información del turno
        return resp;
      } else {
        throw new Error(resp.message || 'No se pudo abrir el turno');
      }
    } catch (error) {
      console.error('Error abriendo turno:', error);
      throw error;
    }
  }, [checkEstado]);

  // Cerrar turno
  const cerrarTurno = useCallback(async (montoRealCierre) => {
    try {
      const cierreData = {
        monto_real_cierre: montoRealCierre,
        observaciones_cierre: `Cierre de turno - ${new Date().toLocaleString('es-CL')}`
      };

      const resp = await apiService.cerrarTurno(cierreData);
      if (resp.success) {
        setTurnoAbierto(false);
        setTurnoInfo(null);
        return resp.data; // Retorna datos del cierre incluyendo diferencia
      } else {
        throw new Error(resp.message || 'No se pudo cerrar el turno');
      }
    } catch (error) {
      console.error('Error cerrando turno:', error);
      throw error;
    }
  }, []);

  // Arqueo intermedio
  const arqueoIntermedio = useCallback(async (arqueoData) => {
    if (!turnoAbierto) {
      throw new Error('Debes abrir el turno para realizar un arqueo intermedio');
    }

    setArqueoLoading(true);
    try {
      const resp = await apiService.arqueoIntermedio(arqueoData);
      if (resp.success) {
        return resp.data; // Retorna datos del arqueo incluyendo diferencia
      } else {
        throw new Error(resp.message || 'No se pudo registrar el arqueo intermedio');
      }
    } catch (error) {
      console.error('Error en arqueo intermedio:', error);
      throw error;
    } finally {
      setArqueoLoading(false);
    }
  }, [turnoAbierto]);

  // Obtener resumen del turno actual
  const getResumenTurno = useCallback(async () => {
    if (!turnoAbierto) return null;

    try {
      const resp = await apiService.getResumenTurno();
      if (resp.success) {
        return resp.data;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo resumen del turno:', error);
      return null;
    }
  }, [turnoAbierto]);

  // Obtener historial de arqueos
  const getHistorialArqueos = useCallback(async () => {
    try {
      const resp = await apiService.getHistorialArqueos();
      if (resp.success) {
        return resp.data;
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo historial de arqueos:', error);
      return [];
    }
  }, []);

  // Validar que el turno esté abierto para operaciones
  const validarTurnoAbierto = useCallback(() => {
    if (!turnoAbierto) {
      showToast('Debes abrir el turno para realizar esta operación', 'error');
      return false;
    }
    return true;
  }, [turnoAbierto, showToast]);

  // Formatear tiempo transcurrido
  const formatearTiempoAbierto = useCallback(() => {
    if (!turnoInfo?.tiempo_abierto_minutos) return '0h 0m';
    
    const horas = Math.floor(turnoInfo.tiempo_abierto_minutos / 60);
    const minutos = turnoInfo.tiempo_abierto_minutos % 60;
    
    return `${horas}h ${minutos}m`;
  }, [turnoInfo]);

  // Calcular estadísticas del turno
  const calcularEstadisticasTurno = useCallback(() => {
    if (!turnoInfo) return null;

    return {
      tiempo_abierto: formatearTiempoAbierto(),
      monto_inicial: turnoInfo.monto_inicial || 0,
      fecha_apertura: turnoInfo.fecha_apertura,
      caja: turnoInfo.caja || 'Principal',
      estado: turnoAbierto ? 'Abierto' : 'Cerrado'
    };
  }, [turnoInfo, turnoAbierto, formatearTiempoAbierto]);

  return {
    // Estados
    turnoAbierto,
    turnoInfo,
    arqueoLoading,

    // Acciones principales
    actions: {
      checkEstado,
      abrirTurno,
      cerrarTurno,
      arqueoIntermedio,
      arqueoLoading,
      
      // Funciones auxiliares
      getResumenTurno,
      getHistorialArqueos,
      validarTurnoAbierto,
      calcularEstadisticasTurno
    }
  };
};

export default useTurno;