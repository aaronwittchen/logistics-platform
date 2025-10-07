import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Logistics Platform API',
      version: '1.0.0',
      description: 'API for managing inventory stock items with event-driven architecture',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        StockItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the stock item',
            },
            name: {
              type: 'string',
              description: 'Name of the stock item',
            },
            quantity: {
              type: 'integer',
              minimum: 0,
              description: 'Available quantity of the stock item',
            },
          },
          required: ['id', 'name', 'quantity'],
        },
        ReserveStockRequest: {
          type: 'object',
          properties: {
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity to reserve',
            },
            reservationId: {
              type: 'string',
              description: 'Unique identifier for this reservation',
            },
          },
          required: ['quantity', 'reservationId'],
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
          required: ['error'],
        },
      },
    },
  },
  apis: [
    'src/Contexts/Inventory/StockItem/infrastructure/controllers/*.ts',
    'src/apps/inventory/backend/routes/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };