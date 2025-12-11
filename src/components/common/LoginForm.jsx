import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Lock, AlertCircle } from 'lucide-react';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { login, loading, error } = useAuth();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setLocalError('Complete todos los campos');
      return;
    }

    console.log('📝 Iniciando login desde LoginForm...');
    setLocalError('');
    
    const result = await login(credentials);
    
    if (result.success) {
      console.log('🎉 Login exitoso desde LoginForm:', result.user.username);
      
      // Forzar navegación inmediata
      console.log('🔄 Forzando navegación inmediata...');
      window.location.href = '/';
      
    } else {
      setLocalError(result.error || 'Error en el login');
      console.log('❌ Login fallido desde LoginForm:', result.error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Santi Telas"
            className="h-14 w-auto mx-auto mb-4"
          />
          <p className="text-gray-600">Sistema de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese su usuario"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese su contraseña"
                required
                disabled={loading}
              />
            </div>
          </div>

          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !credentials.username || !credentials.password}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Ingresando...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Sistema Multi-Rol</p>
          <p className="mt-1">Vendedor • Admin • Cajero</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;