# Error Log

Server started successfully with the following warnings:
- ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

## Recent Activity
- ✓ Ready in 5.8s
- ○ Compiling /owner ...
- GET /owner 307 in 8.0s (compile: 6.8s, proxy.ts: 51ms, render: 1222ms)
- GET /dashboard 200 in 2.5s (compile: 1984ms, proxy.ts: 21ms, render: 511ms)
- POST /dashboard 200 in 92ms (compile: 20ms, proxy.ts: 32ms, render: 41ms)
- GET /api/kasir/transaksi?page=1&limit=100 200 in 6.6s (compile: 1360ms, proxy.ts: 26ms, render: 5.2s)
- GET /dashboard/new 200 in 2.0s (compile: 1911ms, proxy.ts: 42ms, render: 61ms)
- GET /api/categories 200 in 1324ms (compile: 558ms, proxy.ts: 29ms, render: 737ms)
- GET /api/kasir/produk/available?available=true&page=1&limit=12&sortBy=name&sortOrder=asc 200 in 3.1s (compile: 653ms, proxy.ts: 30ms, render: 2.4s)

## Error Suppression Applied
TimeoutError logs have been suppressed to reduce console spam. 
If you need to see timeout errors for debugging, set NODE_ENV=development.

## Image Loading Issues
Some images from Supabase storage may experience timeout issues. This is normal and handled gracefully by the application.