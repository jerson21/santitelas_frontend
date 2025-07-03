// TransferManager.jsx - Sistema completo de transferencias
import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, Package, Warehouse, User, Calendar,
  Check, X, AlertTriangle, Clock, Search, Filter, Loader
} from 'lucide-react';
import ApiService from '../../services/api'; // 👈 IMPORTANTE: Asegúrate que la ruta sea correcta

const TransferManager = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchTransfers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getTransfers({ status: filterStatus });
      if (response.success) {
        setTransfers(response.data);
      } else {
        throw new Error(response.message || 'Error al cargar las transferencias');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [filterStatus]);

  const handleTransferCreated = (newTransfer) => {
    // Añade la nueva transferencia al inicio de la lista para visibilidad inmediata
    setTransfers(prevTransfers => [newTransfer, ...prevTransfers]);
    setShowNewTransfer(false);
  };

  return (
    <div className="space-y-6">
      <TransferHeader stats={transfers} />
      
      <TransferFilters 
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        onNewTransfer={() => setShowNewTransfer(true)}
      />
      
      {loading && <div className="flex justify-center p-4"><Loader className="animate-spin" /> Cargando...</div>}
      {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
      {!loading && !error && <TransferList transfers={transfers} />}
      
      {showNewTransfer && (
        <NewTransferModal 
          onClose={() => setShowNewTransfer(false)}
          onTransferCreated={handleTransferCreated}
        />
      )}
    </div>
  );
};

// ... (TransferHeader y TransferFilters se mantienen igual, pero TransferHeader podría recibir stats)
// 2. HEADER CON ESTADÍSTICAS
const TransferHeader = ({ stats }) => {
    // Lógica para calcular estadísticas desde el array `stats`
    const pendingCount = stats.filter(t => t.estado === 'pending').length;
    const inTransitCount = stats.filter(t => t.estado === 'in_transit').length;
    const completedTodayCount = stats.filter(t => t.estado === 'completed' && new Date(t.completed_at).toDateString() === new Date().toDateString()).length;
    const totalMonthCount = stats.length; // Simplificado, podría ser más complejo

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Gestión de Transferencias entre Bodegas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{pendingCount}</div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{completedTodayCount}</div>
                    <div className="text-sm text-gray-600">Completadas Hoy</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">{inTransitCount}</div>
                    <div className="text-sm text-gray-600">En Tránsito</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{totalMonthCount}</div>
                    <div className="text-sm text-gray-600">Total del Mes</div>
                </div>
            </div>
        </div>
    );
};

// 3. FILTROS Y CONTROLES
const TransferFilters = ({ filterStatus, onFilterChange, onNewTransfer }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar transferencias..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="in_transit">En tránsito</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>
      
      <button
        onClick={onNewTransfer}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <ArrowRightLeft className="w-4 h-4" />
        Nueva Transferencia
      </button>
    </div>
  </div>
);


// 4. LISTA DE TRANSFERENCIAS
const TransferList = ({ transfers }) => {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package className="mx-auto w-12 h-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay transferencias</h3>
        <p className="mt-1 text-sm text-gray-500">No se encontraron transferencias para el filtro seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferencia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen → Destino</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transfers.map((transfer) => (
              <TransferRow key={transfer.id} transfer={transfer} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 5. FILA DE TRANSFERENCIA (sin cambios)
const TransferRow = ({ transfer }) => {
  const getStatusBadge = (estado) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const labels = {
      pending: 'Pendiente',
      in_transit: 'En Tránsito',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[estado]}`}>
        {labels[estado]}
      </span>
    );
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{transfer.id}</div>
          <div className="text-sm text-gray-500">
            {new Date(transfer.created_at).toLocaleDateString('es-CL')}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{transfer.product?.nombre || 'N/A'}</div>
          <div className="text-sm text-gray-500">{transfer.variant?.descripcion || 'N/A'}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="text-sm">
            <div className="font-medium text-gray-900">{transfer.bodega_origen?.nombre || 'N/A'}</div>
            <div className="flex items-center text-gray-500 mt-1">
              <ArrowRightLeft className="w-3 h-3 mr-1" />
              {transfer.bodega_destino?.nombre || 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {transfer.cantidad} {transfer.product?.unidad_medida || 'unidades'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(transfer.estado)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-2">
          {transfer.estado === 'pending' && (
            <>
              <button className="text-green-600 hover:text-green-900"><Check className="w-4 h-4" /></button>
              <button className="text-red-600 hover:text-red-900"><X className="w-4 h-4" /></button>
            </>
          )}
          {transfer.estado === 'in_transit' && (
            <button className="text-blue-600 hover:text-blue-900"><Package className="w-4 h-4" /></button>
          )}
        </div>
      </td>
    </tr>
  );
};


// 6. MODAL NUEVA TRANSFERENCIA (REFACTORIZADO)
const NewTransferModal = ({ onClose, onTransferCreated }) => {
  const [formData, setFormData] = useState({
    variante_id: '',
    bodega_origen_id: '',
    bodega_destino_id: '',
    cantidad: '',
    motivo: '',
  });
  
  const [productos, setProductos] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [stockOrigen, setStockOrigen] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos para los selectores
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [productosRes, bodegasRes] = await Promise.all([
          ApiService.getProductos({ con_variantes: true }),
          ApiService.getBodegas({ activa: true })
        ]);
        if (productosRes.success) setProductos(productosRes.data);
        if (bodegasRes.success) setBodegas(bodegasRes.data);
      } catch (err) {
        setError('No se pudieron cargar los datos iniciales.');
      }
    };
    loadInitialData();
  }, []);

  // Actualizar variantes cuando cambia el producto
  const handleProductoChange = (e) => {
    const productoId = e.target.value;
    const selectedProducto = productos.find(p => p.id === parseInt(productoId));
    setVariantes(selectedProducto ? selectedProducto.variantes : []);
    setFormData({ ...formData, producto_id: productoId, variante_id: '' });
  };

  // Obtener stock de la bodega de origen cuando cambia
  useEffect(() => {
    const fetchStock = async () => {
      if (formData.variante_id && formData.bodega_origen_id) {
        const res = await ApiService.getDisponibilidadVariante(formData.variante_id);
        if (res.success) {
          const bodegaStock = res.data.por_bodega.find(b => b.bodega_id === parseInt(formData.bodega_origen_id));
          setStockOrigen(bodegaStock ? bodegaStock.cantidad_disponible : 0);
        }
      } else {
        setStockOrigen(null);
      }
    };
    fetchStock();
  }, [formData.variante_id, formData.bodega_origen_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // 👈 ¡CLAVE! Evita la recarga de la página
    
    if (formData.bodega_origen_id === formData.bodega_destino_id) {
        setError("La bodega de origen y destino no pueden ser la misma.");
        return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await ApiService.createTransfer(formData);
      if (response.success) {
        onTransferCreated(response.data); // Llama al callback del padre
      } else {
        throw new Error(response.message || 'Ocurrió un error al crear la transferencia.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Nueva Transferencia</h3>
          </div>
          
          <div className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select name="producto_id" onChange={handleProductoChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variante</label>
                <select name="variante_id" value={formData.variante_id} onChange={handleChange} required disabled={!formData.producto_id} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Seleccionar variante...</option>
                  {variantes.map(v => <option key={v.id} value={v.id}>{v.descripcion}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bodega Origen</label>
                <select name="bodega_origen_id" value={formData.bodega_origen_id} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Seleccionar origen...</option>
                  {bodegas.map(b => <option key={b.id_bodega} value={b.id_bodega}>{b.nombre}</option>)}
                </select>
                {stockOrigen !== null && <p className="text-xs text-gray-500 mt-1">Stock disponible: {stockOrigen}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bodega Destino</label>
                <select name="bodega_destino_id" value={formData.bodega_destino_id} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Seleccionar destino...</option>
                  {bodegas.filter(b => b.id_bodega !== parseInt(formData.bodega_origen_id)).map(b => <option key={b.id_bodega} value={b.id_bodega}>{b.nombre}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a transferir</label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ingrese cantidad"
                min="0.01"
                step="0.01"
                max={stockOrigen || undefined}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <textarea
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Ej: Reposición de stock para sucursal..."
              />
            </div>
          </div>
          
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSaving && <Loader className="animate-spin w-4 h-4" />}
              {isSaving ? 'Guardando...' : 'Crear Transferencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferManager;
