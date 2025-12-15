import { useState, useEffect, useCallback, useRef } from 'react';
import ApiService from '../services/api';

// Intervalo de verificación del token (5 minutos)
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000;

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const checkIntervalRef = useRef(null);

  // Función para limpiar sesión
  const clearSession = useCallback(() => {
    console.log('🧹 Limpiando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    ApiService.setToken(null);
    setUser(null);
  }, []);

  // Verificar token contra el backend
  const verifyTokenWithBackend = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return false;
      }

      console.log('🔐 Verificando token con el backend...');
      const response = await ApiService.verifyToken();

      if (response.success && response.data) {
        console.log('✅ Token válido');
        return true;
      } else {
        console.warn('⚠️ Token inválido según backend');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      return false;
    }
  }, []);

  // Verificación inicial del estado de autenticación
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        console.log('🚫 No hay sesión guardada');
        clearSession();
        return;
      }

      // Primero cargar datos locales para UI rápida
      const parsedUser = JSON.parse(userData);
      const normalizedUser = {
        ...parsedUser,
        rol: parsedUser.rol?.toLowerCase() || 'guest'
      };

      // Verificar token con el backend
      const isValid = await verifyTokenWithBackend();

      if (isValid) {
        console.log('🔄 Sesión válida, cargando usuario:', normalizedUser);
        setUser(normalizedUser);
      } else {
        console.warn('⚠️ Sesión expirada - limpiando datos');
        clearSession();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession, verifyTokenWithBackend]);

  // Efecto principal: verificar al cargar + escuchar evento session-expired
  useEffect(() => {
    checkAuthStatus();

    // Escuchar evento global de sesión expirada (disparado por ApiService)
    const handleSessionExpired = (event) => {
      console.warn('🚪 Evento session-expired recibido en useAuth');
      clearSession();
      // Opcional: mostrar mensaje al usuario
      if (event.detail?.message) {
        alert(event.detail.message);
      }
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [checkAuthStatus, clearSession]);

  // Efecto: verificación periódica del token (cada 5 minutos)
  useEffect(() => {
    if (!user) {
      // Limpiar intervalo si no hay usuario
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    console.log('⏰ Iniciando verificación periódica del token (cada 5 min)');

    checkIntervalRef.current = setInterval(async () => {
      console.log('⏰ Verificación periódica del token...');
      const isValid = await verifyTokenWithBackend();

      if (!isValid) {
        console.warn('⚠️ Token expirado detectado en verificación periódica');
        clearSession();
        alert('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
      }
    }, TOKEN_CHECK_INTERVAL);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user, verifyTokenWithBackend, clearSession]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Intentando login con:', credentials.username);
      const response = await ApiService.login(credentials);
      
      if (response.success) {
        const { token, usuario } = response.data;
        
        const normalizedUser = {
          ...usuario,
          rol: usuario.rol?.toLowerCase() || 'guest'
        };
        
        console.log('✅ Login exitoso. Guardando usuario:', normalizedUser);
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        
        // Forzar actualización del estado
        setUser(normalizedUser);
        
        // Log para confirmar que el estado se actualizó
        setTimeout(() => {
          console.log('🔄 Usuario establecido en estado');
        }, 100);
        
        return { success: true, user: normalizedUser };
      } else {
        console.log('❌ Login fallido:', response.message);
        setError(response.message || 'Error en login');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error de conexión';
      console.error('💥 Error en login:', error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await ApiService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      console.log('✅ Sesión cerrada');
    }
  };

  const hasRole = (role) => {
    if (!user?.rol || !role) return false;
    return user.rol.toLowerCase() === role.toLowerCase();
  };

  const hasPermission = (permission) => {
    return user?.permisos?.includes(permission);
  };

  // Calcular valores derivados de forma simple
  const isAuthenticated = !!user;
  const isVendedor = user?.rol === 'vendedor';
  const isAdmin = user?.rol === 'administrador' || user?.rol === 'admin';
  const isCajero = user?.rol === 'cajero';

  // Debug log cuando cambie el user
  useEffect(() => {
    console.log('👤 Estado del usuario cambió:', {
      username: user?.username,
      rol: user?.rol,
      isAuthenticated,
      isVendedor,
      isAdmin,
      isCajero
    });
  }, [user]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    hasPermission,
    isAuthenticated,
    isVendedor,
    isAdmin,
    isCajero
  };
};