/**
 * Resources Routes
 * 
 * Fastify route definitions for resources endpoints.
 * Includes comprehensive Swagger documentation and rate limiting.
 * 
 * @see /mnt/project/09-api-documentation-v2.md
 * @see /mnt/project/11-rate-limiting-v2.md
 */

import type { FastifyInstance } from 'fastify';
import { toJsonSchema, getDefinition } from '@/libs/swagger-schemas';
import * as resourceController from './resources.controller';
import {
    CreateResourceSchema,
    UpdateResourceSchema,
    ResourceFiltersSchema,
    PaginationSchema,
    ResourceResponseSchema,
    ResourceWithOwnerResponseSchema,
} from './resources.schemas';

/**
 * Error response schema for Swagger
 */
const ErrorResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean', enum: [false] },
        error: {
            type: 'object',
            properties: {
                code: { type: 'string' },
                message: { type: 'string' },
            },
        },
    },
};

/**
 * Paginated resources response schema
 */
const PaginatedResourcesResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean', enum: [true] },
        message: { type: 'string' },
        data: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: getDefinition(ResourceResponseSchema, 'ResourceResponseSchema'),
                },
                pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        totalItems: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        hasNextPage: { type: 'boolean' },
                        hasPreviousPage: { type: 'boolean' },
                    },
                },
            },
        },
    },
};

/**
 * Single resource response schema
 */
const ResourceSuccessResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean', enum: [true] },
        message: { type: 'string' },
        data: getDefinition(ResourceResponseSchema, 'ResourceResponseSchema'),
    },
};

/**
 * Resource with owner response schema
 */
const ResourceWithOwnerSuccessResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean', enum: [true] },
        message: { type: 'string' },
        data: getDefinition(ResourceWithOwnerResponseSchema, 'ResourceWithOwnerResponseSchema'),
    },
};

/**
 * Register resources routes
 * 
 * @param fastify - Fastify instance
 */
export async function resourceRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /resources
     * 
     * Get paginated list of resources with optional filters
     */
    fastify.get('/', {
        schema: {
            description: 'Get paginated list of resources with optional filters',
            tags: ['resources'],
            summary: 'List resources',
            querystring: {
                type: 'object',
                properties: {
                    ...(toJsonSchema(ResourceFiltersSchema, 'ResourceFiltersSchema') as any).properties,
                    ...(toJsonSchema(PaginationSchema, 'PaginationSchema') as any).properties,
                },
            },
            response: {
                200: {
                    description: 'Resources retrieved successfully',
                    ...PaginatedResourcesResponseSchema,
                },
            },
        },
        config: {
            rateLimit: {
                max: 100,
                timeWindow: '15 minutes',
            },
        },
        handler: resourceController.listResources,
    });

    /**
     * GET /resources/my
     * 
     * Get current user's resources
     * Requires authentication
     */
    fastify.get('/my', {
        schema: {
            description: "Get current user's resources",
            tags: ['resources'],
            summary: 'Get my resources',
            security: [{ bearerAuth: [] }],
            querystring: toJsonSchema(PaginationSchema, 'PaginationSchema'),
            response: {
                200: {
                    description: 'User resources retrieved successfully',
                    ...PaginatedResourcesResponseSchema,
                },
                401: {
                    description: 'Unauthorized - Invalid or missing token',
                    ...ErrorResponseSchema,
                },
            },
        },
        config: {
            rateLimit: {
                max: 1000,
                timeWindow: '15 minutes',
            },
        },
        preHandler: [fastify.authenticate, fastify.requireAny()],
        handler: resourceController.getMyResources,
    });

    /**
     * GET /resources/:id
     * 
     * Get single resource by ID with owner information
     */
    fastify.get('/:id', {
        schema: {
            description: 'Get single resource by ID with owner information',
            tags: ['resources'],
            summary: 'Get resource by ID',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Resource ID',
                    },
                },
                required: ['id'],
            },
            response: {
                200: {
                    description: 'Resource retrieved successfully',
                    ...ResourceWithOwnerSuccessResponseSchema,
                },
                404: {
                    description: 'Resource not found',
                    ...ErrorResponseSchema,
                },
            },
        },
        config: {
            rateLimit: {
                max: 100,
                timeWindow: '15 minutes',
            },
        },
        handler: resourceController.getResource,
    });

    /**
     * POST /resources
     * 
     * Create a new resource
     * Requires authentication
     */
    fastify.post('/', {
        schema: {
            description: 'Create a new resource',
            tags: ['resources'],
            summary: 'Create resource',
            security: [{ bearerAuth: [] }],
            body: toJsonSchema(CreateResourceSchema, 'CreateResourceRequest'),
            response: {
                201: {
                    description: 'Resource created successfully',
                    ...ResourceSuccessResponseSchema,
                },
                400: {
                    description: 'Validation error',
                    ...ErrorResponseSchema,
                },
                401: {
                    description: 'Unauthorized - Invalid or missing token',
                    ...ErrorResponseSchema,
                },
            },
        },
        config: {
            rateLimit: {
                max: 1000,
                timeWindow: '15 minutes',
            },
        },
        preHandler: [fastify.authenticate, fastify.requireAny()],
        handler: resourceController.createResource,
    });

    /**
     * PATCH /resources/:id
     * 
     * Update a resource (owner only)
     * Requires authentication
     */
    fastify.patch('/:id', {
        schema: {
            description: 'Update a resource (owner only)',
            tags: ['resources'],
            summary: 'Update resource',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Resource ID',
                    },
                },
                required: ['id'],
            },
            body: toJsonSchema(UpdateResourceSchema, 'UpdateResourceRequest'),
            response: {
                200: {
                    description: 'Resource updated successfully',
                    ...ResourceSuccessResponseSchema,
                },
                400: {
                    description: 'Validation error',
                    ...ErrorResponseSchema,
                },
                401: {
                    description: 'Unauthorized - Invalid or missing token',
                    ...ErrorResponseSchema,
                },
                403: {
                    description: 'Forbidden - You do not own this resource',
                    ...ErrorResponseSchema,
                },
                404: {
                    description: 'Resource not found',
                    ...ErrorResponseSchema,
                },
            },
        },
        config: {
            rateLimit: {
                max: 1000,
                timeWindow: '15 minutes',
            },
        },
        preHandler: [fastify.authenticate, fastify.requireAny()],
        handler: resourceController.updateResource,
    });

    /**
     * DELETE /resources/:id
     * 
     * Delete a resource (owner only, soft delete)
     * Requires authentication
     */
    fastify.delete('/:id', {
        schema: {
            description: 'Delete a resource (owner only, soft delete)',
            tags: ['resources'],
            summary: 'Delete resource',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Resource ID',
                    },
                },
                required: ['id'],
            },
            response: {
                200: {
                    description: 'Resource deleted successfully',
                    ...ResourceSuccessResponseSchema,
                },
                401: {
                    description: 'Unauthorized - Invalid or missing token',
                    ...ErrorResponseSchema,
                },
                403: {
                    description: 'Forbidden - You do not own this resource',
                    ...ErrorResponseSchema,
                },
                404: {
                    description: 'Resource not found',
                    ...ErrorResponseSchema,
                },
            },
        },
        config: {
            rateLimit: {
                max: 1000,
                timeWindow: '15 minutes',
            },
        },
        preHandler: [fastify.authenticate, fastify.requireAny()],
        handler: resourceController.deleteResource,
    });
}
