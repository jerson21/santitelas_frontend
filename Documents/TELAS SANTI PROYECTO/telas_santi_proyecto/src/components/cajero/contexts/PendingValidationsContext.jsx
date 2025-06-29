// /src/components/cajero/contexts/PendingValidationsContext.jsx
import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useTransferValidation } from '../../../hooks/useSocket';

const PendingValidationsContext = createContext();

export const PendingValidationsProvider = ({ children }) => {
  const [pendingVales, setPendingVales] = useState([]);
  const { on, off } = useTransferValidation();

  const addPendingValidation = useCallback((valeData) => { /* ... (sin cambios) ... */ }, []);
  
  const updateValidationStatus = useCallback((data) => {
    setPendingVales(prev => prev.map(vale => {
      // ✅ LÓGICA DE MATCHING CORREGIDA
      // Comprueba si el ID del vale coincide con el ID permanente O el ID temporal del servidor.
      if (vale.requestId === data.id || vale.requestId === data.tempId) {
        let status = 'pending';
        if (data.validada) status = 'approved';
        else if (data.status === 'timeout') status = 'timeout';
        else status = 'rejected';
        
        // Actualizamos el vale y nos aseguramos de usar el ID permanente del servidor para el futuro.
        return { ...vale, status, message: data.observaciones || data.mensaje, requestId: data.id };
      }
      return vale;
    }));
  }, []);

  const removeValidation = useCallback((requestId) => { /* ... (sin cambios) ... */ }, []);
  
  useEffect(() => {
    const handleValidationResult = (data) => {
      console.log('Contexto recibió resultado:', data);
      // Simplemente pasamos toda la data. La lógica está en updateValidationStatus.
      updateValidationStatus(data);
    };

    const handleTimeout = (data) => { /* ... (lógica similar) ... */ };
    const handleCancellation = (data) => { /* ... (lógica similar) ... */ };

    on('resultado_validacion', handleValidationResult);
    on('validacion_timeout', handleTimeout);
    on('validacion_cancelada', handleCancellation);

    return () => { /* ... (sin cambios) ... */ };
  }, [on, off, updateValidationStatus, removeValidation]);

  const value = { pendingVales, addPendingValidation, removeValidation };

  return (
    <PendingValidationsContext.Provider value={value}>
      {children}
    </PendingValidationsContext.Provider>
  );
};

export default PendingValidationsContext;