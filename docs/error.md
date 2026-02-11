🚨 [ERROR] Enhanced Transaction Creation Failed: {
  message: 'Stok tidak mencukupi: Produk size L (ADULT) untuk Jas Jaguar Abu: shortage 2. Konflik dengan transaksi: TXN-20260209-002, TXN-20260210-003, TXN-20260210-004',
  itemCount: 1,
  penyewaId: '3704d273-299c-4ebc-800b-faed79ed332c',
  discountType: undefined,
  discountValue: undefined,
  totalAmount: '300000'
}
 POST /api/kasir/transaksi 409 in 18.4s (compile: 21ms, proxy.ts: 65ms, render: 18.3s)



## Error Type
Console Error

## Error Message
Failed to create transaksi: "Stok Produk tidak mencukupi. Tersedia: 0, Diminta: 0."


    at useCreateTransaksi.useMutation [as onError] (features/kasir/hooks/useTransaksi.ts:101:15)
    at async useTransactionForm.useCallback[submitTransaction] (features/kasir/hooks/useTransactionForm.ts:403:34)
    at async handleSubmitTransaction (features/kasir/components/form/TransactionFormPage.tsx:142:23)
    at async PaymentSummaryStep.useCallback[handleSubmit] (features/kasir/components/form/PaymentSummaryStep.tsx:144:23)

## Code Frame
   99 |     onError: (error: KasirApiError) => {
  100 |       // ✅ FIX: Enhanced error logging with detailed message preservation
> 101 |       console.error('Failed to create transaksi:', error.message)
      |               ^
  102 |       
  103 |       // Enhanced error logging for cache-related issues
  104 |       if (error.message.includes('tidak mencukupi') || error.message.includes('Tersedia')) {

Next.js version: 16.0.10 (Turbopack)


## Error Type
Console Error

## Error Message
[useTransaksi] Detailed error information: {}


    at useCreateTransaksi.useMutation [as onError] (features/kasir/hooks/useTransaksi.ts:121:15)
    at async useTransactionForm.useCallback[submitTransaction] (features/kasir/hooks/useTransactionForm.ts:403:34)
    at async handleSubmitTransaction (features/kasir/components/form/TransactionFormPage.tsx:142:23)
    at async PaymentSummaryStep.useCallback[handleSubmit] (features/kasir/components/form/PaymentSummaryStep.tsx:144:23)

## Code Frame
  119 |
  120 |       // ✅ FIX: Log detailed error information for debugging
> 121 |       console.error('[useTransaksi] Detailed error information:', {
      |               ^
  122 |         code: error.code,
  123 |         message: error.message,
  124 |         details: error.details,

Next.js version: 16.0.10 (Turbopack)


## Error Type
Console Error

## Error Message
❌ Transaction creation failed! {} "useTransactionForm"


    at useTransactionForm.useCallback[submitTransaction] (features/kasir/hooks/useTransactionForm.ts:495:17)
    at async handleSubmitTransaction (features/kasir/components/form/TransactionFormPage.tsx:142:23)
    at async PaymentSummaryStep.useCallback[handleSubmit] (features/kasir/components/form/PaymentSummaryStep.tsx:144:23)

## Code Frame
  493 |         )
  494 |       } else {
> 495 |         console.error(
      |                 ^
  496 |           '❌ Transaction creation failed!',
  497 |           {
  498 |             errorType: 'TRANSACTION_FAILURE',

Next.js version: 16.0.10 (Turbopack)


## Error Type
Console KasirApiError

## Error Message
Stok Produk tidak mencukupi. Tersedia: 0, Diminta: 0.


    at apiRequest (features/kasir/api.ts:332:13)

## Code Frame
  330 |       }
  331 |
> 332 |       throw new KasirApiError(
      |             ^
  333 |         error.code,
  334 |         error.message,
  335 |         error.details,

Next.js version: 16.0.10 (Turbopack)

## Error Type
Console KasirApiError

## Error Message
Stok Produk tidak mencukupi. Tersedia: 0, Diminta: 0.


    at apiRequest (features/kasir/api.ts:332:13)

## Code Frame
  330 |       }
  331 |
> 332 |       throw new KasirApiError(
      |             ^
  333 |         error.code,
  334 |         error.message,
  335 |         error.details,

Next.js version: 16.0.10 (Turbopack)

## Error Type
Console Error

## Error Message
❌ Transaction submission failed {}


    at handleSubmitTransaction (features/kasir/components/form/TransactionFormPage.tsx:172:17)
    at async PaymentSummaryStep.useCallback[handleSubmit] (features/kasir/components/form/PaymentSummaryStep.tsx:144:23)

## Code Frame
  170 |         }
  171 |
> 172 |         console.error('❌ Transaction submission failed', errorDetails)
      |                 ^
  173 |
  174 |         // Show error toast using backend error response
  175 |         showApiError(createError)

Next.js version: 16.0.10 (Turbopack)
