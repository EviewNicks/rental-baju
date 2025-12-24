# TimeoutError Suppression Implementation

## Problem
Aplikasi mengalami spam logging TimeoutError yang berulang, terutama dari:
- Next.js Image Optimization saat memproses gambar dari Supabase
- API calls yang timeout
- Network requests yang terputus

## Solution Implemented

### 1. Error Suppression System (`lib/error-suppression.ts`)
- Cache system untuk mencegah logging error yang sama berulang kali
- Maksimal 3 kali error yang sama dalam 30 detik
- Automatic cleanup untuk mencegah memory leak

### 2. Logger Enhancement (`services/logger.ts`)
- Integrasi dengan error suppression system
- Khusus mengurangi TimeoutError spam
- Tetap log error penting lainnya

### 3. Integration Utils Update (`features/kasir/lib/utils/integrationUtils.ts`)
- Timeout error hanya di-log di development mode
- Production mode menggunakan warning level untuk timeout

### 4. API Route Enhancement (`app/api/kasir/produk/available/route.ts`)
- Suppress TimeoutError di production
- Tetap log error lain dengan normal
- Improved error context untuk debugging

### 5. Next.js Configuration (`next.config.ts`)
- Enhanced image optimization settings
- Better timeout handling untuk image processing

### 6. Image Error Handler (`lib/image-error-handler.ts`)
- Specialized handler untuk Next.js Image component
- Graceful error handling untuk image loading failures

## Usage

### Automatic
Semua perubahan bekerja otomatis tanpa perlu konfigurasi tambahan.

### Manual Suppression
```typescript
import { suppressedConsoleError } from '@/lib/error-suppression'

// Gunakan ini sebagai pengganti console.error
suppressedConsoleError(error)
```

### Development Mode
Untuk melihat timeout errors saat development:
```bash
NODE_ENV=development yarn dev
```

### Debug Images
Untuk debug image loading:
```bash
DEBUG_IMAGES=true yarn dev
```

## Benefits
- ✅ Console log yang lebih bersih
- ✅ Tetap capture error penting
- ✅ Better development experience
- ✅ Production-ready error handling
- ✅ Memory efficient (automatic cleanup)

## Files Modified
- `services/logger.ts` - Enhanced error logging
- `features/kasir/lib/utils/integrationUtils.ts` - Timeout error suppression
- `app/api/kasir/produk/available/route.ts` - API error handling
- `next.config.ts` - Image optimization config
- `docs/error.md` - Cleaned up error log

## Files Created
- `lib/error-suppression.ts` - Core suppression system
- `lib/image-error-handler.ts` - Image error handling
- `docs/timeout-error-suppression.md` - This documentation