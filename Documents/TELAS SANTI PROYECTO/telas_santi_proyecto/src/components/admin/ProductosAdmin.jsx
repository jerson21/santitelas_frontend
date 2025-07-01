// src/components/admin/ProductosAdmin.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from '../../utils/debounce';
import ApiService from '../../services/api';
import { X } from 'lucide-react';

// Componentes modulares
import ProductosHeader from './productos/ProductosHeader';
import ProductosFilters from './productos/ProductosFilters';
import ProductosTable from './productos/ProductosTable';
import ProductosPagination from './productos/ProductosPagination';

// Modales
import ProductoFormModal from './ProductoFormModal';
import VarianteFormModal from './VarianteFormModal';
import { StockConfirmationModal, StockMassiveModal, ConfirmationModal } from './productos/StockModals';
import { ModernStockManager } from './ModernStockManager';

const ProductosAdmin = () => {
  // Estados principales
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

  // Estado para confirmación de stock
  const [stockConfirmation, setStockConfirmation] = useState({
    isOpen: false,
    varianteId: null,
    oldStock: 0,
    newStock: 0,
    motivo: '',
    skipConfirmation: false
  });

  // Cargar datos
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
          opciones: (producto.opciones || producto.variantes || []).map(variante => ({
            ...variante,
            stock_total: typeof variante.stock_total === 'string' 
              ? parseFloat(variante.stock_total) || 0 
              : (variante.stock_total || 0)
          }))
        }));
        
        console.log('📦 Productos después de normalizar:', productosNormalizados);
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

  // Handle Stock Update
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

  // Toggles
  const toggleProducto = (id) => setProductosExpandidos(p => ({ ...p, [id]: !p[id] }));
  const toggleVariante = (id) => setVariantesExpandidas(p => ({ ...p, [id]: !p[id] }));
  const closeConfirmation = () => { setConfirmation({ isOpen: false }); setEditingInfo(null); };

  // Handlers de producto
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
        if (datosProducto.datosBasicos) {
          if (typeof ApiService.updateProducto === 'function') {
            const response = await ApiService.updateProducto(datosProducto.id_producto, datosProducto.datosBasicos);
            console.log('📥 Respuesta del servidor:', response);
          }
        }

        if (datosProducto.variantesNuevas && datosProducto.variantesNuevas.length > 0) {
          for (const variante of datosProducto.variantesNuevas) {
            await ApiService.addVarianteProducto(datosProducto.id_producto, variante);
          }
        }
      } else {
        await ApiService.createProductoCompleto(datosProducto);
      }

      await cargarDatos();
      setShowFormModal(false);
    } catch (error) {
      console.error('Error guardando producto:', error);
      throw error;
    }
  };

  // Handlers de variante
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

  // Handler de modalidad
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

  // Selección de variantes
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
      
      <ProductosHeader
        loading={loading}
        searching={searching}
        searchValue={searchValue}
        paginacion={paginacion}
        selectedVariants={selectedVariants}
        stockConfirmation={stockConfirmation}
        onNewProduct={handleNuevoProducto}
        onToggleStockMode={() => setStockConfirmation(prev => ({ 
          ...prev, 
          skipConfirmation: !prev.skipConfirmation 
        }))}
        onMassiveStock={() => setShowStockMassiveModal(true)}
        onDeselectAll={handleDeselectAllVariants}
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <ProductosFilters
          searchValue={searchValue}
          searching={searching}
          filtros={filtros}
          categorias={categorias}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onFilterChange={setFiltros}
        />

        <ProductosTable
          loading={loading}
          productos={productos}
          productosExpandidos={productosExpandidos}
          variantesExpandidas={variantesExpandidas}
          selectedVariants={selectedVariants}
          editingInfo={editingInfo}
          searchValue={searchValue}
          filtros={filtros}
          onToggleProducto={toggleProducto}
          onToggleVariante={toggleVariante}
          onStockUpdate={handleStockUpdate}
          onEditProduct={handleEditarProducto}
          onDuplicateProduct={handleDuplicarProducto}
          onAddVariant={handleAgregarVariante}
          onDeleteVariant={handleEliminarVariante}
          onDeleteModalidad={handleEliminarModalidad}
          onModalidadUpdate={handleModalidadUpdate}
          onVariantSelection={handleVariantSelection}
          onSelectAll={handleSelectAllVariants}
          onOpenStockModal={handleOpenModernStockModal}
          setEditingInfo={setEditingInfo}
          confirmation={confirmation}
        />

        {!loading && paginacion.pages > 1 && (
          <ProductosPagination
            paginacion={paginacion}
            onPageChange={(page) => setFiltros({ ...filtros, page })}
          />
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