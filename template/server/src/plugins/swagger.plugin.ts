import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { env } from '@/config/env';

export async function registerSwagger(app: FastifyInstance) {
    if (!env.SWAGGER_ENABLED) return;

    await app.register(swagger, {
        openapi: {
            info: {
                title: '{{PROJECT_DISPLAY_NAME}}',
                description: '{{PROJECT_DESCRIPTION}}',
                version: '1.0.0',
            },
            servers: [{ url: `http://localhost:${env.PORT}`, description: 'Development' }],
            tags: [
                { name: 'auth', description: 'Authentication and session management' },
                { name: 'resources', description: 'Resource management and CRUD' },
                { name: 'admin', description: 'Admin-only operations' },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });

    await app.register(swaggerUI, {
        routePrefix: env.SWAGGER_ROUTE,
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });
}
