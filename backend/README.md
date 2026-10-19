# Ingresos y Egresos — Backend (MVP)

API REST en **TypeScript + Express + Mongoose (MongoDB Atlas)**, con **arquitectura hexagonal**,
documentada con **Swagger** y lista para desplegar en **Vercel**.

## 1. ¿Qué hace el MVP?

| Funcionalidad | Endpoint |
|---|---|
| Crear / listar / renombrar / eliminar **categorías** (INCOME o EXPENSE) | `/api/v1/categories` |
| Registrar / listar (filtros + paginación) / ver / editar / eliminar **transacciones** | `/api/v1/transactions` |
| **Balance** del período: total ingresos, total egresos, balance y totales por categoría | `/api/v1/summary?from=&to=` |
| Estado de la API | `/api/v1/health` |
| Documentación Swagger | `/api/v1/docs` |

**Reglas de negocio** (viven en el dominio, no en los controladores):

1. Una categoría es de tipo `INCOME` o `EXPENSE`; no se repite el nombre dentro del mismo tipo (sin distinguir mayúsculas).
2. El tipo de una categoría no se puede cambiar (solo su nombre).
3. No se puede eliminar una categoría que tiene transacciones → `422`.
4. El monto de una transacción es `> 0` y tiene máximo 2 decimales.
5. La transacción **hereda el tipo de su categoría**; si se le cambia la categoría, debe ser del mismo tipo → `422`.

**Fuera del MVP** (siguientes pasos): autenticación/usuarios, multi-moneda, presupuestos, tests automatizados.

## 2. Arquitectura hexagonal (Puertos y Adaptadores)

```
              ┌────────────── INFRAESTRUCTURA ───────────────┐
  HTTP  ───▶  │  Controller (adaptador de entrada)           │
              │        │                                     │
              │        ▼                                     │
              │  ┌──────── APLICACIÓN ────────┐              │
              │  │  Casos de uso              │              │
              │  │   ┌──── DOMINIO ────┐      │              │
              │  │   │ Entidades       │      │              │
              │  │   │ Reglas          │      │              │
              │  │   │ Puertos (interf)│◀─────┼── implementa ─  MongoRepository (adaptador de salida) ──▶ MongoDB
              │  │   └─────────────────┘      │              │
              │  └────────────────────────────┘              │
              └──────────────────────────────────────────────┘
```

**Regla de oro:** las dependencias apuntan hacia adentro. El dominio no importa nada de Express ni Mongoose.

```
src/
├── config/env.ts                    # variables de entorno (único lugar que lee process.env)
├── shared/
│   ├── domain/                      # errores de dominio, tipo INCOME/EXPENSE
│   └── infrastructure/
│       ├── database/                # conexión Mongo (Singleton)
│       └── http/                    # validación con Zod y manejador de errores
├── modules/
│   ├── categories/
│   │   ├── domain/                  # Category (entidad) + CategoryRepository (puerto)
│   │   ├── application/             # casos de uso: create, list, update, delete
│   │   └── infrastructure/
│   │       ├── persistence/         # modelo Mongoose + MongoCategoryRepository (adaptador)
│   │       └── http/                # controller/router de Express (adaptador)
│   └── transactions/                # misma estructura + caso de uso GetSummary
├── docs/                            # especificación OpenAPI + Swagger UI
├── container.ts                     # Composition Root: arma todas las piezas
├── app.ts                           # crea la app Express
└── server.ts                        # arranque local
api/index.ts                         # arranque en Vercel (serverless)
```

### Recorrido de un request (`POST /api/v1/transactions`)

1. `transaction.controller.ts` valida el formato del body con **Zod**.
2. Llama a `CreateTransactionUseCase.execute()`.
3. El caso de uso busca la categoría a través del **puerto** `CategoryRepository`.
4. `Transaction.create()` aplica las reglas (monto válido, tipo heredado).
5. Se guarda con el puerto `TransactionRepository` → lo implementa `MongoTransactionRepository`.
6. Si algo falla se lanza un error de dominio y `error-handler.ts` lo traduce a HTTP.

### Patrones de diseño usados

| Patrón | Dónde | Para qué |
|---|---|---|
| **Repository** | `*-repository.ts` / `mongo-*.repository.ts` | Aísla el acceso a datos detrás de una interfaz |
| **Adapter** | `Mongo*Repository`, controllers | Conectan el núcleo con tecnologías externas |
| **Factory Method** | `Category.create()`, `Transaction.create()` | Crear entidades siempre válidas |
| **Inyección de dependencias** | constructores de los casos de uso | Depender de interfaces, no de implementaciones |
| **Composition Root** | `container.ts` | Un solo lugar donde se arma el sistema |
| **Singleton** | `MongoConnection` | Reutilizar una conexión (clave en serverless) |
| **Mapper** | `CategoryMapper`, `TransactionMapper` | Traducir documento de Mongo ↔ entidad |

> Ejercicio: crea un `InMemoryCategoryRepository` que implemente `CategoryRepository` y úsalo en
> `container.ts`. La app funcionará sin MongoDB y no tendrás que tocar ni dominio ni casos de uso.

## 3. Correr en local

```bash
cp .env.example .env      # y coloca tu MONGODB_URI de Atlas
npm install
npm run dev               # http://localhost:3000/api/v1/docs
```

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor con recarga automática (tsx) |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta lo compilado |
| `npm run typecheck` | Verifica tipos sin compilar |

> En Atlas: *Network Access* → permite tu IP (o `0.0.0.0/0` para Vercel).

## 4. Desplegar en Vercel

```bash
npm i -g vercel
vercel login
vercel link                               # desde esta carpeta (backend)
vercel env add MONGODB_URI production      # pega la URI de Atlas
vercel env add MONGODB_DB_NAME production  # ingreso_egresos
vercel --prod
```

`vercel.json` redirige todas las rutas a `api/index.ts`, que exporta la app de Express.
Si despliegas desde GitHub, configura **Root Directory = `ingreso_egresos/backend`**.

## 5. Ejemplo rápido

```bash
# 1. Crear categorías
curl -X POST localhost:3000/api/v1/categories -H 'Content-Type: application/json' -d '{"name":"Sueldo","type":"INCOME"}'
curl -X POST localhost:3000/api/v1/categories -H 'Content-Type: application/json' -d '{"name":"Comida","type":"EXPENSE"}'
# 2. Registrar movimientos (usa los id devueltos)
curl -X POST localhost:3000/api/v1/transactions -H 'Content-Type: application/json' -d '{"amount":3000,"categoryId":"<id-sueldo>","description":"Pago octubre"}'
curl -X POST localhost:3000/api/v1/transactions -H 'Content-Type: application/json' -d '{"amount":120.5,"categoryId":"<id-comida>"}'
# 3. Balance del mes
curl 'localhost:3000/api/v1/summary?from=2026-10-01&to=2026-10-31'
```
