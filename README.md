This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

![CI/CD Pipeline](https://github.com/Magurutech/maguru/workflows/CI/CD%20Pipeline/badge.svg)

## Development

### Install dependencies

```bash
yarn install
```

### Lint & Format

- Jalankan lint: `yarn lint`
- Format otomatis: aktif di VSCode (formatOnSave) dan Prettier
- Konfigurasi lint: Airbnb + Prettier + Tailwind + TypeScript
- Pesan error/warning bisa muncul dalam bahasa Indonesia jika diatur di VSCode

### TypeScript Strict Mode

- Strict mode dan noImplicitAny sudah aktif di `tsconfig.json` untuk memastikan type safety maksimal

### CI/CD Pipeline

Project ini menggunakan GitHub Actions untuk Continuous Integration dan Continuous Deployment:

- **Lint**: Memeriksa kode menggunakan ESLint
- **Test**: Menjalankan unit test dengan Jest dan React Testing Library
- **Build**: Membangun aplikasi untuk memastikan tidak ada error
- **Deploy**: Deploy otomatis ke staging environment (Vercel) saat push ke branch `develop` atau `main`

Workflow berjalan setiap kali ada push atau pull request ke branch `develop` atau `main`, dan juga berjalan setiap malam (00:00 UTC) untuk memastikan dependency tetap kompatibel.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
