// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { App } from './App';

describe('<App />', () => {
  it('muestra el título, los tipos marcables y la versión', () => {
    render(<App version="1.2.3" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bacheta' })).toBeTruthy();
    expect(screen.getByText('Vereda rota')).toBeTruthy();
    expect(screen.queryByText('Esquive')).toBeNull();
    expect(screen.getByText('Versión 1.2.3')).toBeTruthy();
  });
});
