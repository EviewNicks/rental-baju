## Error Type
Console Error

# features/kasir/hooks/useTransaksi.ts (101:15) @ useCreateTransaksi.useMutation [as onError]

## Error Message
Failed to create transaksi: "Size M (ADULT) untuk Jas Jaguar Abu tidak tersedia untuk periode 25/12/2025 - 28/12/2025. Tersedia: 2, Diminta: 4. Konflik dengan transaksi: TXN-20251222-001"


    at useCreateTransaksi.useMutation [as onError] (features/kasir/hooks/useTransaksi.ts:101:15)
    at async useTransactionForm.useCallback[submitTransaction] (features/kasir/hooks/useTransactionForm.ts:312:34)
    at async handleSubmitTransaction (features/kasir/components/form/TransactionFormPage.tsx:131:21)
    at async handleSubmit (features/kasir/components/form/PaymentSummaryStep.tsx:176:21)

## Code Frame
   99 |     onError: (error: KasirApiError) => {
  100 |       // Error will be handled by the component
> 101 |       console.error('Failed to create transaksi:', error.message)
      |               ^
  102 |       
  103 |       // Enhanced error logging for cache-related issues
  104 |       if (error.message.includes('tidak mencukupi') || error.message.includes('Tersedia')) {

Next.js version: 16.0.10 (Turbopack)



# features/kasir/hooks/useTransactionForm.ts (409:17) @ useTransactionForm.useCallback[submitTransaction]

## Error Type
Console Error

## Error Message
❌ Transaction creation failed! {} "useTransactionForm"


    at useTransactionForm.useCallback[submitTransaction] (features/kasir/hooks/useTransactionForm.ts:409:17)
    at async handleSubmitTransaction (features/kasir/components/form/TransactionFormPage.tsx:131:21)
    at async handleSubmit (features/kasir/components/form/PaymentSummaryStep.tsx:176:21)

## Code Frame
  407 |         )
  408 |       } else {
> 409 |         console.error(
      |                 ^
  410 |           '❌ Transaction creation failed!',
  411 |           {
  412 |             errorType: 'TRANSACTION_FAILURE',

Next.js version: 16.0.10 (Turbopack)

# features/kasir/api.ts (332:13) @ apiRequest

## Error Type
Console KasirApiError

## Error Message
Size M (ADULT) untuk Jas Jaguar Abu tidak tersedia untuk periode 25/12/2025 - 28/12/2025. Tersedia: 2, Diminta: 4. Konflik dengan transaksi: TXN-20251222-001


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


# features/kasir/components/form/TransactionFormPage.tsx (149:15) @ handleSubmitTransaction


## Error Type
Console Error

## Error Message
❌ Transaction submission failed {}


    at handleSubmitTransaction (features/kasir/components/form/TransactionFormPage.tsx:149:15)
    at async handleSubmit (features/kasir/components/form/PaymentSummaryStep.tsx:176:21)

## Code Frame
  147 |       }
  148 |
> 149 |       console.error('❌ Transaction submission failed', errorDetails)
      |               ^
  150 |
  151 |       // Show error message based on the type of error
  152 |       if (createError) {

Next.js version: 16.0.10 (Turbopack)
