import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Package, Search, Filter, Plus, Edit2, DollarSign, Eye, Upload, RefreshCw, ChevronDown,
  ChevronRight, MoreVertical, AlertCircle, Check, X, FileSpreadsheet, Layers, Tag,
  BarChart3, Loader2, Save, Trash2, Copy, ShoppingCart, Palette, Ruler, Box, Info,
  AlertTriangle, Download
} from 'lucide-react';

import ApiService from '../../services/api'; 
import ProductoFormModal from './ProductoFormModal';
import VarianteFormModal from './VarianteFormModal';
import { debounce } from '../../utils/debounce';

// 🔧 Componentes de edición inline
const EditableField = ({ value, onSave, onStartEditing, onEndEditing, type = "number", prefix = "$", className = "" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => { setCurrentValue(value); }, [value]);
  useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);
  const handleSave = async () => { setIsEditing(false); onEndEditing(); if (currentValue != value) { try { await onSave(currentValue); } catch (error) { console.error("Fallo al guardar:", error); setCurrentValue(value); } } };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setIsEditing(false); onEndEditing(); setCurrentValue(value); } };
  if (isEditing) {
    return (
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-2 text-gray-400 text-xs">{prefix}</span>}
        <input ref={inputRef} type={type} value={currentValue} onChange={e => setCurrentValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className={`pl-5 pr-2 py-1 border rounded-md focus:outline-none ring-2 ring-blue-500 w-24 text-right ${className}`} />
      </div>
    );
  }
  return (
    <button onClick={() => { setIsEditing(true); onStartEditing(); }} className={`group text-left hover:bg-gray-200 px-2 py-1 rounded transition-colors inline-flex items-center justify-end w-24 ${className}`}>
      <span>{type === 'number' ? ApiService.formatPrice(value) : value}</span>
      <Edit2 className="w-3 h-3 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

const EditableToggle = ({ checked, onSave, onStartEditing, onEndEditing }) => {
  const handleSave = async (newChecked) => {
    onStartEditing();
    try { await onSave(newChecked); } catch (e) { console.error("Error al guardar toggle", e); }
    finally { onEndEditing(); }
  };
  return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => handleSave(e.target.checked)} className="sr-only peer" />
        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
  );
};

// --- Componente Modal de Confirmación ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, variantDetails }) => {
    const [detailsVisible, setDetailsVisible] = useState(false);
    useEffect(() => { if (isOpen) setDetailsVisible(false); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" role="alertdialog">
                <div className="p-5"> <div className="flex items-start"> <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-amber-100"><AlertTriangle className="h-6 w-6 text-amber-600" /></div> <div className="ml-4 text-left w-full"> <h3 className="text-lg font-semibold text-slate-800">{title}</h3> <p className="text-sm text-slate-600 mt-1" dangerouslySetInnerHTML={{ __html: message }}></p> {variantDetails?.length > 0 && (<div className="mt-3 text-sm"> <button onClick={() => setDetailsVisible(!detailsVisible)} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-xs">{detailsVisible ? 'Ocultar' : 'Ver'} variantes afectadas <ChevronDown className={`w-4 h-4 transition-transform ${detailsVisible ? 'rotate-180' : ''}`} /></button> {detailsVisible && <ul className="mt-2 pl-4 list-disc text-slate-500 bg-slate-50 p-2 rounded-md border text-xs max-h-24 overflow-y-auto">{variantDetails.map((v, i) => <li key={i}>{v}</li>)}</ul>} </div>)} </div> </div> </div>
                <div className="bg-slate-50 px-5 py-3 flex justify-end items-center gap-3 rounded-b-lg"><button onClick={onCancel} className="px-4 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100">{cancelText}</button><button onClick={onConfirm} className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">{confirmText}</button></div>
            </div>
        </div>
    );
};

// =====================================================
// COMPONENTE PRINCIPAL: ProductosAdmin con Tabla
// =====================================================
const ProductosAdmin = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [estructura, setEstructura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false); // Nuevo estado para indicador de búsqueda
  const [paginacion, setPaginacion] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filtros, setFiltros] = useState({ busqueda: '', categoria: '', tipo: '', con_stock: false, page: 1 });
  
  const [productosExpandidos, setProductosExpandidos] = useState({});
  const [variantesExpandidas, setVariantesExpandidas] = useState({});
  const [editingInfo, setEditingInfo] = useState(null);
  const [confirmation, setConfirmation] = useState({ isOpen: false });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showVarianteModal, setShowVarianteModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  // Estados para importación/exportación
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // Mapear filtros correctamente para la API
      const filtrosAPI = {
        categoria: filtros.categoria || undefined,
        tipo: filtros.tipo || undefined,
        con_stock: filtros.con_stock || undefined,
        page: filtros.page,
        limit: 20,
        // IMPORTANTE: La API espera 'search', no 'busqueda'
        search: filtros.busqueda || undefined
      };
      
      // Limpiar valores undefined
      Object.keys(filtrosAPI).forEach(key =>
        filtrosAPI[key] === undefined && delete filtrosAPI[key]
      );

      const [productosRes, categoriasRes, estructuraRes] = await Promise.all([
        ApiService.getProductosCatalogo(filtrosAPI),
        !categorias.length ? ApiService.getCategorias() : Promise.resolve({ success: true, data: categorias }),
        !estructura ? ApiService.getEstructuraCatalogo() : Promise.resolve({ success: true, data: estructura })
      ]);

      if (productosRes?.success) {
        // Normalizar datos de productos para consistencia
        const productosNormalizados = (productosRes.data || []).map(producto => ({
          ...producto,
          modelo: producto.modelo || producto.nombre,
          variantes: producto.variantes || producto.opciones || [] // ✅ Normalizado a 'variantes'
        }));

        setProductos(productosNormalizados);
        if (productosRes.pagination) setPaginacion(productosRes.pagination);
      }
      if (categoriasRes?.success && !categorias.length) setCategorias(categoriasRes.data || []);
      if (estructuraRes?.success && !estructura) setEstructura(estructuraRes.data);
    } catch (error) { 
      console.error("❌ Error cargando datos:", error); 
      // TODO: Mostrar notificación de error cuando implementemos el sistema de notificaciones
    } 
    finally { 
      setLoading(false);
      setSearching(false);
    }
  }, [filtros.categoria, filtros.tipo, filtros.con_stock, filtros.page, filtros.busqueda, estructura, categorias]);
  
  // Crear función debounced para búsqueda
  const debouncedSearch = useMemo(
    () => debounce((searchTerm) => {
      setFiltros(prev => ({ ...prev, busqueda: searchTerm, page: 1 }));
    }, 500),
    []
  );

  // Estado local para el input de búsqueda
  const [searchValue, setSearchValue] = useState('');

  // Manejar cambio en búsqueda
  const handleSearchChange = (value) => {
    setSearchValue(value);
    setSearching(true);
    debouncedSearch(value);
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchValue('');
    setSearching(false);
    setFiltros(prev => ({ ...prev, busqueda: '', page: 1 }));
  };

  // Cargar datos cuando cambien los filtros (excepto búsqueda que usa debounce)
  useEffect(() => {
    cargarDatos();
  }, [filtros.categoria, filtros.tipo, filtros.con_stock, filtros.page, filtros.busqueda]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const toggleProducto = (id) => setProductosExpandidos(p => ({ ...p, [id]: !p[id] }));
  const toggleVariante = (id) => setVariantesExpandidas(p => ({ ...p, [id]: !p[id] }));
  const closeConfirmation = () => { setConfirmation({ isOpen: false }); setEditingInfo(null); };
  
  const handleNuevoProducto = () => {
    setProductoEditar(null);
    setShowFormModal(true);
  };

  const handleEditarProducto = (producto) => {
    setProductoEditar(producto);
    setShowFormModal(true);
  };

  const handleGuardarProducto = async (datosProducto) => {
    try {
      // Si es una nueva variante para un producto existente
      if (datosProducto.esNuevaVariante && datosProducto.productoId) {
        await ApiService.addVarianteProducto(datosProducto.productoId, datosProducto.variante);
      } else if (productoEditar) {
        // Modo edición de producto
        await ApiService.updateProducto(productoEditar.id_producto, datosProducto);
      } else {
        // Modo creación de producto nuevo
        await ApiService.createProductoCompleto(datosProducto);
      }
      await cargarDatos();
      setShowFormModal(false);
    } catch (error) {
      console.error('Error guardando producto:', error);
      throw error;
    }
  };

  const handleAgregarVariante = (producto) => {
    setProductoEditar(producto);
    setShowVarianteModal(true);
  };

  const handleGuardarVariante = async (datosVariante) => {
    try {
      await ApiService.addVarianteProducto(productoEditar.id_producto, datosVariante);
      await cargarDatos();
      setShowVarianteModal(false);
    } catch (error) {
      console.error('Error guardando variante:', error);
      throw error;
    }
  };

  // ===========================
  // 📤 EXPORTACIÓN
  // ===========================
  const handleExportar = async () => {
    setExporting(true);
    try {
      // Usar los filtros actuales para exportar
      const filtrosExport = {
        categoria: filtros.categoria || undefined,
        tipo: filtros.tipo || undefined,
        con_stock: filtros.con_stock || undefined,
        search: filtros.busqueda || undefined
      };

      // Limpiar valores undefined
      Object.keys(filtrosExport).forEach(key =>
        filtrosExport[key] === undefined && delete filtrosExport[key]
      );

      await ApiService.exportarProductos(filtrosExport);
    } catch (error) {
      console.error('Error exportando productos:', error);
      alert('Error al exportar productos. Por favor intente nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  // ===========================
  // 📥 IMPORTACIÓN
  // ===========================
  const handleImportar = () => {
    setShowImportModal(true);
  };

  // Nuevas funciones para eliminar y duplicar
  const handleEliminarVariante = async (varianteId, descripcion) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la variante "${descripcion}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmDelete) return;
    
    try {
      const response = await ApiService.deleteVariante(varianteId);
      if (response.success) {
        alert('Variante eliminada exitosamente');
        await cargarDatos();
      } else {
        alert(response.message || 'Error al eliminar la variante');
      }
    } catch (error) {
      console.error('Error eliminando variante:', error);
      alert('Error al eliminar la variante: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEliminarModalidad = async (modalidadId, nombre) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la modalidad "${nombre}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmDelete) return;
    
    try {
      const response = await ApiService.deleteModalidad(modalidadId);
      if (response.success) {
        alert('Modalidad eliminada exitosamente');
        await cargarDatos();
      } else {
        alert(response.message || 'Error al eliminar la modalidad');
      }
    } catch (error) {
      console.error('Error eliminando modalidad:', error);
      alert('Error al eliminar la modalidad: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDuplicarProducto = async (producto) => {
    const nuevoNombre = prompt(
      'Nombre para el producto duplicado:',
      `${producto.modelo} (COPIA)`
    );
    
    if (!nuevoNombre) return;
    
    try {
      const response = await ApiService.duplicarProducto(producto.id_producto, {
        nuevo_nombre: nuevoNombre
      });
      
      if (response.success) {
        alert(`Producto duplicado exitosamente:\n${response.data.nombre}\nCódigo: ${response.data.codigo}`);
        await cargarDatos();
      } else {
        alert(response.message || 'Error al duplicar el producto');
      }
    } catch (error) {
      console.error('Error duplicando producto:', error);
      alert('Error al duplicar el producto: ' + (error.message || 'Error desconocido'));
    }
  };
  
  const handleModalidadUpdate = (productoId, varianteId, modalidadId, field, newValue) => {
    const IVA = 1.19; // IVA 19% Chile
    const isPriceField = ['costo', 'neto', 'factura'].includes(field);
    const value = isPriceField ? parseFloat(newValue) : newValue;

    if (isPriceField && isNaN(value)) { setEditingInfo(null); return; }

    const producto = productos.find(p => p.id_producto === productoId);
    if (!producto) return;
    const variante = producto.variantes.find(v => v.id_variante === varianteId);
    const modalidad = variante.modalidades.find(m => m.id_modalidad === modalidadId);
    if (!modalidad) return;

    // Calcular precio relacionado automáticamente
    let preciosActualizados = {};
    if (field === 'neto') {
      // Si edita neto, calcular factura
      preciosActualizados = {
        neto: value,
        factura: parseFloat((value * IVA).toFixed(2))
      };
    } else if (field === 'factura') {
      // Si edita factura, calcular neto
      preciosActualizados = {
        factura: value,
        neto: parseFloat((value / IVA).toFixed(2))
      };
    } else if (field === 'costo') {
      // Costo no afecta otros precios
      preciosActualizados = { costo: value };
    }

    const executeApiUpdate = async (updates, updateValue, preciosCalculados) => {
        const updatePayload = isPriceField ? { precios: preciosCalculados } : { [field]: updateValue };

        try {
          await Promise.all(updates.map(u => ApiService.updateModalidad(u.modalidadId, updatePayload)));

          // Recargar datos del servidor para asegurar sincronización
          await cargarDatos();

        } catch(e) {
          console.error("❌ Error al guardar:", e);
          alert("Error al guardar.");
          await cargarDatos();
        } finally {
          closeConfirmation();
        }
      };
    
    if (isPriceField) {
      const originalPrice = parseFloat(modalidad.precios[field]);
      const siblings = producto.variantes
        .filter(v => v.id_variante !== varianteId)
        .map(v => ({ v, m: v.modalidades.find(m => m.nombre === modalidad.nombre && parseFloat(m.precios[field]) === originalPrice) }))
        .filter(item => item.m);

      const updates = [{ productoId, varianteId, modalidadId }];
      if (siblings.length > 0) {
        const precioMostrar = field === 'neto' || field === 'factura'
          ? `Neto: ${ApiService.formatPrice(preciosActualizados.neto)}, Factura: ${ApiService.formatPrice(preciosActualizados.factura)}`
          : ApiService.formatPrice(value);

        setConfirmation({
          isOpen: true, title: 'Actualización de Precios en Grupo',
          message: `Modificando para <strong>'${producto.modelo} - ${variante.descripcion_opcion} (${modalidad.nombre})'</strong>.<br/>Hay ${siblings.length} otra(s) variante(s) con el mismo precio. ¿Actualizar todas a ${precioMostrar}?`,
          variantDetails: siblings.map(s => `${s.v.descripcion_opcion} (${s.m.nombre})`),
          onConfirm: () => executeApiUpdate([...updates, ...siblings.map(s => ({ productoId, varianteId: s.v.id_variante, modalidadId: s.m.id_modalidad }))], value, preciosActualizados),
          onCancel: () => executeApiUpdate(updates, value, preciosActualizados),
          confirmText: 'Sí, Actualizar Todas', cancelText: 'No, Solo Esta'
        });
      } else { executeApiUpdate(updates, value, preciosActualizados); }
    } else {
      executeApiUpdate([{ productoId, varianteId, modalidadId }], value, {});
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
       <ConfirmationModal {...confirmation} />
       <header className="mb-4 flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold text-slate-800">Gestión de Productos</h1>
           <p className="text-sm text-gray-500">
             {loading ? 'Cargando...' :
              searching ? 'Buscando...' :
              searchValue ? `${paginacion.total} resultados para "${searchValue}"` :
              `${paginacion.total} productos encontrados`}
           </p>
         </div>
         <div className="flex items-center gap-2">
           {/* Botón Exportar */}
           <button
             onClick={handleExportar}
             disabled={exporting || loading}
             className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
             title="Exportar productos a Excel"
           >
             {exporting ? (
               <>
                 <Loader2 size={18} className="animate-spin" />
                 Exportando...
               </>
             ) : (
               <>
                 <Download size={18} />
                 Exportar
               </>
             )}
           </button>

           {/* Botón Importar */}
           <button
             onClick={handleImportar}
             disabled={importing || loading}
             className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
             title="Importar productos desde Excel"
           >
             <Upload size={18} />
             Importar
           </button>

           {/* Botón Nuevo Producto */}
           <button
             onClick={handleNuevoProducto}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
           >
             <Plus size={20} />
             Nuevo Producto
           </button>
         </div>
       </header>
       <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {searching && (
              <Loader2 size={14} className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
            )}
            {searchValue && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
              >
                <X size={14} className="text-gray-500" />
              </button>
            )}
            <input 
              type="text" 
              placeholder="Buscar por modelo, código, color, medida..." 
              className="w-full sm:w-72 pl-9 pr-14 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button 
              onClick={() => {
                setFiltros({ ...filtros, categoria: '', tipo: '', page: 1 });
                handleClearSearch();
              }} 
              className={`px-3 py-1 text-xs font-semibold rounded-md ${!filtros.categoria ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'}`}
            >
              Todos
            </button>
            {categorias.map(cat => cat.nombre && (
              <button 
                key={cat.id_categoria || cat.nombre} 
                onClick={() => {
                  setFiltros({ ...filtros, categoria: cat.nombre, tipo: '', page: 1 });
                  handleClearSearch();
                }} 
                className={`px-3 py-1 text-xs font-semibold rounded-md ${filtros.categoria === cat.nombre ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'}`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-500">Cargando...</p>
            </div>
          ) : productos.length > 0 ? (
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-2 w-8"></th>
                  <th className="p-2">Modelo / Variante</th>
                  <th className="p-2">SKU</th>
                  <th className="p-2 text-right">Precio Ref.</th>
                  <th className="p-2 text-center">Stock</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(producto => {
                  const isModelHighlighted = editingInfo?.productoId === producto.id_producto;
                  return (
                    <React.Fragment key={producto.id_producto}>
                      <tr 
                        onClick={() => toggleProducto(producto.id_producto)} 
                        className={`cursor-pointer border-b border-t font-semibold ${isModelHighlighted ? 'bg-amber-100' : 'bg-slate-100/70 hover:bg-slate-200/60'}`}
                      >
                        <td className="p-2 text-center">
                          <ChevronDown size={14} className={`transition-transform ${productosExpandidos[producto.id_producto] ? 'rotate-180' : ''}`} />
                        </td>
                        <td className="p-2 text-slate-800">
                          <div>
                            <span className="font-semibold">{producto.modelo}</span>
                            {producto.tipo && (
                              <span className="ml-2 text-xs text-slate-500">({producto.tipo})</span>
                            )}
                          </div>
                          <span className="font-normal text-slate-500 text-xs">
                            {producto.variantes?.length || 0} variantes
                          </span>
                        </td>
                        <td className="p-2 font-mono text-[11px]">{producto.codigo}</td>
                        <td className="p-2 text-right text-slate-500">{producto.resumen_precios?.rango_precios}</td>
                        <td className="p-2 text-center">
                          <div 
                            className={`w-3 h-3 mx-auto rounded-full ${producto.estadisticas?.tiene_stock ? 'bg-green-500' : 'bg-red-500'}`} 
                            title={producto.estadisticas?.tiene_stock ? 'Con Stock' : 'Sin Stock'}
                          ></div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditarProducto(producto);
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Editar producto"
                            >
                              <Edit2 size={14} className="text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicarProducto(producto);
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Duplicar producto"
                            >
                              <Copy size={14} className="text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAgregarVariante(producto);
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Agregar variante especial"
                            >
                              <Plus size={14} className="text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {productosExpandidos[producto.id_producto] && producto.variantes.map(variante => {
                        const isVariantHighlighted = editingInfo?.varianteId === variante.id_variante;
                        return (
                          <React.Fragment key={variante.id_variante}>
                            <tr 
                              onClick={() => toggleVariante(variante.id_variante)} 
                              className={`cursor-pointer border-b border-slate-200/50 ${isVariantHighlighted ? 'bg-amber-50' : 'bg-white hover:bg-slate-50/50'}`}
                            >
                              <td className="p-2"></td>
                              <td className="py-1.5 px-2 pl-8 text-slate-700 flex items-center gap-1">
                                <ChevronDown size={14} className={`text-indigo-500 transition-transform ${variantesExpandidas[variante.id_variante] ? 'rotate-180' : ''}`} />
                                {variante.descripcion_opcion}
                                {/* Resaltar si la variante coincide con la búsqueda */}
                                {searchValue && (
                                  variante.color?.toLowerCase().includes(searchValue.toLowerCase()) ||
                                  variante.medida?.toLowerCase().includes(searchValue.toLowerCase()) ||
                                  variante.material?.toLowerCase().includes(searchValue.toLowerCase()) ||
                                  variante.sku?.toLowerCase().includes(searchValue.toLowerCase())
                                ) && (
                                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    Coincidencia
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-2 font-mono text-[11px]">{variante.sku}</td>
                              <td></td>
                              <td className="py-1.5 px-2 text-center font-medium">{parseFloat(variante.stock_total || 0).toFixed(0)}</td>
                              <td className="py-1.5 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEliminarVariante(variante.id_variante, variante.descripcion_opcion);
                                    }}
                                    className="p-0.5 hover:bg-red-100 rounded"
                                    title="Eliminar variante"
                                  >
                                    <Trash2 size={14} className="text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {variantesExpandidas[variante.id_variante] && (
                              <tr className={`border-b border-slate-200 ${isVariantHighlighted ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                <td colSpan={6} className="p-3">
                                  <div className="pl-16 pr-4 space-y-2">
                                    {variante.modalidades.map(modalidad => {
                                      const isModalityEditing = editingInfo?.modalidadId === modalidad.id_modalidad;
                                      return (
                                      <div key={modalidad.id_modalidad} className={`group p-2 rounded-lg border transition-colors ${isModalityEditing ? 'bg-amber-100 border-amber-300' : 'bg-white border-gray-200'}`}>
                                          <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-slate-700 text-xs">{modalidad.nombre}</span>
                                              <button
                                                onClick={() => handleEliminarModalidad(modalidad.id_modalidad, modalidad.nombre)}
                                                className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Eliminar modalidad"
                                              >
                                                <Trash2 size={12} className="text-red-500" />
                                              </button>
                                            </div>
                                            <div className="flex items-center gap-x-3">
                                               <div className="flex items-center gap-1 text-xs">
                                                 <span className="text-slate-500">Costo:</span>
                                                 <EditableField 
                                                   value={parseFloat(modalidad.precios.costo)} 
                                                   onSave={(v) => handleModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'costo', v)} 
                                                   onStartEditing={() => setEditingInfo({ productoId: producto.id_producto, varianteId: variante.id_variante, modalidadId: modalidad.id_modalidad })} 
                                                   onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)} 
                                                 />
                                               </div>
                                               <div className="flex items-center gap-1 text-xs">
                                                 <span className="text-slate-500">Neto:</span>
                                                 <EditableField 
                                                   value={parseFloat(modalidad.precios.neto)} 
                                                   onSave={(v) => handleModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'neto', v)} 
                                                   onStartEditing={() => setEditingInfo({ productoId: producto.id_producto, varianteId: variante.id_variante, modalidadId: modalidad.id_modalidad })} 
                                                   onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)} 
                                                 />
                                               </div>
                                               <div className="flex items-center gap-1 text-xs">
                                                 <span className="text-slate-500">Factura:</span>
                                                 <EditableField 
                                                   value={parseFloat(modalidad.precios.factura)} 
                                                   onSave={(v) => handleModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'factura', v)} 
                                                   onStartEditing={() => setEditingInfo({ productoId: producto.id_producto, varianteId: variante.id_variante, modalidadId: modalidad.id_modalidad })} 
                                                   onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)} 
                                                 />
                                               </div>
                                            </div>
                                          </div>
                                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-end items-center gap-x-4">
                                              <div className="flex items-center gap-1 text-xs">
                                                <span className="text-slate-500">Cant. Base:</span>
                                                <EditableField 
                                                  prefix="" 
                                                  value={modalidad.cantidad_base} 
                                                  type="text" 
                                                  onSave={(v) => handleModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'cantidad_base', v)} 
                                                  onStartEditing={() => setEditingInfo({ productoId: producto.id_producto, varianteId: variante.id_variante, modalidadId: modalidad.id_modalidad })} 
                                                  onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)} 
                                                />
                                              </div>
                                              <div className="flex items-center gap-1 text-xs">
                                                <span className="text-slate-500">Cant. Mín:</span>
                                                <EditableField 
                                                  prefix="" 
                                                  value={modalidad.minimo_cantidad} 
                                                  type="text" 
                                                  onSave={(v) => handleModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'minimo_cantidad', v)} 
                                                  onStartEditing={() => setEditingInfo({ productoId: producto.id_producto, varianteId: variante.id_variante, modalidadId: modalidad.id_modalidad })} 
                                                  onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)} 
                                                />
                                              </div>
                                              <div className="flex items-center gap-2 text-xs">
                                                <span className="text-slate-500">Variable:</span>
                                                <EditableToggle
                                                  checked={modalidad.es_cantidad_variable}
                                                  onSave={(v) => handleModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'es_cantidad_variable', v)}
                                                  onStartEditing={() => setEditingInfo({ productoId: producto.id_producto, varianteId: variante.id_variante, modalidadId: modalidad.id_modalidad })}
                                                  onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)}
                                                />
                                              </div>
                                              <div className="flex items-center gap-2 text-xs">
                                                <span className="text-slate-500">Afecto Desc.:</span>
                                                <EditableToggle
                                                  checked={Boolean(modalidad.afecto_descuento_ticket)}
                                                  onSave={(v) => handleModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'afecto_descuento_ticket', v)}
                                                  onStartEditing={() => setEditingInfo({ productoId: producto.id_producto, varianteId: variante.id_variante, modalidadId: modalidad.id_modalidad })}
                                                  onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)}
                                                />
                                              </div>
                                          </div>
                                      </div>
                                    )})}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          ) : (
             <div className="text-center py-12 text-gray-500">
               <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
               <p className="text-lg font-medium">No se encontraron productos</p>
               {filtros.busqueda && (
                 <div className="mt-4">
                   <p className="text-sm">
                     No hay resultados para "<span className="font-semibold">{filtros.busqueda}</span>"
                   </p>
                   <div className="mt-4 text-xs text-gray-400">
                     <p className="mb-2">Puedes buscar por:</p>
                     <div className="flex flex-wrap gap-2 justify-center">
                       <span className="px-2 py-1 bg-gray-100 rounded">Modelo (ej: GABANNA)</span>
                       <span className="px-2 py-1 bg-gray-100 rounded">Código (ej: TEL-LIN)</span>
                       <span className="px-2 py-1 bg-gray-100 rounded">Color (ej: Rojo)</span>
                       <span className="px-2 py-1 bg-gray-100 rounded">Medida (ej: 71)</span>
                       <span className="px-2 py-1 bg-gray-100 rounded">Material (ej: Lino)</span>
                     </div>
                   </div>
                 </div>
               )}
               {(filtros.categoria || filtros.tipo) && (
                 <p className="text-sm mt-2">
                   Intenta cambiar los filtros seleccionados
                 </p>
               )}
             </div>
          )}
        </div>
        
        {/* Paginación */}
        {!loading && paginacion.pages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {((paginacion.page - 1) * paginacion.limit) + 1} - {Math.min(paginacion.page * paginacion.limit, paginacion.total)} de {paginacion.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}
                disabled={filtros.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm">
                Página {paginacion.page} de {paginacion.pages}
              </span>
              <button
                onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}
                disabled={filtros.page === paginacion.pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ProductoFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleGuardarProducto}
        producto={productoEditar}
        categorias={categorias}
      />
      
      <VarianteFormModal
        isOpen={showVarianteModal}
        onClose={() => setShowVarianteModal(false)}
        onSave={handleGuardarVariante}
        producto={productoEditar}
      />

      {/* Modal de Importación */}
      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={cargarDatos}
          categorias={categorias}
        />
      )}
    </div>
  );
};

// ===========================
// 📥 COMPONENTE: MODAL DE IMPORTACIÓN
// ===========================
const ImportModal = ({ isOpen, onClose, onImportComplete, categorias }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validar tipo de archivo
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // TODO: Procesar archivo y mostrar preview
    // Por ahora solo mostramos el nombre
    setPreview({
      filename: selectedFile.name,
      size: (selectedFile.size / 1024).toFixed(2) + ' KB',
      productosCount: 0
    });
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor seleccione un archivo');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await ApiService.importarProductos(formData);

      if (response.success) {
        alert(`✅ Importación exitosa: ${response.data.importados} productos importados`);
        await onImportComplete();
        onClose();
      } else {
        setError(response.message || 'Error al importar productos');
      }
    } catch (error) {
      console.error('Error importando productos:', error);
      setError('Error al importar productos: ' + (error.message || 'Error desconocido'));
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // Descargar template vacío
      await ApiService.exportarProductos({ template: true });
    } catch (error) {
      console.error('Error descargando template:', error);
      alert('Error al descargar template');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Upload size={24} />
              Importar Productos
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cargue productos masivamente desde Excel o CSV
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Info size={16} />
              Instrucciones
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
              <li>Descargue el template para ver el formato correcto</li>
              <li>Complete el Excel con sus productos</li>
              <li>Suba el archivo y revise el preview</li>
              <li>Confirme la importación</li>
            </ul>
            <button
              onClick={handleDownloadTemplate}
              className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={14} />
              Descargar Template
            </button>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">
                {file ? (
                  <>
                    <span className="font-semibold text-blue-600">{file.name}</span>
                    <br />
                    <span className="text-xs text-gray-500">Click para cambiar archivo</span>
                  </>
                ) : (
                  <>
                    Click para seleccionar archivo
                    <br />
                    <span className="text-xs text-gray-500">Formatos: .xlsx, .xls, .csv</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Preview del archivo</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Archivo:</span> {preview.filename}</p>
                <p><span className="font-medium">Tamaño:</span> {preview.size}</p>
                <p><span className="font-medium">Productos detectados:</span> {preview.productosCount}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={importing}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload size={16} />
                Importar Productos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductosAdmin;