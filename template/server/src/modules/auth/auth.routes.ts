/**
 * Authentication Routes
 * 
 * Fastify route definitions for authentication endpoints.
 * Includes Swagger documentation and rate limiting.
 * 
 * @see /mnt/project/09-api-documentation-v2.md
 * @see /mnt/project/11-rate-limiting-v2.md
 */

import type { FastifyInstance } from 'fastify';
import { toJsonSchema, getDefinition } from '@/libs/swagger-schemas';
import * as authController from './auth.controller';
import {
    RegisterSchema,
    LoginSchema,
    RefreshTokenSchema,
    AuthResponseSchema,
    UserResponseSchema,
    TokenResponseSchema,
    ErrorResponseSchema,
} from './auth.schemas';

/**
 * Register authentication routes
 * 
 * @param fastify - Fastify instance
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * POST /auth/register
     * 
     * Register a new user account
     */
    fastify.post('/register', {
        schema: {
            description: 'Register a new user account',
            tags: ['auth'],
            summary: 'Register user',
            body: toJsonSchema(RegisterSchema, 'RegisterRequest'),
            response: {
                201: getDefinition(AuthResponseSchema, 'AuthResponse'),
                400: {
                    description: 'Validation error',
                    ...getDefinition(ErrorResponseSchema, 'ErrorResponse'),
                },
                409: {
                    description: 'Email already registered',
                    ...getDefinition(ErrorResponseSchema, 'ErrorResponse'),
                },
            },
        },
        config: {
            rateLimit: {
                max: 3,
                timeWindow: '1 hour',
            },
        },
        handler: authController.register,
    });

    /**
     * POST /auth/login
     * 
     * Login with email and password
     */
    fastify.post('/login', {
        schema: {
            description: 'Login with email and password',
            tags: ['auth'],
            summary: 'Login user',
            body: toJsonSchema(LoginSchema, 'LoginRequest'),
            response: {
                200: getDefinition(AuthResponseSchema, 'AuthResponse'),
                401: {
                    description: 'Invalid credentials',
                    ...getDefinition(ErrorResponseSchema, 'ErrorResponse'),
                },
            },
        },
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '15 minutes',
            },
        },
        handler: authController.login,
    });

    /**
     * POST /auth/refresh
     * 
     * Refresh access token using refresh token
     */
    fastify.post('/refresh', {
        schema: {
            description: 'Refresh access token using refresh token',
            tags: ['auth'],
            summary: 'Refresh tokens',
            body: toJsonSchema(RefreshTokenSchema, 'RefreshTokenRequest'),
            response: {
                200: {
                    description: 'Tokens refreshed successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', enum: [true] },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                    },
                },
                401: {
                    description: 'Invalid or expired refresh token',
                    ...getDefinition(ErrorResponseSchema, 'ErrorResponse'),
                },
            },
        },
        config: {
            rateLimit: {
                max: 10,
                timeWindow: '15 minutes',
            },
        },
        handler: authController.refreshTokens,
    });

    /**
     * POST /auth/logout
     * 
     * Logout user by invalidating refresh token
     */
    fastify.post('/logout', {
        schema: {
            description: 'Logout user by invalidating refresh token',
            tags: ['auth'],
            summary: 'Logout user',
            body: toJsonSchema(RefreshTokenSchema, 'RefreshTokenRequest'),
            response: {
                200: {
                    description: 'Logout successful',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', enum: [true] },
                        message: { type: 'string' },
                        data: { type: 'null' },
                    },
                },
            },
        },
        handler: authController.logout,
    });

    /**
     * GET /auth/me
     * 
     * Get current authenticated user information
     * Requires authentication
     */
    fastify.get('/me', {
        schema: {
            description: 'Get current authenticated user information',
            tags: ['auth'],
            summary: 'Get current user',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'User retrieved successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', enum: [true] },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                email: { type: 'string', format: 'email' },
                                name: { type: 'string', nullable: true },
                                role: { type: 'string' },
                                emailVerified: { type: 'boolean' },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' },
                            },
                        },
                    },
                },
                401: {
                    description: 'Unauthorized - Invalid or missing token',
                    ...getDefinition(ErrorResponseSchema, 'ErrorResponse'),
                },
                404: {
                    description: 'User not found',
                    ...getDefinition(ErrorResponseSchema, 'ErrorResponse'),
                },
            },
        },
        preHandler: [fastify.authenticate],
        handler: authController.getMe,
    });
}
