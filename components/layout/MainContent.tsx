import { ScrollableContainer } from '@/components/common/ScrollableContainer';

interface MainContentProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

export function MainContent({ header, children }: MainContentProps) {
  return (
    <>
      <header className="content-header px-6 h-16 flex items-center">
        {header}
      </header>
      <ScrollableContainer>
        {children}
      </ScrollableContainer>
    </>
  );
}
