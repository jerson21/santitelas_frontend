// /src/hooks/useTransferValidation.js
import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token, onConnect, onDisconnect) {
    if (this.socket?.connected) return this.socket;
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket.id);
      this.reconnectAttempts = 0;
      onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error.type, error.message);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

const socketManager = new SocketManager();

export const useTransferValidation = () => {
const { user, isAdmin } = useAuth();
const token = localStorage.getItem('token');
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const socketRef = useRef(null);
  const [pendingValidations, setPendingValidations] = useState([]);
  const [validationCount, setValidationCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const retryTimeoutRef = useRef(null);

  // Función para obtener pendientes via HTTP
  const fetchPendientes = useCallback(async () => {
    if (!token || !isAdmin) return;
    
    try {
      console.log('📋 Obteniendo transferencias pendientes via HTTP...');
      const res = await fetch(`${SOCKET_URL}/api/transferencias/pendientes`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      console.log('📥 Respuesta HTTP:', json);
      
      if (json.success && json.data) {
        const transferencias = json.data.transferencias_detalle || [];
        setPendingValidations(transferencias.map(t => ({
          ...t,
          timestamp: new Date(Date.now() - (t.tiempo || 0) * 1000)
        })));
        setValidationCount(transferencias.length);
        setLastFetchTime(Date.now());
      }
    } catch (err) {
      console.error('❌ Error al obtener transferencias pendientes (HTTP):', err);
    }
  }, [token, isAdmin]);

  // Función para configurar listeners del socket
  const setupSocketListeners = useCallback((socket) => {
    console.log('🔧 Configurando listeners del socket...');

    // Lista inicial de transferencias
    socket.on('lista_transferencias_pendientes', (payload) => {
      console.log('📋 Lista de transferencias recibida:', payload);
      
      let transferencias = [];
      if (Array.isArray(payload)) {
        transferencias = payload;
      } else if (payload?.transferencias_detalle) {
        transferencias = payload.transferencias_detalle;
      } else if (payload?.data?.transferencias_detalle) {
        transferencias = payload.data.transferencias_detalle;
      }

      setPendingValidations(transferencias.map(t => ({
        ...t,
        timestamp: new Date(Date.now() - (t.tiempo || 0) * 1000)
      })));
      setValidationCount(transferencias.length);
      setLastFetchTime(Date.now());
    });

    // Nueva transferencia
    socket.on('nueva_transferencia_pendiente', (data) => {
      console.log('🆕 Nueva transferencia recibida:', data);
      setPendingValidations(prev => {
        // Evitar duplicados
        if (prev.some(v => v.id === data.id)) return prev;
        return [...prev, {
          ...data,
          timestamp: new Date()
        }];
      });
      setValidationCount(prev => prev + 1);
    });

    // Transferencia procesada
    socket.on('transferencia_procesada', (data) => {
      console.log('✅ Transferencia procesada:', data);
      setPendingValidations(prev => prev.filter(v => v.id !== data.id));
      setValidationCount(prev => Math.max(0, prev - 1));
    });

    // Transferencia cancelada
    socket.on('transferencia_cancelada', (data) => {
      console.log('❌ Transferencia cancelada:', data);
      setPendingValidations(prev => prev.filter(v => v.id !== data.id));
      setValidationCount(prev => Math.max(0, prev - 1));
    });

    // Cajero desconectado
    socket.on('cajero_desconectado', (data) => {
      console.log('⚠️ Cajero desconectado:', data);
      setPendingValidations(prev => 
        prev.map(v => v.id === data.id 
          ? { ...v, cajeroDesconectado: true, mensaje: data.mensaje }
          : v
        )
      );
    });

    // Error del servidor
    socket.on('error', (error) => {
      console.error('❌ Error del socket:', error);
    });
  }, []);

  // Función para unirse a la sala admin
  const joinAdminRoom = useCallback((socket) => {
    if (!user || !isAdmin) {
      console.log('⚠️ No se puede unir a sala admin:', { user: !!user, isAdmin });
      return;
    }

    console.log('🚪 Uniéndose a sala admin...');
    socket.emit('join_admin', {
      usuario: user.username || user.nombre || 'Admin',
      rol: 'admin'
    });

    // Solicitar transferencias pendientes
    setTimeout(() => {
      console.log('📤 Solicitando transferencias pendientes via socket...');
      socket.emit('obtener_transferencias_pendientes');
    }, 100);
  }, [user, isAdmin]);

  // Efecto principal para manejar la conexión
  useEffect(() => {
    // Verificar que tenemos todo lo necesario
    if (!token || !user) {
      console.log('⏳ Esperando token y usuario...', { token: !!token, user: !!user });
      return;
    }

    if (!isAdmin) {
      console.log('👤 Usuario no es admin, no se conecta al socket de validaciones');
      return;
    }

    console.log('🚀 Iniciando conexión socket para admin...');

    // Conectar socket
    const socket = socketManager.connect(
      token,
      () => {
        setIsConnected(true);
        setIsReady(true);
        
        // Configurar listeners
        setupSocketListeners(socket);
        
        // Unirse a sala admin
        joinAdminRoom(socket);
        
        // Fetch inicial por si acaso
        fetchPendientes();
      },
      () => {
        setIsConnected(false);
        // Intentar reconectar después de 3 segundos
        retryTimeoutRef.current = setTimeout(() => {
          if (isAdmin && token) {
            console.log('🔄 Intentando reconectar...');
            fetchPendientes();
          }
        }, 3000);
      }
    );
    
    socketRef.current = socket;

    // Fetch inicial mientras se conecta
    fetchPendientes();

    // Cleanup
    return () => {
      console.log('🧹 Limpiando socket de validaciones...');
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (socket) {
        socket.removeAllListeners();
      }
      socketManager.disconnect();
      setIsConnected(false);
      setIsReady(false);
    };
  }, [token, user, isAdmin, setupSocketListeners, joinAdminRoom, fetchPendientes]);

  // Actualizar periódicamente si no hay conexión socket
  useEffect(() => {
    if (!isConnected && isAdmin && token) {
      const interval = setInterval(() => {
        console.log('🔄 Actualizando pendientes (sin socket)...');
        fetchPendientes();
      }, 10000); // Cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [isConnected, isAdmin, token, fetchPendientes]);

  // Funciones de interacción
  const solicitarValidacion = useCallback((datos) => {
    if (!socketRef.current?.connected) {
      console.error('❌ Socket no conectado para solicitar validación');
      return;
    }
    console.log('📤 Solicitando validación:', datos);
    socketRef.current.emit('solicitar_validacion_transferencia', datos);
  }, []);

  const cancelarValidacion = useCallback((id, motivo) => {
    if (!socketRef.current?.connected) {
      console.error('❌ Socket no conectado para cancelar validación');
      return;
    }
    console.log('❌ Cancelando validación:', id);
    socketRef.current.emit('cancelar_validacion_transferencia', { id, motivo });
  }, []);

  const responderValidacion = useCallback((id, validada, observaciones = '') => {
    if (!socketRef.current?.connected) {
      console.error('❌ Socket no conectado para responder validación');
      return;
    }
    console.log('📝 Respondiendo validación:', id, validada);
    socketRef.current.emit('responder_validacion_transferencia', {
      id,
      validada,
      observaciones,
      admin_usuario: user?.username || user?.nombre || 'Admin'
    });
  }, [user]);

  const actualizarPendientes = useCallback(() => {
    console.log('🔄 Actualizando pendientes manualmente...');
    
    // Intentar via socket primero
    if (socketRef.current?.connected) {
      socketRef.current.emit('obtener_transferencias_pendientes');
    }
    
    // También hacer fetch HTTP
    fetchPendientes();
  }, [fetchPendientes]);

  // Debug info
  useEffect(() => {
    console.log('📊 Estado de validaciones:', {
      isConnected,
      isReady,
      isAdmin,
      pendingCount: validationCount,
      lastFetch: lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString() : 'nunca'
    });
  }, [isConnected, isReady, isAdmin, validationCount, lastFetchTime]);

  return {
    // Estado
    pendingValidations,
    validationCount,
    isConnected,
    isReady,
    
    // Funciones
    solicitarValidacion,
    cancelarValidacion,
    responderValidacion,
    actualizarPendientes,
    
    // Socket functions (por compatibilidad)
    on: (event, callback) => socketRef.current?.on(event, callback),
    off: (event, callback) => socketRef.current?.off(event, callback),
    emit: (event, data) => socketRef.current?.emit(event, data),
  };
};