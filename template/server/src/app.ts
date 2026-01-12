/**
 * Fastify Application Configuration
 *
 * Main entry point for configuring the Fastify instance, plugins,
 * middleware, hooks, and global error handling.
 *
 * @see /mnt/project/02-general-rules.md
 * @see /mnt/project/06-response-handling.md
 * @see /mnt/project/08-observability.md
 * @see /mnt/project/11-rate-limiting-v2.md
 */

import fastify from 'fastify';
import { env } from '@/config/env';
import logger from '@/libs/logger';

// Extracted Modules
import { setupErrorHandler } from '@/libs/error-handler';
import { registerSecurityPlugins } from '@/plugins/security.plugin';
import { registerRateLimit } from '@/plugins/rate-limit.plugin';
import { registerRequestHooks } from '@/hooks/request-timing.hook';
import { authenticateMiddleware } from '@/libs/auth/authenticate.middleware';
import { healthRoutes } from '@/routes/health.routes';

// Routes & RBAC
import { authRoutes } from '@/modules/auth/auth.routes';
import { resourceRoutes } from '@/modules/resources/resources.routes';
import { adminRoutes } from '@/modules/admin/admin.routes';
import {
    requireRole,
    requireAdmin,
    requireUser,
    requireAny,
} from '@/libs/auth/rbac.middleware';

/**
 * Configure and build the Fastify application
 */
const buildApp = async () => {
    const app = fastify({
        loggerInstance: logger,
        disableRequestLogging: true, // Custom logging handled by hooks
    });

    // 1. Plugins
    await registerSecurityPlugins(app);
    await registerRateLimit(app);

    // 2. Decorators
    app.decorate('authenticate', authenticateMiddleware);
    app.decorate('requireRole', requireRole);
    app.decorate('requireAdmin', requireAdmin);
    app.decorate('requireUser', requireUser);
    app.decorate('requireAny', requireAny);

    // 3. Hooks
    registerRequestHooks(app);

    // 4. Error Handler
    app.setErrorHandler(setupErrorHandler);

    // 5. Routes
    await app.register(healthRoutes);
    await app.register(authRoutes, { prefix: `${env.API_PREFIX}/auth` });
    await app.register(resourceRoutes, { prefix: `${env.API_PREFIX}/resources` });
    await app.register(adminRoutes, { prefix: `${env.API_PREFIX}/admin` });

    return app;
};

export default buildApp;
