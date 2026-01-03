## Error Type
Console Error

## Error Message
Cancel transaction API call failed {}


    at useCancelTransaction.useMutation[cancelMutation] [as onError] (features/kasir/hooks/useCancelTransaction.ts:101:15)

## Code Frame
   99 |     },
  100 |     onError: (error) => {
> 101 |       console.error('Cancel transaction API call failed', {
      |               ^
  102 |         transactionCode: transactionCode,
  103 |         error: error.message,
  104 |         errorName: error.name,

Next.js version: 16.0.10 (Turbopack)


🔍 Skipping paired sarung item: {
  itemId: '5f67c6df-1e3f-47b5-abf7-c68d4b728c0b',
  produkId: '1b81246b-a924-4d5f-96f6-f71a22734148'
}
✅ DEBUG - Pairing Reconstructed (Old Format): {
  jasItemId: 'db9cbfef-8cd5-4e00-8f9c-2d59381de655',
  jasProductId: '56d53845-ce30-4f0b-bb8a-9c5d36b0ff6e',
  sarungProductId: 'ca786f53-6116-4c57-ba96-f5572abc0d02',
  sarungQuantity: 1,
  sarungProductFound: true,
  timestamp: '2026-01-03T12:40:36.717Z'
}
✅ DEBUG - Pairing Reconstructed (Old Format): {
  jasItemId: 'ebb4b0b3-7272-4b4e-a268-fbaf24db1eb7',
  jasProductId: '56d53845-ce30-4f0b-bb8a-9c5d36b0ff6e',
  sarungProductId: '1b81246b-a924-4d5f-96f6-f71a22734148',
  sarungQuantity: 2,
  sarungProductFound: true,
  timestamp: '2026-01-03T12:40:36.721Z'
}
🔍 Skipping paired sarung item: {
  itemId: 'fdba6c8e-ab8a-4553-97b1-7124009e7ebb',
  produkId: 'ca786f53-6116-4c57-ba96-f5572abc0d02'
}
D:\.work\rental-software\.next\dev\server\chunks\[root-of-the-server]__42ed68ed._.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed
D:\.work\rental-software\node_modules\@prisma\client\runtime\library.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: TypeError [ERR_INVALID_ARG_TYPE]: The "payload" argument must be of type object. Received null
D:\.work\rental-software\node_modules\next\dist\compiled\next-server\app-route-turbo.runtime.dev.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed
D:\.work\rental-software\.next\dev\server\chunks\node_modules_next_0677f46d._.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed
D:\.work\rental-software\node_modules\next\dist\server\base-server.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed
D:\.work\rental-software\node_modules\next\dist\server\next-server.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed
D:\.work\rental-software\node_modules\next\dist\server\dev\next-dev-server.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed   
D:\.work\rental-software\node_modules\next\dist\trace\trace.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed
D:\.work\rental-software\node_modules\next\dist\server\lib\router-server.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed     
D:\.work\rental-software\node_modules\next\dist\server\lib\start-server.js: Invalid source map. Only conformant source maps can be used to find the original code. Cause: Error: sourceMapURL could not be parsed
PUT /api/kasir/transaksi/TXN-20260103-004 error: Error: Failed to update stock on return:
Invalid `this.prisma.productSize.update()` invocation in
D:\.work\rental-software\.next\dev\server\chunks\[root-of-the-server]__42ed68ed._.js:1072:43

  1069     throw new Error('Quantity must be greater than 0');
  1070 }
  1071 try {
→ 1072     await this.prisma.productSize.update(
An operation failed because it depends on one or more records that were required but not found. No record was found for an update.
    at <unknown> (D:\.work\rental-software\.next\dev\server\chunks\[root-of-the-server]__42ed68ed._.js:1072:43)
    at InventoryService.updateStockOnReturn (D:\.work\rental-software\.next\dev\server\chunks\[root-of-the-server]__42ed68ed._.js:1086:19)
    at async (D:\.work\rental-software\.next\dev\server\chunks\[root-of-the-server]__42ed68ed._.js:3077:33)
    at async (D:\.work\rental-software\.next\dev\server\chunks\[root-of-the-server]__42ed68ed._.js:3068:21)
    at async TransaksiService.updateTransaksiStatus (D:\.work\rental-software\.next\dev\server\chunks\[root-of-the-server]__42ed68ed._.js:3032:34)
    at async PUT (D:\.work\rental-software\.next\dev\server\chunks\[root-of-the-server]__42ed68ed._.js:4822:9)
 PUT /api/kasir/transaksi/TXN-20260103-004 400 in 7.6s (compile: 138ms, proxy.ts: 75ms, render: 7.4s)