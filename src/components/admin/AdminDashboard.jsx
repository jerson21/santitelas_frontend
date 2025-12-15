import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  Warehouse,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Plus,
  Activity,
  LogOut,
  Shield,
  Clock,
  AlertCircle,
  User,
  Cloud
} from 'lucide-react';
import ApiService from '../../services/api';
import UsuariosAdmin from './UsuariosAdmin';
import ProductosAdmin from './ProductosAdmin';
import CategoriasAdmin from './CategoriasAdmin';
import BodegasAdmin from './BodegasAdmin';
import StockAdmin from './StockAdmin';
import MovimientosStock from './MovimientosStock';
import MorosidadesAdmin from './MorosidadesAdmin';
import ClientesAdmin from './ClientesAdmin';
import RelbaseSyncAdmin from './RelbaseSyncAdmin';
import TransferValidationNotifications from './TransferValidationNotifications';


const AdminDashboard = () => {
  const [statistics, setStatistics] = useState({
    usuarios: { total: 0, activos: 0, loading: true },
    productos: { total: 0, activos: 0, loading: true },
    categorias: { total: 0, loading: true },
    bodegas: { total: 0, loading: true },
    valesPendientes: { total: 0, loading: true }
  });
  
  // Leer la vista inicial desde el hash de la URL
  const getInitialView = () => {
    const hash = window.location.hash.replace('#', '');
    const validViews = ['dashboard', 'usuarios', 'productos', 'categorias', 'bodegas', 'stock', 'movimientos', 'morosidades', 'clientes', 'relbase'];
    return validViews.includes(hash) ? hash : 'dashboard';
  };

  const [currentView, setCurrentView] = useState(getInitialView);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Sincronizar el hash de la URL con la vista actual
  useEffect(() => {
    window.location.hash = currentView;
  }, [currentView]);

  // Escuchar cambios en el hash (navegación con botones atrás/adelante)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validViews = ['dashboard', 'usuarios', 'productos', 'categorias', 'bodegas', 'stock', 'movimientos', 'morosidades', 'clientes', 'relbase'];
      if (validViews.includes(hash) && hash !== currentView) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView]);

  // Módulos disponibles con sus configuraciones
  const adminModules = [    
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      description: 'Crear, editar y administrar usuarios del sistema',
      icon: Users,
      color: 'bg-blue-600 hover:bg-blue-700',
      endpoint: '/admin/usuarios',
      actions: ['view', 'create', 'edit'],
      comingSoon: false,
      component: UsuariosAdmin
    },
    {
      id: 'productos',
      title: 'Gestión de Productos',
      description: 'Administrar catálogo de productos y precios',
      icon: Package,
      color: 'bg-green-600 hover:bg-green-700',
      endpoint: '/productos-admin',
      actions: ['view', 'create', 'edit'],
      comingSoon: false,
      component: ProductosAdmin
    },
    {
      id: 'categorias',
      title: 'Gestión de Categorías',
      description: 'Organizar productos por categorías',
      icon: FileText,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      endpoint: '/categorias',
      actions: ['view', 'create', 'edit'],
      comingSoon: false,
      component: CategoriasAdmin
    },
    {
      id: 'bodegas',
      title: 'Gestión de Bodegas',
      description: 'Configurar bodegas y ubicaciones de stock',
      icon: Warehouse,
      color: 'bg-purple-600 hover:bg-purple-700',
      endpoint: '/bodegas',
      actions: ['view', 'create', 'edit'],
      comingSoon: false,
      component: BodegasAdmin
    },
    {
      id: 'stock',
      title: 'Control de Stock',
      description: 'Monitorear inventario y movimientos',
      icon: Activity,
      color: 'bg-teal-600 hover:bg-teal-700',
      endpoint: '/stock',
      actions: ['view'],
      comingSoon: false,
      component: StockAdmin
    },
    {
      id: 'movimientos',
      title: 'Historial de Movimientos',
      description: 'Ver registro de entradas, salidas y transferencias',
      icon: Clock,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      endpoint: '/stock/movimientos',
      actions: ['view'],
      comingSoon: false,
      component: MovimientosStock
    },
    {
      id: 'morosidades',
      title: 'Morosidades y Cobranzas',
      description: 'Control de vales pendientes, cobrados y deudas de clientes',
      icon: AlertTriangle,
      color: 'bg-orange-600 hover:bg-orange-700',
      endpoint: '/cajero/reportes',
      actions: ['view'],
      comingSoon: false,
      component: MorosidadesAdmin
    },
    {
      id: 'clientes',
      title: 'Gestión de Clientes',
      description: 'Administrar datos de clientes y facturación',
      icon: Users,
      color: 'bg-cyan-600 hover:bg-cyan-700',
      endpoint: '/admin/clientes',
      actions: ['view', 'create', 'edit'],
      comingSoon: false,
      component: ClientesAdmin
    },
    {
      id: 'relbase',
      title: 'Sincronización Relbase',
      description: 'Sincronizar productos con sistema de facturación Relbase',
      icon: Cloud,
      color: 'bg-sky-600 hover:bg-sky-700',
      endpoint: '/relbase/sync',
      actions: ['view'],
      comingSoon: false,
      component: RelbaseSyncAdmin
    },
    {
      id: 'reportes',
      title: 'Reportes y Estadísticas',
      description: 'Visualizar métricas y generar reportes',
      icon: BarChart3,
      color: 'bg-amber-600 hover:bg-amber-700',
      endpoint: null,
      actions: [],
      comingSoon: true
    }
  ];

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuthentication();
    setupAxiosInterceptor();
  }, []);

  // Cargar estadísticas cuando esté autenticado
  useEffect(() => {
    if (userInfo && !sessionExpired) {
      loadStatistics();
    }
  }, [userInfo, sessionExpired]);

  // Configurar interceptor para manejar errores 401
  const setupAxiosInterceptor = () => {
    // Si ApiService usa axios internamente, puedes configurar un interceptor
    // Esto depende de cómo esté implementado tu ApiService
    
    // Opción 1: Si tienes acceso a axios
    /*
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          handleSessionExpired();
        }
        return Promise.reject(error);
      }
    );
    */
    
    // Opción 2: Wrapper para métodos de ApiService
    const originalRequest = ApiService.request;
    if (originalRequest) {
      ApiService.request = async (...args) => {
        try {
          const response = await originalRequest.apply(ApiService, args);
          return response;
        } catch (error) {
          if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            handleSessionExpired();
          }
          throw error;
        }
      };
    }
  };

  const checkAuthentication = async () => {
    try {
      const token = ApiService.getToken();
      
      if (!token) {
        console.log('No hay token, redirigiendo a login...');
        handleLogout();
        return;
      }

      // Verificar si el token es válido
      const response = await ApiService.verifyToken();
      
      if (response.success && response.data) {
        setUserInfo(response.data.user || { 
          nombre: 'Usuario Admin',
          email: 'admin@santitelas.cl',
          rol: 'admin'
        });
        setSessionExpired(false);
      } else {
        handleSessionExpired();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      handleSessionExpired();
    }
  };

  const handleSessionExpired = () => {
    setSessionExpired(true);
    // Opcional: mostrar mensaje
    setTimeout(() => {
      handleLogout();
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      // Limpiar estado local
      ApiService.setToken(null);
      localStorage.removeItem('token');
      
      // Redirigir a login
      // Opción 1: Si usas React Router
      // navigate('/login');
      
      // Opción 2: Redirección directa
      window.location.href = '/login';
    }
  };

  const loadStatistics = async () => {
    setIsLoading(true);
    
    // Función helper para manejar errores 401
    const handleApiCall = async (apiCall, defaultValue) => {
      try {
        return await apiCall();
      } catch (error) {
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          handleSessionExpired();
          return null;
        }
        console.error(error);
        return defaultValue;
      }
    };
    
    // Cargar usuarios
    const usuariosResponse = await handleApiCall(
      () => ApiService.getUsuarios(),
      { data: [] }
    );
    
    if (usuariosResponse) {
      const usuarios = usuariosResponse.data || [];
      setStatistics(prev => ({
        ...prev,
        usuarios: {
          total: usuarios.length,
          activos: usuarios.filter(u => u && u.activo).length,
          loading: false
        }
      }));
    }

    // Cargar categorías
    const categoriasData = await handleApiCall(
      () => ApiService.getCategorias({ con_productos: true }),
      { data: [] }
    );
    
    if (categoriasData) {
      setStatistics(prev => ({
        ...prev,
        categorias: {
          total: categoriasData.data?.length || 0,
          loading: false
        }
      }));
    }

    // Cargar bodegas
    const bodegasData = await handleApiCall(
      () => ApiService.getBodegas(),
      { data: [] }
    );
    
    if (bodegasData) {
      setStatistics(prev => ({
        ...prev,
        bodegas: {
          total: bodegasData.data?.length || 0,
          loading: false
        }
      }));
    }

    // Cargar productos
    const productosData = await handleApiCall(
      () => ApiService.getProductosCatalogo({ limit: 1000 }),
      { data: [] }
    );
    
    if (productosData) {
      setStatistics(prev => ({
        ...prev,
        productos: {
          total: productosData.data?.length || 0,
          activos: productosData.data?.filter(p => p.activo !== false).length || 0,
          loading: false
        }
      }));
    }

    // Cargar estadísticas del cajero
    const cajeroStats = await handleApiCall(
      () => ApiService.getEstadisticasCajero(),
      { data: { pendientes_historicos: { total: 0 } } }
    );
    
    if (cajeroStats) {
      setStatistics(prev => ({
        ...prev,
        valesPendientes: {
          total: cajeroStats.data?.pendientes_historicos?.total || 0,
          loading: false
        }
      }));
    }

    setIsLoading(false);
  };

  const handleModuleClick = (module) => {
    if (module.comingSoon) {
      alert(`El módulo "${module.title}" estará disponible próximamente`);
      return;
    }
    
    setCurrentView(module.id);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Componente de sesión expirada
  const SessionExpiredModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Sesión Expirada</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.
        </p>
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ir a Login
          </button>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ title, value, loading, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
          {loading ? (
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin text-gray-400" />
              <span className="text-sm text-gray-400">Cargando...</span>
            </div>
          ) : (
            <>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              {subtext && (
                <p className="text-xs text-gray-500 mt-1">{subtext}</p>
              )}
            </>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color.replace('text-', 'text-').replace('-600', '-400')}`} />
      </div>
    </div>
  );

  const ModuleDetail = ({ module }) => {
    // Si el módulo tiene un componente personalizado, renderizarlo
    if (module.component) {
      const Component = module.component;
      // Props especiales para ciertos componentes
      const componentProps = {};
      if (module.id === 'stock') {
        componentProps.onOpenMovimientos = () => setCurrentView('movimientos');
      }
      if (module.id === 'movimientos') {
        componentProps.onBack = () => setCurrentView('stock');
      }
      return <Component {...componentProps} />;
    }

    // Renderizado genérico para módulos sin componente personalizado
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center">
            <button
              onClick={handleBackToDashboard}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <module.icon className="w-8 h-8 mr-3 text-gray-700" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{module.title}</h2>
              <p className="text-gray-600">{module.description}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {module.actions.includes('create') && (
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo
              </button>
            )}
            {module.actions.includes('view') && (
              <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Eye className="w-4 h-4 mr-2" />
                Ver Todos
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-1">Módulo en Desarrollo</h4>
              <p className="text-sm text-blue-700">
                Este módulo está conectado al endpoint <code className="bg-blue-100 px-1 rounded">{module.endpoint}</code> 
                y está listo para implementar la funcionalidad completa.
              </p>
            </div>
          </div>
        </div>

        {/* Aquí irían los componentes específicos de cada módulo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-2">Funcionalidades Disponibles</h5>
            <ul className="space-y-1 text-sm text-gray-600">
              {module.actions.includes('view') && (
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Visualizar registros
                </li>
              )}
              {module.actions.includes('create') && (
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Crear nuevos registros
                </li>
              )}
              {module.actions.includes('edit') && (
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Editar existentes
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Mostrar modal de sesión expirada
  if (sessionExpired) {
    return <SessionExpiredModal />;
  }

  if (currentView !== 'dashboard') {
    const module = adminModules.find(m => m.id === currentView);
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Componente de notificaciones de transferencias */}
        <TransferValidationNotifications />

        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-800">Santi Telas - Admin</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ← Volver al Dashboard
                </button>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{userInfo?.nombre || 'Admin'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ModuleDetail module={module} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Componente de notificaciones de transferencias */}
      <TransferValidationNotifications />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-800">Santi Telas - Panel de Administración</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Información del usuario */}
              <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-800">{userInfo?.nombre || 'Usuario Admin'}</p>
                  <p className="text-xs text-gray-500">{userInfo?.rol || 'Administrador'}</p>
                </div>
              </div>
              
              {/* Botón de actualizar */}
              <button
                onClick={loadStatistics}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              
              {/* Botón de logout */}
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Dashboard Administrativo
              </h2>
              <p className="text-gray-600">
                Gestiona todos los aspectos del sistema Santi Telas desde un solo lugar
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date().toLocaleDateString('es-CL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Usuarios"
            value={statistics.usuarios.total}
            loading={statistics.usuarios.loading}
            icon={Users}
            color="text-blue-600"
            subtext={`${statistics.usuarios.activos} activos`}
          />
          <StatCard
            title="Productos Activos"
            value={statistics.productos.total}
            loading={statistics.productos.loading}
            icon={Package}
            color="text-green-600"
            subtext={`${statistics.productos.activos} activos`}
          />
          <StatCard
            title="Categorías"
            value={statistics.categorias.total}
            loading={statistics.categorias.loading}
            icon={FileText}
            color="text-indigo-600"
          />
          <StatCard
            title="Bodegas"
            value={statistics.bodegas.total}
            loading={statistics.bodegas.loading}
            icon={Warehouse}
            color="text-purple-600"
          />
        </div>

        {/* Alerta de vales pendientes */}
        {statistics.valesPendientes.total > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-800">
                  Atención: {statistics.valesPendientes.total} vales pendientes
                </h4>
                <p className="text-sm text-yellow-700">
                  Hay vales esperando ser procesados en caja
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Módulos administrativos */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Módulos Administrativos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminModules.map((module) => {
              const IconComponent = module.icon;
              
              return (
                <div
                  key={module.id}
                  onClick={() => handleModuleClick(module)}
                  className={`relative ${module.color} text-white p-6 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-200`}
                >
                  {module.comingSoon && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-semibold">
                      Próximamente
                    </div>
                  )}
                  
                  <div className="flex items-center mb-4">
                    <IconComponent className="w-8 h-8 mr-3" />
                    <h3 className="text-xl font-bold">{module.title}</h3>
                  </div>
                  
                  <p className="text-white/90 text-sm leading-relaxed mb-4">
                    {module.description}
                  </p>

                  {!module.comingSoon && (
                    <div className="flex items-center text-white/80 text-xs">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span>API conectada</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Estado del sistema */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">APIs funcionando correctamente</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Base de datos conectada</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Algunos módulos en desarrollo</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;