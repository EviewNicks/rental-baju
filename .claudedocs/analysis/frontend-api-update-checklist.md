# Frontend Update Checklist: API Synchronization

**Generated:** 2025-10-18
**Scope:** Update `TransactionFormPage.tsx` and related components to sync with RPK-51 Size-Aware API
**Reference:** `/sc:analyze` with `--introspect` and `--seq` flags

---

## 📋 Executive Summary

### Current Status
- **API Backend:** ✅ Fully supports RPK-51 (Size-Aware + Legacy dual-format)
- **Frontend Form:** ❌ Only sends legacy format (missing `productSizeId`)
- **Compatibility:** ⚠️ Works via backward compatibility, but size-aware features INACTIVE

### Impact Assessment
| Component | Status | Priority | Complexity |
|-----------|--------|----------|----------|
| TypeScript Types | ❌ Missing `productSizeId` | 🔴 HIGH | Medium |
| Product Selection | ❌ No size selection UI | 🔴 HIGH | High |
| Transaction Form | ❌ Legacy format only | 🔴 HIGH | Medium |
| Error Handling | ⚠️ Missing size-specific errors | 🟡 MEDIUM | Low |
| API Client | ✅ Already supports both formats | ✅ DONE | N/A |

---

## 🔍 Gap Analysis

### 1. API Contract Comparison

#### Current API Endpoint: `POST /api/kasir/transaksi`

**Supported Request Formats:**

**Format A: Size-Aware (RPK-51)** ✅ API Ready | ❌ Frontend Missing
```typescript
{
  penyewaId: string,
  items: [{
    produkId: string,           // ✅ Frontend sends
    productSizeId: string,      // ❌ Frontend MISSING
    jumlah: number,             // ✅ Frontend sends
    durasi: number,             // ✅ Frontend sends
    kondisiAwal?: string        // ✅ Frontend sends
  }],
  tglMulai: string,             // ✅ Frontend sends
  tglSelesai?: string,          // ✅ Frontend sends
  metodeBayar: 'tunai' | 'transfer' | 'kartu',  // ✅ Frontend sends
  catatan?: string              // ✅ Frontend sends
}
```

**Format B: Legacy (Backward Compatibility)** ✅ API Ready | ✅ Frontend Sends
```typescript
{
  penyewaId: string,
  items: [{
    produkId: string,      // ✅ Frontend sends
    jumlah: number,        // ✅ Frontend sends
    durasi: number,        // ✅ Frontend sends
    kondisiAwal?: string   // ✅ Frontend sends
    // NO productSizeId
  }],
  tglMulai: string,
  tglSelesai?: string,
  metodeBayar: 'tunai' | 'transfer' | 'kartu',
  catatan?: string
}
```

**API Format Detection Logic:**
```typescript
// app/api/kasir/transaksi/route.ts:43
const isSizeAwareRequest = body.items?.some((item: { productSizeId?: string }) => item.productSizeId)

if (isSizeAwareRequest) {
  // Route to size-aware processor
  transaksi = await transaksiService.createTransaksiSizeAware(validatedData)
} else {
  // Route to legacy processor
  transaksi = await transaksiService.createTransaksi(validatedData)
}
```

**Current Frontend Behavior:**
- ❌ ALWAYS triggers legacy processor (no `productSizeId` sent)
- ❌ Size-specific inventory management INACTIVE
- ✅ Backward compatibility prevents errors

---

### 2. TypeScript Types Gap

#### File: `features/kasir/types.ts`

**Current Definition (Line 344-356):**
```typescript
export interface CreateTransaksiRequest {
  penyewaId: string
  items: Array<{
    produkId: string       // ✅ Defined
    jumlah: number         // ✅ Defined
    durasi: number         // ✅ Defined
    kondisiAwal?: string   // ✅ Defined
    // ❌ MISSING: productSizeId?: string
  }>
  tglMulai: string
  tglSelesai?: string
  metodeBayar?: PaymentMethod
  catatan?: string
}
```

**Required Update:**
```typescript
// NEW: Size-Aware Transaction Item Type
export interface CreateTransaksiItemSizeAware {
  produkId: string
  productSizeId: string  // NEW: Required for size-aware
  jumlah: number
  durasi: number
  kondisiAwal?: string
}

// NEW: Legacy Transaction Item Type
export interface CreateTransaksiItemLegacy {
  produkId: string
  jumlah: number
  durasi: number
  kondisiAwal?: string
}

// UPDATED: Support dual-format
export interface CreateTransaksiRequest {
  penyewaId: string
  items: Array<CreateTransaksiItemSizeAware | CreateTransaksiItemLegacy>
  tglMulai: string
  tglSelesai?: string
  metodeBayar?: PaymentMethod
  catatan?: string
}

// HELPER: Type guards for format detection
export function isSizeAwareItem(
  item: CreateTransaksiItemSizeAware | CreateTransaksiItemLegacy
): item is CreateTransaksiItemSizeAware {
  return 'productSizeId' in item && item.productSizeId !== undefined
}
```

#### File: `features/kasir/types.ts` - Product Types

**Current Definition:**
```typescript
export interface Product {
  id: string
  name: string
  category: string
  size: string  // ❌ Just string, no ProductSize relation
  color: string
  pricePerDay: number
  image: string
  available: boolean
  description?: string
  availableQuantity?: number  // ❌ Total only, not per-size
}

export interface ProductSelection {
  product: Product
  quantity: number
  duration: number
  // ❌ MISSING: productSizeId
  // ❌ MISSING: selectedSize info
}
```

**Required Update:**
```typescript
// NEW: ProductSize information from API
export interface ProductSize {
  id: string
  productId: string
  ageCategory: 'ADULT' | 'TEEN' | 'CHILD'
  size: string
  quantity: number
  availableQuantity: number  // Size-specific availability
  rentedStock: number
  createdAt: string
  updatedAt: string
}

// UPDATED: Product with ProductSize support
export interface Product {
  id: string
  name: string
  category: string
  size: string  // Keep for legacy UI display
  color: string
  pricePerDay: number
  image: string
  available: boolean
  description?: string
  availableQuantity?: number  // Keep for legacy total

  // NEW: Size-aware fields
  sizes?: ProductSize[]  // Available sizes for this product
  supportsSizeSelection?: boolean  // Flag for UI to show size selector
}

// UPDATED: ProductSelection with size awareness
export interface ProductSelection {
  product: Product
  quantity: number
  duration: number

  // NEW: Size-aware fields (optional for backward compatibility)
  productSizeId?: string  // Selected size ID
  selectedSize?: ProductSize  // Full size information
}
```

---

### 3. Component Updates Required

#### 3.1 ProductSelectionStep Component

**File:** `features/kasir/components/form/ProductSelectionStep.tsx`

**Current Implementation (Line 65-88):**
```typescript
const handleAddProduct = (product: Product, quantity: number) => {
  const productSelection = {
    product,
    quantity,
    duration: globalDuration,
  }

  try {
    addProduct(productSelection)
    // ❌ No size selection
    // ❌ No productSizeId
  } catch (error) {
    console.error('Failed to add product', error)
  }
}
```

**Required Updates:**

**Step 1: Add Size Selection UI**
```typescript
// NEW: Size selector state
const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

// NEW: Size selection handler
const handleSizeSelect = (productId: string, sizeId: string) => {
  setSelectedSizes(prev => ({
    ...prev,
    [productId]: sizeId
  }))
}

// UPDATED: Add product with size
const handleAddProduct = (product: Product, quantity: number) => {
  const selectedSizeId = selectedSizes[product.id]
  const selectedSize = product.sizes?.find(s => s.id === selectedSizeId)

  // Validation: Require size selection if product supports it
  if (product.supportsSizeSelection && !selectedSizeId) {
    setErrorMessage('Pilih ukuran terlebih dahulu')
    return
  }

  // Validation: Check size-specific availability
  if (selectedSize && selectedSize.availableQuantity < quantity) {
    setErrorMessage(
      `Stok ukuran ${selectedSize.size} tidak mencukupi. ` +
      `Tersedia: ${selectedSize.availableQuantity}, Diminta: ${quantity}`
    )
    return
  }

  const productSelection: ProductSelection = {
    product,
    quantity,
    duration: globalDuration,
    // NEW: Include size information
    productSizeId: selectedSizeId,
    selectedSize: selectedSize,
  }

  try {
    addProduct(productSelection)
    // Clear size selection after adding
    setSelectedSizes(prev => {
      const newSizes = { ...prev }
      delete newSizes[product.id]
      return newSizes
    })
  } catch (error) {
    console.error('Failed to add product', error)
  }
}
```

**Step 2: Add Size Selector UI Component**
```tsx
// NEW: Size selector component
interface SizeSelectorProps {
  product: Product
  selectedSizeId?: string
  onSizeSelect: (sizeId: string) => void
}

function SizeSelector({ product, selectedSizeId, onSizeSelect }: SizeSelectorProps) {
  if (!product.supportsSizeSelection || !product.sizes?.length) {
    return null
  }

  return (
    <div className="mt-2">
      <label className="text-sm font-medium text-gray-700">
        Pilih Ukuran:
      </label>
      <div className="flex gap-2 mt-1">
        {product.sizes.map(size => (
          <button
            key={size.id}
            onClick={() => onSizeSelect(size.id)}
            disabled={size.availableQuantity === 0}
            className={cn(
              "px-3 py-1 rounded-md border transition-colors",
              selectedSizeId === size.id
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-500",
              size.availableQuantity === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="font-medium">{size.size}</span>
            <span className="text-xs ml-1">
              ({size.availableQuantity} tersedia)
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Update ProductCard Component**
```tsx
// Update ProductCard usage in ProductSelectionStep
<ProductCard
  product={product}
  onAddToCart={(quantity) => handleAddProduct(product, quantity)}
  isInCart={isInCart}
  // NEW: Pass size selection state
  selectedSizeId={selectedSizes[product.id]}
  onSizeSelect={(sizeId) => handleSizeSelect(product.id, sizeId)}
/>
```

---

#### 3.2 TransactionFormPage Component

**File:** `features/kasir/components/form/TransactionFormPage.tsx`

**Current Implementation (Line 65-88):**
```typescript
const handleAddProduct = (product: ProductSelection['product'], quantity: number) => {
  const productSelection = {
    product,
    quantity,
    duration: globalDuration,
  }

  try {
    addProduct(productSelection)
  } catch (error) {
    console.error('Failed to add product', error)
  }
}
```

**Required Updates:**

```typescript
// UPDATED: Handle size-aware product addition
const handleAddProduct = (
  product: ProductSelection['product'],
  quantity: number,
  productSizeId?: string,  // NEW: Optional size ID
  selectedSize?: ProductSize  // NEW: Optional size info
) => {
  const productSelection: ProductSelection = {
    product,
    quantity,
    duration: globalDuration,
    // NEW: Include size information if provided
    productSizeId,
    selectedSize,
  }

  try {
    addProduct(productSelection)

    // NEW: Log size-aware addition for debugging
    if (productSizeId) {
      console.log('Size-aware product added', {
        productId: product.id,
        productName: product.name,
        size: selectedSize?.size,
        quantity,
        availableStock: selectedSize?.availableQuantity,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Failed to add product', {
      productId: product.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
```

---

#### 3.3 useTransactionForm Hook

**File:** `features/kasir/hooks/useTransactionForm.ts`

**Current Implementation (Line 188-203):**
```typescript
const submitTransaction = useCallback(async () => {
  setIsSubmitting(true)
  try {
    // Transform form data to API format
    const createRequest: CreateTransaksiRequest = {
      penyewaId: formData.customer?.id || '',
      items: formData.products.map((product) => ({
        produkId: product.product.id,
        jumlah: product.quantity,
        durasi: globalDuration,
        kondisiAwal: 'baik',
        // ❌ MISSING: productSizeId
      })),
      tglMulai: convertDateToISODateTime(formData.pickupDate),
      tglSelesai: formData.returnDate ? convertDateToISODateTime(formData.returnDate) : undefined,
      metodeBayar: /* ... */,
      catatan: formData.notes || undefined,
    }

    const createdTransaction = await createTransaksiMutation.mutateAsync(createRequest)
    // ...
  } catch (error) {
    // ...
  }
}, [/* deps */])
```

**Required Updates:**

```typescript
const submitTransaction = useCallback(async () => {
  setIsSubmitting(true)
  try {
    // UPDATED: Transform form data with size awareness
    const createRequest: CreateTransaksiRequest = {
      penyewaId: formData.customer?.id || '',
      items: formData.products.map((product) => {
        // Base item data
        const baseItem = {
          produkId: product.product.id,
          jumlah: product.quantity,
          durasi: globalDuration,
          kondisiAwal: 'baik',
        }

        // NEW: Add productSizeId if available (size-aware format)
        if (product.productSizeId) {
          return {
            ...baseItem,
            productSizeId: product.productSizeId,
          } as CreateTransaksiItemSizeAware
        }

        // Return legacy format if no size selected
        return baseItem as CreateTransaksiItemLegacy
      }),
      tglMulai: convertDateToISODateTime(formData.pickupDate),
      tglSelesai: formData.returnDate ? convertDateToISODateTime(formData.returnDate) : undefined,
      metodeBayar:
        formData.paymentMethod === 'cash'
          ? 'tunai'
          : formData.paymentMethod === 'transfer'
            ? 'transfer'
            : 'kartu',
      catatan: formData.notes || undefined,
    }

    // NEW: Log format detection for debugging
    const hasSizeAwareItems = createRequest.items.some(isSizeAwareItem)
    console.log('Transaction submission format', {
      formatType: hasSizeAwareItems ? 'size-aware' : 'legacy',
      totalItems: createRequest.items.length,
      sizeAwareItems: createRequest.items.filter(isSizeAwareItem).length,
      legacyItems: createRequest.items.filter(item => !isSizeAwareItem(item)).length,
      timestamp: new Date().toISOString(),
    })

    // Create transaction via API (auto-detects format)
    const createdTransaction = await createTransaksiMutation.mutateAsync(createRequest)

    // ... rest of the code
  } catch (error) {
    // UPDATED: Enhanced error handling for size-aware errors
    const errorMessage = error instanceof Error ? error.message : String(error)

    // NEW: Handle size-specific errors
    if (errorMessage.includes('ProductSize') || errorMessage.includes('ukuran')) {
      console.error('Size-aware transaction error', {
        errorType: 'SIZE_VALIDATION_ERROR',
        errorMessage,
        timestamp: new Date().toISOString(),
      })
      // Set user-friendly error message
      setErrorMessage(
        'Terjadi kesalahan dengan ukuran produk yang dipilih. ' +
        'Periksa ketersediaan stok per ukuran.'
      )
      return false
    }

    // ... existing error handling
  } finally {
    setIsSubmitting(false)
  }
}, [/* deps */])
```

---

#### 3.4 ProductCard UI Component

**File:** `features/kasir/components/ui/product-card.tsx`

**Required Updates:**

Add size selector integration to ProductCard component:

```tsx
interface ProductCardProps {
  product: Product
  onAddToCart: (quantity: number) => void
  isInCart?: boolean
  // NEW: Size selection props
  selectedSizeId?: string
  onSizeSelect?: (sizeId: string) => void
}

export function ProductCard({
  product,
  onAddToCart,
  isInCart,
  selectedSizeId,
  onSizeSelect,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)

  // NEW: Calculate max quantity based on selected size or total
  const maxQuantity = useMemo(() => {
    if (selectedSizeId && product.sizes) {
      const selectedSize = product.sizes.find(s => s.id === selectedSizeId)
      return selectedSize?.availableQuantity || 0
    }
    return product.availableQuantity || 0
  }, [selectedSizeId, product])

  // NEW: Validate quantity against size-specific availability
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > maxQuantity) {
      setQuantity(maxQuantity)
    } else if (newQuantity < 1) {
      setQuantity(1)
    } else {
      setQuantity(newQuantity)
    }
  }

  return (
    <div className="product-card">
      {/* Product image, name, price, etc. */}

      {/* NEW: Size selector (if product supports it) */}
      {product.supportsSizeSelection && product.sizes && onSizeSelect && (
        <div className="mt-3">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Pilih Ukuran:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {product.sizes.map(size => (
              <button
                key={size.id}
                onClick={() => onSizeSelect(size.id)}
                disabled={size.availableQuantity === 0}
                className={cn(
                  "px-2 py-1.5 text-sm rounded border transition-all",
                  selectedSizeId === size.id
                    ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400",
                  size.availableQuantity === 0 && "opacity-40 cursor-not-allowed bg-gray-50"
                )}
              >
                <div className="font-medium">{size.size}</div>
                <div className="text-xs opacity-75">
                  {size.availableQuantity > 0
                    ? `${size.availableQuantity} pcs`
                    : 'Habis'
                  }
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity selector */}
      <div className="mt-3 flex items-center gap-3">
        <label className="text-sm font-medium">Jumlah:</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="p-1 rounded border hover:bg-gray-100"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            min={1}
            max={maxQuantity}
            className="w-16 text-center border rounded px-2 py-1"
          />
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= maxQuantity}
            className="p-1 rounded border hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm text-gray-500">
          (Maks: {maxQuantity})
        </span>
      </div>

      {/* Add to cart button */}
      <button
        onClick={() => onAddToCart(quantity)}
        disabled={
          isInCart ||
          maxQuantity === 0 ||
          (product.supportsSizeSelection && !selectedSizeId)
        }
        className="mt-3 w-full btn btn-primary"
      >
        {isInCart ? (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sudah di Keranjang
          </>
        ) : product.supportsSizeSelection && !selectedSizeId ? (
          'Pilih Ukuran Terlebih Dahulu'
        ) : maxQuantity === 0 ? (
          'Stok Habis'
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Tambah ke Keranjang
          </>
        )}
      </button>
    </div>
  )
}
```

---

#### 3.5 PaymentSummaryStep Component

**File:** `features/kasir/components/form/PaymentSummaryStep.tsx`

**Required Updates:**

Display size information in order summary:

```tsx
// UPDATED: Show size info in order summary
{formData.products.map((item, index) => (
  <div key={index} className="flex justify-between items-start py-3 border-b">
    <div className="flex-1">
      <h4 className="font-medium text-gray-900">
        {item.product.name}
      </h4>

      {/* NEW: Show selected size info */}
      {item.selectedSize && (
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-medium">Ukuran:</span> {item.selectedSize.size}
          {' '}
          <span className="text-gray-500">
            ({item.selectedSize.ageCategory})
          </span>
        </p>
      )}

      <p className="text-sm text-gray-500 mt-1">
        {item.quantity} x {formatCurrency(item.product.pricePerDay)} x {duration} hari
      </p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900">
        {formatCurrency(item.product.pricePerDay * item.quantity * duration)}
      </p>
    </div>
  </div>
))}
```

---

### 4. Error Handling Updates

#### File: `features/kasir/components/form/TransactionFormPage.tsx`

**Current Error Handling:**
```typescript
// Generic error message
setErrorMessage('Terjadi kesalahan saat membuat transaksi')
```

**Required Updates:**

```typescript
// UPDATED: Size-aware error handling
const handleSubmitTransaction = async () => {
  setErrorMessage(null)

  const success = await submitTransaction()

  if (!success) {
    if (createError) {
      // NEW: Map API error codes to user-friendly messages
      const errorCode = createError.code
      const errorMessage = createError.message

      switch (errorCode) {
        case 'NOT_FOUND':
          if (errorMessage.includes('ProductSize')) {
            setErrorMessage(
              'Ukuran produk yang dipilih tidak ditemukan. ' +
              'Silakan refresh halaman dan pilih ulang.'
            )
          } else if (errorMessage.includes('Penyewa')) {
            setErrorMessage('Data pelanggan tidak ditemukan.')
          } else {
            setErrorMessage(errorMessage)
          }
          break

        case 'AVAILABILITY_ERROR':
          if (errorMessage.includes('ukuran') || errorMessage.includes('size')) {
            setErrorMessage(
              'Stok untuk ukuran yang dipilih tidak mencukupi. ' +
              'Silakan pilih ukuran lain atau kurangi jumlah.'
            )
          } else {
            setErrorMessage(
              'Stok produk tidak mencukupi. ' +
              'Silakan kurangi jumlah atau pilih produk lain.'
            )
          }
          break

        case 'VALIDATION_ERROR':
          const validationDetails = createError.validationErrors
          if (validationDetails && validationDetails.length > 0) {
            const firstError = validationDetails[0]
            if (firstError.field.includes('productSizeId')) {
              setErrorMessage(
                `Ukuran produk tidak valid: ${firstError.message}`
              )
            } else {
              setErrorMessage(firstError.message)
            }
          } else {
            setErrorMessage('Data transaksi tidak valid.')
          }
          break

        default:
          setErrorMessage(errorMessage || 'Terjadi kesalahan saat membuat transaksi')
      }
    } else {
      setErrorMessage('Terjadi kesalahan tidak terduga. Silakan coba lagi.')
    }
  }

  return success
}
```

---

### 5. API Client Updates

#### File: `features/kasir/api.ts`

**Status:** ✅ Already Supports Both Formats

The API client is already prepared for dual-format support. No changes needed.

**Verification:**
```typescript
// Existing implementation supports both formats
static async createTransaksi(data: CreateTransaksiRequest): Promise<TransaksiResponse> {
  return apiRequest<TransaksiResponse>('/transaksi', {
    method: 'POST',
    body: JSON.stringify(data),  // Accepts both size-aware and legacy
  })
}
```

---

### 6. Data Fetching Updates

#### File: `features/kasir/hooks/useProduk.ts`

**Required Updates:**

Update product fetching to include ProductSize data:

```typescript
// CURRENT: Basic product fetch
export function useAvailableProducts(params: ProductAvailabilityQueryParams = {}) {
  return useQuery({
    queryKey: ['kasir', 'produk', 'available', params],
    queryFn: async () => {
      const result = await kasirApi.produk.getAvailable(params)
      return result
    },
    staleTime: 10 * 1000,
    gcTime: 2 * 30 * 1000,
  })
}

// UPDATED: Fetch products WITH size information
export function useAvailableProductsWithSizes(params: ProductAvailabilityQueryParams = {}) {
  return useQuery({
    queryKey: ['kasir', 'produk', 'available-with-sizes', params],
    queryFn: async () => {
      const result = await kasirApi.produk.getAvailable({
        ...params,
        includeSizes: true,  // NEW: Request size data
      })

      // Transform API response to include size support flag
      return {
        ...result,
        data: result.data.map(product => ({
          ...product,
          supportsSizeSelection: Boolean(product.sizes && product.sizes.length > 0),
        })),
      }
    },
    staleTime: 10 * 1000,
    gcTime: 2 * 30 * 1000,
  })
}
```

---

## 📝 Implementation Checklist

### Phase 1: Types & Interfaces (Priority: 🔴 HIGH)

- [ ] **1.1** Update `CreateTransaksiRequest` interface in `features/kasir/types.ts`
  - Add `CreateTransaksiItemSizeAware` interface
  - Add `CreateTransaksiItemLegacy` interface
  - Update `CreateTransaksiRequest` to support dual-format items
  - Add `isSizeAwareItem()` type guard function

- [ ] **1.2** Update `Product` interface in `features/kasir/types.ts`
  - Add `ProductSize` interface
  - Add `sizes?: ProductSize[]` field
  - Add `supportsSizeSelection?: boolean` field

- [ ] **1.3** Update `ProductSelection` interface in `features/kasir/types.ts`
  - Add `productSizeId?: string` field
  - Add `selectedSize?: ProductSize` field

### Phase 2: Data Layer (Priority: 🔴 HIGH)

- [ ] **2.1** Update API client in `features/kasir/api.ts` (if needed)
  - Verify dual-format support
  - Add query parameter for `includeSizes` in product fetch

- [ ] **2.2** Update `useProduk.ts` hook
  - Add `useAvailableProductsWithSizes` hook
  - Transform API response to include `supportsSizeSelection` flag

- [ ] **2.3** Update `useTransactionForm.ts` hook
  - Modify `submitTransaction` to include `productSizeId` when available
  - Add format detection logging
  - Update error handling for size-specific errors

### Phase 3: UI Components (Priority: 🔴 HIGH)

- [ ] **3.1** Update `ProductSelectionStep.tsx`
  - Add size selector state management
  - Create `SizeSelector` component
  - Update `handleAddProduct` to accept size parameters
  - Add size-specific availability validation
  - Update error messages for size conflicts

- [ ] **3.2** Update `ProductCard.tsx`
  - Add `selectedSizeId` and `onSizeSelect` props
  - Integrate size selector UI
  - Calculate max quantity based on selected size
  - Update quantity validation
  - Update button states for size requirement

- [ ] **3.3** Update `TransactionFormPage.tsx`
  - Update `handleAddProduct` signature to accept size params
  - Add size-aware logging
  - Update error handling

- [ ] **3.4** Update `PaymentSummaryStep.tsx`
  - Display selected size information in order summary
  - Show size-specific pricing breakdown

### Phase 4: Error Handling (Priority: 🟡 MEDIUM)

- [ ] **4.1** Update error handling in `TransactionFormPage.tsx`
  - Map API error codes to user-friendly messages
  - Handle `NOT_FOUND` for ProductSize
  - Handle `AVAILABILITY_ERROR` for size-specific stock
  - Handle `VALIDATION_ERROR` for productSizeId

- [ ] **4.2** Add error notifications
  - Size selection required notification
  - Size stock insufficient notification
  - Invalid size selection notification

### Phase 5: Testing & Validation (Priority: 🟡 MEDIUM)

- [ ] **5.1** Manual testing
  - Test size-aware product addition
  - Test legacy product addition (no sizes)
  - Test mixed cart (size-aware + legacy)
  - Test size-specific stock validation
  - Test error scenarios

- [ ] **5.2** E2E testing (if applicable)
  - Create E2E test for size-aware transaction flow
  - Test backward compatibility with legacy products

### Phase 6: Documentation (Priority: 🟢 LOW)

- [ ] **6.1** Update component documentation
  - Document new props in ProductCard
  - Document size selection workflow
  - Update API integration docs

- [ ] **6.2** Update README (if exists in component folders)
  - Document ProductSize integration
  - Add troubleshooting guide for size-related errors

---

## 🔧 Implementation Order Recommendation

### Step 1: Foundation (Day 1)
1. Update TypeScript types (`features/kasir/types.ts`)
2. Update API client if needed (`features/kasir/api.ts`)
3. Update data fetching hook (`features/kasir/hooks/useProduk.ts`)

### Step 2: Core Logic (Day 2)
1. Update `useTransactionForm` hook
2. Update `ProductSelectionStep` component
3. Add size selector state management

### Step 3: UI Components (Day 3)
1. Update `ProductCard` component with size selector UI
2. Update `TransactionFormPage` component
3. Update `PaymentSummaryStep` component

### Step 4: Error Handling & Polish (Day 4)
1. Implement comprehensive error handling
2. Add user-friendly error messages
3. Test all error scenarios

### Step 5: Testing & Documentation (Day 5)
1. Manual testing of all scenarios
2. E2E testing (if applicable)
3. Update documentation

---

## 🎯 Migration Strategy

### Strategy: Graceful Enhancement (Recommended)

**Approach:** Add size-aware support while maintaining legacy compatibility

**Benefits:**
- ✅ No breaking changes to existing functionality
- ✅ Gradual rollout possible
- ✅ Backward compatible with products without sizes
- ✅ Easy rollback if issues arise

**Implementation:**
1. All new fields are **optional** (`productSizeId?`, `selectedSize?`)
2. UI conditionally shows size selector (`if (product.supportsSizeSelection)`)
3. API automatically detects format (size-aware vs legacy)
4. Form works with both types of products in same cart

**Example Mixed Cart:**
```typescript
cart = [
  {
    product: { id: '1', name: 'Baju A', supportsSizeSelection: true },
    quantity: 2,
    productSizeId: 'size-123',  // Size-aware
    selectedSize: { size: 'M', availableQuantity: 10 }
  },
  {
    product: { id: '2', name: 'Baju B', supportsSizeSelection: false },
    quantity: 1,
    // No productSizeId - Legacy format
  }
]

// API Request:
{
  items: [
    { produkId: '1', productSizeId: 'size-123', jumlah: 2, durasi: 3 },  // Size-aware
    { produkId: '2', jumlah: 1, durasi: 3 }  // Legacy
  ]
}

// API auto-detects: MIXED format → processes accordingly
```

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Include productSizeId
**Problem:** Adding products without size selection when `supportsSizeSelection` is true

**Solution:**
```typescript
// Validation before adding to cart
if (product.supportsSizeSelection && !selectedSizeId) {
  throw new Error('Size selection required')
}
```

### Pitfall 2: Not Validating Size-Specific Stock
**Problem:** Allowing quantity that exceeds size-specific availability

**Solution:**
```typescript
// Check size-specific availability
const maxQuantity = selectedSize?.availableQuantity || product.availableQuantity || 0
if (quantity > maxQuantity) {
  throw new Error(`Max quantity for size ${selectedSize.size}: ${maxQuantity}`)
}
```

### Pitfall 3: UI State Sync Issues
**Problem:** Size selection state not clearing after adding to cart

**Solution:**
```typescript
// Clear size selection after successful addition
setSelectedSizes(prev => {
  const newSizes = { ...prev }
  delete newSizes[product.id]
  return newSizes
})
```

### Pitfall 4: Error Message Confusion
**Problem:** Generic error messages for size-specific issues

**Solution:**
```typescript
// Map error codes to specific messages
if (errorCode === 'AVAILABILITY_ERROR' && errorMessage.includes('ukuran')) {
  return 'Stok ukuran yang dipilih tidak mencukupi'
}
```

---

## 📊 Validation Checklist

Before marking implementation complete, verify:

### Functional Requirements
- [ ] Size selector appears for products with `supportsSizeSelection: true`
- [ ] Size selector hidden for products without size support
- [ ] `productSizeId` included in API request when size selected
- [ ] Legacy format used when no size selected
- [ ] Mixed cart (size-aware + legacy) works correctly
- [ ] Size-specific stock validation prevents overbooking
- [ ] Error messages are user-friendly and specific

### UI/UX Requirements
- [ ] Size selector is visually clear and intuitive
- [ ] Disabled sizes show "Habis" or similar indicator
- [ ] Selected size is visually highlighted
- [ ] Quantity input max value updates based on selected size
- [ ] Order summary shows selected size information
- [ ] Error notifications are dismissible and clear

### Data Integrity
- [ ] Type safety maintained throughout
- [ ] No TypeScript errors in updated files
- [ ] Optional fields properly handled (no undefined crashes)
- [ ] API request format matches backend expectations
- [ ] Response data properly typed and accessed

### Performance
- [ ] No unnecessary re-renders from size selector state
- [ ] Product list caching still works
- [ ] Query invalidation works correctly after transaction

---

## 📖 References

### Documentation Files
- [Transaction Form Dependencies Analysis](./transaction-form-dependencies.md)
- [API Documentation](../api/kasir-api.json)
- [Postman Test Collection](../../docs/api/kasir/transaksi.json)

### Related API Endpoints
- `POST /api/kasir/transaksi` - Create transaction (dual-format support)
- `GET /api/kasir/produk/available` - Get available products (with sizes)

### Backend Implementations
- `app/api/kasir/transaksi/route.ts:43` - Format detection logic
- `features/kasir/services/transaksiService.ts` - Size-aware processor
- `features/kasir/lib/validation/kasirSchema.ts` - Validation schemas

### Frontend Files to Update
1. `features/kasir/types.ts` - Type definitions
2. `features/kasir/hooks/useTransactionForm.ts` - Transaction logic
3. `features/kasir/hooks/useProduk.ts` - Product fetching
4. `features/kasir/components/form/TransactionFormPage.tsx` - Main form
5. `features/kasir/components/form/ProductSelectionStep.tsx` - Product selection
6. `features/kasir/components/ui/product-card.tsx` - Product card UI
7. `features/kasir/components/form/PaymentSummaryStep.tsx` - Order summary

---

**Last Updated:** 2025-10-18
**Status:** Analysis Complete | Ready for Implementation
**Next Action:** Review checklist with team → Implement Phase 1
