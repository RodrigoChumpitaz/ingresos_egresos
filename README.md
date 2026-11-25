# Finanza (`ingresos_egresosv2`)

Sistema de control de ingresos, egresos, metas de ahorro y análisis financiero personal con soporte multi-divisa (`PEN` como moneda base).

## Estructura del proyecto

- [`backend/`](backend/README.md): API REST en TypeScript + Express 5 + Mongoose (arquitectura hexagonal), autenticación por cookie `httpOnly` (`userId`), metas de ahorro, tipo de cambio en vivo con caché (`frankfurter.dev` / `open.er-api.com`), modo local `in-memory` con datos demo, Docker Compose y pruebas con Vitest + Supertest.
- [`frontend/`](frontend/README.md): SPA en React 18 + TypeScript + Vite + Tailwind CSS + `shadcn/ui` + Recharts + React Router, con vista simple (`/`), Movimientos (`/movements`), Categorías (`/categories`), Metas de ahorro (`/savings`), Análisis detallado (`/reports`) y Personalización (`/settings`).
- [`docs/agents/`](docs/agents/domain.md) y [`AGENTS.md`](AGENTS.md): configuración de flujo de ingeniería y rastreador local.

## Arranque rápido en local (modo demo sin base de datos externa)

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
El backend escucha en `http://localhost:3000` (Swagger en `/api/v1/docs`).  
Si deseas persistencia real en MongoDB local con Docker:
```bash
cd backend
docker compose up -d
# En .env cambia STORAGE_MODE=mongo y MONGODB_URI=mongodb://localhost:27017
npm run seed
```

### 2. Frontend
```bash
cd frontend
# Crea .env.local con VITE_API_URL=http://localhost:3000/api/v1
npm install
npm run dev
```
Abre `http://localhost:5173/`. Puedes crear tu propia cuenta o ingresar con el usuario demo precargado:
- **Correo:** `demo@finanza.local`
- **Contraseña:** `Demo1234!`

## Verificación y pruebas

```bash
# Backend
cd backend && npm test && npm run typecheck && npm run build

# Frontend
cd frontend && npm test && npm run typecheck && npm run build
```
