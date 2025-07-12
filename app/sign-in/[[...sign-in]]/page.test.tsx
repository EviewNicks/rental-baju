import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignInPage from './page';

// Mock the Clerk component
jest.mock('@clerk/nextjs', () => ({
  SignIn: () => <div data-testid="clerk-sign-in">Mocked Sign In Component</div>,
}));

describe('Halaman SignIn', () => {
  it('menampilkan wrapper glass panel dan komponen SignIn Clerk', () => {
    const { container } = render(<SignInPage />);

    // Cek wrapper utama
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Cek ada elemen dengan class glass-panel (wrapper UI Maguru)
    const glassPanel = container.querySelector('.glass-panel');
    expect(glassPanel).toBeInTheDocument();

    // Cek komponen SignIn Clerk dimuat
    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument();
  });
});
