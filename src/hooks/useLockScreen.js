// hooks/useLockScreen.js - Hook para sistema de bloqueo de pantalla
import { useState, useEffect, useCallback, useRef } from 'react';
import ApiService from '../services/api';

const INACTIVITY_TIMEOUT = 30 * 1000; // 30 segundos

export const useLockScreen = (isEnabled = true) => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Verificar si el usuario tiene PIN configurado
  const checkHasPin = useCallback(async () => {
    try {
      const response = await ApiService.verificarTienePin();
      if (response.success) {
        setHasPin(response.data.tiene_pin);
        console.log('PIN configurado:', response.data.tiene_pin);
      }
    } catch (error) {
      console.error('Error verificando PIN:', error);
    } finally {
      setPinChecked(true);
    }
  }, []);

  // Resetear timer de inactividad
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isEnabled && hasPin && !isLocked) {
      timeoutRef.current = setTimeout(() => {
        console.log('Bloqueando pantalla por inactividad (30s)');
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT);
    }
  }, [isEnabled, hasPin, isLocked]);

  // Bloquear manualmente (boton "Ir a Bodega")
  const lockScreen = useCallback(() => {
    if (hasPin) {
      console.log('Bloqueando pantalla manualmente');
      setIsLocked(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      console.warn('No se puede bloquear: usuario no tiene PIN configurado');
      alert('No tiene PIN configurado. Contacte al administrador.');
    }
  }, [hasPin]);

  // Desbloquear pantalla
  const unlockScreen = useCallback(() => {
    console.log('Desbloqueando pantalla');
    setIsLocked(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Verificar PIN al montar
  useEffect(() => {
    if (isEnabled) {
      checkHasPin();
    }
  }, [isEnabled, checkHasPin]);

  // Configurar listeners de actividad
  useEffect(() => {
    if (!isEnabled || !hasPin) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
      'click'
    ];

    const handleActivity = () => {
      if (!isLocked) {
        resetInactivityTimer();
      }
    };

    // Agregar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isEnabled, hasPin, isLocked, resetInactivityTimer]);

  return {
    isLocked,
    hasPin,
    pinChecked,
    lockScreen,
    unlockScreen,
    checkHasPin
  };
};

export default useLockScreen;
