# Transaction Logger

**Purpose**: Debug transaction data flow from frontend to API with detailed JSON logging.

## 📋 Usage

### Enable Logger
```bash
# Development environment (default)
NODE_ENV=development

# Or explicitly enable
NEXT_PUBLIC_DEBUG_TRANSACTION=true
```

### Logger Output

When enabled, logger will display two console outputs:

**1. Form Data Log** (from TransactionFormPage):
- User-friendly format
- Product details with quantities
- Customer information
- Total pricing calculation

**2. API Payload Log** (from useTransactionForm):
- Backend-ready format
- Complete CreateTransaksiRequest structure
- Size-aware vs legacy format detection
- API endpoint information

## 📊 Example Output

### Form Data Output:
```
📋 TRANSACTION FORM DATA
├─ 📊 Metadata
│   ├─ description: "Data collected from user input form..."
│   ├─ timestamp: "2025-01-27T10:30:00.000Z"
│   └─ source: "TransactionFormPage.handleSubmitTransaction"
├─ 📄 Data Payload
├─ 📦 Items Summary
├─ 👤 Customer Info
└─ 💰 Pricing Summary
```

### API Payload Output:
```
🚀 TRANSACTION API PAYLOAD
├─ 📊 Metadata
│   ├─ endpoint: "POST /api/kasir/transaksi"
│   ├─ format: "size-aware"
│   └─ source: "useTransactionForm.submitTransaction"
├─ 📄 Data Payload (Complete JSON)
├─ 📦 Items Summary
├─ 👤 Customer Info
└─ 💰 Pricing Summary
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development          # Enable in development
NEXT_PUBLIC_DEBUG_TRANSACTION=true  # Force enable
```

### Dynamic Configuration
```typescript
import { TransactionLogger } from './transactionLogger'

// Update configuration
TransactionLogger.updateConfig({
  logLevel: 'form-data'  // or 'api-payload' or 'both'
})

// Check if enabled
if (TransactionLogger.isEnabled()) {
  // Log data
}
```

## 🎯 Use Cases

1. **Debugging API calls**: See exact data sent to backend
2. **Data transformation verification**: Track format changes
3. **Development workflow**: Speed up testing and debugging
4. **API contract validation**: Verify request structure
5. **User issue troubleshooting**: Debug specific user submissions

## ⚠️ Security Notes

- **Development only**: Automatically disabled in production
- **No sensitive data**: Logs don't include passwords or tokens
- **Console output**: Only appears in browser console
- **Performance impact**: Minimal overhead when disabled