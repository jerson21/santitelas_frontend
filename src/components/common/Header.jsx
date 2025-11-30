import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  User, 
  LogOut, 
  Shield, 
  ShoppingCart, 
  Calculator, 
  Menu,
  X,
  Settings,
  Home,
  BarChart3,
  Package,
  Users,
  FileText,
  Bell,
  HelpCircle
} from 'lucide-react';

const Header = ({ title, children, cartCount = 0, cartTotal = 0, onCartClick }) => {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    console.log('🚪 Logout desde Header...');
    await logout();
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  const getRoleIcon = () => {
    switch (user?.rol) {
      case 'admin':
        return <Shield className="w-5 h-5" />;
      case 'vendedor':
        return <ShoppingCart className="w-5 h-5" />;
      case 'cajero':
        return <Calculator className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = () => {
    switch (user?.rol) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'vendedor':
        return 'bg-blue-100 text-blue-800';
      case 'cajero':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Opciones de navegación según el rol
  const getNavOptions = () => {
    const baseOptions = [
      { icon: Home, label: 'Inicio', path: '/', roles: ['admin', 'vendedor', 'cajero'] }
    ];

    if (user?.rol === 'admin') {
      return [
        ...baseOptions,
        { icon: BarChart3, label: 'Dashboard', path: '/admin', roles: ['admin'] },
        { icon: Users, label: 'Usuarios', path: '/admin/usuarios', roles: ['admin'] },
        { icon: Package, label: 'Inventario', path: '/admin/inventario', roles: ['admin'] },
        { icon: FileText, label: 'Reportes', path: '/admin/reportes', roles: ['admin'] }
      ];
    }

    if (user?.rol === 'vendedor') {
      return [
        ...baseOptions,
        { icon: ShoppingCart, label: 'Ventas', path: '/vendedor', roles: ['vendedor'] },
        { icon: Package, label: 'Productos', path: '/vendedor/productos', roles: ['vendedor'] },
        { icon: FileText, label: 'Mis Vales', path: '/vendedor/vales', roles: ['vendedor'] }
      ];
    }

    if (user?.rol === 'cajero') {
      return [
        ...baseOptions,
        { icon: Calculator, label: 'Caja', path: '/cajero', roles: ['cajero'] },
        { icon: FileText, label: 'Vales Pendientes', path: '/cajero/vales', roles: ['cajero'] }
      ];
    }

    return baseOptions;
  };

  const navOptions = getNavOptions();

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Logo y Título */}
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-blue-600">Santi Telas</h1>
                {title && (
                  <span className="hidden sm:block text-xl font-semibold text-gray-800">{title}</span>
                )}
              </div>

              {/* Role Badge */}
              <span className={`hidden sm:flex px-3 py-1 rounded-full text-sm font-medium items-center space-x-1 ${getRoleColor()}`}>
                {getRoleIcon()}
                <span className="capitalize">{user?.rol}</span>
              </span>
            </div>

            {/* Center Section - Navigation (Desktop) - Oculto para cajero */}
            {user?.rol !== 'cajero' && (
              <nav className="hidden lg:flex items-center space-x-1">
                {navOptions.map((option) => (
                  <button
                    key={option.path}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => {
                      // Aquí podrías manejar la navegación
                      console.log(`Navegando a: ${option.path}`);
                    }}
                  >
                    <option.icon className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </nav>
            )}

            {/* Right Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Carrito Mejorado para Tablet */}
              {user?.rol === 'vendedor' && (
                <button
                  onClick={onCartClick}
                  className="relative p-3 text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 rounded-xl min-w-[80px] flex flex-col items-center"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <>
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                      <div className="text-xs font-semibold text-blue-600 mt-1">
                        ${cartTotal.toFixed(0)}
                      </div>
                    </>
                  )}
                </button>
              )}

              {/* Children (elementos personalizados) */}
              {children}

              {/* Notificaciones */}
              <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-700">{user?.nombre_completo}</p>
                    <p className="text-xs text-gray-500">@{user?.username}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {getRoleIcon()}
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.nombre_completo}</p>
                      <p className="text-xs text-gray-500">@{user?.username}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor()}`}>
                        {getRoleIcon()}
                        <span className="ml-1 capitalize">{user?.rol}</span>
                      </span>
                    </div>
                    
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Configuración</span>
                    </button>
                    
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4" />
                      <span>Ayuda</span>
                    </button>
                    
                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Menú</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <nav className="p-2">
              {navOptions.map((option) => (
                <button
                  key={option.path}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => {
                    console.log(`Navegando a: ${option.path}`);
                    setShowMobileMenu(false);
                  }}
                >
                  <option.icon className="w-5 h-5" />
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Click outside handlers */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Header;