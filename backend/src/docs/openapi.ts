const uuidParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const json = (ref: string) => ({ 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } });

const rangeParams = [
  {
    name: 'from',
    in: 'query',
    schema: { type: 'string', format: 'date' },
    example: '2026-10-01',
    description: 'Fecha inicial (inclusive)',
  },
  {
    name: 'to',
    in: 'query',
    schema: { type: 'string', format: 'date' },
    example: '2026-10-31',
    description: 'Fecha final (inclusive; si es solo fecha incluye todo el día)',
  },
];

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Ingresos y Egresos API',
    version: '1.0.0',
    description:
      'MVP para registrar ingresos y egresos personales, agrupados por categorías, y consultar el balance.\n\n' +
      '**Flujo sugerido:** 1) crear categorías (ej. "Sueldo" INCOME, "Comida" EXPENSE) → ' +
      '2) registrar transacciones en esas categorías → 3) consultar `/api/v1/summary`.',
  },
  servers: [{ url: '/', description: 'Servidor actual' }],
  tags: [
    { name: 'Health', description: 'Estado de la API' },
    { name: 'Auth', description: 'Registro, inicio de sesión y sesión actual (cookie httpOnly)' },
    { name: 'Categories', description: 'Categorías de ingresos y egresos' },
    { name: 'Transactions', description: 'Movimientos de dinero' },
    { name: 'Summary', description: 'Balance, ahorro, tendencia y totales' },
    { name: 'SavingsGoals', description: 'Metas y apartados de ahorro (Nivel 2)' },
    { name: 'ExchangeRates', description: 'Tipos de cambio gratuitos con caché' },
  ],
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica que la API esté viva',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/v1/auth/register': {
      post: { tags: ['Auth'], summary: 'Registra una nueva cuenta personal', responses: { 201: { description: 'Cuenta creada' }, 409: errorResponse('Correo ya registrado') } },
    },
    '/api/v1/auth/login': {
      post: { tags: ['Auth'], summary: 'Inicia sesión y emite cookie httpOnly', responses: { 200: { description: 'Sesión iniciada' }, 401: errorResponse('Credenciales inválidas') } },
    },
    '/api/v1/auth/logout': {
      post: { tags: ['Auth'], summary: 'Cierra la sesión actual', responses: { 204: { description: 'Sesión cerrada' } } },
    },
    '/api/v1/auth/me': {
      get: { tags: ['Auth'], summary: 'Devuelve el usuario autenticado actual', responses: { 200: { description: 'Usuario actual' }, 401: errorResponse('No autenticado') } },
    },
    '/api/v1/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Lista las categorías',
        parameters: [{ name: 'type', in: 'query', schema: { $ref: '#/components/schemas/MoneyType' } }],
        responses: {
          200: {
            description: 'Lista de categorías',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } },
          },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Crea una categoría',
        requestBody: { required: true, content: json('CreateCategory') },
        responses: {
          201: { description: 'Categoría creada', content: json('Category') },
          400: errorResponse('Datos inválidos'),
          409: errorResponse('Ya existe una categoría con ese nombre y tipo'),
        },
      },
    },
    '/api/v1/categories/{id}': {
      patch: {
        tags: ['Categories'],
        summary: 'Renombra una categoría (el tipo no se puede cambiar)',
        parameters: [uuidParam],
        requestBody: { required: true, content: json('UpdateCategory') },
        responses: {
          200: { description: 'Categoría actualizada', content: json('Category') },
          400: errorResponse('Datos inválidos'),
          404: errorResponse('Categoría no encontrada'),
          409: errorResponse('Nombre duplicado'),
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Elimina una categoría sin transacciones',
        parameters: [uuidParam],
        responses: {
          204: { description: 'Eliminada' },
          404: errorResponse('Categoría no encontrada'),
          422: errorResponse('La categoría tiene transacciones'),
        },
      },
    },
    '/api/v1/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'Lista transacciones con filtros y paginación',
        parameters: [
          { name: 'type', in: 'query', schema: { $ref: '#/components/schemas/MoneyType' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Búsqueda en descripción' },
          ...rangeParams,
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { name: 'all', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Devuelve todos los ítems filtrados para exportación' },
        ],
        responses: {
          200: { description: 'Página de transacciones', content: json('PaginatedTransactions') },
          400: errorResponse('Filtros inválidos'),
        },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Registra un ingreso o egreso',
        description: 'El tipo (INCOME/EXPENSE) se toma de la categoría elegida.',
        requestBody: { required: true, content: json('CreateTransaction') },
        responses: {
          201: { description: 'Transacción creada', content: json('Transaction') },
          400: errorResponse('Datos inválidos'),
          404: errorResponse('Categoría no encontrada'),
        },
      },
    },
    '/api/v1/transactions/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Obtiene una transacción',
        parameters: [uuidParam],
        responses: {
          200: { description: 'Transacción', content: json('Transaction') },
          404: errorResponse('No encontrada'),
        },
      },
      patch: {
        tags: ['Transactions'],
        summary: 'Actualiza una transacción',
        description: 'Si cambias la categoría, debe ser del mismo tipo que la transacción.',
        parameters: [uuidParam],
        requestBody: { required: true, content: json('UpdateTransaction') },
        responses: {
          200: { description: 'Transacción actualizada', content: json('Transaction') },
          400: errorResponse('Datos inválidos'),
          404: errorResponse('Transacción o categoría no encontrada'),
          422: errorResponse('La categoría es de otro tipo'),
        },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Elimina una transacción',
        parameters: [uuidParam],
        responses: { 204: { description: 'Eliminada' }, 404: errorResponse('No encontrada') },
      },
    },
    '/api/v1/summary': {
      get: {
        tags: ['Summary'],
        summary: 'Balance, ahorro neto, tasa de ahorro y totales por categoría',
        parameters: [
          ...rangeParams,
          { name: 'compare', in: 'query', schema: { type: 'string', enum: ['prev'] }, description: 'Compara contra el período anterior equivalente' },
        ],
        responses: {
          200: { description: 'Resumen', content: json('Summary') },
          400: errorResponse('Fechas inválidas'),
        },
      },
    },
    '/api/v1/summary/trend': {
      get: {
        tags: ['Summary'],
        summary: 'Serie temporal de ingresos, egresos y ahorro',
        parameters: [
          ...rangeParams,
          { name: 'granularity', in: 'query', schema: { type: 'string', enum: ['auto', 'day', 'week', 'month'], default: 'auto' } },
        ],
        responses: {
          200: { description: 'Serie temporal' },
          400: errorResponse('Fechas inválidas'),
        },
      },
    },
    '/api/v1/savings-goals': {
      get: {
        tags: ['SavingsGoals'],
        summary: 'Lista las metas de ahorro',
        responses: { 200: { description: 'Lista de metas' } },
      },
      post: {
        tags: ['SavingsGoals'],
        summary: 'Crea una meta de ahorro',
        responses: { 201: { description: 'Meta creada' }, 400: errorResponse('Datos inválidos'), 409: errorResponse('Nombre duplicado') },
      },
    },
    '/api/v1/savings-goals/{id}/movements': {
      post: {
        tags: ['SavingsGoals'],
        summary: 'Registra un aporte o retiro en una meta (no afecta Egresos)',
        parameters: [uuidParam],
        responses: { 201: { description: 'Movimiento registrado' }, 404: errorResponse('No encontrada'), 422: errorResponse('Saldo insuficiente') },
      },
    },
    '/api/v1/exchange-rates': {
      get: {
        tags: ['ExchangeRates'],
        summary: 'Tasas de cambio actuales cacheadas (PEN, USD, EUR, MXN)',
        parameters: [
          { name: 'base', in: 'query', schema: { type: 'string', enum: ['PEN', 'USD', 'EUR', 'MXN'], default: 'PEN' } },
        ],
        responses: { 200: { description: 'Tasas de cambio' } },
      },
    },
  },
  components: {
    schemas: {
      MoneyType: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'ValidationError' },
          message: { type: 'string', example: 'El monto debe ser un número mayor a 0' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Sueldo' },
          type: { $ref: '#/components/schemas/MoneyType' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateCategory: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 50, example: 'Sueldo' },
          type: { $ref: '#/components/schemas/MoneyType' },
        },
      },
      UpdateCategory: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string', minLength: 2, maxLength: 50, example: 'Sueldo mensual' } },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { $ref: '#/components/schemas/MoneyType' },
          amount: { type: 'number', example: 2500.5 },
          currency: { type: 'string', enum: ['PEN', 'USD', 'EUR', 'MXN'], example: 'PEN' },
          originalAmount: { type: 'number', example: 100 },
          exchangeRate: { type: 'number', example: 3.41 },
          description: { type: 'string', example: 'Pago de octubre' },
          categoryId: { type: 'string', format: 'uuid' },
          date: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTransaction: {
        type: 'object',
        required: ['amount', 'categoryId'],
        properties: {
          amount: { type: 'number', minimum: 0.01, example: 2500.5, description: 'Máximo 2 decimales' },
          currency: { type: 'string', enum: ['PEN', 'USD', 'EUR', 'MXN'], default: 'PEN' },
          exchangeRate: { type: 'number', minimum: 0.0001, example: 3.41, description: 'Requerido si currency != PEN' },
          categoryId: { type: 'string', format: 'uuid' },
          description: { type: 'string', maxLength: 200, example: 'Pago de octubre' },
          date: { type: 'string', format: 'date-time', description: 'Por defecto: ahora' },
        },
      },
      UpdateTransaction: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0.01, example: 2600 },
          currency: { type: 'string', enum: ['PEN', 'USD', 'EUR', 'MXN'] },
          exchangeRate: { type: 'number', minimum: 0.0001 },
          categoryId: { type: 'string', format: 'uuid' },
          description: { type: 'string', maxLength: 200 },
          date: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedTransactions: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
        },
      },
      Summary: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date-time', nullable: true },
          to: { type: 'string', format: 'date-time', nullable: true },
          totalIncome: { type: 'number', example: 3000 },
          totalExpense: { type: 'number', example: 1250.75 },
          balance: { type: 'number', example: 1749.25 },
          netSavings: { type: 'number', example: 1749.25 },
          savingsRate: { type: 'number', example: 58.31 },
          byCategory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                categoryId: { type: 'string', format: 'uuid' },
                categoryName: { type: 'string', example: 'Comida' },
                type: { $ref: '#/components/schemas/MoneyType' },
                total: { type: 'number', example: 850.5 },
                count: { type: 'integer', example: 12 },
              },
            },
          },
        },
      },
    },
  },
};
