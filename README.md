# create-tigra

Generate a **production-ready, robust API server** in seconds. 

`create-tigra` scaffolds a modern, high-performance backend with built-in best practices, simplifying the setup of complex stacks so you can focus on building features.

## Key Features

*   **Production-Ready Server**: A robust **Fastify + TypeScript** foundation designed for scale and performance.
*   **Built-in Database & Caching**: Pre-configured **Database** (MySQL via Prisma) and **Redis** for caching and queues.
*   **Docker Integration**: Full `docker-compose` setup included. Spin up your infrastructure (Database, Redis) instantly.
*   **Management UIs Included**: Comes with containerized UIs for your database and Redis, making local development and debugging effortless.
*   **Secured Authentication**: Implementation of robust authentication strategies out-of-the-box.
*   **RBAC & Admin Routes**: Pre-built Role-Based Access Control system with dedicated, secured admin routes to manage your application.

## Prerequisites

Before using `create-tigra`, ensure you have the following installed:

*   **Node.js**: Version 18.0.0 or higher.
*   **Docker Desktop**: Required to run the initialized project (provides MySQL, Redis, and admin UIs).
*   **npm** (or pnpm/yarn): To install dependencies.

## Usage

To create a new project, simply run:

```bash
npx create-tigra <project-name>
```

Follow the interactive prompts to configure your new server.

## What's Inside?

When you generate a project with `create-tigra`, you get a fully structured codebase:

*   **Framework**: Fastify (v4+)
*   **Language**: TypeScript (Strict mode)
*   **ORM**: Prisma
*   **Validation**: Zod (Type-safe schemas)
*   **Testing**: Vitest
*   **Documentation**: Swagger / OpenAPI (automatically generated)
*   **Infrastructure**: Docker Compose for MySQL, Redis, and administration UIs.

## Getting Started

1.  **Generate the project**:
    ```bash
    npx create-tigra my-app
    ```

2.  **Install Dependencies**:
    ```bash
    cd my-app/server
    npm install
    ```

3.  **Start Infrastructure**:
    Make sure Docker is running, then start the services:
    ```bash
    docker-compose up -d
    ```

4.  **Initialize Database**:
    This command waits for the database to be ready and runs migrations:
    ```bash
    npm run db:init
    ```

5.  **Seed Database (Optional)**:
    Populate the database with an admin user and sample data:
    ```bash
    npm run prisma:seed
    ```

6.  **Build and Start**:
    ```bash
    npm run build
    npm run dev
    ```

    Your server will be running at `http://localhost:3000`.

## License

MIT
