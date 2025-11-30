// /src/components/cajero/components/QuickActionsMenu.jsx
import React, { useState } from 'react';
import {
  Users,
  FileText,
  AlertCircle,
  BarChart3,
  Search,
  Clock,
  DollarSign,
  Menu,
  X
} from 'lucide-react';

const QuickActionsMenu = ({
  onBuscarCliente,
  onReportes,
  onEstadisticas,
  onMorosidades,
  onClientes
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAction = (action) => {
    action();
    setIsOpen(false);
  };

  const actions = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: onClientes
    },
    {
      id: 'buscar',
      label: 'Buscar Cliente',
      icon: Search,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: onBuscarCliente
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: FileText,
      color: 'bg-green-500 hover:bg-green-600',
      action: onReportes
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: BarChart3,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: onEstadisticas
    },
    {
      id: 'morosidades',
      label: 'Morosidades',
      icon: AlertCircle,
      color: 'bg-red-500 hover:bg-red-600',
      action: onMorosidades
    }
  ];

  return (
    <div className="fixed left-6 bottom-6 z-[9999] pointer-events-none">
      {/* Overlay oscuro cuando está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-[-1] pointer-events-auto"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Botones de acciones rápidas */}
      <div className="relative">
        {/* Botones individuales */}
        <div className="absolute bottom-20 left-0 flex flex-col-reverse items-start space-y-reverse space-y-3 mb-3">
          {actions.map((item, index) => (
            <div
              key={item.id}
              className={`transform transition-all duration-300 ease-out ${
                isOpen
                  ? 'translate-y-0 opacity-100 scale-100'
                  : 'translate-y-20 opacity-0 scale-0'
              }`}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : `${(actions.length - index - 1) * 30}ms`
              }}
            >
              {/* Label del botón */}
              <div className="flex items-center space-x-3">
                {/* Botón circular */}
                <button
                  onClick={() => handleAction(item.action)}
                  className={`${item.color} text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transform transition-all hover:scale-110 active:scale-95 pointer-events-auto`}
                  title={item.label}
                >
                  <item.icon className="w-6 h-6" />
                </button>

                <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg pointer-events-auto">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botón principal (FAB) */}
        <button
          onClick={toggleMenu}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 pointer-events-auto ${
            isOpen
              ? 'bg-red-500 hover:bg-red-600 rotate-90'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rotate-0'
          } hover:scale-110 active:scale-95`}
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white" />
          ) : (
            <Menu className="w-8 h-8 text-white" />
          )}
        </button>

        {/* Indicador de pulso cuando está cerrado */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full pointer-events-none">
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActionsMenu;
