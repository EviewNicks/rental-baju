# Kasir Feature Documentation

## Overview

Fitur Kasir menyediakan sistem manajemen transaksi rental yang komprehensif dengan kemampuan tracking inventory, processing payments, dan managing customer data.

## Core Features

### 1. Transaction Management
- **Create Transactions**: Pembuatan transaksi rental baru
- **Transaction Processing**: Update status dan pembayaran
- **Transaction History**: Tracking aktivitas transaksi
- **Multi-role Support**: Owner, Producer, Kasir access levels

### 2. Item Pickup System
- **Pickup Processing**: Pengambilan item oleh customer
- **Quantity Tracking**: Monitor item availability
- **Error Handling**: Robust error management dengan detailed logging
- **User-friendly Interface**: Clear error messages dan recovery options

### 3. Product Management
- **Inventory Tracking**: Monitor product availability
- **Category Management**: Organize produk by category
- **Status Management**: Available, Rented, Maintenance tracking

## Architecture

### Layer Structure
```
features/kasir/
├── components/          # UI Components (Presentation Layer)
│   ├── detail/         # Transaction detail components
│   ├── form/           # Transaction form components
│   └── list/           # Transaction list components
├── hooks/              # Business Logic + State Management
├── services/           # Business Logic (Server-side CRUD)
├── api.ts              # API client/fetcher for this feature
├── types/              # TypeScript types & schemas
├── lib/                # Validation and utilities
│   ├── validation/     # Schema validation
│   └── utils/          # Helper functions
└── context/            # Global state (when needed)
```

### Key Services

#### PickupService
- **Location**: `services/pickupService.ts`
- **Purpose**: Handle pickup operations dengan comprehensive error handling
- **Features**:
  - Transaction validation
  - Atomic database operations
  - Structured error logging
  - Business rule enforcement

#### TransaksiService
- **Location**: `services/transaksiService.ts`
- **Purpose**: Core transaction management
- **Features**:
  - CRUD operations
  - Status management
  - Payment processing
  - Activity tracking

## Error Handling Strategy

### Comprehensive Error Management

Fitur Kasir mengimplementasi error handling yang robust dengan:

1. **Service Layer Error Handling**
   - Proper error catching dengan detailed context
   - Structured logging untuk debugging
   - User-friendly error messages
   - Error classification (database, validation, business logic)

2. **API Layer Enhancement**
   - Request correlation ID tracking
   - Enhanced error logging
   - Consistent error response format
   - Performance monitoring

3. **Frontend Error Display**
   - Enhanced error UI dengan actionable steps
   - Error classification (recoverable/fatal/permission)
   - Contextual help tips
   - Retry mechanisms

### Error Categories

| Category | Handling Strategy | User Message |
|----------|------------------|--------------|
| Database Connection | Retry with exponential backoff | "Database sedang sibuk. Silakan coba lagi." |
| Data Conflict | Refresh resolution | "Item mungkin telah diambil. Refresh halaman." |
| Permission Denied | Contact admin guidance | "Hubungi administrator untuk akses." |
| Validation Error | Field-specific guidance | "Periksa kembali data input." |
| System Error | Generic retry option | "Terjadi kesalahan. Coba lagi." |

## API Endpoints

### Transaction Management
- `GET /api/kasir/transaksi` - List transactions dengan pagination
- `GET /api/kasir/transaksi/[kode]` - Get transaction detail
- `POST /api/kasir/transaksi` - Create new transaction
- `PATCH /api/kasir/transaksi/[kode]` - Update transaction

### Pickup Operations
- `PATCH /api/kasir/transaksi/[kode]/ambil` - Process item pickup
- **Request Body**:
  ```json
  {
    "items": [
      {
        "id": "transaksi-item-id",
        "jumlahDiambil": 2
      }
    ],
    "catatan": "Optional pickup notes"
  }
  ```

### Product Availability
- `GET /api/kasir/produk/available` - Check available products

## Validation Schemas

### Pickup Request
```typescript
interface PickupRequest {
  items: PickupItemRequest[]
  catatan?: string
}

interface PickupItemRequest {
  id: string // UUID
  jumlahDiambil: number // 1-999
}
```

### Transaction Request
```typescript
interface CreateTransaksiRequest {
  penyewaId: string
  items: TransaksiItemRequest[]
  tglMulai: string
  tglSelesai: string
  catatan?: string
}
```

## Testing Strategy

### Test Coverage
- **Unit Tests**: Service layer logic dan validation
- **Integration Tests**: API endpoints dan database operations
- **E2E Tests**: Complete user flows dengan Playwright

### Key Test Scenarios
1. **Error Handling**: Berbagai error scenarios dan recovery
2. **Data Validation**: Input validation dan business rules
3. **Transaction Integrity**: Atomic operations dan rollback
4. **User Experience**: Error states dan feedback mechanisms

## Performance Considerations

### Database Optimization
- Proper indexing untuk frequently queried fields
- Connection pooling management
- Query optimization untuk large datasets

### Frontend Performance
- React Query untuk caching dan state management
- Lazy loading untuk large lists
- Optimistic updates untuk better UX

### Error Handling Performance
- Asynchronous logging untuk non-blocking operations
- Structured logging format untuk efficient parsing
- Error rate monitoring dan alerting

## Security Considerations

### Input Validation
- Zod schema validation untuk semua inputs
- Sanitization user input data
- SQL injection prevention melalui Prisma ORM

### Permission Management
- Role-based access control (RBAC)
- API endpoint protection
- User action audit trails

### Error Information Security
- Sanitized error messages untuk prevent information leakage
- No sensitive data di error logs
- Secure error reporting mechanisms

## Monitoring & Observability

### Logging Strategy
- Structured JSON logging
- Correlation ID tracking
- Error categorization
- Performance metrics

### Key Metrics
- Transaction success rate
- Error rate by category
- Processing time distribution
- User interaction patterns

### Alert Configuration
- High error rate alerts
- Database connection issues
- Performance degradation
- Security event monitoring

## Best Practices

### Code Organization
- Feature-first architecture
- Separation of concerns
- Clear dependency management
- Consistent naming conventions

### Error Handling
- Fail fast dengan clear error messages
- Comprehensive logging dengan context
- User-friendly error recovery options
- Graceful degradation strategies

### Testing
- TDD approach untuk new features
- Comprehensive error scenario testing
- Integration testing untuk critical paths
- E2E testing untuk user workflows

## Recent Updates

### Error Handling Enhancement (2025-10-18)
**Improvements:**
- ✅ Enhanced error handling di `PickupService` dengan detailed context logging
- ✅ API layer correlation ID tracking untuk better debugging
- ✅ Frontend error display dengan actionable recovery steps
- ✅ Comprehensive error classification system
- ✅ Structured logging format untuk monitoring
- ✅ Test suite untuk error scenarios coverage

**Files Modified:**
- `services/pickupService.ts` - Enhanced error handling
- `app/api/kasir/transaksi/[kode]/ambil/route.ts` - API logging improvements
- `components/detail/PickupModal.tsx` - Better error UI
- `hooks/usePickupProcess.ts` - Error message processing
- `docs/kasir/error-handling-guide.md` - Comprehensive documentation

## Development Guidelines

### When Adding New Features
1. Follow existing error handling patterns
2. Add comprehensive logging dengan context
3. Create appropriate test cases
4. Update documentation
5. Consider error scenarios dan edge cases

### When Modifying Existing Features
1. Maintain backward compatibility
2. Update error handling jika needed
3. Add regression tests
4. Update documentation
5. Test error scenarios thoroughly

## Troubleshooting

### Common Issues
1. **Generic Errors**: Check error handling implementation
2. **Missing Logs**: Verify logging configuration
3. **Poor UX**: Review error message clarity
4. **Performance Issues**: Check database queries dan logging overhead

### Debugging Tools
- Structured logs searching
- Correlation ID tracking
- Error pattern analysis
- Performance monitoring dashboards

---

*Last Updated: 2025-10-18*
*Feature Owner: Kasir Development Team*