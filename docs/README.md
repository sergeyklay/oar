# Oar documentation

This directory contains the technical documentation for Oar. Architecture Decision Records explain system design choices. Feature docs describe user-facing functionality. Development guides help contributors set up and build the project.

## 📐 Architecture

Foundational decisions about system design and technical direction.

| Document | Description |
|----------|-------------|
| [ADR-001: Hyper-optimized modular monolith](./architecture/001-monolith.md) | Hyper-optimized modular monolith architecture |

## 💡 Features

Explanations of user-facing functionality and domain logic. Start with the foundation concepts, then explore the interface, actions, and advanced features.

### Views

| Document | Description |
|----------|-------------|
| [Overview Screen](./features/005-overview-screen.md) | The main screen for managing all bills |
| [Due Soon Screen](./features/008-due-soon-screen.md) | Bills due within a configurable time range |
| [Due This Month Screen](./features/004-due-this-month.md) | Bills due in the current calendar month |
| [Paid Recently Screen](./features/014-paid-recently-screen.md) | Payments made within a configurable lookback period |
| [Archive Screen](./features/013-archive-screen.md) | Viewing and managing archived bills |

### Foundation

| Document | Description |
|----------|-------------|
| [Recurrence Engine](./features/001-recurrence-engine.md) | How recurring and one-time payments advance |

### Core Interface

| Document | Description |
|----------|-------------|
| [Hiding the Sidebar](./features/015-hiding-the-sidebar.md) | Temporarily hide the sidebar to get more space for your bill table |
| [Bill Detail Panel](./features/009-bill-detail-panel-and-skip-payment.md) | The panel for managing a specific bill |

### Organization

| Document | Description |
|----------|-------------|
| [Organizing Bills with Tags](./features/003-organizing-bills-with-tags.md) | Categorizing bills with tags |

### Actions

| Document | Description |
|----------|-------------|
| [Logging Payments](./features/002-auto-pay.md) | Recording payments, partial payments, and historical payment detection |
| [Editing Payment History](./features/011-editing-payment-history.md) | Correcting payment mistakes and managing payment records |

### Advanced Features

| Document | Description |
|----------|-------------|
| [After a Bill Ends](./features/012-after-a-bill-ends-setting.md) | What happens when a bill ends |

### Automation

| Document | Description |
|----------|-------------|
| [Background Jobs](./features/006-background-jobs.md) | Automated system tasks |
| [Active Payer Signals](./features/010-active-payer-signals.md) | Explicit payment mode indicators (Auto/Manual) for each bill |

## 🚀 Development

Guides for contributors and local development.

| Document | Description |
|----------|-------------|
| [Getting Started](./development/001-getting-started.md) | Getting started with Oar |
| [Local Docker Deployment](./development/002-local-docker.md) | Running Oar locally with Docker |
| [Logging](./development/003-logging.md) | Logging in Oar |
