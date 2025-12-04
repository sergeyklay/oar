# Oar

A sovereign, local-first bill management system built with Next.js 16, SQLite, and Drizzle ORM.

[![CI](https://github.com/sergeyklay/oar/actions/workflows/ci.yml/badge.svg)](https://github.com/sergeyklay/oar/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/sergeyklay/oar/graph/badge.svg?token=x0CUqL35Ab)](https://codecov.io/gh/sergeyklay/oar)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/sergeyklay/oar?labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Getting Started

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
# Clone and enter the project
cd oar

# Use correct Node version
nvm use

# Install dependencies
npm ci

# Initialize the database
npm run db:push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Commands

```bash
npm run db:push      # Push schema changes to SQLite
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio GUI
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** SQLite with WAL mode
- **ORM:** Drizzle
- **Validation:** Zod
- **Styling:** Tailwind CSS
