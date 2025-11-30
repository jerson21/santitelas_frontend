import { useState, useEffect } from 'react';
import ApiService from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        const normalizedUser = {
          ...parsedUser,
          rol: parsedUser.rol?.toLowerCase() || 'guest'
        };
        console.log('🔄 Cargando usuario existente:', normalizedUser);
        setUser(normalizedUser);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

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