# CLAUDE.md - Santi Telas Frontend

## Project Overview

Santi Telas Frontend is a multi-role Point of Sale (POS) system for a fabric/textile store. Built with React + Vite + TailwindCSS, it provides role-based dashboards for three user types: Vendedor (Salesperson), Cajero (Cashier), and Admin.

**Primary Language**: Spanish (business domain and UI)
**Backend API**: Flask/Python at `http://localhost:5000/api` (separate repository)

## Tech Stack

- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite 4.x
- **Styling**: TailwindCSS 3.x with custom component classes
- **Icons**: lucide-react
- **Real-time**: socket.io-client for WebSocket communication
- **HTTP Client**: Native fetch via custom `ApiService` class
- **Deployment**: Docker / Cloudflare Pages

## Project Structure

```
santitelas_frontend/
├── src/
│   ├── App.jsx                     # Main router (role-based rendering)
│   ├── main.jsx                    # Entry point
│   ├── components/
│   │   ├── common/                 # Shared components
│   │   │   ├── Header.jsx          # Navigation header
│   │   │   └── LoginForm.jsx       # Authentication form
│   │   ├── vendedor/               # Salesperson dashboard
│   │   │   ├── VendedorDashboard.jsx
│   │   │   ├── VendedorHeader.jsx
│   │   │   ├── ProductModal.jsx
│   │   │   ├── CartModal.jsx
│   │   │   ├── ValeModal.jsx
│   │   │   ├── ClienteModal.jsx
│   │   │   └── UltimosVales.jsx
│   │   ├── cajero/                 # Cashier dashboard
│   │   │   ├── CajeroDashboard.jsx
│   │   │   ├── components/         # Cashier-specific components
│   │   │   │   ├── ValeSearch.jsx
│   │   │   │   ├── ValeDetails.jsx
│   │   │   │   ├── PaymentPanel.jsx
│   │   │   │   ├── TurnoControlModal.jsx
│   │   │   │   └── ... (many more)
│   │   │   ├── hooks/              # Cashier-specific hooks
│   │   │   │   ├── useTurno.js
│   │   │   │   ├── useVale.js
│   │   │   │   ├── useEstadisticas.js
│   │   │   │   └── useToast.js
│   │   │   └── contexts/           # Cashier contexts
│   │   │       └── PendingValidationsContext.jsx
│   │   └── admin/                  # Admin dashboard
│   │       ├── AdminDashboard.jsx
│   │       ├── UsuariosAdmin.jsx
│   │       ├── ProductosAdmin.jsx
│   │       ├── ProductoFormModal.jsx
│   │       ├── VarianteFormModal.jsx
│   │       └── TransferValidationNotifications.jsx
│   ├── hooks/                      # Global hooks
│   │   ├── useAuth.js              # Authentication hook
│   │   ├── useSocket.js            # WebSocket connection
│   │   └── useTransferValidation.js
│   ├── services/
│   │   ├── api.js                  # API service (singleton)
│   │   └── NotificationManager.js
│   ├── styles/
│   │   ├── index.css               # Tailwind + custom components
│   │   └── cajero.css
│   └── utils/
│       └── debounce.js
├── public/
│   └── sounds/                     # Notification sounds
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── Dockerfile
├── docker-compose.yml
└── nginx.conf                      # Production nginx config
```

## Development Commands

```bash
# Install dependencies
npm install

# Development server (port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Docker development
docker-compose up --build

# Docker detached
docker-compose up -d
```

## Architecture Patterns

### Role-Based Routing

The app uses simple role-based rendering in `App.jsx`:

```jsx
// No React Router - simple conditional rendering
if (isVendedor) return <VendedorDashboard />;
if (isAdmin) return <AdminDashboard />;
if (isCajero) return <CajeroDashboard />;
```

Roles are detected from JWT token payload stored in localStorage.

### Authentication

- Uses `useAuth` hook for all auth operations
- JWT tokens stored in `localStorage` as `token`
- User data stored in `localStorage` as `user`
- Role normalization: always lowercase (`vendedor`, `cajero`, `admin`/`administrador`)

### API Service Pattern

`src/services/api.js` exports a singleton `ApiService` instance:

```javascript
// All API calls go through the singleton
import apiService from '../../services/api';

// Usage
const response = await apiService.getVendedorProductos({ categoria: id });
```

Key patterns:
- All methods return `{ success: boolean, data: any, message?: string }`
- Token auto-attached via `Authorization: Bearer <token>`
- Base URL from `window.API_BASE_URL` or defaults to `http://localhost:5000/api`

### State Management

- No Redux/Zustand - uses React's built-in state
- Complex state in custom hooks (e.g., `useTurno`, `useVale`, `useEstadisticas`)
- Cart persistence via `localStorage.setItem('carrito_venta_actual', ...)`
- Context used sparingly (only `PendingValidationsContext` for cajero)

### WebSocket Integration

Socket.io used for real-time features:
- Transfer validation notifications (admin ↔ cajero)
- Singleton `SocketManager` class in `useSocket.js`
- Room-based events: `join_admin`, `join_cajero`, `join_vendedor`

## Coding Conventions

### Component Patterns

1. **Functional components only** with hooks
2. **React.memo** for expensive list renderers
3. **useCallback/useMemo** for optimization in large components
4. **Separate sub-components** in same file for related UI pieces

### Naming Conventions

- **Components**: PascalCase (`ValeDetails.jsx`, `PaymentPanel.jsx`)
- **Hooks**: camelCase with `use` prefix (`useTurno.js`, `useVale.js`)
- **Files**: Component name matches filename
- **CSS classes**: Tailwind utilities + custom component classes

### Custom CSS Classes

Defined in `src/styles/index.css`:
```css
.btn-primary    /* Blue primary button */
.btn-secondary  /* Gray secondary button */
.btn-danger     /* Red danger button */
.card           /* White card with shadow */
.input-field    /* Form input styling */
.modal-overlay  /* Modal backdrop */
.modal-content  /* Modal container */
```

### Console Logging

Debug logging uses emoji prefixes (can be removed in production):
- `🔍` Search/lookup operations
- `✅` Success
- `❌` Error
- `📦` Data/payload
- `🚀` Starting operations
- `📤` Sending data
- `📥` Receiving data
- `🔌` Socket operations

## Domain Model

### Key Entities

- **Producto**: Has multiple `variantes` (color, medida, material)
- **Variante**: Has multiple `modalidades` (pricing modes like metro/rollo)
- **Modalidad**: Contains pricing (`precio_neto`, `precio_neto_factura`, `precio_costo`)
- **Vale/Pedido**: Sales order created by vendedor, processed by cajero
- **Cliente**: Customer with RUT (Chilean tax ID), nombre, etc.
- **Turno**: Cashier shift with opening/closing balance

### Vale Workflow

1. **Vendedor** creates vale (status: `vale_pendiente`)
2. **Cajero** searches vale by number
3. **Cajero** processes payment (status: `completado`)
4. Alternative: anular (cancel) vale (status: `cancelado`)

### Document Types

```javascript
// Three document types affecting pricing
'ticket'   // No IVA (tax)
'boleta'   // Consumer receipt
'factura'  // Invoice (requires cliente RUT)
```

## API Endpoints Reference

### Authentication
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/verify` - Verify token

### Vendedor
- `GET /vendedor/categorias` - List categories
- `GET /vendedor/productos` - Search products
- `GET /vendedor/producto/:id` - Product detail
- `POST /vendedor/pedido-rapido` - Create vale
- `PUT /vendedor/pedidos/:id/productos` - Add products to existing vale

### Cajero
- `GET /cajero/vale/:numero/detalles` - Vale details
- `POST /cajero/procesar-vale/:numero` - Process payment
- `POST /cajero/anular-vale/:numero` - Cancel vale
- `POST /cajero/abrir-turno` - Open shift
- `POST /cajero/cerrar-turno` - Close shift
- `GET /cajero/estadisticas` - Daily statistics
- `GET /cajero/reportes/vales-cobrados` - Collected vales report
- `GET /cajero/reportes/vales-por-cobrar` - Pending vales report

### Admin
- `GET /admin/usuarios` - List users
- `POST /admin/usuarios` - Create user
- `PUT /admin/usuarios/:id` - Update user
- `GET /productos/catalogo` - Product catalog
- `POST /productos-admin` - Create product
- `PUT /productos-admin/:id` - Update product

## Deployment

### Cloudflare Pages

The project deploys to Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `dist`
- SPA redirects handled via `_redirects` file

### Docker

```bash
# Development
docker-compose up --build

# Connect to host services
# Uses host.docker.internal for backend access
```

### Environment Variables

```bash
VITE_API_URL=http://localhost:5000/api  # Backend API URL
```

Set `window.API_BASE_URL` in production for runtime configuration.

## Testing

No test framework currently configured. When adding tests:
- Recommend Vitest (Vite-native)
- React Testing Library for component tests
- Consider MSW for API mocking

## Common Tasks

### Adding a New Component

1. Create file in appropriate directory (`vendedor/`, `cajero/`, or `admin/`)
2. Use functional component with hooks
3. Import lucide-react icons as needed
4. Use Tailwind classes for styling

### Adding a New API Endpoint

1. Add method to `src/services/api.js` class
2. Follow existing pattern: `async methodName(params) { return await this.request(...) }`
3. Handle errors consistently

### Adding a New Hook

1. Create in `src/hooks/` for global hooks
2. Create in `src/components/{role}/hooks/` for role-specific hooks
3. Return object with state and action functions

## Known Issues / Tech Debt

1. **Duplicate method definitions**: `createPedidoRapido` appears twice in api.js
2. **Duplicate delete methods**: `deleteVariante` and `deleteModalidad` duplicated
3. **Heavy console logging**: Many debug logs should be removed for production
4. **No error boundary**: App lacks React error boundaries
5. **No TypeScript**: Consider migrating for better type safety
6. **Large components**: `VendedorDashboard.jsx` is 1500+ lines, could be split

## Security Notes

- JWT tokens in localStorage (consider httpOnly cookies for production)
- RUT validation on client and server side for facturas
- No CSRF protection visible (relies on JWT)
- API requests include authorization header

## Performance Considerations

- Debounced search (700ms default)
- Cart auto-saved to localStorage
- 30-minute inactivity timeout for cart
- React.memo used on NavigationBar and heavy lists
