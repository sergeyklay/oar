# Oar documentation

This directory contains the technical documentation for Oar. Architecture Decision Records explain system design choices. Feature docs describe user-facing functionality. Development guides help contributors set up and build the project.

## 📐 Architecture

Foundational decisions about system design and technical direction.

| Document | Description |
|----------|-------------|
| [ADR-001: Hyper-optimized modular monolith](./architecture/001-monolith.md) | Hyper-optimized modular monolith architecture |

## 💡 Features

Explanations of user-facing functionality and domain logic.

| Document | Description |
|----------|-------------|
| [Overview Screen](./features/005-overview-screen.md) | The main screen for managing all bills |
| [Due Soon Screen](./features/008-due-soon-screen.md) | Bills due within a configurable time range |
| [Due This Month View](./features/004-due-this-month.md) | Bills due in the current calendar month |
| [Logging Payments](./features/002-auto-pay.md) | Recording payments and updating due dates |
| [Recurrence Engine](./features/001-recurrence-engine.md) | How recurring and one-time payments advance |
| [Organizing Bills with Tags](./features/003-organizing-bills-with-tags.md) | Categorizing bills with tags |
| [Background Jobs](./features/006-background-jobs.md) | Automated system tasks |

## 🚀 Development

Guides for contributors and local development.

| Document | Description |
|----------|-------------|
| [Getting Started](./development/001-getting-started.md) | Getting started with Oar |
| [Local Docker Deployment](./development/002-local-docker.md) | Running Oar locally with Docker |
