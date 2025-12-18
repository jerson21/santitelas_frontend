// components/vendedor/LockScreen.jsx - Pantalla de bloqueo con teclado aleatorio
import React, { useState, useEffect } from 'react';
import { Lock, ShoppingCart, X, Loader2, AlertCircle } from 'lucide-react';
import ApiService from '../../services/api';

// Funcion para generar posiciones aleatorias de numeros
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const LockScreen = ({
  isLocked,
  onUnlock,
  hasPin = true,
  cart = [],
  vendedorNombre = 'Vendedor',
  documentType = 'ticket'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keypadNumbers, setKeypadNumbers] = useState([]);

  // Generar teclado aleatorio cada vez que se muestra
  useEffect(() => {
    if (isLocked) {
      setKeypadNumbers(shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']));
      setPin('');
      setError('');
    }
  }, [isLocked]);

  // Calcular total del carrito
  const cartTotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
  const cartItemsCount = cart.length;

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  // Manejar input de numero
  const handleNumberPress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');

      // Auto-validar cuando se completan 4 digitos
      if (newPin.length === 4) {
        validatePin(newPin);
      }
    }
  };

  // Borrar ultimo digito
  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  // Limpiar PIN
  const handleClear = () => {
    setPin('');
    setError('');
    // Regenerar teclado al limpiar
    setKeypadNumbers(shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']));
  };

  // Validar PIN
  const validatePin = async (pinToValidate) => {
    setLoading(true);
    setError('');

    try {
      const response = await ApiService.validarPin(pinToValidate);

      if (response.success) {
        onUnlock();
      } else {
        setError(response.message || 'PIN incorrecto');
        setPin('');
        // Regenerar posiciones del teclado tras error
        setKeypadNumbers(shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']));
      }
    } catch (err) {
      setError('Error al validar PIN');
      setPin('');
      setKeypadNumbers(shuffleArray(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']));
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) return null;

  // Si no tiene PIN configurado, mostrar mensaje diferente
  if (!hasPin) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-orange-900 to-orange-700 z-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-white/20 backdrop-blur rounded-full p-6 mb-6 inline-block">
            <AlertCircle className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            PIN No Configurado
          </h1>
          <p className="text-orange-200 text-lg max-w-md">
            No tiene PIN de bloqueo configurado.
            Contacte al administrador para configurarlo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-blue-700 z-50 flex">
      {/* Panel izquierdo: Resumen del carrito (solo lectura) */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-white/10 backdrop-blur-sm p-8 flex-col">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="w-8 h-8 text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">Carrito Actual</h2>
            <p className="text-blue-200 text-sm">
              {documentType.toUpperCase()} - Solo visualizacion
            </p>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-blue-200 py-10">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay productos en el carrito</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-white/20 backdrop-blur rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {item.product?.nombre || 'Producto'}
                    </p>
                    <p className="text-sm text-blue-200">
                      {item.variante?.color || item.color || ''}
                      {item.modalidad ? ` - ${item.modalidad}` : ''}
                    </p>
                    <p className="text-sm text-blue-200">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-bold text-white text-lg">
                    {formatPrice(item.total)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        <div className="border-t border-white/20 pt-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-200">Total ({cartItemsCount} productos)</p>
              <p className="text-3xl font-bold text-white">
                {formatPrice(cartTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho: Teclado de desbloqueo */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Icono y mensaje */}
        <div className="text-center mb-8">
          <div className="bg-white/20 backdrop-blur rounded-full p-6 mb-6 inline-block">
            <Lock className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Pantalla Bloqueada
          </h1>
          <p className="text-blue-200 text-lg">
            {vendedorNombre}
          </p>
          <p className="text-blue-300 text-sm mt-2">
            Ingrese su PIN de 4 digitos para desbloquear
          </p>
        </div>

        {/* Indicador de PIN */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-5 h-5 rounded-full transition-all duration-200 ${
                index < pin.length
                  ? 'bg-white scale-110'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-500/80 text-white px-6 py-3 rounded-lg mb-6 flex items-center gap-2">
            <X className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Teclado numerico aleatorio */}
        <div className="grid grid-cols-3 gap-4 max-w-xs">
          {keypadNumbers.slice(0, 9).map((num) => (
            <button
              key={num}
              onClick={() => handleNumberPress(num)}
              disabled={loading || pin.length >= 4}
              className="w-20 h-20 text-3xl font-bold bg-white/20 hover:bg-white/30
                       text-white rounded-xl transition-all duration-150
                       active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                       backdrop-blur"
            >
              {num}
            </button>
          ))}

          {/* Fila inferior: Limpiar, 0, Borrar */}
          <button
            onClick={handleClear}
            disabled={loading}
            className="w-20 h-20 text-sm font-semibold bg-red-500/50 hover:bg-red-500/70
                     text-white rounded-xl transition-all duration-150 active:scale-95"
          >
            Limpiar
          </button>

          <button
            onClick={() => handleNumberPress(keypadNumbers[9])}
            disabled={loading || pin.length >= 4}
            className="w-20 h-20 text-3xl font-bold bg-white/20 hover:bg-white/30
                     text-white rounded-xl transition-all duration-150
                     active:scale-95 disabled:opacity-50 backdrop-blur"
          >
            {keypadNumbers[9]}
          </button>

          <button
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            className="w-20 h-20 text-sm font-semibold bg-yellow-500/50 hover:bg-yellow-500/70
                     text-white rounded-xl transition-all duration-150 active:scale-95
                     disabled:opacity-50"
          >
            Borrar
          </button>
        </div>

        {/* Indicador de carga */}
        {loading && (
          <div className="mt-6 flex items-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            Validando...
          </div>
        )}

        {/* Info de carrito en movil */}
        <div className="md:hidden mt-8 text-center">
          <p className="text-blue-200">
            {cartItemsCount > 0
              ? `${cartItemsCount} productos en carrito - ${formatPrice(cartTotal)}`
              : 'Carrito vacio'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
