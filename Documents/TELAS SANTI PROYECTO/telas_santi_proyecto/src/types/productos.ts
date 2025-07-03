// src/types/productos.ts - Versión corregida

// Tipos básicos
export interface Precio {
    costo: string;
    neto: string;
    factura: string;
  }
  
  export interface Modalidad {
    id?: number;
    id_modalidad?: number;
    nombre: string;
    descripcion?: string;
    cantidad_base?: number;
    es_cantidad_variable?: boolean;
    minimo_cantidad?: number;
    precio_costo?: number;
    precio_neto?: number;
    precio_factura?: number;
    precios?: Precio;  // Mantener como opcional
    // Agregar índice para propiedades dinámicas
    [key: string]: any;
  }
  
  export interface Variante {
    id?: string | number;
    id_variante?: number;
    esExistente?: boolean;
    color?: string;
    medida?: string;
    material?: string;
    descripcion?: string;
    descripcion_opcion?: string;
    stock_minimo: number;
    stock_total?: number;
    modalidades: Modalidad[];
    sku?: string;
  }
  
  export interface Producto {
    id_producto: number;
    nombre: string;
    modelo: string;
    codigo?: string;
    categoria?: string;
    tipo?: string;
    descripcion?: string;
    unidad_medida?: string;
    stock_minimo_total?: number;
    opciones: Variante[];
  }
  
  export interface Categoria {
    id?: number;
    id_categoria?: number;
    nombre: string;
  }
  
  // Tipos para formularios
  export interface PreciosBase {
    modalidad1: {
      nombre: string;
      cantidad_base: number;
      es_cantidad_variable: boolean;
      minimo_cantidad: number;
      descuento: number;
      precio_neto: number;
      precio_factura: number;
    };
    modalidad2: {
      nombre: string;
      cantidad_base: number;
      es_cantidad_variable: boolean;
      minimo_cantidad: number;
      descuento: number;
      precio_neto: number;
      precio_factura: number;
    };
  }
  
  export interface ProductoFormData {
    categoria: string;
    tipo: string;
    modelo: string;
    codigo: string;
    descripcion: string;
    unidad_medida: string;
    stock_minimo_total: number;
    preciosBase: PreciosBase;
    opciones: Variante[];
  }
  
  export interface VarianteFormData {
    color: string;
    medida: string;
    material: string;
    descripcion: string;
    stock_minimo: number;
    modalidades: Modalidad[];
  }
  
  // Tipos para respuestas API
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
  
  // Tipos para datos guardados
  export interface DatosProducto {
    id_producto?: number;
    esActualizacionProducto?: boolean;
    datosBasicos?: Partial<ProductoFormData>;
    variantesNuevas?: Variante[];
    [key: string]: any;
  }
  
  // Props de componentes
  export interface ProductoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (datosProducto: DatosProducto) => Promise<void>;
    producto?: Producto;
    categorias: Categoria[];
  }
  
  export interface VarianteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (datosVariante: VarianteFormData) => Promise<void>;
    producto?: Producto;
  }
  
  export interface StockConfirmationModalProps {
    isOpen: boolean;
    oldStock: number;
    newStock: number;
    motivo: string;
    skipConfirmation: boolean;
    onConfirm: (motivo: string) => Promise<void>;
    onCancel: () => void;
    onChange: (updates: { motivo?: string; skipConfirmation?: boolean }) => void;
  }
  
  export interface StockMassiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updateData: { operation: string; amount: number; reason: string }) => Promise<void>;
    selectedProducts: number[];
  }
  
  export interface ConfirmationModalProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    variantDetails?: string[];
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }
  
  // Tipos helper
  export type ProductoOpcional = Producto | undefined;
  export type VarianteOpcional = Variante | undefined;