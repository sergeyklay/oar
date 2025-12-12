# Oar

A self-hosted, local-first bill manager for the Active Payer.

[![CI](https://github.com/sergeyklay/oar/actions/workflows/ci.yml/badge.svg)](https://github.com/sergeyklay/oar/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/sergeyklay/oar/graph/badge.svg?token=x0CUqL35Ab)](https://codecov.io/gh/sergeyklay/oar)

## Philosophy

Oar rejects mindless automation. Most expense trackers record what already happened; Oar makes you confront what's coming. Every payment requires your conscious acknowledgment. This friction prevents zombie subscriptions and builds financial awareness.

Sovereignty by default. Your data lives on your machine. No cloud sync, no telemetry, no external APIs. You own your financial truth.

## Features

- **Manual payment logging** - Each payment is a deliberate act, not a background process. You still can configure automatic logging, but it's off by default
- **Forecasting and liquidity planning** - See your cash flow before it happens
- **Sinking funds** - Know exactly how much to save for upcoming obligations
- **Local-first architecture** - Works offline, stores everything in SQLite

## Tech stack

Next.js (App Router), SQLite (WAL mode), Drizzle ORM, shadcn/ui, Tailwind CSS, Docker

## Documentation

| Section | Description |
|---------|-------------|
| 📐 [Architecture](docs/architecture/) | System design and database schema |
| 🚀 [Development](docs/development/) | Local setup, Docker deployment |
| 💡 [Features](docs/features/) | Deep dives into recurrence, forecasting, tags |

## Quick start

See the [Local Docker Guide](docs/development/002-local-docker.md) for full setup instructions.

## License

This project is licensed under the MIT License.
