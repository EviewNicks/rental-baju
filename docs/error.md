[pickup-TXN-20260104-003-1767534044499-xah8gytuf] Pickup request started: {
  transactionCode: 'TXN-20260104-003',
  clientIP: '::1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  timestamp: '2026-01-04T13:40:44.499Z'
}
🔍 Skipping paired sarung item: {
  itemId: '62ef40be-4d8b-449e-b8f4-bb0907eef518',
  produkId: 'ca786f53-6116-4c57-ba96-f5572abc0d02'
}
🔍 Skipping paired sarung item: {
  itemId: '6dd662fd-1900-457e-aba0-3ca5838d7990',
  produkId: '0367ba92-5407-4d73-98d7-4f5a1a017833'
}
🚀 Pickup process initiated {
  transactionId: '0f1a28b2-e52a-4e1c-ace5-e1b77b3fa30f',
  itemCount: 2,
  totalQuantity: 2,
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  timestamp: '2026-01-04T13:40:48.944Z',
  pairingContext: 'enhanced_pickup_with_pairing_support'
}
📊 Data format detected for stock processing {
  itemId: '305272d0-581e-4994-8f87-b23682ed105b',
  detectedFormat: 'JSON',
  hasKondisiAwal: true,
  kondisiAwalLength: 526,
  timestamp: '2026-01-04T13:40:53.575Z'
}
🔧 Stock deduction initiated {
  sizeId: '5f73c8ad-9c61-4642-8c54-a9078f1392e4',
  linkedSarungSizeId: '21af8409-5bb4-48d4-b816-c02d0d48e6d0',
  quantity: 1,
  isDualDeduction: true,
  transactionContext: 'r',
  timestamp: '2026-01-04T13:40:53.582Z'
}
🔄 Executing dual stock deduction {
  jasProductSizeId: '5f73c8ad-9c61-4642-8c54-a9078f1392e4',
  sarungProductSizeId: '21af8409-5bb4-48d4-b816-c02d0d48e6d0',
  quantity: 1,
  step: 'sequential_updates',
  timestamp: '2026-01-04T13:40:53.587Z'
}
Dual stock deduction completed for jas-sarung pairing {
  itemId: '305272d0-581e-4994-8f87-b23682ed105b',
  jasProductSizeId: '5f73c8ad-9c61-4642-8c54-a9078f1392e4',
  sarungProductSizeId: '21af8409-5bb4-48d4-b816-c02d0d48e6d0',
  quantity: 1
}
📊 Data format detected for stock processing {
  itemId: '5124d11c-f564-4904-b056-224d60502a44',
  detectedFormat: 'JSON',
  hasKondisiAwal: true,
  kondisiAwalLength: 140,
  timestamp: '2026-01-04T13:40:54.211Z'
}
🔧 Stock deduction initiated {
  sizeId: '12091dd3-a1d2-43a0-84bc-94ff2efed8ae',
  linkedSarungSizeId: undefined,
  quantity: 1,
  isDualDeduction: false,
  transactionContext: 'r',
  timestamp: '2026-01-04T13:40:54.213Z'
}
Stock deduction completed for regular item {
  itemId: '5124d11c-f564-4904-b056-224d60502a44',
  productSizeId: '12091dd3-a1d2-43a0-84bc-94ff2efed8ae',
  quantity: 1
}
✅ Pickup process completed successfully {
  transactionId: '0f1a28b2-e52a-4e1c-ace5-e1b77b3fa30f',
  transactionCode: 'TXN-20260104-003',
  totalItems: 2,
  totalQuantity: 2,
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  processingTime: 0,
  pairingItemsProcessed: 2,
  timestamp: '2026-01-04T13:40:57.426Z'
}
[pickup-TXN-20260104-003-1767534044499-xah8gytuf] Pickup completed successfully: {
  transactionCode: 'TXN-20260104-003',
  totalItems: 2,
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  processingTime: 1767513797326,
  timestamp: '2026-01-04T13:40:57.431Z'
}
 PATCH /api/kasir/transaksi/TXN-20260104-003/ambil 200 in 14.5s (compile: 1496ms, proxy.ts: 30ms, render: 13.0s)
🔍 Skipping paired sarung item: {
  itemId: '62ef40be-4d8b-449e-b8f4-bb0907eef518',
  produkId: 'ca786f53-6116-4c57-ba96-f5572abc0d02'
}
🔍 Skipping paired sarung item: {
  itemId: '6dd662fd-1900-457e-aba0-3ca5838d7990',
  produkId: '0367ba92-5407-4d73-98d7-4f5a1a017833'
}
 GET /api/kasir/transaksi/TXN-20260104-003 200 in 4.1s (compile: 33ms, proxy.ts: 320ms, render: 3.7s)
🔍 Skipping paired sarung item: {
  itemId: '62ef40be-4d8b-449e-b8f4-bb0907eef518',
  produkId: 'ca786f53-6116-4c57-ba96-f5572abc0d02'
}
🔍 Skipping paired sarung item: {
  itemId: '6dd662fd-1900-457e-aba0-3ca5838d7990',
  produkId: '0367ba92-5407-4d73-98d7-4f5a1a017833'
}
 GET /api/kasir/transaksi/TXN-20260104-003 200 in 3.4s (compile: 16ms, proxy.ts: 19ms, render: 3.4s)
