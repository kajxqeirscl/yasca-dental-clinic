/**
 * Render helper for component tests — wraps in MemoryRouter + AuthProvider + I18n.
 *
 * Kullanım:
 *   renderWithProviders(<MyComponent />, { initialEntries: ['/dashboard'] });
 *   renderWithProviders(<MyComponent />, { authenticated: true });
 */
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../app/utils/i18n';
import { AuthProvider } from '../app/contexts/AuthContext';
import { setTokens, clearAuth } from '../app/services/api';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authenticated?: boolean;
  /**
   * AuthProvider'ı wrapper'a dahil etme — kendi mock'unu sağlayan testler için.
   */
  withoutAuth?: boolean;
}

function AllProviders({
  children,
  initialEntries = ['/'],
  withoutAuth = false,
}: {
  children: ReactNode;
  initialEntries?: string[];
  withoutAuth?: boolean;
}) {
  const innerContent = (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
  return (
    <I18nextProvider i18n={i18n}>
      {withoutAuth ? innerContent : <AuthProvider>{innerContent}</AuthProvider>}
    </I18nextProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    authenticated = false,
    withoutAuth = false,
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  if (authenticated) {
    setTokens('valid-test-token', 'valid-test-refresh');
  } else {
    clearAuth();
  }

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries} withoutAuth={withoutAuth}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
}

// re-export her şey RTL'den (testlerin tek yerden import etmesi için)
export * from '@testing-library/react';
