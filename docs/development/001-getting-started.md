# Getting Started

- **Status:** Draft
- **Last Updated:** 2025-12-19

## 1. Goal

Set up a local development environment for **Oar** to contribute to the
project or test features. By the end of this guide, you will have a
running instance of Oar connected to a local SQLite database with sample
data.

## 2. Prerequisites

Ensure you have the following installed on your machine:

- **Node.js 24**: The project requires Node.js 24 (see `.nvmrc`).
- **npm**: Use npm as the primary package manager.
- **Git**: For version control and cloning the repository.
- **OpenSSL**: Required to generate encryption keys for Next.js Server Actions.

## 3. Step-by-Step Guide

### Step 1: Clone the Repository

Clone the project to your local machine and navigate into the directory:

```bash
git clone https://github.com/sergeyklay/oar.git
cd oar
```

### Step 2: Install Dependencies

Use npm to install the required packages:

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a local environment file by copying the provided example:

```bash
cp .env.example .env
```

Open `.env` and generate a secure encryption key for Server Actions:

```bash
# On Linux/macOS
openssl rand -base64 32
```

Copy the output and paste it into the `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
field in your `.env` file.

### Step 4: Initialize the Database

Oar uses SQLite with Drizzle ORM. Push the schema to your local database
file:

```bash
npm run db:push
```

Note: This creates the SQLite database file at the path specified by
`DATABASE_URL` (default: `./data/oar.db`).

### Step 5: Seed Sample Data (Optional)

To populate the application with mock bills and transactions for testing,
run the seed script:

```bash
npm run db:seed
```

### Step 6: Start the Development Server

Launch the Next.js development server:

```bash
npm run dev
```

## 4. Configuration

The application uses the following environment variables:

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `DATABASE_URL` | Path to the SQLite database file. | `./data/oar.db` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Key for Server Actions. | Required |
| `OAR_MEMORY_LIMIT` | Docker memory limit. | `128MiB` |

Note: `OAR_MEMORY_LIMIT` is used only for Docker deployment.
For more see [Local Docker Deployment](./002-local-docker.md).

## 5. Verification

How do I know it worked?

1. Open your browser and navigate to `http://localhost:3000`.
2. You should see the Oar dashboard.
3. If you ran the seed script, you should see sample bills and recent
   transactions.
4. Run the test suite to ensure everything is functioning correctly:

   ```bash
   npm test
   ```

## 6. Troubleshooting

### Incorrect Node.js Version

If you see errors related to syntax or missing APIs, verify your Node.js
version:

```bash
node -v
```

If you use `nvm`, run `nvm use` in the root directory to switch to the
version specified in `.nvmrc`.

### Database Connection Errors

If the application fails to start or shows database errors, ensure the
`data/` directory exists or that the path in `DATABASE_URL` is writable.

### Server Actions Errors

If you encounter issues when submitting forms, ensure
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is set correctly in your `.env` file
and that you restarted the development server after adding it.

## 7. Next Steps

To learn about Local Docker deployment, see [Local Docker Deployment](./002-local-docker.md).
