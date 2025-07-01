// src/components/admin/productos/helpers.js

export const getStockColor = (stock, unidadMedida = 'unidad') => {
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
    
    // Umbrales diferentes según unidad de medida
    const umbrales = {
      'metro': { bajo: 50, critico: 0 },
      'unidad': { bajo: 10, critico: 0 },
      'kilogramo': { bajo: 20, critico: 0 },
      'litros': { bajo: 20, critico: 0 }
    };
    
    const umbral = umbrales[unidadMedida] || umbrales.unidad;
    
    if (stockNum <= umbral.critico) return 'bg-red-500';
    if (stockNum <= umbral.bajo) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  export const calcularStockTotalProducto = (producto) => {
    return producto.opciones?.reduce((sum, v) => {
      const stockVariante = typeof v.stock_total === 'number' 
        ? v.stock_total 
        : parseFloat(v.stock_total) || 0;
      return sum + stockVariante;
    }, 0) || 0;
  };
  
  export const getStockUnit = (unidadMedida) => {
    switch(unidadMedida) {
      case 'metro': return 'mts';
      case 'kilogramo': return 'kg';
      case 'litros': return 'lts';
      default: return 'uds';
    }
  };