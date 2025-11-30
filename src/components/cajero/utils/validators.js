// /src/components/cajero/utils/validators.js

/**
 * Valida el formato de un número de vale
 * @param {string} numero - Número de vale a validar
 * @returns {Object} - { valido: boolean, numero?: string, mensaje?: string }
 */
export const validarNumeroVale = (numero) => {
  if (!numero || !numero.trim()) {
    return { valido: false, mensaje: 'Ingresa un número de vale válido' };
  }

  const numeroLimpio = numero.trim().toUpperCase();
  
  // Validar formato simple (87, #87, 087) 
  if (/^\d{1,4}$/.test(numeroLimpio.replace(/[#\s]/g, ''))) {
    return { valido: true, numero: numeroLimpio.replace(/[#\s]/g, '') };
  }
  
  // Validar formato completo (VP20250602-0087)
  if (/^VP\d{8}-\d{4}$/.test(numeroLimpio)) {
    return { valido: true, numero: numeroLimpio };
  }

  return { 
    valido: false, 
    mensaje: 'Formato inválido. Usa: 87 o VP20250602-0087' 
  };
};

/**
 * Valida datos de pago para facturas
 * @param {Object} paymentData - Datos de pago
 * @returns {Object} - { valido: boolean, errores: string[] }
 */
export const validarDatosPago = (paymentData) => {
  const errores = [];

  // Validaciones para factura
  if (paymentData.tipo_documento === 'factura') {
    if (!paymentData.rut_cliente || !paymentData.rut_cliente.trim()) {
      errores.push('RUT del cliente es requerido para factura');
    }
    if (!paymentData.razon_social || !paymentData.razon_social.trim()) {
      errores.push('Razón social es requerida para factura');
    }
  }

  // Validar montos
  const montoPagado = Number(paymentData.monto_pagado) || 0;
  const descuento = Number(paymentData.descuento) || 0;

  if (descuento < 0) {
    errores.push('El descuento no puede ser negativo');
  }

  if (montoPagado <= 0) {
    errores.push('El monto pagado debe ser mayor a 0');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

/**
 * Valida formato de RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} - true si es válido
 */
export const validarRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return false;
  
  // Limpiar RUT
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;
  
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toLowerCase();
  
  // Calcular dígito verificador
  let suma = 0;
  let multiplo = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : String(11 - resto);
  
  return dv === dvCalculado;
};

/**
 * Formatea un RUT con puntos y guión
 * @param {string} rut - RUT a formatear
 * @returns {string} - RUT formateado
 */
export const formatearRUT = (rut) => {
  if (!rut) return '';
  
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  if (rutLimpio.length < 2) return rutLimpio;
  
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  
  // Agregar puntos al cuerpo
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${cuerpoFormateado}-${dv}`;
};

/**
 * Valida email básico
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export const validarEmail = (email) => {
  if (!email) return true; // Email es opcional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida teléfono chileno
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} - true si es válido
 */
export const validarTelefono = (telefono) => {
  if (!telefono) return true; // Teléfono es opcional
  
  // Limpiar número
  const telefonoLimpio = telefono.replace(/[^0-9+]/g, '');
  
  // Formatos válidos: +56912345678, 56912345678, 912345678
  const regexes = [
    /^\+569\d{8}$/, // +56912345678
    /^569\d{8}$/,   // 56912345678
    /^9\d{8}$/      // 912345678
  ];
  
  return regexes.some(regex => regex.test(telefonoLimpio));
};

/**
 * Filtra campos vacíos de un objeto
 * @param {Object} obj - Objeto a filtrar
 * @returns {Object} - Objeto sin campos vacíos
 */
export const filterEmptyFields = (obj) => {
  const filtered = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    // Solo incluir si el valor no está vacío
    if (value !== null && value !== undefined && value !== '') {
      // Si es string, verificar que no sea solo espacios
      if (typeof value === 'string') {
        if (value.trim() !== '') {
          filtered[key] = value.trim();
        }
      } else {
        // Para números, booleanos, etc.
        filtered[key] = value;
      }
    }
  });
  
  return filtered;
};

/**
 * Valida datos de arqueo
 * @param {Object} arqueoData - Datos del arqueo
 * @returns {Object} - { valido: boolean, errores: string[] }
 */
export const validarDatosArqueo = (arqueoData) => {
  const errores = [];
  
  // Validar que al menos haya un monto
  const montos = [
    arqueoData.conteo_billetes,
    arqueoData.conteo_monedas
  ].flat();
  
  const hayMontos = montos.some(monto => 
    Object.values(monto || {}).some(valor => Number(valor) > 0)
  );
  
  if (!hayMontos) {
    errores.push('Debe ingresar al menos un monto en el arqueo');
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
};
