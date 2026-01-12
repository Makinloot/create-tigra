#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================================
// Case Transformation Utilities
// ==============================================

function toKebabCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function toSnakeCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}

function toTitleCase(str) {
    return str
        .replace(/[^a-z0-9]+/gi, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

// ==============================================
// Template Variable Replacement
// ==============================================

function generateSecureSecret(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function replaceTemplateVariables(content, config) {
    const replacements = {
        '{{PROJECT_NAME}}': config.projectName,
        '{{PROJECT_NAME_SNAKE}}': config.projectNameSnake,
        '{{PROJECT_DISPLAY_NAME}}': config.projectDisplayName,
        '{{PROJECT_DESCRIPTION}}': config.projectDescription,
        '{{DATABASE_NAME}}': config.databaseName,
        '{{DATABASE_USER}}': config.databaseUser,
        '{{DATABASE_PASSWORD}}': config.databasePassword,
        '{{AUTHOR_NAME}}': config.authorName,
        '{{JWT_SECRET}}': config.jwtSecret,
    };

    let result = content;
    for (const [key, value] of Object.entries(replacements)) {
        result = result.split(key).join(value);
    }

    return result;
}

// ==============================================
// Files to Process (relative to project root)
// ==============================================

const filesToProcess = [
    // Root files
    'CLAUDE.md',
    // Server files
    'server/package.json',
    'server/.env.example',
    'server/docker-compose.yml',
    'server/README.md',
    'server/src/config/env.ts',
    'server/prisma/schema.prisma',
    'server/Tigra-API.postman_collection.json',
];

// Files/folders to exclude from template
const excludePatterns = [
    'node_modules',
    'dist',
    '.git',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'coverage',
    'build-errors.txt',
    '.env.local',
    '.env',
    '*.tsbuildinfo',
    'tsconfig.build.tsbuildinfo',
    '.DS_Store',
    'Thumbs.db',
];

// ==============================================
// Main CLI
// ==============================================

const program = new Command();

program
    .name('create-tigra')
    .description('Create a production-ready Fastify + TypeScript + Prisma API server')
    .version('1.0.0')
    .argument('[project-name]', 'Name of the project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .action(async (projectNameArg, options) => {
        console.log();
        console.log(chalk.bold.cyan('  Create Tigra'));
        console.log(chalk.gray('  Production-ready Fastify + TypeScript + Prisma'));
        console.log();

        let projectName = projectNameArg;

        // If no project name provided, prompt for it
        if (!projectName) {
            const response = await prompts({
                type: 'text',
                name: 'projectName',
                message: 'Project name:',
                initial: 'my-project',
                validate: (value) =>
                    /^[a-z][a-z0-9-]*$/.test(value) ||
                    'Must start with letter, lowercase letters, numbers, and hyphens only',
            });

            if (!response.projectName) {
                console.log(chalk.red('Cancelled.'));
                process.exit(1);
            }
            projectName = response.projectName;
        }

        // Validate project name
        projectName = toKebabCase(projectName);

        // Check if directory exists
        const targetDir = path.join(process.cwd(), projectName);
        if (fs.existsSync(targetDir)) {
            console.log(chalk.red(`Error: Directory "${projectName}" already exists.`));
            process.exit(1);
        }

        // Gather additional info (or use defaults)
        let config;
        if (options.yes) {
            config = {
                projectName,
                projectNameSnake: toSnakeCase(projectName),
                projectDisplayName: toTitleCase(projectName),
                projectDescription: 'A production-ready REST API server',
                databaseName: toSnakeCase(projectName) + '_db',
                databaseUser: 'root',
                databasePassword: 'password',
                authorName: '',
                jwtSecret: generateSecureSecret(48),
            };
        } else {
            const answers = await prompts([
                {
                    type: 'text',
                    name: 'projectDisplayName',
                    message: 'Display name:',
                    initial: toTitleCase(projectName),
                },
                {
                    type: 'text',
                    name: 'projectDescription',
                    message: 'Description (optional):',
                    initial: '',
                },
                {
                    type: 'text',
                    name: 'authorName',
                    message: 'Author name (optional):',
                    initial: '',
                },
            ]);

            if (!answers.projectDisplayName) {
                console.log(chalk.red('Cancelled.'));
                process.exit(1);
            }

            config = {
                projectName,
                projectNameSnake: toSnakeCase(projectName),
                projectDisplayName: answers.projectDisplayName,
                projectDescription: answers.projectDescription || '',
                databaseName: toSnakeCase(projectName) + '_db',
                databaseUser: 'root',
                databasePassword: 'password',
                authorName: answers.authorName || '',
                jwtSecret: generateSecureSecret(48),
            };
        }

        // Copy template
        const spinner = ora('Creating project...').start();

        try {
            const templateDir = path.join(__dirname, '..', 'template');

            // Filter function to exclude unwanted files/folders
            const filterFunc = (src) => {
                const relativePath = path.relative(templateDir, src);
                const basename = path.basename(src);

                // Always include the root
                if (!relativePath) return true;

                // Special case: exclude .env but NOT .env.example
                if (basename === '.env' && !src.endsWith('.env.example')) {
                    return false;
                }

                // Check against exclude patterns
                return !excludePatterns.some(
                    (pattern) =>
                        relativePath === pattern ||
                        relativePath.includes(`${path.sep}${pattern}`) ||
                        relativePath.includes(`${pattern}${path.sep}`) ||
                        relativePath.startsWith(`${pattern}${path.sep}`)
                );
            };

            // Copy entire template directory to target
            await fs.copy(templateDir, targetDir, { filter: filterFunc });

            spinner.text = 'Replacing template variables...';

            // Process files with template variables
            for (const file of filesToProcess) {
                const filePath = path.join(targetDir, file);
                if (await fs.pathExists(filePath)) {
                    const content = await fs.readFile(filePath, 'utf8');
                    const replaced = replaceTemplateVariables(content, config);
                    await fs.writeFile(filePath, replaced, 'utf8');
                }
            }

            spinner.succeed('Project created successfully!');

            // Print next steps
            console.log();
            console.log(chalk.green(`  Done! Created ${chalk.bold(projectName)}`));
            console.log();
            console.log('  Project structure:');
            console.log(chalk.gray(`    ${projectName}/`));
            console.log(chalk.gray('    ├── server/        # Backend API'));
            console.log(chalk.gray('    ├── .agent/        # AI agent rules'));
            console.log(chalk.gray('    ├── .claude/       # Claude Code rules'));
            console.log(chalk.gray('    ├── .cursor/       # Cursor IDE rules'));
            console.log(chalk.gray('    └── CLAUDE.md      # Project rules'));
            console.log();
            console.log('  Next steps:');
            console.log();
            console.log(chalk.cyan(`    cd ${projectName}/server`));
            console.log(chalk.cyan('    npm install'));
            console.log();
            console.log(chalk.yellow('  Start Docker services (Docker must be running):'));
            console.log(chalk.cyan('    docker-compose up -d'));
            console.log();
            console.log(chalk.yellow('  Initialize database (waits for MySQL to be ready):'));
            console.log(chalk.cyan('    npm run db:init                     # Waits for DB + runs migration'));
            console.log(chalk.cyan('    npm run prisma:seed                 # Seed database with admin + sample data'));
            console.log();
            console.log(chalk.yellow('  Build and start:'));
            console.log(chalk.cyan('    npm run build                       # Build the project'));
            console.log(chalk.cyan('    npm run dev                         # Start development server'));
            console.log();
            console.log(chalk.yellow('  Note on Docker:'));
            console.log(chalk.gray(`    Containers will be named: ${projectName}-mysql, ${projectName}-redis, etc.`));
            console.log(chalk.gray('    Default ports: 3306 (MySQL), 6379 (Redis), 8080 (phpMyAdmin), 8081 (Redis UI)'));
            console.log(chalk.gray('    If ports conflict, edit docker-compose.yml or stop other containers first.'));
            console.log();
            console.log(chalk.gray('  URLs after starting:'));
            console.log(chalk.gray('    API Server:  http://localhost:3000'));
            console.log(chalk.gray('    Health Check: http://localhost:3000/health'));
            console.log(chalk.gray('    phpMyAdmin:  http://localhost:8080 (root / password)'));
            console.log(chalk.gray('    Redis UI:    http://localhost:8081'));
            console.log();
        } catch (error) {
            spinner.fail('Failed to create project');
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

program.parse();
