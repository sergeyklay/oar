import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

jest.mock('./Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

jest.mock('./CalendarPanel', () => ({
  CalendarPanel: () => <aside data-testid="calendar-panel">Calendar</aside>,
}));

describe('AppShell', () => {
  it('renders children in main content area', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows CalendarPanel by default when rightPanel is not provided', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('calendar-panel')).toBeInTheDocument();
  });

  it('hides CalendarPanel when rightPanel is null', () => {
    render(
      <AppShell rightPanel={null}>
        <div>Content</div>
      </AppShell>
    );

    expect(screen.queryByTestId('calendar-panel')).not.toBeInTheDocument();
  });

  it('shows custom rightPanel when provided', () => {
    render(
      <AppShell rightPanel={<div data-testid="custom-panel">Custom</div>}>
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('custom-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-panel')).not.toBeInTheDocument();
  });

  it('always renders Sidebar', () => {
    render(
      <AppShell rightPanel={null}>
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});

