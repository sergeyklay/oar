# Oar Documentation

Technical documentation for Oar. Feature docs describe user-facing functionality. Development guides help contributors set up and build the project. Architecture Decision Records explain system design choices.

## Features

Explanations of user-facing functionality and domain logic. Start with the foundation concepts, then explore the interface, actions, and advanced features.

### Foundation

Core concepts that underpin the entire system.

- [Active Payer Philosophy](./features/active-payer-philosophy.md) - The foundational philosophy behind Oar's approach to personal finance
- [Recurrence Engine](./features/recurrence-engine.md) - How recurring and one-time payments advance

### Views

The main screens for viewing and managing bills.

- [Overview View](./features/overview-view.md) - The main view for managing all bills
- [Due Soon View](./features/due-soon-view.md) - Bills due within a configurable time range
- [Due This Month View](./features/due-this-month.md) - Bills due in the current calendar month
- [Paid Recently View](./features/paid-recently-view.md) - Payments made within a configurable lookback period
- [Forecast View](./features/forecast-view.md) - Projecting future financial liabilities by month
- [Monthly History View](./features/monthly-history-view.md) - Reviewing actual payment history with year-over-year comparison
- [Annual Spending View](./features/annual-spending-view.md) - Reviewing annual spending patterns aggregated by bill
- [Archive View](./features/archive-view.md) - Viewing and managing archived bills

### Core Interface

Common UI elements shared across views.

- [Page Header](./features/page-header.md) - Common header controls available on all pages
- [Bill Search](./features/bill-search.md) - Search for bills by title across all pages
- [Bill Detail Panel](./features/bill-detail-panel-and-skip-payment.md) - The panel for managing a specific bill

### Organization

Categorizing and grouping bills.

- [Organizing Bills with Tags](./features/organizing-bills-with-tags.md) - Categorizing bills with tags

### Actions

Recording and managing payments.

- [Logging Payments](./features/auto-pay.md) - Recording payments, partial payments, and historical payment detection
- [Editing Payment History](./features/editing-payment-history.md) - Correcting payment mistakes and managing payment records

### Advanced Features

Optional behaviors and configuration.

- [After a Bill Ends](./features/after-a-bill-ends-setting.md) - What happens when a bill ends
- [Include Automatic Bills Setting](./features/include-automatic-bills-setting.md) - Control whether automatic bills appear in Due Soon and Due This Month views
- [Weekend Payment Date Adjustment](./features/weekend-payment-date-adjustment.md) - How weekend due dates are adjusted for banking reality

### Automation

Background processes and system tasks.

- [Background Jobs](./features/background-jobs.md) - Automated system tasks
- [Active Payer Signals](./features/active-payer-signals.md) - Explicit payment mode indicators (Auto/Manual) for each bill

## Development

Guides for contributors and local development.

- [Getting Started](./development/getting-started.md) - Setting up your development environment
- [Local Docker Deployment](./development/local-docker.md) - Running Oar locally with Docker
- [Deploying Oar on AWS with Cloudflare Tunnel](./development/deploy-aws.md) - Guide to deploying Oar on AWS using Cloudflare Tunnel for secure access
- [Logging](./development/logging.md) - Logging conventions and configuration

## Architecture

Foundational decisions about system design and technical direction.

- [ADR-001: Hyper-optimized modular monolith](./architecture/monolith.md)
- [ADR-002: Client-Side Only Date Rendering Strategy](./architecture/client-side-date-rendering.md)
