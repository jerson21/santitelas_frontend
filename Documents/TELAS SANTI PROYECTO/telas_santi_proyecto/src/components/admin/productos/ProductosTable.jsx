// src/components/admin/productos/ProductosTable.jsx
import React from 'react';
import { Loader2, Search, ChevronDown, Edit2, Copy, Plus, Trash2, Settings } from 'lucide-react';
import { EditableField, EditableToggle, StockControls } from './EditableComponents';
import { getStockColor, calcularStockTotalProducto } from './helpers';

const ProductosTable = ({
  loading,
  productos,
  productosExpandidos,
  variantesExpandidas,
  selectedVariants,
  editingInfo,
  searchValue,
  filtros,
  onToggleProducto,
  onToggleVariante,
  onStockUpdate,
  onEditProduct,
  onDuplicateProduct,
  onAddVariant,
  onDeleteVariant,
  onDeleteModalidad,
  onModalidadUpdate,
  onVariantSelection,
  onSelectAll,
  onOpenStockModal,
  setEditingInfo,
  confirmation
}) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-2 text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
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
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left text-slate-600">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="p-2 w-8">
              <input
                type="checkbox"
                checked={selectedVariants.size > 0 && selectedVariants.size === productos.flatMap(p => p.opciones).length}
                onChange={(e) => e.target.checked ? onSelectAll() : onDeselectAll()}
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
            const stockTotal = calcularStockTotalProducto(producto);
            
            return (
              <React.Fragment key={producto.id_producto}>
                {/* Fila del producto */}
                <tr
                  onClick={() => onToggleProducto(producto.id_producto)}
                  className={`cursor-pointer border-b border-t font-semibold ${
                    isModelHighlighted ? 'bg-amber-100' : 'bg-slate-100/70 hover:bg-slate-200/60'
                  }`}
                >
                  <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {/* Checkbox para seleccionar todas las variantes del producto */}
                  </td>
                  <td className="p-2 text-center">
                    <ChevronDown 
                      size={14} 
                      className={`transition-transform ${
                        productosExpandidos[producto.id_producto] ? 'rotate-180' : ''
                      }`} 
                    />
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
                      className={`w-3 h-3 mx-auto rounded-full ${getStockColor(stockTotal)}`}
                      title={`Stock total: ${stockTotal}`}
                    ></div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProduct(producto);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Editar producto"
                      >
                        <Edit2 size={14} className="text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateProduct(producto);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Duplicar producto"
                      >
                        <Copy size={14} className="text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddVariant(producto);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Agregar variante especial"
                      >
                        <Plus size={14} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Filas de variantes expandidas */}
                {productosExpandidos[producto.id_producto] && producto.opciones.map(variante => {
                  const isVariantHighlighted = editingInfo?.varianteId === variante.id_variante;
                  const isSelected = selectedVariants.has(variante.id_variante);
                  
                  return (
                    <React.Fragment key={variante.id_variante}>
                      {/* Fila de la variante */}
                      <tr
                        onClick={() => onToggleVariante(variante.id_variante)}
                        className={`cursor-pointer border-b border-slate-200/50 ${
                          isVariantHighlighted ? 'bg-amber-50' : isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onVariantSelection(variante.id_variante, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-2"></td>
                        <td className="py-1.5 px-2 pl-8 text-slate-700 flex items-center gap-1">
                          <ChevronDown 
                            size={14} 
                            className={`text-indigo-500 transition-transform ${
                              variantesExpandidas[variante.id_variante] ? 'rotate-180' : ''
                            }`} 
                          />
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
                              onUpdateStock={(newStock) => onStockUpdate(variante.id_variante, newStock)}
                              onStartEditing={() => setEditingInfo({ 
                                productoId: producto.id_producto, 
                                varianteId: variante.id_variante 
                              })}
                              onEndEditing={() => setEditingInfo(null)}
                              varianteId={variante.id_variante}
                              unidadMedida={producto.unidad_medida || 'unidad'}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenStockModal(variante.id_variante);
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
                                onDeleteVariant(variante.id_variante, variante.descripcion_opcion);
                              }}
                              className="p-0.5 hover:bg-red-100 rounded"
                              title="Eliminar variante"
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Filas de modalidades expandidas */}
                      {variantesExpandidas[variante.id_variante] && (
                        <tr className={`border-b border-slate-200 ${
                          isVariantHighlighted ? 'bg-amber-50' : 'bg-slate-50'
                        }`}>
                          <td colSpan={7} className="p-3">
                            <div className="pl-16 pr-4 space-y-2">
                              {variante.modalidades.map(modalidad => {
                                const isModalityEditing = editingInfo?.modalidadId === modalidad.id_modalidad;
                                return (
                                  <div 
                                    key={modalidad.id_modalidad} 
                                    className={`group p-2 rounded-lg border transition-colors ${
                                      isModalityEditing ? 'bg-amber-100 border-amber-300' : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-700 text-xs">
                                          {modalidad.nombre}
                                        </span>
                                        <button
                                          onClick={() => onDeleteModalidad(modalidad.id_modalidad, modalidad.nombre)}
                                          className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Eliminar modalidad"
                                        >
                                          <Trash2 size={12} className="text-red-500" />
                                        </button>
                                      </div>
                                      <ModalidadPrices 
                                        modalidad={modalidad}
                                        producto={producto}
                                        variante={variante}
                                        onModalidadUpdate={onModalidadUpdate}
                                        setEditingInfo={setEditingInfo}
                                        confirmation={confirmation}
                                      />
                                    </div>
                                    <ModalidadConfig 
                                      modalidad={modalidad}
                                      producto={producto}
                                      variante={variante}
                                      onModalidadUpdate={onModalidadUpdate}
                                      setEditingInfo={setEditingInfo}
                                      confirmation={confirmation}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Componente auxiliar para precios de modalidad
const ModalidadPrices = ({ modalidad, producto, variante, onModalidadUpdate, setEditingInfo, confirmation }) => (
  <div className="flex items-center gap-x-3">
    <div className="flex items-center gap-1 text-xs">
      <span className="text-slate-500">Costo:</span>
      <EditableField
        value={parseFloat(modalidad.precios.costo)}
        onSave={(v) => onModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'costo', v)}
        onStartEditing={() => setEditingInfo({ 
          productoId: producto.id_producto, 
          varianteId: variante.id_variante, 
          modalidadId: modalidad.id_modalidad 
        })}
        onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)}
      />
    </div>
    <div className="flex items-center gap-1 text-xs">
      <span className="text-slate-500">Neto:</span>
      <EditableField
        value={parseFloat(modalidad.precios.neto)}
        onSave={(v) => onModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'neto', v)}
        onStartEditing={() => setEditingInfo({ 
          productoId: producto.id_producto, 
          varianteId: variante.id_variante, 
          modalidadId: modalidad.id_modalidad 
        })}
        onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)}
      />
    </div>
    <div className="flex items-center gap-1 text-xs">
      <span className="text-slate-500">Factura:</span>
      <EditableField
        value={parseFloat(modalidad.precios.factura)}
        onSave={(v) => onModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'factura', v)}
        onStartEditing={() => setEditingInfo({ 
          productoId: producto.id_producto, 
          varianteId: variante.id_variante, 
          modalidadId: modalidad.id_modalidad 
        })}
        onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)}
      />
    </div>
  </div>
);

// Componente auxiliar para configuración de modalidad
const ModalidadConfig = ({ modalidad, producto, variante, onModalidadUpdate, setEditingInfo, confirmation }) => (
  <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-end items-center gap-x-4">
    <div className="flex items-center gap-1 text-xs">
      <span className="text-slate-500">Cant. Base:</span>
      <EditableField
        prefix=""
        value={modalidad.cantidad_base}
        type="text"
        onSave={(v) => onModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'cantidad_base', v)}
        onStartEditing={() => setEditingInfo({ 
          productoId: producto.id_producto, 
          varianteId: variante.id_variante, 
          modalidadId: modalidad.id_modalidad 
        })}
        onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)}
      />
    </div>
    <div className="flex items-center gap-1 text-xs">
      <span className="text-slate-500">Cant. Mín:</span>
      <EditableField
        prefix=""
        value={modalidad.minimo_cantidad}
        type="text"
        onSave={(v) => onModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'minimo_cantidad', v)}
        onStartEditing={() => setEditingInfo({ 
          productoId: producto.id_producto, 
          varianteId: variante.id_variante, 
          modalidadId: modalidad.id_modalidad 
        })}
        onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)}
      />
    </div>
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500">Variable:</span>
      <EditableToggle
        checked={modalidad.es_cantidad_variable}
        onSave={(v) => onModalidadUpdate(producto.id_producto, variante.id_variante, modalidad.id_modalidad, 'es_cantidad_variable', v)}
        onStartEditing={() => setEditingInfo({ 
          productoId: producto.id_producto, 
          varianteId: variante.id_variante, 
          modalidadId: modalidad.id_modalidad 
        })}
        onEndEditing={() => !confirmation.isOpen && setEditingInfo(null)}
      />
    </div>
  </div>
);

export default ProductosTable;