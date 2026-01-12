import { FastifyInstance } from 'fastify';
import { toJsonSchema } from '@/libs/swagger-schemas';
import * as adminController from './admin.controller';
import * as schemas from './admin.schemas';

/**
 * Admin Routes
 * All routes require ADMIN role
 */
export async function adminRoutes(app: FastifyInstance) {
    /**
     * GET /admin/users
     * List all users with pagination
     */
    app.get('/users', {
        schema: {
            description: 'List all users (admin only)',
            tags: ['admin'],
            querystring: toJsonSchema(schemas.ListUsersSchema, 'ListUsersSchema'),
            security: [{ bearerAuth: [] }],
        },
        preHandler: [app.authenticate, app.requireAdmin()],
        handler: adminController.listAllUsers,
    });

    /**
     * GET /admin/users/:id
     * Get user details
     */
    app.get('/users/:id', {
        schema: {
            description: 'Get user by ID (admin only)',
            tags: ['admin'],
            params: toJsonSchema(schemas.UserIdSchema, 'UserIdSchema'),
            security: [{ bearerAuth: [] }],
        },
        preHandler: [app.authenticate, app.requireAdmin()],
        handler: adminController.getUserById,
    });

    /**
     * DELETE /admin/users/:id
     * Delete user
     */
    app.delete('/users/:id', {
        schema: {
            description: 'Delete user (admin only)',
            tags: ['admin'],
            params: toJsonSchema(schemas.UserIdSchema, 'UserIdSchema'),
            security: [{ bearerAuth: [] }],
        },
        preHandler: [app.authenticate, app.requireAdmin()],
        handler: adminController.deleteUser,
    });

    /**
     * POST /admin/users/:id/change-role
     * Change user role
     */
    app.post('/users/:id/change-role', {
        schema: {
            description: 'Change user role (admin only)',
            tags: ['admin'],
            params: toJsonSchema(schemas.UserIdSchema, 'UserIdSchema'),
            body: toJsonSchema(schemas.ChangeRoleSchema, 'ChangeRoleSchema'),
            security: [{ bearerAuth: [] }],
        },
        preHandler: [app.authenticate, app.requireAdmin()],
        handler: adminController.changeUserRole,
    });

    /**
     * POST /admin/users/:id/verify-email
     * Manually verify user email
     */
    app.post('/users/:id/verify-email', {
        schema: {
            description: 'Verify user email manually (admin only)',
            tags: ['admin'],
            params: toJsonSchema(schemas.UserIdSchema, 'UserIdSchema'),
            security: [{ bearerAuth: [] }],
        },
        preHandler: [app.authenticate, app.requireAdmin()],
        handler: adminController.verifyUserEmail,
    });

    /**
     * GET /admin/stats
     * Get system statistics
     */
    app.get('/stats', {
        schema: {
            description: 'Get system statistics (admin only)',
            tags: ['admin'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [app.authenticate, app.requireAdmin()],
        handler: adminController.getSystemStats,
    });
}
