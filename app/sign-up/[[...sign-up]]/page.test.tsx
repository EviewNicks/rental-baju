import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUpPage from './page';

// Mock the Clerk component
jest.mock('@clerk/nextjs', () => ({
  SignUp: () => <div data-testid="clerk-sign-up">Mocked Sign Up Component</div>,
}));

describe('Halaman SignUp', () => {
  it('menampilkan wrapper glass panel dan komponen SignUp Clerk', () => {
    const { container } = render(<SignUpPage />);

    // Cek wrapper utama
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Cek ada elemen dengan class glass-panel (wrapper UI Maguru)
    const glassPanel = container.querySelector('.glass-panel');
    expect(glassPanel).toBeInTheDocument();

    // Cek komponen SignUp Clerk dimuat
    expect(screen.getByTestId('clerk-sign-up')).toBeInTheDocument();
  });
});
