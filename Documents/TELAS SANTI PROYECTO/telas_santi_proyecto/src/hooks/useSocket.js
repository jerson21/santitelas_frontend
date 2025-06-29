// /src/hooks/useSocket.js - VERSIÓN CORREGIDA CON TU useAuth
import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './useAuth'; // ✅ IMPORTAR TU HOOK

const SOCKET_URL = window.API_BASE_URL || 'http://localhost:5000';

class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket conectado:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Instancia singleton
const socketManager = new SocketManager();

// Hook principal
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      socketRef.current = socketManager.connect(token);
      
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);
      
      socketRef.current.on('connect', handleConnect);
      socketRef.current.on('disconnect', handleDisconnect);
      
      return () => {
        socketRef.current?.off('connect', handleConnect);
        socketRef.current?.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  const emit = useCallback((event, data) => {
    socketManager.emit(event, data);
  }, []);

  const on = useCallback((event, callback) => {
    socketManager.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    socketManager.off(event, callback);
  }, []);

  const joinRoom = useCallback((room, userData) => {
    // ✅ FIX: Usar los eventos específicos que el servidor espera
    if (room === 'admin') {
      socketManager.emit('join_admin', userData);
    } else if (room === 'cajeros') {
      socketManager.emit('join_cajero', userData);
    } else if (room === 'vendedores') {
      socketManager.emit('join_vendedor', userData);
    } else {
      // Fallback para otras salas
      socketManager.emit('unirse_sala', { sala: room, ...userData });
    }
  }, []);

  const leaveRoom = useCallback((room) => {
    socketManager.emit('salir_sala', { sala: room });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom
  };
};

// Hook específico para validación de transferencias
export const useTransferValidation = () => {
  const { emit, on, off, joinRoom, isConnected } = useSocket();
  const { user, isAdmin } = useAuth(); // ✅ USAR TU HOOK useAuth
  const [pendingValidations, setPendingValidations] = useState([]);
  const [validationCount, setValidationCount] = useState(0);

  useEffect(() => {
    // ✅ AHORA USAMOS isAdmin DE TU HOOK
    console.log('🔍 DEBUG useTransferValidation:', {
      isConnected,
      user,
      isAdmin,
      userRole: user?.rol,
      userName: user?.username || user?.nombre
    });
    
    if (isConnected && isAdmin) {
      console.log('✅ Admin detectado, uniéndose a sala admin...');
      
      joinRoom('admin', { 
        usuario: user.username || user.nombre || 'Admin',
        rol: 'admin'
      });
      
      console.log('📋 Solicitando transferencias pendientes...');
      emit('obtener_transferencias_pendientes');
    } else {
      console.log('⚠️ No se une a sala admin:', {
        isConnected,
        isAdmin,
        razón: !isConnected ? 'No conectado' : 'No es admin'
      });
    }

    // ✅ EVENTOS CORREGIDOS PARA COINCIDIR CON EL SERVIDOR
    const handleNuevaValidacion = (data) => {
      console.log('📨 Nueva validación recibida:', data);
      setPendingValidations(prev => [...prev, { ...data, timestamp: new Date() }]);
      setValidationCount(prev => prev + 1);
    };

    const handleValidacionCompletada = (data) => {
      console.log('✅ Validación completada:', data);
      setPendingValidations(prev => prev.filter(v => v.id !== data.id));
      setValidationCount(prev => Math.max(0, prev - 1));
    };

    const handleValidacionCancelada = (data) => {
      console.log('❌ Validación cancelada:', data);
      setPendingValidations(prev => prev.filter(v => v.id !== data.id));
      setValidationCount(prev => Math.max(0, prev - 1));
    };

    // ✅ NUEVO: Manejar lista inicial de transferencias pendientes
    const handleListaPendientes = (transferencias) => {
      console.log('📋 Lista de transferencias pendientes recibida:', transferencias);
      setPendingValidations(transferencias.map(t => ({ ...t, timestamp: new Date(t.timestamp) })));
      setValidationCount(transferencias.length);
    };

    // ✅ NUEVO: Manejar cuando un cajero se desconecta
    const handleCajeroDesconectado = (data) => {
      console.log('⚠️ Cajero desconectado con transferencia pendiente:', data);
      setPendingValidations(prev => 
        prev.map(v => v.id === data.id 
          ? { ...v, cajeroDesconectado: true, mensaje: data.mensaje }
          : v
        )
      );
    };

    // Registrar todos los listeners
    on('nueva_transferencia_pendiente', handleNuevaValidacion);
    on('transferencia_procesada', handleValidacionCompletada);
    on('transferencia_cancelada', handleValidacionCancelada);
    on('lista_transferencias_pendientes', handleListaPendientes);
    on('cajero_desconectado', handleCajeroDesconectado);

    return () => {
      off('nueva_transferencia_pendiente', handleNuevaValidacion);
      off('transferencia_procesada', handleValidacionCompletada);
      off('transferencia_cancelada', handleValidacionCancelada);
      off('lista_transferencias_pendientes', handleListaPendientes);
      off('cajero_desconectado', handleCajeroDesconectado);
    };
  }, [isConnected, isAdmin, user, on, off, joinRoom, emit]);

  // Función para que el cajero solicite validación
  const solicitarValidacion = useCallback((datos) => {
    console.log('📤 Solicitando validación:', datos);
    emit('solicitar_validacion_transferencia', datos);
  }, [emit]);

  // Función para cancelar una validación
  const cancelarValidacion = useCallback((validacionId, motivo) => {
    console.log('❌ Cancelando validación:', validacionId, motivo);
    emit('cancelar_validacion_transferencia', {
      id: validacionId,
      motivo
    });
  }, [emit]);

  // Función para que el admin responda a una validación
  const responderValidacion = useCallback((validacionId, aprobada, observaciones = '') => {
    console.log('📝 Respondiendo validación:', validacionId, aprobada);
    emit('responder_validacion_transferencia', {
      id: validacionId,
      validada: aprobada,
      observaciones,
      admin_usuario: user?.username || user?.nombre || 'Admin' // ✅ USAR DATOS DEL USER
    });
  }, [emit, user]);

  // ✅ NUEVO: Función para actualizar lista de pendientes manualmente
  const actualizarPendientes = useCallback(() => {
    emit('obtener_transferencias_pendientes');
  }, [emit]);

  // Retornar todas las funciones necesarias
  return {
    // Estado
    pendingValidations,
    validationCount,
    isConnected,
    
    // Funciones de validación
    solicitarValidacion,
    cancelarValidacion,
    responderValidacion,
    actualizarPendientes,
    
    // Funciones de socket (necesarias para el componente ValidacionTransferencia)
    on,
    off,
    emit,
    joinRoom,
    leaveRoom: useSocket().leaveRoom
  };
};