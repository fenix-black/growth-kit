import ClientWrapper from './ClientWrapper';
import ThemeScript from './ThemeScript';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ThemeScript />
      <ClientWrapper>
        {children}
      </ClientWrapper>
    </>
  );
}
