import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RealTime Poll API',
      version: '1.0.0',
      description: 'API pour l\'application de sondages en temps réel Nutanix',
      contact: {
        name: 'Nutanix',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      schemas: {
        Poll: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique du sondage',
              example: 'abc123xyz',
            },
            question: {
              type: 'string',
              description: 'Question du sondage',
              example: 'Quelle est votre couleur préférée?',
            },
            options: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PollOption',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date d\'expiration',
            },
            totalVotes: {
              type: 'integer',
              description: 'Nombre total de votes',
              example: 42,
            },
          },
        },
        PollOption: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant de l\'option',
              example: 'opt_1',
            },
            text: {
              type: 'string',
              description: 'Texte de l\'option',
              example: 'Bleu',
            },
            votes: {
              type: 'integer',
              description: 'Nombre de votes pour cette option',
              example: 15,
            },
          },
        },
        CreatePollInput: {
          type: 'object',
          required: ['question', 'options'],
          properties: {
            question: {
              type: 'string',
              minLength: 3,
              maxLength: 500,
              description: 'Question du sondage',
              example: 'Quelle est votre couleur préférée?',
            },
            options: {
              type: 'array',
              minItems: 2,
              maxItems: 10,
              items: {
                type: 'string',
              },
              description: 'Options de réponse (2-10)',
              example: ['Rouge', 'Bleu', 'Vert'],
            },
            expiresInHours: {
              type: 'integer',
              minimum: 1,
              maximum: 168,
              default: 24,
              description: 'Durée de validité en heures',
            },
          },
        },
        VoteInput: {
          type: 'object',
          required: ['optionId'],
          properties: {
            optionId: {
              type: 'string',
              description: 'ID de l\'option choisie',
              example: 'opt_1',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
            },
            error: {
              type: 'string',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            uptime: {
              type: 'number',
              description: 'Uptime en secondes',
            },
            services: {
              type: 'object',
              properties: {
                redis: {
                  type: 'string',
                  enum: ['connected', 'disconnected'],
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const specs = swaggerJsdoc(options);
export { swaggerUi };
