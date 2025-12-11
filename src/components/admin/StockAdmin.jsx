import React, { useState, useEffect, useRef } from 'react';
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
  History,
  Plus,
  Trash2,
  FileSpreadsheet,
  Upload,
  Layers
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
  const [showIngresoMasivoModal, setShowIngresoMasivoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Estado para ingreso masivo
  const [ingresoMasivoData, setIngresoMasivoData] = useState({
    id_bodega: '',
    motivo: 'Recepción de contenedor',
    referencia: '',
    entradas: [{ id_variante_producto: '', cantidad: '', searchTerm: '' }]
  });
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Estado para importación Excel
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  const [importExcelData, setImportExcelData] = useState({
    id_bodega: '',
    file: null
  });
  const [importResult, setImportResult] = useState(null);

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

  // ========= FUNCIONES PARA INGRESO MASIVO =========

  // Abrir modal de ingreso masivo
  const handleOpenIngresoMasivo = () => {
    setIngresoMasivoData({
      id_bodega: selectedBodega || '',
      motivo: 'Recepción de contenedor',
      referencia: '',
      entradas: [{ id_variante_producto: '', cantidad: '', searchTerm: '', productoInfo: null }]
    });
    setErrors({});
    setSearchResults([]);
    setActiveSearchIndex(null);
    setShowIngresoMasivoModal(true);
  };

  // Buscar productos para ingreso masivo
  const handleSearchProducto = async (searchValue, index) => {
    if (!searchValue || searchValue.length < 2) {
      setSearchResults([]);
      return;
    }

    setActiveSearchIndex(index);
    setSearchLoading(true);

    try {
      const response = await ApiService.buscarProductosRapido(searchValue, 20);
      if (response.success && response.data) {
        // Transformar los resultados para mostrar variantes
        const resultados = [];
        response.data.forEach(producto => {
          if (producto.variantes && producto.variantes.length > 0) {
            producto.variantes.forEach(variante => {
              resultados.push({
                id_variante_producto: variante.id_variante_producto,
                sku: variante.sku,
                color: variante.color,
                medida: variante.medida,
                productoNombre: producto.nombre || producto.modelo,
                productoCodigo: producto.codigo
              });
            });
          }
        });
        setSearchResults(resultados);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Seleccionar producto en ingreso masivo
  const handleSelectProductoMasivo = (resultado, index) => {
    const nuevasEntradas = [...ingresoMasivoData.entradas];
    nuevasEntradas[index] = {
      ...nuevasEntradas[index],
      id_variante_producto: resultado.id_variante_producto,
      searchTerm: `${resultado.productoNombre} - ${resultado.sku}${resultado.color ? ` (${resultado.color})` : ''}`,
      productoInfo: resultado
    };
    setIngresoMasivoData({ ...ingresoMasivoData, entradas: nuevasEntradas });
    setSearchResults([]);
    setActiveSearchIndex(null);
  };

  // Agregar fila de entrada
  const handleAddEntrada = () => {
    setIngresoMasivoData({
      ...ingresoMasivoData,
      entradas: [...ingresoMasivoData.entradas, { id_variante_producto: '', cantidad: '', searchTerm: '', productoInfo: null }]
    });
  };

  // Eliminar fila de entrada
  const handleRemoveEntrada = (index) => {
    if (ingresoMasivoData.entradas.length <= 1) return;
    const nuevasEntradas = ingresoMasivoData.entradas.filter((_, i) => i !== index);
    setIngresoMasivoData({ ...ingresoMasivoData, entradas: nuevasEntradas });
  };

  // Actualizar cantidad de entrada
  const handleUpdateEntradaCantidad = (index, cantidad) => {
    const nuevasEntradas = [...ingresoMasivoData.entradas];
    nuevasEntradas[index] = { ...nuevasEntradas[index], cantidad };
    setIngresoMasivoData({ ...ingresoMasivoData, entradas: nuevasEntradas });
  };

  // Actualizar búsqueda de entrada (con debounce para no saturar el servidor)
  const handleUpdateEntradaSearch = (index, searchTerm) => {
    const nuevasEntradas = [...ingresoMasivoData.entradas];
    nuevasEntradas[index] = {
      ...nuevasEntradas[index],
      searchTerm,
      id_variante_producto: '',
      productoInfo: null
    };
    setIngresoMasivoData({ ...ingresoMasivoData, entradas: nuevasEntradas });

    // Cancelar búsqueda anterior si existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Esperar 400ms antes de buscar
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchProducto(searchTerm, index);
    }, 400);
  };

  // Procesar ingreso masivo
  const handleIngresoMasivo = async () => {
    const newErrors = {};

    if (!ingresoMasivoData.id_bodega) {
      newErrors.bodega = 'Selecciona una bodega';
    }
    if (!ingresoMasivoData.motivo) {
      newErrors.motivo = 'Ingresa un motivo';
    }

    // Validar entradas
    const entradasValidas = ingresoMasivoData.entradas.filter(e =>
      e.id_variante_producto && e.cantidad && Number(e.cantidad) > 0
    );

    if (entradasValidas.length === 0) {
      newErrors.entradas = 'Debes agregar al menos un producto con cantidad válida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      const response = await ApiService.registrarEntradaMasivaStock({
        id_bodega: Number(ingresoMasivoData.id_bodega),
        motivo: ingresoMasivoData.motivo,
        referencia: ingresoMasivoData.referencia || null,
        entradas: entradasValidas.map(e => ({
          id_variante_producto: Number(e.id_variante_producto),
          cantidad: Number(e.cantidad)
        }))
      });

      if (response.success) {
        setSuccessMessage(`Se registraron ${entradasValidas.length} entradas de stock exitosamente`);
        setShowIngresoMasivoModal(false);
        selectedBodega ? loadStockBodega(selectedBodega) : loadStockGeneral();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrors({ general: response.message || 'Error al registrar entradas' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Error al registrar entradas' });
    } finally {
      setProcessing(false);
    }
  };

  // Calcular resumen de ingreso masivo
  const getResumenIngresoMasivo = () => {
    const entradasValidas = ingresoMasivoData.entradas.filter(e =>
      e.id_variante_producto && e.cantidad && Number(e.cantidad) > 0
    );
    return {
      totalProductos: entradasValidas.length,
      totalCantidad: entradasValidas.reduce((sum, e) => sum + Number(e.cantidad || 0), 0)
    };
  };

  // ========= FUNCIONES PARA IMPORTACIÓN EXCEL =========

  // Abrir modal de importación Excel
  const handleOpenImportExcel = () => {
    setImportExcelData({
      id_bodega: selectedBodega || '',
      file: null
    });
    setImportResult(null);
    setErrors({});
    setShowImportExcelModal(true);
  };

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar extensión
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(fileExtension)) {
        setErrors({ file: 'Solo se permiten archivos Excel (.xlsx, .xls)' });
        return;
      }
      setImportExcelData({ ...importExcelData, file });
      setErrors({});
    }
  };

  // Procesar importación Excel
  const handleImportExcel = async () => {
    const newErrors = {};

    if (!importExcelData.id_bodega) {
      newErrors.bodega = 'Selecciona una bodega';
    }
    if (!importExcelData.file) {
      newErrors.file = 'Selecciona un archivo Excel';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', importExcelData.file);
      formData.append('id_bodega', importExcelData.id_bodega);
      formData.append('motivo', 'Importación desde Excel');

      const response = await ApiService.importarStockExcel(formData);

      if (response.success) {
        setImportResult(response.data);
        setSuccessMessage(`Se importaron ${response.data.total_importados} registros de stock`);
        selectedBodega ? loadStockBodega(selectedBodega) : loadStockGeneral();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrors({ general: response.message || 'Error al importar archivo' });
        if (response.errores) {
          setImportResult({ errores: response.errores });
        }
      }
    } catch (error) {
      setErrors({ general: error.message || 'Error al importar archivo' });
    } finally {
      setProcessing(false);
    }
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
        <div className="flex flex-wrap gap-2">
          {alertasBajoMinimo.length > 0 && (
            <button
              onClick={() => setShowAlertasModal(true)}
              className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg hover:bg-yellow-200 transition text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">{alertasBajoMinimo.length} Alertas</span>
              <span className="sm:hidden">{alertasBajoMinimo.length}</span>
            </button>
          )}
          <button
            onClick={handleOpenImportExcel}
            className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Importar Excel</span>
          </button>
          {onOpenMovimientos && (
            <button
              onClick={onOpenMovimientos}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historial</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => handleOpenEntrada()}
          className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition"
        >
          <ArrowDownCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium text-green-800">Entrada</p>
            <p className="text-sm text-green-600 hidden sm:block">Compras o devoluciones</p>
          </div>
        </button>
        <button
          onClick={() => handleOpenSalida()}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition"
        >
          <ArrowUpCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium text-red-800">Salida</p>
            <p className="text-sm text-red-600 hidden sm:block">Mermas o ajustes</p>
          </div>
        </button>
        <button
          onClick={() => handleOpenTransferencia()}
          className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
        >
          <ArrowRightLeft className="w-8 h-8 text-blue-600 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium text-blue-800">Transferencia</p>
            <p className="text-sm text-blue-600 hidden sm:block">Mover entre bodegas</p>
          </div>
        </button>
        <button
          onClick={handleOpenIngresoMasivo}
          className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition"
        >
          <Layers className="w-8 h-8 text-purple-600 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium text-purple-800">Ingreso Masivo</p>
            <p className="text-sm text-purple-600 hidden sm:block">Recepción de contenedor</p>
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

      {/* Modal de Ingreso Masivo */}
      {showIngresoMasivoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[98vh] flex flex-col ${activeSearchIndex !== null ? '' : 'overflow-hidden'}`}>
            {/* Header compacto */}
            <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-800">Ingreso Masivo</h3>
                  {getResumenIngresoMasivo().totalProductos > 0 && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {getResumenIngresoMasivo().totalProductos} items | {getResumenIngresoMasivo().totalCantidad.toFixed(1)} mts
                    </span>
                  )}
                </div>
                <button onClick={() => setShowIngresoMasivoModal(false)} className="text-gray-500 hover:text-gray-700 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Campos comunes - una sola línea compacta */}
            <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0 bg-gray-50">
              <div className="flex flex-wrap items-center gap-3">
                {/* Bodegas */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Bodega:</span>
                  {bodegas.map(b => (
                    <button
                      key={b.id_bodega}
                      type="button"
                      onClick={() => setIngresoMasivoData({ ...ingresoMasivoData, id_bodega: String(b.id_bodega) })}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        Number(ingresoMasivoData.id_bodega) === b.id_bodega
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {b.nombre}
                    </button>
                  ))}
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                {/* Motivo */}
                <select
                  value={ingresoMasivoData.motivo}
                  onChange={(e) => setIngresoMasivoData({ ...ingresoMasivoData, motivo: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                >
                  <option value="Recepción de contenedor">Recepción contenedor</option>
                  <option value="Compra de mercadería">Compra mercadería</option>
                  <option value="Devolución de cliente">Devolución</option>
                  <option value="Ajuste de inventario">Ajuste inventario</option>
                </select>
                {/* Referencia */}
                <input
                  type="text"
                  value={ingresoMasivoData.referencia}
                  onChange={(e) => setIngresoMasivoData({ ...ingresoMasivoData, referencia: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded text-xs w-40"
                  placeholder="Ref: #contenedor..."
                />
              </div>
              {(errors.bodega || errors.motivo) && (
                <p className="text-red-500 text-xs mt-1">{errors.bodega || errors.motivo}</p>
              )}
            </div>

            {/* Body con scroll - área principal de productos */}
            <div className={`p-3 flex-1 ${activeSearchIndex !== null ? 'overflow-visible' : 'overflow-y-auto'}`}>
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{errors.general}</span>
                </div>
              )}

              {errors.entradas && (
                <p className="text-red-500 text-sm mb-2">{errors.entradas}</p>
              )}

              <div className="space-y-1">
                {/* Header - solo en desktop */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2 pb-1 border-b border-gray-200">
                  <div className="col-span-8">Producto (buscar por nombre, SKU, tipo o color)</div>
                  <div className="col-span-2">Metros</div>
                  <div className="col-span-2 text-center">Acción</div>
                </div>

                {/* Filas de productos */}
                {ingresoMasivoData.entradas.map((entrada, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-1.5 px-2 bg-white border-b border-gray-100 hover:bg-gray-50"
                  >
                    {/* Búsqueda de producto */}
                    <div className="sm:col-span-8 relative">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={entrada.searchTerm}
                          onChange={(e) => handleUpdateEntradaSearch(index, e.target.value)}
                          onFocus={() => setActiveSearchIndex(index)}
                          onBlur={() => setTimeout(() => setActiveSearchIndex(null), 200)}
                          className={`w-full pl-8 pr-8 py-1.5 border rounded text-sm ${
                            entrada.id_variante_producto ? 'bg-green-50 border-green-300' : 'border-gray-300'
                          }`}
                          placeholder="Buscar por nombre, SKU, tipo o color..."
                        />
                        {entrada.id_variante_producto && (
                          <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600 w-4 h-4" />
                        )}
                      </div>

                      {/* Dropdown de resultados */}
                      {activeSearchIndex === index && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                          {searchLoading ? (
                            <div className="p-3 text-center text-gray-500">
                              <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                              Buscando...
                            </div>
                          ) : (
                            searchResults.map((resultado) => (
                              <button
                                key={resultado.id_variante_producto}
                                type="button"
                                onClick={() => handleSelectProductoMasivo(resultado, index)}
                                className="w-full text-left px-3 py-2 hover:bg-purple-50 border-b border-gray-100 last:border-0"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{resultado.productoNombre}</p>
                                    <p className="text-xs text-gray-500">
                                      {resultado.sku}
                                      {resultado.color && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded">{resultado.color}</span>}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cantidad */}
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={entrada.cantidad}
                        onChange={(e) => handleUpdateEntradaCantidad(index, e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Botones */}
                    <div className="sm:col-span-2 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveEntrada(index)}
                        disabled={ingresoMasivoData.entradas.length <= 1}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {index === ingresoMasivoData.entradas.length - 1 && (
                        <button
                          type="button"
                          onClick={handleAddEntrada}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="Agregar fila"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Botón agregar más filas */}
                <button
                  type="button"
                  onClick={handleAddEntrada}
                  className="mt-2 w-full py-1.5 border border-dashed border-gray-300 rounded text-gray-400 hover:border-purple-400 hover:text-purple-600 transition flex items-center justify-center gap-1 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Agregar producto
                </button>
              </div>
            </div>

            {/* Footer compacto */}
            <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50">
              <button
                onClick={() => setShowIngresoMasivoModal(false)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleIngresoMasivo}
                disabled={processing || getResumenIngresoMasivo().totalProductos === 0}
                className="px-4 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Registrar ({getResumenIngresoMasivo().totalProductos})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación Excel */}
      {showImportExcelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  Importar Stock desde Excel
                </h3>
                <button
                  onClick={() => setShowImportExcelModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errors.general}</span>
                </div>
              )}

              {/* Instrucciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Formato del archivo</h4>
                <p className="text-sm text-blue-700 mb-2">
                  El archivo Excel debe tener las siguientes columnas en la primera fila:
                </p>
                <ul className="text-sm text-blue-600 list-disc list-inside space-y-1">
                  <li><strong>SKU</strong> o <strong>Codigo</strong>: Código del producto</li>
                  <li><strong>Cantidad</strong> o <strong>Metros</strong>: Cantidad a ingresar</li>
                </ul>
              </div>

              {/* Bodega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bodega destino *</label>
                <div className="flex flex-wrap gap-2">
                  {bodegas.map(b => (
                    <button
                      key={b.id_bodega}
                      type="button"
                      onClick={() => setImportExcelData({ ...importExcelData, id_bodega: String(b.id_bodega) })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        Number(importExcelData.id_bodega) === b.id_bodega
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      <Warehouse className="w-4 h-4" />
                      {b.nombre}
                    </button>
                  ))}
                </div>
                {errors.bodega && <p className="text-red-500 text-sm mt-1">{errors.bodega}</p>}
              </div>

              {/* Selector de archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Archivo Excel *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-file-input"
                  />
                  <label
                    htmlFor="excel-file-input"
                    className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      importExcelData.file
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {importExcelData.file ? (
                      <>
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">{importExcelData.file.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-500">Haz clic para seleccionar archivo</span>
                      </>
                    )}
                  </label>
                </div>
                {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
              </div>

              {/* Resultados de importación */}
              {importResult && (
                <div className="space-y-3">
                  {importResult.total_importados > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">Importación exitosa</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-green-600">Registros:</span>
                          <span className="ml-2 font-medium">{importResult.total_importados}</span>
                        </div>
                        <div>
                          <span className="text-green-600">Total metros:</span>
                          <span className="ml-2 font-medium">{importResult.total_cantidad?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {importResult.errores && importResult.errores.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Errores encontrados ({importResult.errores.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errores.map((err, idx) => (
                          <p key={idx} className="text-sm text-yellow-700">
                            Fila {err.fila}: {err.sku ? `SKU "${err.sku}" - ` : ''}{err.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0 bg-gray-50">
              <button
                onClick={() => setShowImportExcelModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg order-2 sm:order-1"
              >
                {importResult?.total_importados > 0 ? 'Cerrar' : 'Cancelar'}
              </button>
              {!importResult?.total_importados && (
                <button
                  onClick={handleImportExcel}
                  disabled={processing || !importExcelData.file || !importExcelData.id_bodega}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdmin;
