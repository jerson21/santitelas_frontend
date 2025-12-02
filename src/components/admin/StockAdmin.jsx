import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Warehouse,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  History
} from 'lucide-react';
import ApiService from '../../services/api';

const StockAdmin = ({ onOpenMovimientos }) => {
  const [stockData, setStockData] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [alertasBajoMinimo, setAlertasBajoMinimo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBodega, setSelectedBodega] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false);
  const [showAlertasModal, setShowAlertasModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Formulario de movimiento
  const [movimientoForm, setMovimientoForm] = useState({
    id_variante_producto: '',
    id_bodega: '',
    id_bodega_origen: '',
    id_bodega_destino: '',
    cantidad: '',
    cantidad_nueva: '',
    motivo: '',
    referencia: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadBodegas();
  }, []);

  useEffect(() => {
    if (selectedBodega) {
      loadStockBodega(selectedBodega);
    } else {
      loadStockGeneral();
    }
    loadAlertasBajoMinimo();
  }, [selectedBodega]);

  const loadBodegas = async () => {
    try {
      const response = await ApiService.getBodegas({ activa: true });
      if (response.success) {
        setBodegas(response.data || []);
      }
    } catch (error) {
      console.error('Error loading bodegas:', error);
    }
  };

  const loadStockGeneral = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getStock();
      if (response.success) {
        setStockData(response.data || []);
      }
    } catch (error) {
      console.error('Error loading stock:', error);
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStockBodega = async (bodegaId) => {
    setLoading(true);
    try {
      const response = await ApiService.getStockBodega(bodegaId);
      if (response.success) {
        setStockData(response.data?.stock || []);
      }
    } catch (error) {
      console.error('Error loading stock bodega:', error);
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAlertasBajoMinimo = async () => {
    try {
      const response = await ApiService.getStockBajoMinimo(
        selectedBodega ? { id_bodega: selectedBodega } : {}
      );
      if (response.success) {
        setAlertasBajoMinimo(response.data || []);
      }
    } catch (error) {
      console.error('Error loading alertas:', error);
    }
  };

  // Filtrar stock
  const stockFiltrado = stockData.filter(item => {
    if (!item) return false;
    const producto = item.varianteProducto?.producto;
    const variante = item.varianteProducto;

    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      producto?.nombre?.toLowerCase().includes(searchLower) ||
      producto?.codigo?.toLowerCase().includes(searchLower) ||
      variante?.sku?.toLowerCase().includes(searchLower) ||
      variante?.color?.toLowerCase().includes(searchLower);

    return matchSearch;
  });

  // Abrir modal de entrada
  const handleOpenEntrada = (item = null) => {
    setSelectedItem(item);
    setMovimientoForm({
      id_variante_producto: item?.id_variante_producto || '',
      id_bodega: item?.id_bodega || selectedBodega || '',
      cantidad: '',
      motivo: '',
      referencia: ''
    });
    setErrors({});
    setShowEntradaModal(true);
  };

  // Abrir modal de salida
  const handleOpenSalida = (item = null) => {
    setSelectedItem(item);
    setMovimientoForm({
      id_variante_producto: item?.id_variante_producto || '',
      id_bodega: item?.id_bodega || selectedBodega || '',
      cantidad: '',
      motivo: '',
      referencia: ''
    });
    setErrors({});
    setShowSalidaModal(true);
  };

  // Abrir modal de transferencia
  const handleOpenTransferencia = (item = null) => {
    setSelectedItem(item);
    setMovimientoForm({
      id_variante_producto: item?.id_variante_producto || '',
      id_bodega_origen: item?.id_bodega || selectedBodega || '',
      id_bodega_destino: '',
      cantidad: '',
      motivo: ''
    });
    setErrors({});
    setShowTransferenciaModal(true);
  };

  // Registrar entrada
  const handleEntrada = async () => {
    const newErrors = {};
    if (!movimientoForm.id_variante_producto) newErrors.variante = 'Selecciona un producto';
    if (!movimientoForm.id_bodega) newErrors.bodega = 'Selecciona una bodega';
    if (!movimientoForm.cantidad || movimientoForm.cantidad <= 0) newErrors.cantidad = 'Ingresa una cantidad válida';
    if (!movimientoForm.motivo) newErrors.motivo = 'Ingresa un motivo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      const response = await ApiService.registrarEntradaStock({
        id_variante_producto: Number(movimientoForm.id_variante_producto),
        id_bodega: Number(movimientoForm.id_bodega),
        cantidad: Number(movimientoForm.cantidad),
        motivo: movimientoForm.motivo,
        referencia: movimientoForm.referencia || null
      });

      if (response.success) {
        setSuccessMessage('Entrada de stock registrada exitosamente');
        setShowEntradaModal(false);
        selectedBodega ? loadStockBodega(selectedBodega) : loadStockGeneral();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: response.message || 'Error al registrar entrada' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Error al registrar entrada' });
    } finally {
      setProcessing(false);
    }
  };

  // Registrar salida
  const handleSalida = async () => {
    const newErrors = {};
    if (!movimientoForm.id_variante_producto) newErrors.variante = 'Selecciona un producto';
    if (!movimientoForm.id_bodega) newErrors.bodega = 'Selecciona una bodega';
    if (!movimientoForm.cantidad || movimientoForm.cantidad <= 0) newErrors.cantidad = 'Ingresa una cantidad válida';
    if (!movimientoForm.motivo) newErrors.motivo = 'Ingresa un motivo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      const response = await ApiService.registrarSalidaStock({
        id_variante_producto: Number(movimientoForm.id_variante_producto),
        id_bodega: Number(movimientoForm.id_bodega),
        cantidad: Number(movimientoForm.cantidad),
        motivo: movimientoForm.motivo,
        referencia: movimientoForm.referencia || null
      });

      if (response.success) {
        setSuccessMessage('Salida de stock registrada exitosamente');
        setShowSalidaModal(false);
        selectedBodega ? loadStockBodega(selectedBodega) : loadStockGeneral();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: response.message || 'Error al registrar salida' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Error al registrar salida' });
    } finally {
      setProcessing(false);
    }
  };

  // Realizar transferencia
  const handleTransferencia = async () => {
    const newErrors = {};
    if (!movimientoForm.id_variante_producto) newErrors.variante = 'Selecciona un producto';
    if (!movimientoForm.id_bodega_origen) newErrors.bodega_origen = 'Selecciona bodega origen';
    if (!movimientoForm.id_bodega_destino) newErrors.bodega_destino = 'Selecciona bodega destino';
    if (movimientoForm.id_bodega_origen === movimientoForm.id_bodega_destino) {
      newErrors.bodega_destino = 'La bodega destino debe ser diferente';
    }
    if (!movimientoForm.cantidad || movimientoForm.cantidad <= 0) newErrors.cantidad = 'Ingresa una cantidad válida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      const response = await ApiService.transferirStock({
        id_variante_producto: Number(movimientoForm.id_variante_producto),
        id_bodega_origen: Number(movimientoForm.id_bodega_origen),
        id_bodega_destino: Number(movimientoForm.id_bodega_destino),
        cantidad: Number(movimientoForm.cantidad),
        motivo: movimientoForm.motivo || 'Transferencia entre bodegas'
      });

      if (response.success) {
        setSuccessMessage('Transferencia realizada exitosamente');
        setShowTransferenciaModal(false);
        selectedBodega ? loadStockBodega(selectedBodega) : loadStockGeneral();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: response.message || 'Error al realizar transferencia' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Error al realizar transferencia' });
    } finally {
      setProcessing(false);
    }
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'sin_stock': return 'bg-red-100 text-red-800';
      case 'bajo_minimo': return 'bg-yellow-100 text-yellow-800';
      case 'alerta': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'sin_stock': return 'Sin Stock';
      case 'bajo_minimo': return 'Bajo Mínimo';
      case 'alerta': return 'Alerta';
      default: return 'Normal';
    }
  };

  // Obtener lista única de variantes desde stockData para los selectores
  const getVariantesDisponibles = () => {
    const variantesMap = new Map();
    stockData.forEach(item => {
      if (item.varianteProducto && !variantesMap.has(item.id_variante_producto)) {
        variantesMap.set(item.id_variante_producto, {
          id_variante_producto: item.id_variante_producto,
          sku: item.varianteProducto.sku,
          color: item.varianteProducto.color,
          medida: item.varianteProducto.medida,
          producto: item.varianteProducto.producto
        });
      }
    });
    return Array.from(variantesMap.values());
  };

  // Modal de movimiento (entrada/salida)
  const MovimientoModal = ({ tipo, onSubmit, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {tipo === 'entrada' ? (
                <ArrowDownCircle className="w-6 h-6 text-green-600" />
              ) : (
                <ArrowUpCircle className="w-6 h-6 text-red-600" />
              )}
              {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {errors.general}
            </div>
          )}

          {selectedItem ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-800">
                {selectedItem.varianteProducto?.producto?.nombre}
              </p>
              <p className="text-sm text-blue-600">
                SKU: {selectedItem.varianteProducto?.sku}
                {selectedItem.varianteProducto?.color && ` | Color: ${selectedItem.varianteProducto.color}`}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Stock actual: {selectedItem.cantidad_disponible}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto/Variante *</label>
              <select
                value={movimientoForm.id_variante_producto}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, id_variante_producto: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.variante ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar producto</option>
                {getVariantesDisponibles().map(v => (
                  <option key={v.id_variante_producto} value={v.id_variante_producto}>
                    {v.producto?.nombre} - {v.sku} {v.color ? `(${v.color})` : ''}
                  </option>
                ))}
              </select>
              {errors.variante && <p className="text-red-500 text-sm mt-1">{errors.variante}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bodega *</label>
            {selectedItem ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg">
                <Warehouse className="w-4 h-4" />
                {bodegas.find(b => b.id_bodega === Number(movimientoForm.id_bodega))?.nombre || 'Bodega seleccionada'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bodegas.map(b => (
                  <button
                    key={b.id_bodega}
                    type="button"
                    onClick={() => setMovimientoForm({ ...movimientoForm, id_bodega: String(b.id_bodega) })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      Number(movimientoForm.id_bodega) === b.id_bodega
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    <Warehouse className="w-4 h-4" />
                    {b.nombre}
                  </button>
                ))}
              </div>
            )}
            {errors.bodega && <p className="text-red-500 text-sm mt-1">{errors.bodega}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={movimientoForm.cantidad}
              onChange={(e) => setMovimientoForm({ ...movimientoForm, cantidad: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg ${errors.cantidad ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Cantidad"
            />
            {errors.cantidad && <p className="text-red-500 text-sm mt-1">{errors.cantidad}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <select
              value={movimientoForm.motivo}
              onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg ${errors.motivo ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar motivo</option>
              {tipo === 'entrada' ? (
                <>
                  <option value="Compra de mercadería">Compra de mercadería</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                  <option value="Ajuste de inventario">Ajuste de inventario</option>
                  <option value="Otro">Otro</option>
                </>
              ) : (
                <>
                  <option value="Merma">Merma</option>
                  <option value="Producto dañado">Producto dañado</option>
                  <option value="Ajuste de inventario">Ajuste de inventario</option>
                  <option value="Devolución a proveedor">Devolución a proveedor</option>
                  <option value="Otro">Otro</option>
                </>
              )}
            </select>
            {errors.motivo && <p className="text-red-500 text-sm mt-1">{errors.motivo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia (opcional)</label>
            <input
              type="text"
              value={movimientoForm.referencia}
              onChange={(e) => setMovimientoForm({ ...movimientoForm, referencia: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Ej: Factura #123, Orden de compra"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={processing}
            className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 ${
              tipo === 'entrada'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Registrar
          </button>
        </div>
      </div>
    </div>
  );

  // Modal de transferencia
  const TransferenciaModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              Transferir Stock
            </h3>
            <button onClick={() => setShowTransferenciaModal(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {errors.general}
            </div>
          )}

          {selectedItem ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-800">
                {selectedItem.varianteProducto?.producto?.nombre}
              </p>
              <p className="text-sm text-blue-600">
                SKU: {selectedItem.varianteProducto?.sku}
                {selectedItem.varianteProducto?.color && ` | Color: ${selectedItem.varianteProducto.color}`}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Stock en origen: {selectedItem.cantidad_disponible}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto/Variante *</label>
              <select
                value={movimientoForm.id_variante_producto}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, id_variante_producto: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.variante ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar producto</option>
                {getVariantesDisponibles().map(v => (
                  <option key={v.id_variante_producto} value={v.id_variante_producto}>
                    {v.producto?.nombre} - {v.sku} {v.color ? `(${v.color})` : ''}
                  </option>
                ))}
              </select>
              {errors.variante && <p className="text-red-500 text-sm mt-1">{errors.variante}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bodega Origen *</label>
            {selectedItem ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
                <Warehouse className="w-4 h-4" />
                {bodegas.find(b => b.id_bodega === Number(movimientoForm.id_bodega_origen))?.nombre || 'Bodega origen'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bodegas.map(b => (
                  <button
                    key={b.id_bodega}
                    type="button"
                    onClick={() => setMovimientoForm({ ...movimientoForm, id_bodega_origen: String(b.id_bodega), id_bodega_destino: '' })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      Number(movimientoForm.id_bodega_origen) === b.id_bodega
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    <Warehouse className="w-4 h-4" />
                    {b.nombre}
                  </button>
                ))}
              </div>
            )}
            {errors.bodega_origen && <p className="text-red-500 text-sm mt-1">{errors.bodega_origen}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bodega Destino *</label>
            <div className="flex flex-wrap gap-2">
              {bodegas
                .filter(b => b.id_bodega !== Number(movimientoForm.id_bodega_origen))
                .map(b => (
                  <button
                    key={b.id_bodega}
                    type="button"
                    onClick={() => setMovimientoForm({ ...movimientoForm, id_bodega_destino: String(b.id_bodega) })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      Number(movimientoForm.id_bodega_destino) === b.id_bodega
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    <Warehouse className="w-4 h-4" />
                    {b.nombre}
                  </button>
                ))}
            </div>
            {!movimientoForm.id_bodega_origen && (
              <p className="text-gray-500 text-sm mt-1">Selecciona primero una bodega origen</p>
            )}
            {errors.bodega_destino && <p className="text-red-500 text-sm mt-1">{errors.bodega_destino}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a transferir *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={movimientoForm.cantidad}
              onChange={(e) => setMovimientoForm({ ...movimientoForm, cantidad: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg ${errors.cantidad ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Cantidad"
            />
            {errors.cantidad && <p className="text-red-500 text-sm mt-1">{errors.cantidad}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={movimientoForm.motivo}
              onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Ej: Reposición de sala de ventas"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => setShowTransferenciaModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleTransferencia}
            disabled={processing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            Transferir
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Package className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Control de Stock</h1>
            <p className="text-gray-500">Gestiona el inventario de tus bodegas</p>
          </div>
        </div>
        <div className="flex gap-2">
          {alertasBajoMinimo.length > 0 && (
            <button
              onClick={() => setShowAlertasModal(true)}
              className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 transition"
            >
              <AlertTriangle className="w-5 h-5" />
              {alertasBajoMinimo.length} Alertas
            </button>
          )}
          {onOpenMovimientos && (
            <button
              onClick={onOpenMovimientos}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              <History className="w-5 h-5" />
              Historial
            </button>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => handleOpenEntrada()}
          className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition"
        >
          <ArrowDownCircle className="w-8 h-8 text-green-600" />
          <div className="text-left">
            <p className="font-medium text-green-800">Entrada de Stock</p>
            <p className="text-sm text-green-600">Registrar compras o devoluciones</p>
          </div>
        </button>
        <button
          onClick={() => handleOpenSalida()}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition"
        >
          <ArrowUpCircle className="w-8 h-8 text-red-600" />
          <div className="text-left">
            <p className="font-medium text-red-800">Salida de Stock</p>
            <p className="text-sm text-red-600">Registrar mermas o ajustes</p>
          </div>
        </button>
        <button
          onClick={() => handleOpenTransferencia()}
          className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
        >
          <ArrowRightLeft className="w-8 h-8 text-blue-600" />
          <div className="text-left">
            <p className="font-medium text-blue-800">Transferencia</p>
            <p className="text-sm text-blue-600">Mover entre bodegas</p>
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
        {/* Barra de búsqueda */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar producto, SKU o color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <button
            onClick={() => selectedBodega ? loadStockBodega(selectedBodega) : loadStockGeneral()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Selector de bodegas con botones */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBodega('')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              selectedBodega === ''
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            Todas
          </button>
          {bodegas.map(b => (
            <button
              key={b.id_bodega}
              onClick={() => setSelectedBodega(String(b.id_bodega))}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedBodega === String(b.id_bodega)
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Warehouse className="w-4 h-4" />
              {b.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de stock */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : stockFiltrado.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontró stock</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bodega</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Disponible</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reservado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stockFiltrado.map((item) => {
                const producto = item.varianteProducto?.producto;
                const variante = item.varianteProducto;
                const bodega = item.bodega;

                return (
                  <tr key={item.id_stock} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{producto?.nombre}</p>
                        <p className="text-sm text-gray-500">
                          SKU: {variante?.sku}
                          {variante?.color && ` | ${variante.color}`}
                          {variante?.medida && ` | ${variante.medida}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{bodega?.nombre || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-gray-800">{item.cantidad_disponible}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-600">{item.cantidad_reservada || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(item.estado_stock)}`}>
                        {getEstadoTexto(item.estado_stock)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEntrada(item)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Entrada"
                        >
                          <ArrowDownCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenSalida(item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Salida"
                        >
                          <ArrowUpCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenTransferencia(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Transferir"
                        >
                          <ArrowRightLeft className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Resumen */}
      <div className="mt-4 text-sm text-gray-500">
        Mostrando {stockFiltrado.length} registros de stock
      </div>

      {/* Modal de alertas bajo mínimo */}
      {showAlertasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  Productos Bajo Stock Mínimo ({alertasBajoMinimo.length})
                </h3>
                <button onClick={() => setShowAlertasModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {alertasBajoMinimo.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay alertas de stock bajo</p>
              ) : (
                <div className="space-y-3">
                  {alertasBajoMinimo.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.varianteProducto?.producto?.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.varianteProducto?.sku} | {item.bodega?.nombre}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">
                          {item.cantidad_disponible} / {item.stock_minimo || item.varianteProducto?.stock_minimo}
                        </p>
                        <p className="text-sm text-gray-500">
                          Déficit: {item.deficit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {showEntradaModal && (
        <MovimientoModal
          tipo="entrada"
          onSubmit={handleEntrada}
          onClose={() => setShowEntradaModal(false)}
        />
      )}
      {showSalidaModal && (
        <MovimientoModal
          tipo="salida"
          onSubmit={handleSalida}
          onClose={() => setShowSalidaModal(false)}
        />
      )}
      {showTransferenciaModal && <TransferenciaModal />}
    </div>
  );
};

export default StockAdmin;
