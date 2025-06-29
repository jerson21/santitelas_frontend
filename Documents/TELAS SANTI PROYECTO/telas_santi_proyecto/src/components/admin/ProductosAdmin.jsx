// src/components/admin/ProductosAdmin.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Package, Search, Filter, Plus, Edit2, DollarSign, Eye, Upload, RefreshCw, ChevronDown,
  ChevronRight, MoreVertical, AlertCircle, Check, X, FileSpreadsheet, Layers, Tag,
  BarChart3, Loader2, Save, Trash2, Copy, ShoppingCart, Palette, Ruler, Box, Info,
  AlertTriangle, Minus, Archive, TrendingUp, TrendingDown, Settings
} from 'lucide-react';

import ApiService from '../../services/api';
import ProductoFormModal from './ProductoFormModal';
import VarianteFormModal from './VarianteFormModal';
import { ModernStockManager } from './ModernStockManager';
import { debounce } from '../../utils/debounce';

// ===================================================================
// COMPONENTES AUXILIARES (FUERA DE ProductosAdmin)
// ===================================================================

// 1. COMPONENTE StockConfirmationModal (debe estar AQUÍ, NO dentro de ProductosAdmin)
const StockConfirmationModal = ({ isOpen, oldStock, newStock, motivo, onConfirm, onCancel, onChange, skipConfirmation }) => {
  if (!isOpen) return null;

  const difference = newStock - oldStock;
  const isIncrease = difference > 0;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Confirmar Cambio de Stock
          </h3>
        </div>

        <div className="p-5 space-y-4">
          {/* Resumen del cambio */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Stock actual:</span>
              <span className="font-mono font-semibold">{oldStock}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Nuevo stock:</span>
              <span className="font-mono font-semibold">{newStock}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Diferencia:</span>
                <span className={`font-mono font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncrease ? '+' : ''}{difference}
                </span>
              </div>
            </div>
          </div>

          {/* Campo de motivo opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del ajuste (opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => onChange({ motivo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Inventario físico, Ajuste por rotura, etc."
              autoFocus
            />
          </div>

          {/* Checkbox para saltar confirmación */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="skipConfirmation"
              checked={skipConfirmation}
              onChange={(e) => onChange({ skipConfirmation: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="skipConfirmation" className="ml-2 text-sm text-gray-600">
              No volver a preguntar en esta sesión
            </label>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 flex justify-end items-center gap-3 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivo)}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Check size={16} />
            Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. EditableField
const EditableField = ({
  value,
  onSave,
  onStartEditing,
  onEndEditing,
  type = "number",
  prefix = "$",
  className = "",
  isStock = false,
  unit = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { 
    setCurrentValue(value); 
  }, [value]);
  
  useEffect(() => { 
    if (isEditing) inputRef.current?.focus(); 
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    onEndEditing();
    if (currentValue != value) {
      try {
        await onSave(currentValue);
      } catch (error) {
        console.error("Fallo al guardar:", error);
        setCurrentValue(value);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      onEndEditing();
      setCurrentValue(value);
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number') return price;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
  };

  const getDisplayValue = () => {
    if (isStock) {
      const stockNum = parseFloat(value) || 0;
      return `${stockNum.toFixed(0)}${unit ? ` ${unit}` : ''}`;
    } else if (type === 'number' && prefix === '$') {
      return formatPrice(parseFloat(value) || 0);
    } else if (type === 'text' || prefix === '') {
      return value;
    } else {
      return value;
    }
  };

  if (isEditing) {
    return (
      <div className="relative flex items-center">
        {prefix && !isStock && type === 'number' && <span className="absolute left-2 text-gray-400 text-xs">{prefix}</span>}
        <input
          ref={inputRef}
          type={type}
          value={currentValue}
          onChange={e => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${prefix && !isStock && type === 'number' ? 'pl-5' : 'pl-2'} pr-2 py-1 border rounded-md focus:outline-none ring-2 ring-blue-500 w-24 text-right ${className}`}
        />
        {isStock && unit && (
          <span className="absolute right-2 text-gray-400 text-xs">{unit}</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setIsEditing(true); onStartEditing(); }}
      className={`group text-left hover:bg-gray-200 px-2 py-1 rounded transition-colors inline-flex items-center justify-end w-24 ${className}`}
    >
      <span>{getDisplayValue()}</span>
      <Edit2 className="w-3 h-3 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

// 3. EditableToggle
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

// 4. StockControls
const StockControls = ({ stock, onUpdateStock, onStartEditing, onEndEditing, varianteId, unidadMedida = "unidad" }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [quickAmount, setQuickAmount] = useState(10);
  
  const stockNumerico = parseFloat(stock) || 0;
  
  console.log(`StockControls variante ${varianteId}: stock recibido="${stock}", parseado=${stockNumerico}`);

  const handleQuickStock = async (action) => {
    const amount = parseInt(quickAmount) || 0;
    if (amount <= 0) return;

    onStartEditing();
    try {
      if (action === 'add') {
        await onUpdateStock(stockNumerico + amount);
      } else if (action === 'subtract') {
        const newStock = Math.max(0, stockNumerico - amount);
        await onUpdateStock(newStock);
      }
    } catch (error) {
      console.error('Error al actualizar stock:', error);
    } finally {
      onEndEditing();
      setShowQuickActions(false);
    }
  };

  const getStockUnit = () => {
    switch(unidadMedida) {
      case 'metro': return 'mts';
      case 'kilogramo': return 'kg';
      case 'litros': return 'lts';
      default: return 'uds';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <EditableField
        value={stockNumerico}
        onSave={onUpdateStock}
        onStartEditing={onStartEditing}
        onEndEditing={onEndEditing}
        type="number"
        prefix=""
        className="w-20 text-center"
        isStock={true}
        unit={getStockUnit()}
      />

      <div className="relative">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
          title="Acciones rápidas de stock"
        >
          <MoreVertical size={14} />
        </button>

        {showQuickActions && (
          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3 min-w-48">
            <div className="text-xs font-semibold text-gray-700 mb-2">Ajuste Rápido de Stock</div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="Cant."
                min="1"
              />
              <button
                onClick={() => handleQuickStock('add')}
                className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                title="Agregar stock"
              >
                <Plus size={12} />
                Agregar
              </button>
              <button
                onClick={() => handleQuickStock('subtract')}
                className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                title="Reducir stock"
              >
                <Minus size={12} />
                Reducir
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Stock actual: {stockNumerico} {getStockUnit()}
            </div>
            <button
              onClick={() => setShowQuickActions(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. ConfirmationModal
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

// 6. StockMassiveModal
const StockMassiveModal = ({ isOpen, onClose, onSave, selectedProducts }) => {
  const [operation, setOperation] = useState('set');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Por favor ingresa una cantidad válida');
      return;
    }

    onSave({
      operation,
      amount: numAmount,
      reason: reason.trim()
    });

    setAmount('');
    setReason('');
    setOperation('set');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-slate-800">Gestión Masiva de Stock</h3>
          <p className="text-sm text-gray-600 mt-1">
            Afectará {selectedProducts.length} variante(s) seleccionada(s)
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operación
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="set">Establecer cantidad exacta</option>
              <option value="add">Agregar stock</option>
              <option value="subtract">Reducir stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa la cantidad"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Inventario, Ajuste, Reposición..."
            />
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 flex justify-end items-center gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// COMPONENTE PRINCIPAL: ProductosAdmin
// ===================================================================
const ProductosAdmin = () => {
  // Estados existentes
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [estructura, setEstructura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [paginacion, setPaginacion] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filtros, setFiltros] = useState({ busqueda: '', categoria: '', tipo: '', con_stock: false, page: 1 });
  const [productosExpandidos, setProductosExpandidos] = useState({});
  const [variantesExpandidas, setVariantesExpandidas] = useState({});
  const [editingInfo, setEditingInfo] = useState(null);
  const [confirmation, setConfirmation] = useState({ isOpen: false });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showVarianteModal, setShowVarianteModal] = useState(false);
  const [showStockMassiveModal, setShowStockMassiveModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState(new Set());
  const [showModernStockModal, setShowModernStockModal] = useState(false);
  const [selectedVarianteIdForStock, setSelectedVarianteIdForStock] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  // ESTADO PARA CONFIRMACIÓN DE STOCK (debe estar AQUÍ, DENTRO de ProductosAdmin)
  const [stockConfirmation, setStockConfirmation] = useState({
    isOpen: false,
    varianteId: null,
    oldStock: 0,
    newStock: 0,
    motivo: '',
    skipConfirmation: false
  });

  // Callbacks y funciones
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const filtrosAPI = {
        categoria: filtros.categoria || undefined,
        tipo: filtros.tipo || undefined,
        con_stock: filtros.con_stock || undefined,
        page: filtros.page,
        limit: 20,
        search: filtros.busqueda || undefined
      };
  
      Object.keys(filtrosAPI).forEach(key =>
        filtrosAPI[key] === undefined && delete filtrosAPI[key]
      );
  
      console.log('🔍 Enviando filtros a API:', filtrosAPI);
  
      const [productosRes, categoriasRes, estructuraRes] = await Promise.all([
        ApiService.getProductosCatalogo(filtrosAPI),
        !categorias.length ? ApiService.getCategorias() : Promise.resolve({ success: true, data: categorias }),
        !estructura ? ApiService.getEstructuraCatalogo() : Promise.resolve({ success: true, data: estructura })
      ]);
  
      if (productosRes?.success) {
        const productosNormalizados = (productosRes.data || []).map(producto => ({
          ...producto,
          modelo: producto.modelo || producto.nombre,
          opciones: producto.opciones || producto.variantes || []
        }));
        
        console.log('📦 Productos después de normalizar:', productosNormalizados);
        console.log('🔍 Ejemplo de stock:', productosNormalizados[0]?.opciones?.[0]?.stock_total);
        
        setProductos(productosNormalizados);
        if (productosRes.pagination) setPaginacion(productosRes.pagination);
      }
      if (categoriasRes?.success && !categorias.length) setCategorias(categoriasRes.data || []);
      if (estructuraRes?.success && !estructura) setEstructura(estructuraRes.data);
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
    }
    finally {
      setLoading(false);
      setSearching(false);
    }
  }, [filtros.categoria, filtros.tipo, filtros.con_stock, filtros.page, filtros.busqueda, estructura, categorias]);

  const debouncedSearch = useMemo(
    () => debounce((searchTerm) => {
      setFiltros(prev => ({ ...prev, busqueda: searchTerm, page: 1 }));
    }, 500),
    []
  );

  const handleSearchChange = (value) => {
    setSearchValue(value);
    setSearching(true);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setSearching(false);
    setFiltros(prev => ({ ...prev, busqueda: '', page: 1 }));
  };

  // handleStockUpdate actualizado
  const handleStockUpdate = async (varianteId, nuevoStock) => {
    try {
      console.log('📦 Iniciando actualización de stock para variante:', varianteId, 'Nuevo stock:', nuevoStock);
      
      const stockNumerico = parseFloat(nuevoStock) || 0;
      const variante = productos.flatMap(p => p.opciones).find(v => v.id_variante === varianteId);
      const stockActual = parseFloat(variante?.stock_total) || 0;
      
      if (!stockConfirmation.skipConfirmation && Math.abs(stockNumerico - stockActual) > 0) {
        setStockConfirmation({
          isOpen: true,
          varianteId: varianteId,
          oldStock: stockActual,
          newStock: stockNumerico,
          motivo: '',
          skipConfirmation: stockConfirmation.skipConfirmation
        });
        return;
      }
      
      await ejecutarActualizacionStock(varianteId, stockNumerico, '');
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
      alert('Error al actualizar stock: ' + (error.message || 'Error desconocido'));
      await cargarDatos();
    }
  };
  
  const ejecutarActualizacionStock = async (varianteId, nuevoStock, motivo = '') => {
    try {
      console.log('🔧 Ejecutando actualización de stock...');
      console.log('📊 Variante ID:', varianteId);
      console.log('📊 Nuevo Stock:', nuevoStock);
      console.log('📊 Motivo:', motivo || '(sin motivo)');
      
      const response = await ApiService.updateVarianteStock(
        varianteId,
        nuevoStock,
        motivo || null,
        null
      );
      
      if (response.success) {
        console.log('✅ Stock actualizado correctamente:', response);
        
        setProductos(current => current.map(producto => ({
          ...producto,
          opciones: producto.opciones.map(variante =>
            variante.id_variante === varianteId
              ? { ...variante, stock_total: nuevoStock }
              : variante
          )
        })));
        
        return response;
      } else {
        throw new Error(response.message || 'Error al actualizar stock');
      }
      
    } catch (error) {
      console.error('❌ Error en actualización de stock:', error);
      throw error;
    }
  };
  
  const handleStockConfirmationConfirm = async (motivo) => {
    const { varianteId, newStock } = stockConfirmation;
    setStockConfirmation(prev => ({ ...prev, isOpen: false }));
    
    try {
      await ejecutarActualizacionStock(varianteId, newStock, motivo);
    } catch (error) {
      alert('Error al actualizar stock: ' + (error.message || 'Error desconocido'));
      await cargarDatos();
    }
  };
  
  const handleStockConfirmationCancel = () => {
    setStockConfirmation(prev => ({ ...prev, isOpen: false, motivo: '' }));
    cargarDatos();
  };

  // Resto de funciones...
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
      console.log('💾 Guardando producto:', datosProducto);

      if (datosProducto.esActualizacionProducto) {
        console.log('🔄 Actualizando producto existente:', datosProducto);

        if (datosProducto.datosBasicos) {
          console.log('📝 Actualizando datos básicos del producto...');
          console.log('📋 Datos a enviar:', datosProducto.datosBasicos);
          console.log('🆔 ID del producto:', datosProducto.id_producto);

          if (typeof ApiService.updateProducto === 'function') {
            const response = await ApiService.updateProducto(datosProducto.id_producto, datosProducto.datosBasicos);
            console.log('📥 Respuesta del servidor:', response);
          } else {
            console.error('❌ ApiService.updateProducto no existe');
            if (typeof ApiService.actualizarProducto === 'function') {
              await ApiService.actualizarProducto(datosProducto.id_producto, datosProducto.datosBasicos);
              console.log('✅ Datos básicos actualizados (método alternativo)');
            } else {
              console.warn('⚠️ Método updateProducto no implementado en ApiService');
              alert('La actualización de datos básicos del producto requiere implementación en el backend.\nSe actualizarán solo las variantes nuevas.');
            }
          }
        }

        if (datosProducto.variantesNuevas && datosProducto.variantesNuevas.length > 0) {
          console.log('➕ Agregando', datosProducto.variantesNuevas.length, 'variantes nuevas...');
          for (const variante of datosProducto.variantesNuevas) {
            await ApiService.addVarianteProducto(datosProducto.id_producto, variante);
          }
          console.log('✅ Variantes nuevas agregadas');
        }

        console.log('✅ Producto actualizado exitosamente');
      }
      else if (datosProducto.esNuevaVariante && datosProducto.productoId) {
        await ApiService.addVarianteProducto(datosProducto.productoId, datosProducto.variante);
      }
      else if (productoEditar && !datosProducto.esActualizacionProducto) {
        if (typeof ApiService.updateProducto === 'function') {
          await ApiService.updateProducto(productoEditar.id_producto, datosProducto);
        } else {
          console.warn('⚠️ Método updateProducto no implementado para actualizaciones básicas');
        }
      }
      else {
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

  const handleVariantSelection = (varianteId, isSelected) => {
    const newSelection = new Set(selectedVariants);
    if (isSelected) {
      newSelection.add(varianteId);
    } else {
      newSelection.delete(varianteId);
    }
    setSelectedVariants(newSelection);
  };

  const handleSelectAllVariants = () => {
    const allVariantIds = productos.flatMap(p => p.opciones.map(v => v.id_variante));
    setSelectedVariants(new Set(allVariantIds));
  };

  const handleDeselectAllVariants = () => {
    setSelectedVariants(new Set());
  };

  const handleMassiveStockUpdate = async (updateData) => {
    const { operation, amount, reason } = updateData;

    try {
      alert("La funcionalidad de Actualización Masiva de Stock está pendiente de implementación en el backend.");
      console.warn("Llamada a updateMassiveStock (frontend) - pendiente de implementación en backend.");
    } catch (error) {
      console.error('Error en actualización masiva:', error);
    } finally {
        setShowStockMassiveModal(false);
        setSelectedVariants(new Set());
    }
  };

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
    const isPriceField = ['costo', 'neto', 'factura'].includes(field);
    const value = isPriceField ? parseFloat(newValue) : newValue;

    if (isPriceField && isNaN(value)) { setEditingInfo(null); return; }

    const producto = productos.find(p => p.id_producto === productoId);
    if (!producto) return;
    const variante = producto.opciones.find(v => v.id_variante === varianteId);
    const modalidad = variante.modalidades.find(m => m.id_modalidad === modalidadId);
    if (!modalidad) return;

    const executeApiUpdate = async (updates, updateValue) => {
        const updatePayload = isPriceField ? { precios: { [field]: updateValue } } : { [field]: updateValue };
        try {
          await Promise.all(updates.map(u => ApiService.updateModalidad(u.modalidadId, updatePayload)));

          setProductos(current => current.map(p => {
            if (p.id_producto === productoId) {
              return { ...p, opciones: p.opciones.map(v => {
                const u = updates.find(up => up.varianteId === v.id_variante);
                if (!u) return v;
                return { ...v, modalidades: v.modalidades.map(m => m.id_modalidad === u.modalidadId
                    ? { ...m,
                        precios: isPriceField ? { ...m.precios, [field]: updateValue.toString() } : m.precios,
                        ...(!isPriceField && {[field]: updateValue})
                      }
                    : m
                )};
              })};
            }
            return p;
          }));
        } catch(e) { console.error("Error al guardar:", e); alert("Error al guardar."); cargarDatos();
        } finally { closeConfirmation(); }
      };

    if (isPriceField) {
      const originalPrice = parseFloat(modalidad.precios[field]);
      const siblings = producto.opciones
        .filter(v => v.id_variante !== varianteId)
        .map(v => ({ v, m: v.modalidades.find(m => m.nombre === modalidad.nombre && parseFloat(m.precios[field]) === originalPrice) }))
        .filter(item => item.m);

      const updates = [{ productoId, varianteId, modalidadId }];
      if (siblings.length > 0) {
        setConfirmation({
          isOpen: true, title: 'Actualización de Precios en Grupo',
          message: `Modificando para <strong>'${producto.modelo} - ${variante.descripcion_opcion} (${modalidad.nombre})'</strong>.<br/>Hay ${siblings.length} otra(s) variante(s) con el mismo precio. ¿Actualizar todas a ${ApiService.formatPrice(value)}?`,
          variantDetails: siblings.map(s => `${s.v.descripcion_opcion} (${s.m.nombre})`),
          onConfirm: () => executeApiUpdate([...updates, ...siblings.map(s => ({ productoId, varianteId: s.v.id_variante, modalidadId: s.m.id_modalidad }))], value),
          onCancel: () => executeApiUpdate(updates, value),
          confirmText: 'Sí, Actualizar Todas', cancelText: 'No, Solo Esta'
        });
      } else { executeApiUpdate(updates, value); }
    } else {
      executeApiUpdate([{ productoId, varianteId, modalidadId }], value);
    }
  };

  const getStockColor = (stock) => {
    let stockNum = 0;
    
    if (stock !== undefined && stock !== null) {
      if (typeof stock === 'string') {
        stockNum = parseFloat(stock) || 0;
      } else if (typeof stock === 'number') {
        stockNum = stock;
      } else if (typeof stock === 'boolean') {
        stockNum = stock ? 1 : 0;
      }
    }
    
    if (stockNum === 0) return 'bg-red-500';
    if (stockNum < 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleOpenModernStockModal = (varianteId) => {
    setSelectedVarianteIdForStock(varianteId);
    setShowModernStockModal(true);
  };

  const handleCloseModernStockModal = () => {
    setShowModernStockModal(false);
    setSelectedVarianteIdForStock(null);
    cargarDatos();
  };

  // Effects
  useEffect(() => {
    cargarDatos();
  }, [filtros.categoria, filtros.tipo, filtros.con_stock, filtros.page, filtros.busqueda]);

  useEffect(() => {
    cargarDatos();
  }, []);

  // RENDER
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
         <div className="flex items-center gap-3">
           {selectedVariants.size > 0 && (
             <div className="flex items-center gap-2">
               <span className="text-sm text-gray-600">
                 {selectedVariants.size} seleccionadas
               </span>
               <button
                 onClick={() => setShowStockMassiveModal(true)}
                 className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm"
               >
                 <Archive size={16} />
                 Gestión Stock
               </button>
               <button
                 onClick={handleDeselectAllVariants}
                 className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
               >
                 Deseleccionar
               </button>
             </div>
           )}
           
           {/* Botón de Modo Rápido */}
           {selectedVariants.size === 0 && (
             <button
               onClick={() => setStockConfirmation(prev => ({ 
                 ...prev, 
                 skipConfirmation: !prev.skipConfirmation 
               }))}
               className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                 stockConfirmation.skipConfirmation 
                   ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
               }`}
               title={stockConfirmation.skipConfirmation ? 'Modo rápido activado' : 'Activar modo rápido'}
             >
               <RefreshCw size={16} />
               {stockConfirmation.skipConfirmation ? 'Modo Rápido' : 'Normal'}
             </button>
           )}
           
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
         {/* Filtros y búsqueda */}
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

         {/* Tabla de productos */}
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
                   <th className="p-2 w-8">
                     <input
                       type="checkbox"
                       checked={selectedVariants.size > 0 && selectedVariants.size === productos.flatMap(p => p.opciones).length}
                       onChange={(e) => e.target.checked ? handleSelectAllVariants() : handleDeselectAllVariants()}
                       className="rounded border-gray-300"
                     />
                   </th>
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
                         <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                           {/* Checkbox para seleccionar todas las variantes del producto */}
                         </td>
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
                             {producto.opciones?.length || 0} variantes
                           </span>
                         </td>
                         <td className="p-2 font-mono text-[11px]">{producto.codigo}</td>
                         <td className="p-2 text-right text-slate-500">{producto.resumen_precios?.rango_precios}</td>
                         <td className="p-2 text-center">
                           <div
                             className={`w-3 h-3 mx-auto rounded-full ${getStockColor(producto.estadisticas?.tiene_stock ? 1 : 0)}`}
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
                       {productosExpandidos[producto.id_producto] && producto.opciones.map(variante => {
                         const isVariantHighlighted = editingInfo?.varianteId === variante.id_variante;
                         const isSelected = selectedVariants.has(variante.id_variante);
                         return (
                           <React.Fragment key={variante.id_variante}>
                             <tr
                               onClick={() => toggleVariante(variante.id_variante)}
                               className={`cursor-pointer border-b border-slate-200/50 ${isVariantHighlighted ? 'bg-amber-50' : isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50/50'}`}
                             >
                               <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                 <input
                                   type="checkbox"
                                   checked={isSelected}
                                   onChange={(e) => handleVariantSelection(variante.id_variante, e.target.checked)}
                                   className="rounded border-gray-300"
                                 />
                               </td>
                               <td className="p-2"></td>
                               <td className="py-1.5 px-2 pl-8 text-slate-700 flex items-center gap-1">
                                 <ChevronDown size={14} className={`text-indigo-500 transition-transform ${variantesExpandidas[variante.id_variante] ? 'rotate-180' : ''}`} />
                                 {variante.descripcion_opcion}
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
                               <td className="py-1.5 px-2 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                   <div
                                     className={`w-2 h-2 rounded-full ${getStockColor(variante.stock_total)}`}
                                     title={`Stock: ${parseFloat(variante.stock_total || 0).toFixed(0)}`}
                                   ></div>
                                   <StockControls
                                     stock={variante.stock_total || 0}
                                     onUpdateStock={(newStock) => handleStockUpdate(variante.id_variante, newStock)}
                                     onStartEditing={() => setEditingInfo({ productoId: producto.id_producto, varianteId: variante.id_variante })}
                                     onEndEditing={() => setEditingInfo(null)}
                                     varianteId={variante.id_variante}
                                     unidadMedida={producto.unidad_medida || 'unidad'}
                                   />
                                   <button
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         handleOpenModernStockModal(variante.id_variante);
                                     }}
                                     className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                                     title="Ver/Editar Stock por Bodega"
                                   >
                                     <Settings size={14} />
                                   </button>
                                 </div>
                               </td>
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
                                 <td colSpan={7} className="p-3">
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
                   );
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

       {/* Modales */}
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

       <StockMassiveModal
         isOpen={showStockMassiveModal}
         onClose={() => setShowStockMassiveModal(false)}
         onSave={handleMassiveStockUpdate}
         selectedProducts={Array.from(selectedVariants)}
       />

       {/* Modal de confirmación de stock */}
       <StockConfirmationModal
         isOpen={stockConfirmation.isOpen}
         oldStock={stockConfirmation.oldStock}
         newStock={stockConfirmation.newStock}
         motivo={stockConfirmation.motivo}
         skipConfirmation={stockConfirmation.skipConfirmation}
         onConfirm={handleStockConfirmationConfirm}
         onCancel={handleStockConfirmationCancel}
         onChange={(updates) => setStockConfirmation(prev => ({ ...prev, ...updates }))}
       />

       {/* Modal de stock detallado */}
       {showModernStockModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
           <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
             <div className="p-4 border-b flex justify-between items-center">
               <h2 className="text-xl font-bold text-gray-800">
                 Gestión de Stock Detallado
               </h2>
               <button onClick={handleCloseModernStockModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                 <X size={20} />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
               {selectedVarianteIdForStock && (
                 <ModernStockManager
                   varianteId={selectedVarianteIdForStock}
                   modo="admin"
                   onStockUpdate={handleCloseModernStockModal}
                   showConfiguration={true}
                 />
               )}
             </div>
             <div className="p-4 border-t bg-gray-50 flex justify-end">
               <button
                 onClick={handleCloseModernStockModal}
                 className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
               >
                 Cerrar
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
  );
};

export default ProductosAdmin;