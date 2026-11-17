# Finanza — Frontend modular (equipo de 3 personas)

Aplicación React + TypeScript + Vite. Este paquete **solo sustituye la carpeta `frontend/`**: no incluye ni modifica `backend/`.

## Instalar y probar LOCALMENTE

1. Conserva una copia de seguridad de tu carpeta `frontend/` anterior.
2. Copia la carpeta `frontend/` de este ZIP a la raíz del repositorio, junto a `backend/`.
3. En la terminal, dentro de `frontend/`, ejecuta:

```powershell
npm install
npm run dev
```

Abre la dirección local anunciada por Vite (normalmente http://localhost:5173).

Para comprobar compilación:

```powershell
npm run build
```

No necesitas crear ramas ni subir nada para probarlo. No copies `node_modules/` entre computadoras: se genera con `npm install`.

## Arquitectura modular

```text
src/
├── app/
│   └── App.tsx                      # Integración, navegación y estado compartido
├── modules/
│   ├── dashboard/
│   │   └── DashboardPage.tsx         # Resumen general y gráficos
│   ├── reports/
│   │   └── ReportsPage.tsx           # Reportes y CSV
│   ├── movements/
│   │   ├── MovementsPage.tsx         # Lista, búsqueda, filtros, eliminación y CSV
│   │   └── components/
│   │       └── MovementModal.tsx     # Crear y editar movimientos
│   └── categories/
│       ├── CategoriesPage.tsx        # Listar y eliminar categorías
│       └── components/
│           └── CategoryModal.tsx    # Crear y editar categorías
├── shared/
│   ├── components/
│   │   ├── UI.tsx                    # Modal, Toast, estados y badges
│   │   └── StatCard.tsx              # Tarjetas de indicadores
│   ├── constants/colors.ts          # Colores de gráficos
│   └── utils/format.ts              # Formatos de moneda, fechas, errores
├── services/api.ts                  # ÚNICO cliente API para todo el proyecto
├── types/finance.ts                 # Tipos compartidos del backend
├── styles/styles.css                # Estilos del diseño original
└── main.tsx                         # Entrada React
```

### Responsables y archivos permitidos

| Persona | Rama sugerida | Archivos principales | Issues sugeridos |
|---|---|---|---|
| 1 | `feature/dashboard-reportes` | `src/modules/dashboard/**`, `src/modules/reports/**` | #1 Dashboard; #2 Reportes y CSV |
| 2 | `feature/movimientos` | `src/modules/movements/**` | #3 Listado y filtros; #4 CRUD movimientos |
| 3 | `feature/categorias-ui` | `src/modules/categories/**`, `src/shared/components/**`, `src/styles/**` | #5 CRUD categorías; #6 UI, responsividad y notificaciones |

**Archivos con coordinación obligatoria:** `src/app/App.tsx`, `src/services/api.ts`, `src/types/finance.ts`, `src/shared/utils/format.ts`, `src/shared/constants/colors.ts`, `src/main.tsx`, `package.json`, `package-lock.json`, `vite.config.ts`. No son de propiedad exclusiva: cualquier cambio debe acordarse y revisarse antes de integrarlo.

**Importante:** La separación reduce conflictos de Git, pero NO los elimina automáticamente. Persona 3 debe coordinar cambios de CSS global porque afectan todas las pantallas.

## Contrato con el backend

Por defecto se usa:

`https://ingreso-egresos-backend.vercel.app/api/v1`

Puedes cambiar la URL sin editar código creando `frontend/.env.local` con:

```dotenv
VITE_API_URL=https://ingreso-egresos-backend.vercel.app/api/v1
```

La API se consulta desde `src/services/api.ts`. No es un enlace que descargue el diseño: React y CSS se ejecutan en el navegador del usuario.

**Atención:** aunque el frontend corra en `localhost`, las escrituras `POST`, `PATCH` y `DELETE` se envían al backend en Vercel y pueden modificar la base de datos real. Para un equipo, lo ideal es un entorno de pruebas separado.

## Flujo recomendado cuando decidan usar GitHub

1. Una persona verifica `npm run dev` y `npm run build`, y sube esta versión base reorganizada (una vez, no por separado por integrante).
2. Integrar la base en `develop` desde `main` conforme a las reglas del repositorio.
3. Cada persona crea **su rama desde `develop`** y trabaja en los archivos asignados.
4. Cada PR apunta a `develop`, con revisión por otra persona y comprobación del build.
5. Cuando todo esté validado, fusionar `develop` a `main`.

Si trabajan con un flujo más simple, pueden omitir `develop` y abrir PR hacia `main`; lo importante es no modificar directamente la rama compartida.

## Checklist antes de aceptar un PR

- `npm install` y `npm run build` sin errores.
- Dashboard con rango de fechas y gráfico.
- Listado, filtros y paginación de movimientos.
- Crear, modificar y eliminar un movimiento de prueba (en DB de pruebas).
- Crear, modificar y eliminar una categoría sin movimientos asociados.
- Reportes y descargas CSV.
- Modal y toast; notificación se cierra tras unos 4 segundos.
- Responsive en pantalla pequeña.

## Notas

- Se mantuvieron los mismos componentes visuales y la lógica del frontend original; el cambio central es la división en módulos.
- CSV se mantiene deliberadamente, sin XLSX.
- La sesión de este entorno no pudo descargar todas las dependencias npm para ejecutar un build verificado. El proyecto debe validarse con `npm run build` en tu PC antes de repartir las ramas.
