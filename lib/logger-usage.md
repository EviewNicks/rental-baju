# 📝 Panduan Mudah: Client Logger untuk Debugging

> **TL;DR**: Logger siap pakai untuk debugging. Import → Log → Lihat hasil di browser console!

## 🚀 Quick Start (5 Menit Setup)

### Step 1: Import Logger
```typescript
import { logger, useLogger } from '@/lib/client-logger'
```

### Step 2: Gunakan Logger
```typescript
// Cara paling mudah
logger.info('Transaction berhasil!', { userId: 123 })
logger.error('Ada error!', { error: 'Network timeout' })
```

### Step 3: Lihat Hasil
- Buka browser console (F12)
- Ketik: `showLogs()` 
- Done! ✅

---

## 🎯 Kapan Pakai Logger?

| **Situasi** | **Contoh** |
|-------------|------------|
| 🔄 **Track User Actions** | Button click, form submit |
| 🐛 **Debug API Issues** | Request gagal, response lambat |
| 📊 **Monitor Performance** | Operasi yang lama |
| 🚨 **Catch Errors** | Try-catch blocks |

---

## 📖 Cara Pakai: 3 Method Mudah

### **Method 1: Direct Logger (Paling Simple)**

```typescript
import { logger } from '@/lib/client-logger'

// Di mana saja dalam kode
logger.info('User login berhasil', { userName: 'John' })
logger.error('Payment gagal', { amount: 50000, error: 'Timeout' })
```

### **Method 2: Component Hook (Recommended untuk React)**

```typescript
import { useLogger } from '@/lib/client-logger'

function TransactionForm() {
  const log = useLogger('TransactionForm') // Otomatis track component
  
  const handleSubmit = () => {
    log.info('Form submitted', { productCount: 3 })
    // ... form logic
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### **Method 3: Service Layer (untuk API calls)**

```typescript
import { logger } from '@/lib/client-logger'

export class TransaksiService {
  async createTransaction(data: any) {
    logger.info('🚀 Creating transaction', { data }, 'TransaksiService')
    
    try {
      const response = await fetch('/api/kasir/transaksi', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      logger.info('✅ Transaction created', { id: response.id })
      return response.json()
      
    } catch (error) {
      logger.error('❌ Transaction failed', { error }, 'TransaksiService')
      throw error
    }
  }
}
```

---

## 🔍 Cara Lihat & Ambil Log

### **Option 1: Browser Console (Paling Mudah)**

```javascript
// Buka browser console (F12), ketik:
showLogs()          // Lihat semua logs
downloadLogs()      // Download file JSON
clearLogs()         // Hapus logs
```

### **Option 2: Filter Logs (untuk Debugging Spesifik)**

```javascript
// Lihat cuma errors
showLogs().filter(l => l.level === 'error')

// Lihat logs TransactionForm
showLogs().filter(l => l.component === 'TransactionForm')

// Lihat logs 10 menit terakhir
showLogs().filter(l => new Date(l.timestamp) > new Date(Date.now() - 600000))
```

### **Option 3: localStorage (Backup Access)**

```javascript
// Akses langsung
JSON.parse(localStorage.getItem('client-logs') || '[]')

// Hapus
localStorage.removeItem('client-logs')
```

---

## 🎯 Real-World Examples

### **Example 1: Debug Transaction Flow**

```typescript
// features/kasir/hooks/useTransactionForm.ts
import { useLogger } from '@/lib/client-logger'

export function useTransactionForm() {
  const log = useLogger('TransactionForm')
  
  const submitTransaction = async (data: any) => {
    log.info('🚀 Starting transaction', { customerName: data.customer.name })
    
    try {
      const result = await createTransaksi(data)
      log.info('✅ Transaction success', { transactionId: result.id })
      return true
    } catch (error) {
      log.error('❌ Transaction failed', { error: error.message, data })
      return false
    }
  }
  
  return { submitTransaction }
}
```

**Hasil di console:**
```
[2024-01-28T10:30:15.123Z] [INFO] [TransactionForm] 🚀 Starting transaction | Data: {"customerName":"John Doe"}
[2024-01-28T10:30:15.456Z] [INFO] [TransactionForm] ✅ Transaction success | Data: {"transactionId":"txn_123"}
```

### **Example 2: Debug Performance Issues**

```typescript
// Timing operations
const log = useLogger('ProductList')

const fetchProducts = async () => {
  const startTime = performance.now()
  log.debug('Fetching products...')
  
  try {
    const products = await api.getProducts()
    const duration = performance.now() - startTime
    
    log.info('Products loaded', { 
      count: products.length, 
      duration: `${duration.toFixed(2)}ms` 
    })
    
  } catch (error) {
    log.error('Failed to load products', { error })
  }
}
```

### **Example 3: Debug User Actions**

```typescript
// Track user interactions
const log = useLogger('ProductCard')

const handleAddToCart = (product: Product) => {
  log.info('User added product to cart', {
    productId: product.id,
    productName: product.name,
    price: product.price,
    timestamp: Date.now()
  })
  
  // ... add to cart logic
}
```

---

## 🚨 Troubleshooting Common Issues

### **Problem 1: "Tidak ada logs yang muncul"**

**Solution:**
```javascript
// Check di console:
console.log('Logging enabled:', process.env.NEXT_PUBLIC_ENABLE_LOGGING)
console.log('Log level:', process.env.NEXT_PUBLIC_LOG_LEVEL)

// Harus return 'true' dan 'debug' di development
```

### **Problem 2: "Logs hilang setelah refresh"**

**Solution:**
```javascript
// Logs tersimpan di localStorage, check:
JSON.parse(localStorage.getItem('client-logs') || '[]')

// Kalau kosong, mungkin storage penuh atau disabled
```

### **Problem 3: "Performance impact"**

**Solution:**
```typescript
// Logger otomatis disable di production
// Di development, maksimal 100 logs di memory
// localStorage cuma simpan 20 logs terakhir
```

---

## 💡 Pro Tips

### **1. Gunakan Emojis untuk Clarity**
```typescript
log.info('🚀 Starting operation')
log.info('✅ Operation success') 
log.error('❌ Operation failed')
log.warn('⚠️ Something unusual')
```

### **2. Include Useful Context**
```typescript
// ❌ Bad
log.error('Error occurred')

// ✅ Good
log.error('Transaction failed', {
  userId: user.id,
  amount: 50000,
  error: error.message,
  timestamp: Date.now()
})
```

### **3. Use Component Names Consistently**
```typescript
// Consistent naming
const log = useLogger('TransactionForm')
const log = useLogger('ProductList')  
const log = useLogger('PaymentModal')
```

### **4. Quick Debug Commands**
```javascript
// Simpan ini di browser bookmarks:
javascript:console.table(JSON.parse(localStorage.getItem('client-logs')||'[]').filter(l=>l.level==='error'))

// Quick error check
javascript:console.log('Errors:',JSON.parse(localStorage.getItem('client-logs')||'[]').filter(l=>l.level==='error').length)
```

---

## 🔧 Advanced Usage (Optional)

### **Import Helper Functions**
```typescript
// Import debugging utilities
import { 
  TransactionTroubleshooter,
  PerformanceTroubleshooter 
} from '@/lib/troubleshoot-examples'

// Use in browser console:
TransactionTroubleshooter.debugTransactionFlow()
PerformanceTroubleshooter.findSlowOperations()
```

### **Export untuk Support Team**
```javascript
// Browser console - export semua info untuk support
function exportForSupport() {
  const logs = JSON.parse(localStorage.getItem('client-logs') || '[]')
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    logs: logs
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'debug-logs.json'
  a.click()
}
```

---

## ✅ Checklist: Am I Using Logger Correctly?

- [ ] ✅ Import logger di component/service
- [ ] ✅ Log user actions (clicks, submits)  
- [ ] ✅ Log API calls (start, success, error)
- [ ] ✅ Include relevant data context
- [ ] ✅ Use appropriate log levels (debug/info/warn/error)
- [ ] ✅ Test dengan `showLogs()` di browser console
- [ ] ✅ Dapat download logs dengan `downloadLogs()`

**Kalau semua ✅, Anda sudah siap untuk debugging yang efektif!** 🎉

---

## 🆘 Need Help?

1. **Quick Test**: Ketik `showLogs()` di browser console
2. **Check Setup**: Pastikan import dari `@/lib/client-logger`
3. **Debug Mode**: Development environment harus enabled
4. **Support**: Export logs dengan `downloadLogs()` untuk tim support

**Happy Debugging!** 🐛→🎯