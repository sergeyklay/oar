# Oar documentation

This directory contains the technical documentation for Oar. Architecture Decision Records explain system design choices. Feature docs describe user-facing functionality. Development guides help contributors set up and build the project.

## Architecture

Foundational decisions about system design and technical direction.

| Document | Description |
|----------|-------------|
| [ADR-001: Hyper-optimized modular monolith](./architecture/001-monolith.md) | Hyper-optimized modular monolith architecture |

## Features

Explanations of user-facing functionality and domain logic.

| Document | Description |
|----------|-------------|
| [Recurrence Engine](./features/001-recurrence-engine.md) | Handling recurring and one-time payments |
| [Logging Payments](./features/002-auto-pay.md) | Logging payments and updating due dates |
| [Organizing Bills with Tags](./features/003-organizing-bills-with-tags.md) | Categorizing bills with tags |
| [Due This Month View](./features/004-due-this-month.md) | Viewing bills due in the current month |

## Development

Guides for contributors and local development.

| Document | Description |
|----------|-------------|
| [Getting Started](./development/001-getting-started.md) | Getting started with Oar |
| [Local Docker Deployment](./development/002-local-docker.md) | Running Oar locally with Docker |

