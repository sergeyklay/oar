interface MainContentProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

export function MainContent({ header, children }: MainContentProps) {
  return (
    <>
      <header className="content-header px-6 py-4">
        {header}
      </header>
      <div className="bill-list-container">
        {children}
      </div>
    </>
  );
}
