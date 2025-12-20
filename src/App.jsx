import React from 'react';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/common/LoginForm';
import VendedorDashboard from './components/vendedor/VendedorDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import CajeroDashboard from './components/cajero/CajeroDashboard';
import { Loader2, LogOut } from 'lucide-react';

function App() {
  const { user, loading, isAuthenticated, isVendedor, isAdmin, isCajero, logout } = useAuth();

  // Debug logging
  console.log('🔍 App render:', {
    user: user?.username,
    rol: user?.rol,
    isAuthenticated,
    isVendedor,
    isAdmin,
    isCajero
  });

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Router basado en rol
  const renderDashboard = () => {
    if (isVendedor) {
      return <VendedorDashboard />;
    }
    
    if (isAdmin) {
      return <AdminDashboard />;
    }
    
    if (isCajero) {
      return <CajeroDashboard />;
    }

    // Rol no reconocido
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <LogOut className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Acceso Denegado
            </h1>
            <p className="text-gray-600 mb-6">
              Tu rol <span className="font-semibold">({user?.rol})</span> no tiene acceso a este sistema.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Por favor, contacta al administrador si crees que esto es un error.
            </p>
            <div className="space-y-3">
              <button
                onClick={logout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Intentar de Nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="App min-h-screen overflow-auto touch-scroll">
      {renderDashboard()}
    </div>
  );
}

export default App;