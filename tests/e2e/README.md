# Tests E2E — WorkOrders Frontend

Suite de pruebas automatizadas con [Playwright](https://playwright.dev/) + Chromium para verificar la interfaz frontend del sistema WorkOrders.

## Requisitos previos

1. **Backend** funcionando (Laravel, puerto 8001):
   ```bash
   cd ../work-orders
   php artisan serve --port=8001
   ```

2. **Frontend** en desarrollo (Vite, puerto 5174):
   ```bash
   npm run dev
   ```

3. **Variables de entorno** — copiar y configurar:
   ```bash
   cp .env.e2e.example .env.e2e
   ```
   Editar `.env.e2e`:
   - `E2E_BASE_URL` — URL del frontend (default: `http://localhost:5174`)
   - `E2E_EMAIL` — Correo de usuario con permisos para pruebas
   - `E2E_PASSWORD` — Contraseña del usuario

   Alternativamente, si se tiene un token Bearer válido:
   - `E2E_AUTH_TOKEN` — Token Sanctum para inyección directa (opcional, salta el login)

## Ejecutar pruebas

```bash
# Todas las pruebas (headless)
npm run test:e2e

# Con navegador visible
npm run test:e2e:headed

# Con UI interactiva de Playwright
npm run test:e2e:ui

# Prueba específica
npx playwright test tests/e2e/navigation.spec.ts
```

## Cobertura

### Navegación (navigation.spec.ts)
- Verifica que **20+ rutas** cargan sin errores
- Detecta console errors, page errors, y texto "undefined"/"null"
- Rutas cubiertas: Dashboard, Órdenes, Facturación, Inventario, Compras/CXP, Bancos, Conciliación, Clientes, Proveedores, Productos, Categorías

### Formularios (forms.spec.ts)
- Verifica campos visibles en formularios principales:
  - Nueva Factura
  - Ajuste de Inventario
  - Transferencia de Inventario
  - Recepción de Compra
  - Movimiento Bancario
  - Transferencia Bancaria
  - Conciliación
  - Importación de Estado de Cuenta

### Tablas y Detalles (tables.spec.ts)
- Verifica que DataTables cargan en:
  - Listado de Facturas
  - Saldos de Inventario
  - Kardex
  - Cuentas por Pagar
  - Pagos
  - Movimientos Bancarios
  - Conciliaciones

### Errores Visuales (visual-errors.spec.ts)
- Escanea páginas principales buscando textos `undefined`, `[object Object]`
- Detecta scroll horizontal excesivo
- Verifica que botones principales estén habilitados

### Screenshots (screenshots.spec.ts)
- Toma capturas de pantalla automáticas de **20 páginas**
- Output en: `test-results/screenshots/`

## Lo que NO cubren estas pruebas

- ❌ Emisión SRI real (facturación electrónica)
- ❌ Envío/consulta/autorización al SRI
- ❌ Firma XML, RIDE, secuenciales
- ❌ Guardado destructivo de datos reales (solo verificación visual)
- ❌ Lógica de negocio backend
- ❌ Pruebas de concurrencia o multi-usuario

## Recomendaciones

- Usar datos con prefijo `TEST-` si se crean registros
- No apuntar a ambiente de producción
- Asegurar que el backend tenga datos mínimos (al menos un cliente, un producto, una cuenta bancaria) para que las tablas dejen de mostrar "no data"
- Si se usan screenshots en CI, moverlos a un artefacto

## Archivos

```
tests/e2e/
├── README.md
├── navigation.spec.ts
├── forms.spec.ts
├── tables.spec.ts
├── visual-errors.spec.ts
├── screenshots.spec.ts
└── helpers/
    ├── auth.ts        # Autenticación (login + token injection)
    └── ui.ts          # Funciones helper de UI
```
