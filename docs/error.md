## Error Type
Console Error

## Error Message
[DEBUG] Error creating product: {}


    at handleSubmit (features/manage-product/components/form-product/ProductFormPage.tsx:605:15)

## Code Frame
  603 |       // Success redirect for create mode (handled above in the if block)
  604 |     } catch (error) {
> 605 |       console.error(`[DEBUG] Error ${mode === 'add' ? 'creating' : 'updating'} product:`, {
      |               ^
  606 |         error: error,
  607 |         errorMessage: error instanceof Error ? error.message : String(error),
  608 |         formData: formData,

Next.js version: 16.0.10 (Turbopack)


 GET /api/cost-items?limit=100 200 in 988ms (compile: 10ms, proxy.ts: 35ms, render: 943ms)
 POST /api/products 400 in 92ms (compile: 21ms, proxy.ts: 36ms, render: 34ms)
 POST /api/products 400 in 98ms (compile: 23ms, proxy.ts: 55ms, render: 20ms)
 POST /api/products 400 in 148ms (compile: 32ms, proxy.ts: 82ms, render: 34ms)
