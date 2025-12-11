import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  Shield,
  Calendar,
  User
} from 'lucide-react';
import ApiService from '../../services/api';

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Estado de paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Ref para scroll a la tabla
  const tableRef = useRef(null);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    email: '',
    password: '',
    confirmarPassword: '',
    id_rol: '', // Inicializar vacío hasta cargar roles
    telefono: '',
    activo: true
  });

  // Cargar roles desde la BD
  const loadRoles = async () => {
    try {
      const response = await ApiService.getRoles();
      if (response.success && response.data) {
        setRoles(response.data);
        // Establecer el primer rol como default si existe
        if (response.data.length > 0 && !formData.id_rol) {
          setFormData(prev => ({ ...prev, id_rol: response.data[0].id_rol }));
        }
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setErrors({ general: 'Error al cargar los roles' });
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar usuarios cuando cambian los filtros o la página
  useEffect(() => {
    loadUsuarios();
  }, [pagination.page, pagination.limit, debouncedSearch, filterStatus]);

  // Cargar usuarios
  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterStatus === 'activos') params.activo = true;
      if (filterStatus === 'inactivos') params.activo = false;

      const response = await ApiService.getUsuarios(params);
      if (response.success && response.data) {
        setUsuarios(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            ...response.pagination
          }));
        }
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de paginación
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.pages) {
      setPagination(prev => ({ ...prev, page }));
      // Scroll suave a la tabla
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadRoles();
  }, []);

  // Función auxiliar para obtener el nombre del rol por ID
  const getRoleName = (idRol) => {
    const rol = roles.find(r => r.id_rol === idRol);
    return rol ? rol.nombre : 'Usuario';
  };

  // Función auxiliar para obtener el ID del rol por nombre
  const getRoleId = (nombreRol) => {
    const rol = roles.find(r => r.nombre.toLowerCase() === nombreRol.toLowerCase());
    return rol ? rol.id_rol : null;
  };

  // Filtrar usuarios solo por rol (búsqueda y estado se hacen en servidor)
  const usuariosFiltrados = usuarios.filter(usuario => {
    if (!usuario) return false;
    const rol = usuario.rol || '';
    const matchRole = filterRole === 'todos' || rol.toLowerCase() === filterRole.toLowerCase();
    return matchRole;
  });

  // Componente de paginación
  const PaginationComponent = () => {
    if (pagination.pages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = window.innerWidth < 640 ? 3 : 5;
      let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
      let end = Math.min(pagination.pages, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-3 bg-white border-t border-gray-200 gap-3">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xs sm:text-sm text-gray-700">
            <span className="hidden sm:inline">Mostrando </span>
            <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>-
            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
            <span className="hidden sm:inline"> de</span>
            <span className="sm:hidden">/</span>
            <span className="font-medium"> {pagination.total}</span>
          </span>
          <select
            value={pagination.limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={pagination.page === 1}
            className="p-1 sm:p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-1 sm:p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map(pageNum => (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                pageNum === pagination.page
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="p-1 sm:p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => goToPage(pagination.pages)}
            disabled={pagination.page === pagination.pages}
            className="p-1 sm:p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre completo es requerido';
    }
    
    if (!showEditModal && !formData.usuario.trim()) {
      newErrors.usuario = 'El nombre de usuario es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!showEditModal || formData.password) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.password !== formData.confirmarPassword) {
        newErrors.confirmarPassword = 'Las contraseñas no coinciden';
      }
    }
    
    if (!formData.id_rol) {
      newErrors.id_rol = 'Debe seleccionar un rol';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear usuario
  const handleCreate = async () => {
    if (!validateForm()) return;
    
    try {
      const { confirmarPassword, nombre, ...restData } = formData;
      const userData = {
        ...restData,
        nombre_completo: nombre,
        password: formData.password
      };
      
      const response = await ApiService.createUsuario(userData);
      
      if (response.success) {
        setSuccessMessage('Usuario creado exitosamente');
        setShowCreateModal(false);
        resetForm();
        loadUsuarios();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: response.message || 'Error al crear usuario' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Error al crear usuario' });
    }
  };

  // Actualizar usuario
  const handleUpdate = async () => {
    if (!validateForm()) return;
    
    try {
      const { confirmarPassword, nombre, usuario, ...restData } = formData;
      const userData = {
        nombre_completo: nombre,
        email: restData.email,
        telefono: restData.telefono,
        id_rol: restData.id_rol,
        activo: restData.activo
      };
      
      // Solo incluir password si se cambió
      if (restData.password) {
        userData.password = restData.password;
      }
      
      const response = await ApiService.updateUsuario 
        ? await ApiService.updateUsuario(selectedUser.id_usuario, userData)
        : await ApiService.request(`/admin/usuarios/${selectedUser.id_usuario}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
          });
      
      if (response.success) {
        setSuccessMessage('Usuario actualizado exitosamente');
        setShowEditModal(false);
        resetForm();
        loadUsuarios();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: response.message || 'Error al actualizar usuario' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Error al actualizar usuario' });
    }
  };

  // Activar/Desactivar usuario
  const toggleUserStatus = async (usuario) => {
    try {
      const response = await ApiService.toggleUsuarioStatus 
        ? await ApiService.toggleUsuarioStatus(usuario.id_usuario, !usuario.activo)
        : await ApiService.request(`/admin/usuarios/${usuario.id_usuario}/activar`, {
            method: 'PATCH',
            body: JSON.stringify({ activo: !usuario.activo })
          });
      
      if (response.success) {
        setSuccessMessage(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'} exitosamente`);
        loadUsuarios();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      setErrors({ general: error.message });
    }
  };

  // Abrir modal de edición
  const openEditModal = (usuario) => {
    setSelectedUser(usuario);
    const rolId = getRoleId(usuario.rol) || (roles.length > 0 ? roles[0].id_rol : '');
    setFormData({
      nombre: usuario.nombre_completo || '',
      usuario: usuario.usuario || '',
      email: usuario.email || '',
      password: '',
      confirmarPassword: '',
      id_rol: rolId,
      telefono: usuario.telefono || '',
      activo: usuario.activo !== undefined ? usuario.activo : true
    });
    setErrors({});
    setShowEditModal(true);
  };

  // Reset formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      usuario: '',
      email: '',
      password: '',
      confirmarPassword: '',
      id_rol: roles.length > 0 ? roles[0].id_rol : '',
      telefono: '',
      activo: true
    });
    setErrors({});
    setSelectedUser(null);
  };

  // Toggle row expansion
  const toggleRowExpansion = (userId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color del rol dinámicamente
  const getRoleColor = (rol) => {
    if (!rol) return 'bg-gray-100 text-gray-800';
    
    const rolLower = rol.toLowerCase();
    
    // Colores predefinidos para roles comunes
    const colors = {
      administrador: 'bg-purple-100 text-purple-800',
      admin: 'bg-purple-100 text-purple-800',
      cajero: 'bg-blue-100 text-blue-800',
      bodeguero: 'bg-green-100 text-green-800',
      vendedor: 'bg-orange-100 text-orange-800',
      usuario: 'bg-gray-100 text-gray-800',
      supervisor: 'bg-indigo-100 text-indigo-800',
      gerente: 'bg-red-100 text-red-800'
    };
    
    return colors[rolLower] || 'bg-gray-100 text-gray-800';
  };

  // Calcular estadísticas por rol
  const getRoleCount = (roleName) => {
    return usuarios.filter(u => u && u.rol && u.rol.toLowerCase() === roleName.toLowerCase()).length;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header con estadísticas dinámicas */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-bold text-gray-800">{usuarios.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-bold text-green-600">
              {usuarios.filter(u => u && u.activo).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Activos</div>
          </div>
          {/* Mostrar estadísticas por cada rol */}
          {roles.slice(0, 4).map((rol) => (
            <div key={rol.id_rol} className="text-center">
              <div className={`text-xl sm:text-3xl font-bold ${
                rol.nombre.toLowerCase().includes('admin') ? 'text-purple-600' :
                rol.nombre.toLowerCase().includes('cajero') ? 'text-blue-600' :
                rol.nombre.toLowerCase().includes('bodeguero') ? 'text-green-600' :
                'text-orange-600'
              }`}>
                {getRoleCount(rol.nombre)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">{rol.nombre}s</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <Check className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Mensaje de error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <span className="text-red-800">{errors.general}</span>
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filtros y botones */}
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex-1 min-w-[120px] px-2 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="todos">Todos roles</option>
              {roles.map((rol) => (
                <option key={rol.id_rol} value={rol.nombre.toLowerCase()}>
                  {rol.nombre}s
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 min-w-[100px] px-2 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>

            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>

            <button
              onClick={loadUsuarios}
              disabled={loading}
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div ref={tableRef} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin text-gray-400" />
                      <span className="text-gray-500">Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <React.Fragment key={usuario.id_usuario}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.nombre_completo || 'Sin nombre'}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{usuario.usuario || 'usuario'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {usuario.email || 'Sin email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(usuario.rol)}`}>
                          {usuario.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usuario.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(usuario.ultimo_acceso)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => toggleRowExpansion(usuario.id_usuario)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Ver detalles"
                          >
                            {expandedRows.has(usuario.id_usuario) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(usuario)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(usuario)}
                            className={`${
                              usuario.activo 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            {usuario.activo ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(usuario.id_usuario) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Información de Usuario</div>
                              <div className="space-y-1">
                                <div className="flex items-center text-gray-600">
                                  <User className="w-4 h-4 mr-2" />
                                  Usuario: @{usuario.usuario || 'Sin usuario'}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Mail className="w-4 h-4 mr-2" />
                                  {usuario.email || 'No registrado'}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Phone className="w-4 h-4 mr-2" />
                                  {usuario.telefono || 'No registrado'}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Permisos</div>
                              <div className="flex items-center text-gray-600">
                                <Shield className="w-4 h-4 mr-2" />
                                Rol: {usuario.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : 'Usuario'}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Fechas</div>
                              <div className="space-y-1">
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Creado: {formatDate(usuario.fecha_creacion)}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Último acceso: {formatDate(usuario.ultimo_acceso)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationComponent />
      </div>

      {/* Modal Crear/Editar Usuario */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              {showEditModal ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h2>
            
            {errors.general && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm text-red-800">{errors.general}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => !showEditModal && setFormData({ ...formData, usuario: e.target.value })}
                  placeholder="admin, maria, juan..."
                  readOnly={showEditModal}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.usuario ? 'border-red-500' : 'border-gray-300'
                  } ${showEditModal ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {errors.usuario ? (
                  <p className="mt-1 text-sm text-red-600">{errors.usuario}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    {showEditModal ? 'El nombre de usuario no se puede cambiar' : 'Se usará para iniciar sesión'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {showEditModal && '(dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={formData.confirmarPassword}
                  onChange={(e) => setFormData({ ...formData, confirmarPassword: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmarPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.confirmarPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmarPassword}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.id_rol}
                  onChange={(e) => setFormData({ ...formData, id_rol: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.id_rol ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {roles.length === 0 ? (
                    <option value="">Cargando roles...</option>
                  ) : (
                    roles.map((rol) => (
                      <option key={rol.id_rol} value={rol.id_rol}>
                        {rol.nombre}
                      </option>
                    ))
                  )}
                </select>
                {errors.id_rol && (
                  <p className="mt-1 text-sm text-red-600">{errors.id_rol}</p>
                )}
              </div>
              
              {showEditModal && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                  </label>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={showEditModal ? handleUpdate : handleCreate}
                disabled={roles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {showEditModal ? 'Actualizar' : 'Crear'} Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;