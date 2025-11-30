// /src/components/cajero/components/Toast.jsx
import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar el toast con animación
    setIsVisible(true);

    if (autoClose) {
      const timer = setTimeout(onClose, 7000); // 7 segundos para leer
      return () => clearTimeout(timer);
    }
  }, [onClose, autoClose]);

  const config = {
    success: {
      bgColor: 'bg-green-500',
      icon: CheckCircle
    },
    error: {
      bgColor: 'bg-red-500',
      icon: AlertCircle
    },
    warning: {
      bgColor: 'bg-yellow-500',
      icon: AlertTriangle
    },
    info: {
      bgColor: 'bg-blue-500',
      icon: Info
    }
  };

  const { bgColor, icon: IconComponent } = config[type];

  // Estilos inline para la animación
  const toastStyle = {
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
    opacity: isVisible ? 1 : 0,
    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
  };

  return (
    <div 
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-xl z-50 max-w-md`}
      style={toastStyle}
    >
      <div className="flex items-start">
        <IconComponent className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {message}
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="ml-4 text-white hover:text-gray-200 flex-shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;