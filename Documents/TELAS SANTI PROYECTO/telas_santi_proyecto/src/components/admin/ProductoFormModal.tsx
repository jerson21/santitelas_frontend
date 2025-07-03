// src/components/admin/ProductoFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, Package, Tag, Palette, Ruler, Box, Info, Calculator, Percent } from 'lucide-react';
import ApiService from '../../services/api';
import { 
  ProductoFormModalProps, 
  ProductoFormData, 
  Modalidad,
  Variante,
  PreciosBase
} from '../../types/productos'; // ✅ Correcto

const ProductoFormModal: React.FC<ProductoFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  producto = null, 
  categorias = [] 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProductoFormData>({
    categoria: '',
    tipo: '',
    modelo: '',
    codigo: '',
    descripcion: '',
    unidad_medida: 'unidad',
    stock_minimo_total: 0,
    preciosBase: {
      modalidad1: {
        nombre: 'UNIDAD',
        cantidad_base: 1,
        es_cantidad_variable: false,
        minimo_cantidad: 1,
        descuento: 0,
        precio_neto: 0,
        precio_factura: 0
      },
      modalidad2: {
        nombre: 'EMBALAJE',
        cantidad_base: 10,
        es_cantidad_variable: false,
        minimo_cantidad: 10,
        descuento: 10,
        precio_neto: 0,
        precio_factura: 0
      }
    },
    opciones: []
  });

  // Actualizar modalidades base cuando cambia unidad_medida
  useEffect(() => {
    if (formData.unidad_medida === 'metro') {
      setFormData(prev => ({
        ...prev,
        preciosBase: {
          modalidad1: {
            nombre: 'METRO',
            cantidad_base: 1,
            es_cantidad_variable: true,
            minimo_cantidad: 0.1,
            descuento: 0,
            precio_neto: prev.preciosBase.modalidad1.precio_neto || 0,
            precio_factura: Math.round((prev.preciosBase.modalidad1.precio_neto || 0) * 1.19)
          },
          modalidad2: {
            nombre: 'ROLLO',
            cantidad_base: 25,
            es_cantidad_variable: true,
            minimo_cantidad: 20,
            descuento: 5,
            precio_neto: prev.preciosBase.modalidad2.precio_neto || 0,
            precio_factura: Math.round((prev.preciosBase.modalidad2.precio_neto || 0) * 1.19)
          }
        }
      }));
    } else if (formData.unidad_medida === 'unidad') {
      setFormData(prev => ({
        ...prev,
        preciosBase: {
          modalidad1: {
            nombre: 'UNIDAD',
            cantidad_base: 1,
            es_cantidad_variable: false,
            minimo_cantidad: 1,
            descuento: 0,
            precio_neto: prev.preciosBase.modalidad1.precio_neto || 0,
            precio_factura: Math.round((prev.preciosBase.modalidad1.precio_neto || 0) * 1.19)
          },
          modalidad2: {
            nombre: 'EMBALAJE',
            cantidad_base: 10,
            es_cantidad_variable: false,
            minimo_cantidad: 10,
            descuento: 10,
            precio_neto: prev.preciosBase.modalidad2.precio_neto || 0,
            precio_factura: Math.round((prev.preciosBase.modalidad2.precio_neto || 0) * 1.19)
          }
        }
      }));
    }
  }, [formData.unidad_medida]);

  // Calcular precio con descuento automáticamente
  const calcularPrecioConDescuento = (precioBase: number, descuento: number): number => {
    if (!precioBase || !descuento) return precioBase || 0;
    return Math.round(precioBase * (1 - descuento / 100));
  };

  // Actualizar precio modalidad 1 desde neto
  const updatePrecioModalidad1Neto = (precio_neto: number): void => {
    const precio_factura = Math.round(precio_neto * 1.19);
    
    setFormData(prev => {
      // Calcular precio modalidad 2 con descuento
      const precio_neto_m2 = calcularPrecioConDescuento(precio_neto, prev.preciosBase.modalidad2.descuento);
      const precio_factura_m2 = Math.round(precio_neto_m2 * 1.19);
      
      return {
        ...prev,
        preciosBase: {
          modalidad1: {
            ...prev.preciosBase.modalidad1,
            precio_neto,
            precio_factura
          },
          modalidad2: {
            ...prev.preciosBase.modalidad2,
            precio_neto: precio_neto_m2,
            precio_factura: precio_factura_m2
          }
        }
      };
    });
  };

  // Actualizar precio modalidad 1 desde factura
  const updatePrecioModalidad1Factura = (precio_factura: number): void => {
    const precio_neto = Math.round(precio_factura / 1.19);
    
    setFormData(prev => {
      // Calcular precio modalidad 2 con descuento
      const precio_neto_m2 = calcularPrecioConDescuento(precio_neto, prev.preciosBase.modalidad2.descuento);
      const precio_factura_m2 = Math.round(precio_neto_m2 * 1.19);
      
      return {
        ...prev,
        preciosBase: {
          modalidad1: {
            ...prev.preciosBase.modalidad1,
            precio_neto,
            precio_factura
          },
          modalidad2: {
            ...prev.preciosBase.modalidad2,
            precio_neto: precio_neto_m2,
            precio_factura: precio_factura_m2
          }
        }
      };
    });
  };

  // Actualizar descuento modalidad 2
  const updateDescuentoModalidad2 = (descuento: number): void => {
    setFormData(prev => {
      const precio_base = prev.preciosBase.modalidad1.precio_neto;
      const precio_neto_m2 = calcularPrecioConDescuento(precio_base, descuento);
      const precio_factura_m2 = Math.round(precio_neto_m2 * 1.19);
      
      return {
        ...prev,
        preciosBase: {
          ...prev.preciosBase,
          modalidad2: {
            ...prev.preciosBase.modalidad2,
            descuento,
            precio_neto: precio_neto_m2,
            precio_factura: precio_factura_m2
          }
        }
      };
    });
  };

  // Actualizar cantidad variable en precios base
  const updateCantidadVariableBase = (modalidad: 'modalidad1' | 'modalidad2', value: boolean): void => {
    setFormData(prev => ({
      ...prev,
      preciosBase: {
        ...prev.preciosBase,
        [modalidad]: {
          ...prev.preciosBase[modalidad],
          es_cantidad_variable: value
        }
      }
    }));
  };

  // Carga de datos del producto para edición
  useEffect(() => {
    if (producto) {
      console.log('📦 Cargando producto para editar:', producto);
      
      const cargarDatosProducto = () => {
        try {
          // Convertir variantes existentes al formato del formulario
          const variantesFormateadas: Variante[] = (producto.opciones || []).map(variante => ({
            id: variante.id_variante?.toString() || `temp_${Date.now()}_${Math.random()}`,
            esExistente: true,
            color: (variante as any).color || '',
            medida: (variante as any).medida || '',
            material: (variante as any).material || '',
            descripcion: variante.descripcion_opcion || '',
            stock_minimo: (variante as any).stock_minimo || 0,
            modalidades: ((variante as any).modalidades || []).map((modalidad: any) => ({
              id: modalidad.id_modalidad || `temp_${Date.now()}_${Math.random()}`,
              esExistente: true,
              nombre: modalidad.nombre || 'UNIDAD',
              descripcion: modalidad.descripcion || '',
              cantidad_base: parseFloat(modalidad.cantidad_base) || 1,
              es_cantidad_variable: modalidad.es_cantidad_variable || false,
              minimo_cantidad: parseFloat(modalidad.minimo_cantidad) || 1,
              precio_costo: parseFloat(modalidad.precios?.costo) || 0,
              precio_neto: parseFloat(modalidad.precios?.neto) || 0,
              precio_factura: parseFloat(modalidad.precios?.factura) || 0
            }))
          }));

          // Extraer precios base de las variantes existentes
          let preciosBaseReales: PreciosBase = {
            modalidad1: {
              nombre: 'UNIDAD',
              cantidad_base: 1,
              es_cantidad_variable: false,
              minimo_cantidad: 1,
              descuento: 0,
              precio_neto: 0,
              precio_factura: 0
            },
            modalidad2: {
              nombre: 'EMBALAJE',
              cantidad_base: 10,
              es_cantidad_variable: false,
              minimo_cantidad: 10,
              descuento: 10,
              precio_neto: 0,
              precio_factura: 0
            }
          };

          // Si tiene variantes, tomar precios de la primera variante como base
          if (variantesFormateadas.length > 0 && variantesFormateadas[0].modalidades.length >= 2) {
            const primeraVariante = variantesFormateadas[0];
            
            if (primeraVariante.modalidades[0]) {
              preciosBaseReales.modalidad1 = {
                nombre: primeraVariante.modalidades[0].nombre || 'UNIDAD',
                cantidad_base: primeraVariante.modalidades[0].cantidad_base || 1,
                es_cantidad_variable: primeraVariante.modalidades[0].es_cantidad_variable || false,
                minimo_cantidad: primeraVariante.modalidades[0].minimo_cantidad || 1,
                descuento: 0,
                precio_neto: primeraVariante.modalidades[0].precio_neto || 0,
                precio_factura: primeraVariante.modalidades[0].precio_factura || 0
              };
            }

            if (primeraVariante.modalidades[1]) {
              preciosBaseReales.modalidad2 = {
                nombre: primeraVariante.modalidades[1].nombre || 'EMBALAJE',
                cantidad_base: primeraVariante.modalidades[1].cantidad_base || 10,
                es_cantidad_variable: primeraVariante.modalidades[1].es_cantidad_variable || false,
                minimo_cantidad: primeraVariante.modalidades[1].minimo_cantidad || 10,
                descuento: 10,
                precio_neto: primeraVariante.modalidades[1].precio_neto || 0,
                precio_factura: primeraVariante.modalidades[1].precio_factura || 0
              };
            }
          }

          console.log('📋 Variantes formateadas:', variantesFormateadas);
          console.log('💰 Precios base extraídos:', preciosBaseReales);

          setFormData({
            categoria: producto.categoria || '',
            tipo: producto.tipo || '',
            modelo: producto.modelo || producto.nombre || '',
            codigo: producto.codigo || '',
            descripcion: producto.descripcion || '',
            unidad_medida: producto.unidad_medida || 'unidad',
            stock_minimo_total: producto.stock_minimo_total || 0,
            preciosBase: preciosBaseReales,
            opciones: variantesFormateadas
          });

        } catch (error) {
          console.error('❌ Error procesando datos del producto:', error);
          // Fallback a datos básicos del producto
          setFormData({
            categoria: producto.categoria || '',
            tipo: producto.tipo || '',
            modelo: producto.modelo || producto.nombre || '',
            codigo: producto.codigo || '',
            descripcion: producto.descripcion || '',
            unidad_medida: producto.unidad_medida || 'unidad',
            stock_minimo_total: producto.stock_minimo_total || 0,
            preciosBase: {
              modalidad1: {
                nombre: 'UNIDAD',
                cantidad_base: 1,
                es_cantidad_variable: false,
                minimo_cantidad: 1,
                descuento: 0,
                precio_neto: 0,
                precio_factura: 0
              },
              modalidad2: {
                nombre: 'EMBALAJE',
                cantidad_base: 10,
                es_cantidad_variable: false,
                minimo_cantidad: 10,
                descuento: 10,
                precio_neto: 0,
                precio_factura: 0
              }
            },
            opciones: []
          });
        }
      };

      cargarDatosProducto();
    } else {
      // Para producto nuevo, resetear con valores por defecto
      setFormData({
        categoria: '',
        tipo: '',
        modelo: '',
        codigo: '',
        descripcion: '',
        unidad_medida: 'unidad',
        stock_minimo_total: 0,
        preciosBase: {
          modalidad1: {
            nombre: 'UNIDAD',
            cantidad_base: 1,
            es_cantidad_variable: false,
            minimo_cantidad: 1,
            descuento: 0,
            precio_neto: 0,
            precio_factura: 0
          },
          modalidad2: {
            nombre: 'EMBALAJE',
            cantidad_base: 10,
            es_cantidad_variable: false,
            minimo_cantidad: 10,
            descuento: 10,
            precio_neto: 0,
            precio_factura: 0
          }
        },
        opciones: []
      });
    }
  }, [producto, isOpen]);

  const agregarVariante = (): void => {
    // Crear modalidades basadas en los precios base configurados
    const modalidades: Modalidad[] = [
      {
        id: Date.now(),
        nombre: formData.preciosBase.modalidad1.nombre,
        descripcion: '',
        cantidad_base: formData.preciosBase.modalidad1.cantidad_base,
        es_cantidad_variable: formData.preciosBase.modalidad1.es_cantidad_variable,
        minimo_cantidad: formData.preciosBase.modalidad1.minimo_cantidad,
        precio_costo: 0,
        precio_neto: formData.preciosBase.modalidad1.precio_neto,
        precio_factura: formData.preciosBase.modalidad1.precio_factura
      },
      {
        id: Date.now() + 1,
        nombre: formData.preciosBase.modalidad2.nombre,
        descripcion: '',
        cantidad_base: formData.preciosBase.modalidad2.cantidad_base,
        es_cantidad_variable: formData.preciosBase.modalidad2.es_cantidad_variable,
        minimo_cantidad: formData.preciosBase.modalidad2.minimo_cantidad,
        precio_costo: 0,
        precio_neto: formData.preciosBase.modalidad2.precio_neto,
        precio_factura: formData.preciosBase.modalidad2.precio_factura
      }
    ];
    
    setFormData({
      ...formData,
      opciones: [
        ...formData.opciones,
        {
          id: Date.now(),
          color: '',
          medida: '',
          material: '',
          descripcion: '',
          stock_minimo: 0,
          modalidades: modalidades
        }
      ]
    });
  };

  const eliminarVariante = (varianteId: string | number): void => {
    setFormData({
      ...formData,
      opciones: formData.opciones.filter(v => v.id !== varianteId)
    });
  };

  const updateVariante = (varianteId: string | number, field: keyof Variante, value: any): void => {
    setFormData({
      ...formData,
      opciones: formData.opciones.map(v => 
        v.id === varianteId ? { ...v, [field]: value } : v
      )
    });
  };

  const agregarModalidad = (varianteId: string | number): void => {
    setFormData({
      ...formData,
      opciones: formData.opciones.map(v => {
        if (v.id === varianteId) {
          const nombresExistentes = v.modalidades.map(m => m.nombre.toUpperCase());
          
          let nuevoNombre = 'ESPECIAL';
          let contador = 1;
          while (nombresExistentes.includes(nuevoNombre)) {
            nuevoNombre = `ESPECIAL_${contador}`;
            contador++;
          }
          
          return {
            ...v,
            modalidades: [
              ...v.modalidades,
              {
                id: Date.now(),
                nombre: nuevoNombre,
                descripcion: '',
                cantidad_base: 1,
                es_cantidad_variable: false,
                minimo_cantidad: 1,
                precio_costo: 0,
                precio_neto: 0,
                precio_factura: 0
              }
            ]
          };
        }
        return v;
      })
    });
  };

  const updateModalidad = (varianteId: string | number, modalidadId: number, field: string, value: any): void => {
    setFormData({
      ...formData,
      opciones: formData.opciones.map(v => {
        if (v.id === varianteId) {
          return {
            ...v,
            modalidades: v.modalidades.map(m => {
              if (m.id === modalidadId) {
                if (field === 'precio_neto') {
                  // Calcular precio_factura automáticamente
                  return {
                    ...m,
                    precio_neto: value,
                    precio_factura: Math.round(value * 1.19)
                  };
                } else if (field === 'precio_factura') {
                  // Calcular precio_neto desde factura
                  return {
                    ...m,
                    precio_neto: Math.round(value / 1.19),
                    precio_factura: value
                  };
                }
                return { ...m, [field]: value };
              }
              return m;
            })
          };
        }
        return v;
      })
    });
  };

  const eliminarModalidad = (varianteId: string | number, modalidadId: number): void => {
    setFormData({
      ...formData,
      opciones: formData.opciones.map(v => {
        if (v.id === varianteId) {
          return {
            ...v,
            modalidades: v.modalidades.filter(m => m.id !== modalidadId)
          };
        }
        return v;
      })
    });
  };

  const handleSubmit = async (): Promise<void> => {
    // Validaciones básicas
    if (!formData.categoria || !formData.modelo) {
      alert('Por favor complete los campos obligatorios: Categoría y Modelo');
      return;
    }

    // Validar precios base solo para productos nuevos
    if (!producto && (!formData.preciosBase.modalidad1.precio_neto || formData.preciosBase.modalidad1.precio_neto <= 0)) {
      alert(`Por favor configure el precio base para ${formData.preciosBase.modalidad1.nombre}`);
      return;
    }

    // Si es producto nuevo, validar que tenga al menos una variante
    if (!producto && (!formData.opciones || formData.opciones.length === 0)) {
      alert('Debe agregar al menos una variante al producto');
      return;
    }

    // Validar que cada variante nueva tenga al menos una característica
    for (let i = 0; i < formData.opciones.length; i++) {
      const variante = formData.opciones[i];
      // Solo validar variantes nuevas (que no tienen esExistente: true)
      if (!variante.esExistente && !variante.color && !variante.medida && !variante.material) {
        alert(`La variante #${i + 1} debe tener al menos color, medida o material`);
        return;
      }
    }

    setLoading(true);
    
    try {
      if (producto) {
        // Modo edición: Enviar todo en una sola llamada estructurada
        const variantesNuevas = formData.opciones.filter(v => !v.esExistente);
        
        const datosCompletos = {
          esActualizacionProducto: true,
          id_producto: producto.id_producto,
          datosBasicos: {
            categoria: formData.categoria,
            tipo: formData.tipo,
            modelo: formData.modelo,
            codigo: formData.codigo,
            descripcion: formData.descripcion,
            unidad_medida: formData.unidad_medida,
            stock_minimo_total: formData.stock_minimo_total
          },
          variantesNuevas: variantesNuevas
        };
        
        await onSave(datosCompletos);
      } else {
        // Crear producto nuevo
        await onSave(formData as any);
      }
      onClose();
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar el producto: ' + ((error as Error).message || 'Por favor intente nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {producto ? `Editar Producto: ${producto.modelo || producto.nombre}` : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Información Básica */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Package size={18} />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria || cat.id} value={cat.nombre}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: LINO, FELPA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: GABANNA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="metro">Metro</option>
                    <option value="kilogramo">Kilogramo</option>
                    <option value="litros">Litros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.stock_minimo_total}
                    onChange={(e) => setFormData({ ...formData, stock_minimo_total: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div className="col-span-2 md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Descripción del producto..."
                  />
                </div>
              </div>
            </div>

            {/* Configuración de Precios Base - Solo para productos nuevos */}
            {!producto && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-blue-800">
                  <Calculator size={18} />
                  Configurar Precios Base
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Modalidad 1 */}
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-700">
                        {formData.preciosBase.modalidad1.nombre}
                      </h4>
                      <span className="text-sm text-gray-500">
                        Base: {formData.preciosBase.modalidad1.cantidad_base} {formData.unidad_medida}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Precio Neto
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              value={formData.preciosBase.modalidad1.precio_neto}
                              onChange={(e) => updatePrecioModalidad1Neto(parseInt(e.target.value) || 0)}
                              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Precio Factura
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              value={formData.preciosBase.modalidad1.precio_factura}
                              onChange={(e) => updatePrecioModalidad1Factura(parseInt(e.target.value) || 0)}
                              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.preciosBase.modalidad1.es_cantidad_variable}
                            onChange={(e) => updateCantidadVariableBase('modalidad1', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-700">Permitir cantidad variable</span>
                        </label>
                        {formData.preciosBase.modalidad1.es_cantidad_variable && (
                          <span className="ml-3 text-xs text-gray-500">
                            Mín: {formData.preciosBase.modalidad1.minimo_cantidad}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modalidad 2 */}
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-700">
                        {formData.preciosBase.modalidad2.nombre}
                      </h4>
                      <span className="text-sm text-gray-500">
                        Base: {formData.preciosBase.modalidad2.cantidad_base} {formData.unidad_medida}s
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descuento
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={formData.preciosBase.modalidad2.descuento}
                              onChange={(e) => updateDescuentoModalidad2(parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                              max="100"
                            />
                            <Percent size={14} className="text-gray-500" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            P. Neto
                          </label>
                          <div className="relative">
                            <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                            <input
                              type="text"
                              value={formData.preciosBase.modalidad2.precio_neto.toLocaleString('es-CL')}
                              className="w-full pl-5 pr-1 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-md"
                              disabled
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            P. Factura
                          </label>
                          <div className="relative">
                            <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                            <input
                              type="text"
                              value={formData.preciosBase.modalidad2.precio_factura.toLocaleString('es-CL')}
                              className="w-full pl-5 pr-1 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-md"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.preciosBase.modalidad2.es_cantidad_variable}
                            onChange={(e) => updateCantidadVariableBase('modalidad2', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-700">Permitir cantidad variable</span>
                        </label>
                        {formData.preciosBase.modalidad2.es_cantidad_variable && (
                          <span className="ml-3 text-xs text-gray-500">
                            Mín: {formData.preciosBase.modalidad2.minimo_cantidad}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-blue-600 mt-3 flex items-center">
                  <Info size={12} className="mr-1" />
                  Los precios se calculan automáticamente. Puedes ingresar precio neto o factura.
                </p>
              </div>
            )}

            {/* Variantes */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Tag size={18} />
                  Variantes del Producto
                  {producto && (
                    <span className="text-sm font-normal text-gray-500">
                      ({formData.opciones.filter(v => v.esExistente).length} existentes, {formData.opciones.filter(v => !v.esExistente).length} nuevas)
                    </span>
                  )}
                </h3>
                <button
                  onClick={agregarVariante}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm"
                  disabled={!producto && formData.preciosBase.modalidad1.precio_neto === 0}
                  title={!producto && formData.preciosBase.modalidad1.precio_neto === 0 ? "Configure primero los precios base" : ""}
                >
                  <Plus size={14} />
                  Agregar Variante
                </button>
              </div>

              {!producto && formData.preciosBase.modalidad1.precio_neto === 0 && (
                <div className="text-center py-3 bg-yellow-50 rounded-lg mb-3">
                  <Info className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                  <p className="text-xs text-yellow-800">
                    Configure primero los precios base antes de agregar variantes
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {(!formData.opciones || formData.opciones.length === 0) && (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {producto ? 'No hay variantes en este producto' : 'No hay variantes agregadas'}
                    </p>
                    {!producto && (
                      <p className="text-xs text-gray-400 mt-1">
                        Cada producto debe tener al menos una variante
                      </p>
                    )}
                  </div>
                )}

                {formData.opciones && formData.opciones.map((variante, varIndex) => (
                  <div key={variante.id} className={`border rounded-lg p-4 ${variante.esExistente ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                        {variante.esExistente ? (
                          <>
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Variante Existente {varIndex + 1}
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Nueva Variante {varIndex + 1}
                          </>
                        )}
                        {(variante.color || variante.medida || variante.material) && 
                          <span className="font-normal text-xs text-gray-500 ml-2">
                            ({[variante.color, variante.medida, variante.material].filter(Boolean).join(' - ')})
                          </span>
                        }
                      </h4>
                      {!variante.esExistente && (
                        <button
                          onClick={() => eliminarVariante(variante.id!)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Solo permitir editar características en variantes nuevas */}
                    {!variante.esExistente && (
                      <>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              <Palette size={12} className="inline mr-1" />
                              Color
                            </label>
                            <input
                              type="text"
                              value={variante.color}
                              onChange={(e) => updateVariante(variante.id!, 'color', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: Azul"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              <Ruler size={12} className="inline mr-1" />
                              Medida
                            </label>
                            <input
                              type="text"
                              value={variante.medida}
                              onChange={(e) => updateVariante(variante.id!, 'medida', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: 71"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              <Box size={12} className="inline mr-1" />
                              Material
                            </label>
                            <input
                              type="text"
                              value={variante.material}
                              onChange={(e) => updateVariante(variante.id!, 'material', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ej: 100% Lino"
                            />
                          </div>
                        </div>

                        {/* Modalidades de la variante */}
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-xs font-medium text-gray-600">
                              Modalidades de venta
                            </h5>
                            <button
                              onClick={() => agregarModalidad(variante.id!)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              + Agregar modalidad
                            </button>
                          </div>

                          <div className="space-y-2">
                            {variante.modalidades.map((modalidad, modIndex) => (
                              <div key={modalidad.id} className="bg-white p-2.5 rounded border border-gray-200">
                                <div className="grid grid-cols-6 gap-2 items-end">
                                  <div>
                                    <label className="block text-xs text-gray-600">Nombre</label>
                                    <input
                                      type="text"
                                      value={modalidad.nombre}
                                      onChange={(e) => updateModalidad(variante.id!, modalidad.id!, 'nombre', e.target.value)}
                                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded"
                                      readOnly={modIndex < 2}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs text-gray-600">Base</label>
                                    <input
                                      type="number"
                                      value={modalidad.cantidad_base}
                                      onChange={(e) => updateModalidad(variante.id!, modalidad.id!, 'cantidad_base', parseFloat(e.target.value) || 1)}
                                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded"
                                      step="0.1"
                                      min="0"
                                      readOnly={modIndex < 2}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs text-gray-600">P. Neto</label>
                                    <input
                                      type="number"
                                      value={modalidad.precio_neto}
                                      onChange={(e) => updateModalidad(variante.id!, modalidad.id!, 'precio_neto', parseFloat(e.target.value) || 0)}
                                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded"
                                      min="0"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs text-gray-600">P. Factura</label>
                                    <input
                                      type="number"
                                      value={modalidad.precio_factura}
                                      onChange={(e) => updateModalidad(variante.id!, modalidad.id!, 'precio_factura', parseFloat(e.target.value) || 0)}
                                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded"
                                      min="0"
                                    />
                                  </div>

                                  <div className="flex items-center">
                                    <label className="flex items-center gap-1 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={modalidad.es_cantidad_variable}
                                        onChange={(e) => updateModalidad(variante.id!, modalidad.id!, 'es_cantidad_variable', e.target.checked)}
                                        className="rounded"
                                      />
                                      Variable
                                    </label>
                                  </div>

                                  <div className="flex items-center justify-end">
                                    {modIndex >= 2 && (
                                      <button
                                        onClick={() => eliminarModalidad(variante.id!, modalidad.id!)}
                                        className="text-red-500 hover:text-red-700 p-0.5"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {modalidad.es_cantidad_variable && (
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <label className="text-xs text-gray-600">Cantidad mínima:</label>
                                    <input
                                      type="number"
                                      value={modalidad.minimo_cantidad}
                                      onChange={(e) => updateModalidad(variante.id!, modalidad.id!, 'minimo_cantidad', parseFloat(e.target.value) || 0)}
                                      className="w-16 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                                      step="0.1"
                                      min="0"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Para variantes existentes, mostrar solo info de lectura */}
                    {variante.esExistente && (
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <div className="text-xs text-blue-700 mb-2">
                          <strong>Variante existente:</strong> {variante.color} {variante.medida} {variante.material}
                        </div>
                        <div className="text-xs text-gray-600">
                          {variante.modalidades.length} modalidades configuradas
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Para editar esta variante, use la tabla principal de productos
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={14} />
                {producto ? 'Actualizar' : 'Crear'} Producto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductoFormModal;