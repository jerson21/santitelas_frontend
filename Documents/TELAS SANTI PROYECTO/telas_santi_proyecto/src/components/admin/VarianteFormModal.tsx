// src/components/admin/VarianteFormModal.tsx
import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Loader2, Tag, Package, Percent, Gift } from 'lucide-react';
import { 
  VarianteFormModalProps, 
  VarianteFormData,
  Modalidad 
} from '../../types/productos'; // ✅ Correcto

interface TemplateModalidad extends Omit<Modalidad, 'id'> {
  nombre: string;
  descripcion: string;
  cantidad_base: number;
  es_cantidad_variable: boolean;
  minimo_cantidad: number;
  precio_costo: number;
  precio_neto: number;
  precio_factura: number;
}

interface Template {
  descripcion: string;
  modalidades: TemplateModalidad[];
}

type TipoVariante = 'normal' | 'oferta' | 'paquete' | 'descuento';

const VarianteFormModal: React.FC<VarianteFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  producto 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [tipoVariante, setTipoVariante] = useState<TipoVariante>('normal');
  const [formData, setFormData] = useState<VarianteFormData>({
    color: '',
    medida: '',
    material: '',
    descripcion: '',
    stock_minimo: 0,
    modalidades: []
  });

  const templatesPorTipo: Record<string, Template> = {
    oferta: {
      descripcion: 'Oferta especial',
      modalidades: [
        {
          nombre: 'OFERTA 3X2',
          descripcion: 'Lleve 3 pague 2',
          cantidad_base: 3,
          es_cantidad_variable: false,
          minimo_cantidad: 3,
          precio_costo: 0,
          precio_neto: 0,
          precio_factura: 0
        }
      ]
    },
    paquete: {
      descripcion: 'Paquete promocional',
      modalidades: [
        {
          nombre: 'PACK 5 UNIDADES',
          descripcion: 'Paquete de 5 unidades con descuento',
          cantidad_base: 5,
          es_cantidad_variable: false,
          minimo_cantidad: 5,
          precio_costo: 0,
          precio_neto: 0,
          precio_factura: 0
        }
      ]
    },
    descuento: {
      descripcion: 'Con descuento por volumen',
      modalidades: [
        {
          nombre: 'MAYORISTA',
          descripcion: 'Precio mayorista (mín. 10 unidades)',
          cantidad_base: 10,
          es_cantidad_variable: true,
          minimo_cantidad: 10,
          precio_costo: 0,
          precio_neto: 0,
          precio_factura: 0
        }
      ]
    }
  };

  const aplicarTemplate = (tipo: string): void => {
    if (templatesPorTipo[tipo]) {
      const template = templatesPorTipo[tipo];
      setFormData({
        ...formData,
        descripcion: template.descripcion,
        modalidades: template.modalidades.map(m => ({
          ...m,
          id: Date.now() + Math.random()
        }))
      });
    }
  };

  const agregarModalidad = (): void => {
    setFormData({
      ...formData,
      modalidades: [
        ...formData.modalidades,
        {
          id: Date.now(),
          nombre: '',
          descripcion: '',
          cantidad_base: 1,
          es_cantidad_variable: false,
          minimo_cantidad: 1,
          precio_costo: 0,
          precio_neto: 0,
          precio_factura: 0
        }
      ]
    });
  };

  const updateModalidad = (modalidadId: number, field: keyof Modalidad, value: any): void => {
    setFormData({
      ...formData,
      modalidades: formData.modalidades.map(m =>
        m.id === modalidadId ? { ...m, [field]: value } : m
      )
    });
  };

  const eliminarModalidad = (modalidadId: number): void => {
    setFormData({
      ...formData,
      modalidades: formData.modalidades.filter(m => m.id !== modalidadId)
    });
  };

  const handleSubmit = async (): Promise<void> => {
    if (formData.modalidades.length === 0) {
      alert('Debe agregar al menos una modalidad de venta');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando variante:', error);
      alert('Error al guardar la variante');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Agregar Variante a {producto.modelo}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Crea variantes especiales como ofertas, paquetes o descuentos por volumen
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tipo de variante */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de variante
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setTipoVariante('normal')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  tipoVariante === 'normal' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Tag className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <span className="text-sm">Normal</span>
              </button>
              <button
                onClick={() => {
                  setTipoVariante('oferta');
                  aplicarTemplate('oferta');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  tipoVariante === 'oferta' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Percent className="w-6 h-6 mx-auto mb-1 text-green-600" />
                <span className="text-sm">Oferta</span>
              </button>
              <button
                onClick={() => {
                  setTipoVariante('paquete');
                  aplicarTemplate('paquete');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  tipoVariante === 'paquete' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Package className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                <span className="text-sm">Paquete</span>
              </button>
              <button
                onClick={() => {
                  setTipoVariante('descuento');
                  aplicarTemplate('descuento');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  tipoVariante === 'descuento' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Gift className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                <span className="text-sm">Mayorista</span>
              </button>
            </div>
          </div>

          {/* Datos básicos de la variante */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Información de la variante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color/Variación
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Oferta Temporada"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción de la variante"
                />
              </div>
            </div>
          </div>

          {/* Modalidades */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Modalidades de venta</h3>
              <button
                onClick={agregarModalidad}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm"
              >
                <Plus size={16} />
                Agregar modalidad
              </button>
            </div>

            <div className="space-y-3">
              {formData.modalidades.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No hay modalidades. Agrega una para continuar.</p>
                </div>
              )}

              {formData.modalidades.map((modalidad, index) => (
                <div key={modalidad.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-700">Modalidad {index + 1}</h4>
                    <button
                      onClick={() => eliminarModalidad(modalidad.id!)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={modalidad.nombre}
                        onChange={(e) => updateModalidad(modalidad.id!, 'nombre', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="OFERTA 3X2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Cantidad base
                      </label>
                      <input
                        type="number"
                        value={modalidad.cantidad_base}
                        onChange={(e) => updateModalidad(modalidad.id!, 'cantidad_base', parseFloat(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Precio Neto *
                      </label>
                      <input
                        type="number"
                        value={modalidad.precio_neto}
                        onChange={(e) => updateModalidad(modalidad.id!, 'precio_neto', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Precio Factura *
                      </label>
                      <input
                        type="number"
                        value={modalidad.precio_factura}
                        onChange={(e) => updateModalidad(modalidad.id!, 'precio_factura', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={modalidad.descripcion}
                        onChange={(e) => updateModalidad(modalidad.id!, 'descripcion', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Descripción de la modalidad"
                      />
                    </div>
                  </div>

                  {tipoVariante === 'oferta' && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                      <p className="text-xs text-yellow-800">
                        💡 Tip: Para ofertas 3x2, configura cantidad_base=3 y ajusta el precio total del paquete
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            disabled={loading || formData.modalidades.length === 0}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Crear Variante
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VarianteFormModal;