# Santi Telas - Frontend Multi-Rol

Sistema de gestión completo para Santi Telas con interfaz multi-rol (Vendedor, Admin, Cajero) desarrollado en React + Vite + Docker.

## 🚀 Características

- **Multi-Rol**: Una aplicación que maneja 3 roles diferentes
- **Vendedor**: Sistema de vales con categorías, productos, colores y modalidades
- **Admin**: Panel de administración completo
- **Cajero**: Sistema de procesamiento de vales y control de turno
- **Docker**: Configuración lista para desarrollo y producción
- **Responsive**: Diseño adaptable a móviles y tablets

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- Tu API backend corriendo en puerto 5000
- Node.js 18+ (opcional, solo si corres sin Docker)

## 🛠️ Instalación

### Opción 1: Con Docker (Recomendado)

1. **Clona y prepara el proyecto:**
```bash
git clone <tu-repo>
cd santi-telas-frontend
```

2. **Ajusta el docker-compose.yml:**
```yaml
# En docker-compose.yml, línea 23:
- ../ruta-a-tu-api-backend:/app  # Ajusta esta ruta
```

3. **Construye y ejecuta:**
```bash
docker-compose up --build
```

4. **Accede a la aplicación:**
```
http://localhost:3000
```

### Opción 2: Desarrollo Local

1. **Instala dependencias:**
```bash
npm install
```

2. **Ejecuta en modo desarrollo:**
```bash
npm run dev
```

3. **Para producción:**
```bash
npm run build
npm run preview
```

## 🏗️ Estructura del Proyecto

```
santi-telas-frontend/
├── src/
│   ├── App.jsx                  # Router principal
│   ├── main.jsx                 # Entry point
│   ├── components/
│   │   ├── common/              # Componentes compartidos
│   │   │   ├── Header.jsx
│   │   │   └── LoginForm.jsx
│   │   ├── vendedor/            # Sistema Vendedor
│   │   │   ├── VendedorDashboard.jsx
│   │   │   ├── ProductModal.jsx
│   │   │   ├── CartModal.jsx
│   │   │   └── ValeModal.jsx
│   │   ├── admin/               # Panel Admin
│   │   │   └── AdminDashboard.jsx
│   │   └── cajero/              # Sistema Cajero
│   │       └── CajeroDashboard.jsx
│   ├── hooks/
│   │   └── useAuth.js           # Hook de autenticación
│   ├── services/
│   │   └── api.js               # Cliente API centralizado
│   └── styles/
│       └── index.css            # Estilos Tailwind
└── docker-compose.yml           # Configuración Docker
```

## 🔐 Sistema de Autenticación

La aplicación usa JWT y detecta automáticamente el rol del usuario:

```javascript
// Roles soportados:
- 'vendedor' → VendedorDashboard
- 'admin'    → AdminDashboard  
- 'cajero'   → CajeroDashboard
```

## 🎯 Funcionalidades por Rol

### 👨‍💼 Vendedor
- ✅ Dashboard de categorías (botones grandes)
- ✅ Navegación por productos 
- ✅ Modal de producto con colores y modalidades (metro/rollo)
- ✅ Carrito de productos multi-item
- ✅ Generación de vales para caja
- ✅ Selector de tipo documento (ticket/boleta/factura)
- ✅ Precios dinámicos según modalidad y documento

### 👨‍💻 Admin
- ✅ Panel de administración modular
- 🔄 Gestión de usuarios (próximamente)
- 🔄 Gestión de productos (próximamente)
- 🔄 Gestión de bodegas (próximamente)
- 🔄 Reportes y estadísticas (próximamente)

### 👨‍💰 Cajero
- ✅ Búsqueda y procesamiento de vales
- ✅ Control de turno de caja
- 🔄 Arqueos intermedios (próximamente)
- 🔄 Métodos de pago (próximamente)

## 🔧 Configuración de API

El archivo `src/services/api.js` centraliza todas las llamadas a tu API:

```javascript
const API_BASE = 'http://localhost:5000/api';
```

### Endpoints utilizados:
- `POST /auth/login` - Autenticación
- `GET /categorias` - Listar categorías
- `GET /productos/categoria/{id}` - Productos por categoría
- `GET /stock/producto/{id}` - Stock de producto
- `POST /vendedor/pedido-rapido` - Crear vale
- `GET /cajero/vale/{numero}/detalles` - Detalles de vale

## 🐳 Docker

### Desarrollo
```bash
docker-compose up
```

### Producción
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Entorno
```env
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

## 🎨 Personalización

### Colores del Sistema
```css
/* src/styles/index.css */
:root {
  --primary: #2563eb;    /* Azul principal */
  --secondary: #6b7280;  /* Gris secundario */
  --success: #059669;    /* Verde éxito */
  --danger: #dc2626;     /* Rojo peligro */
}
```

### Modalidades de Producto
```javascript
// En ProductModal.jsx, línea 8:
const modalidadMultiplier = modalidad === 'rollo' ? 1.2 : 1; 
// Ajusta el multiplicador de precio para rollos
```

## 🚦 Estados del Sistema

### Estados de Vales
```javascript
'borrador'              → En construcción
'vale_pendiente'        → Listo para caja
'procesando_caja'       → En proceso de pago
'completado'            → Pagado y completado
'cancelado'             → Cancelado
```

## 📱 Responsive Design

- **Mobile First**: Optimizado para móviles
- **Breakpoints**: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- **Componentes adaptables**: Grids y layouts responsivos

## 🧪 Testing

```bash
# Instalar dependencias de desarrollo
npm install --dev

# Ejecutar tests (cuando se implementen)
npm test
```

## 🚀 Despliegue

### Con Nginx (Producción)
```bash
npm run build
# Copiar dist/ a tu servidor web
```

### Con Docker (Recomendado)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Troubleshooting

### Problema: Error de conexión a API
**Solución**: Verificar que tu API esté corriendo en puerto 5000

### Problema: Docker no encuentra la API
**Solución**: Ajustar la ruta en docker-compose.yml línea 23

### Problema: Estilos no cargan
**Solución**: Verificar que Tailwind esté configurado correctamente

## 📞 Soporte

- **Desarrollador**: Tu nombre
- **Email**: tu@email.com
- **Documentación API**: http://localhost:5000/docs

## 📄 Licencia

Este proyecto es privado y confidencial para Santi Telas.

---

## 🎉 ¡Listo para usar!

Tu sistema multi-rol está completamente configurado y listo para desarrollo. La aplicación detectará automáticamente el rol del usuario y mostrará la interfaz correspondiente.

**Próximos pasos:**
1. Ajustar la URL de tu API en `docker-compose.yml`
2. Crear usuarios de prueba en tu base de datos
3. Probar el flujo completo: Vendedor → Vale → Cajero
4. Personalizar según tus necesidades específicas