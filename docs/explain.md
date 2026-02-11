✓ Compiled in 797ms
 ✓ Compiled in 601ms
 ✓ Compiled in 584ms
🚀 TRANSACTION API PAYLOAD
  📊 Metadata
    description: Final API request payload that will be sent to POST /api/kasir/transaksi
    timestamp: 2026-02-10T14:15:27.015Z
    source: useTransactionForm.submitTransaction
    endpoint: POST /api/kasir/transaksi
    format: size-aware
    enhancedFeatures:
      manualPriceAdjustments: 0
      jasSarungPairings: 4
      discountApplied: true
      discountType: percent
      discountValue: 10
    validation:
      schemaVersion: v2.0-with-manual-adjustments
      zodValidationPassed: true
      fieldsPreserved: [
      'manualPriceAdjustment',
      'linkedSarung',
      'discountType',
      'discountValue'
    ]
  📄 Data Payload
    {
      "penyewaId": "3704d273-299c-4ebc-800b-faed79ed332c",
      "kasirId": "96930b03-8ddf-4d45-ab6b-fb5ea9620bd8",
      "items": [
        {
          "produkId": "205a744f-fd9c-4277-a05a-2aaacca5072d",
          "productSizeId": "3ac36180-e85a-41cd-946d-b261bf1d5f56",
          "jumlah": 1,
          "durasi": 4,
          "kondisiAwal": "baik",
          "linkedSarung": {
            "productId": "63b0ff83-4055-4257-957b-c19d0145db1b",
            "productSizeId": "55ebfde5-14d6-4ab6-8612-4504d01d1d2c",
            "quantity": 1,
            "selectedSize": {
              "id": "55ebfde5-14d6-4ab6-8612-4504d01d1d2c",
              "size": "UNIVERSAL",
              "ageCategory": "ADULT",
              "quantity": 2,
              "availableQuantity": 3,
              "color": "ADULT - UNIVERSAL",
              "originalQuantity": 2,
              "rentedQuantity": -1
            }
          }
        },
        {
          "produkId": "205a744f-fd9c-4277-a05a-2aaacca5072d",
          "productSizeId": "3ac36180-e85a-41cd-946d-b261bf1d5f56",
          "jumlah": 1,
          "durasi": 4,
          "kondisiAwal": "baik",
          "linkedSarung": {
            "productId": "4395eae1-9422-4e48-8eb9-fc4a293b6299",
            "productSizeId": "4a2616f5-c2de-45d9-9c0c-3832bd48c200",
            "quantity": 1,
            "selectedSize": {
              "id": "4a2616f5-c2de-45d9-9c0c-3832bd48c200",
              "size": "UNIVERSAL",
              "ageCategory": "ADULT",
              "quantity": 12,
              "availableQuantity": 12,
              "color": "ADULT - UNIVERSAL",
              "originalQuantity": 12,
              "rentedQuantity": 0
            }
          }
        },
        {
          "produkId": "6ba4659a-6343-4ced-ada6-eec595fd00b5",
          "productSizeId": "bebc185b-e8f4-4b9a-a3dc-8b3dccc7f984",
          "jumlah": 2,
          "durasi": 4,
          "kondisiAwal": "baik",
          "linkedSarung": {
            "productId": "d5fdf8b3-60b9-4e58-a7ba-780a0660b9a5",
            "productSizeId": "a5438712-f879-4525-b7c9-59e4f368d16e",
            "quantity": 2,
            "selectedSize": {
              "id": "a5438712-f879-4525-b7c9-59e4f368d16e",
              "size": "UNIVERSAL",
              "ageCategory": "ADULT",
              "quantity": 21,
              "availableQuantity": 21,
              "color": "ADULT - UNIVERSAL",
              "originalQuantity": 21,
              "rentedQuantity": 0
            }
          }
        },
        {
          "produkId": "629aa8cd-e91e-4fab-855b-de90cb520be0",
          "productSizeId": "57fc4030-531f-4146-8af2-b32c9a407da9",
          "jumlah": 1,
          "durasi": 4,
          "kondisiAwal": "baik",
          "linkedSarung": {
            "productId": "1f75b0ef-0fa3-4440-b27b-200e30b7868a",
            "productSizeId": "16040cc2-3124-44a8-8150-36f97890c3b8",
            "quantity": 1,
            "selectedSize": {
              "id": "16040cc2-3124-44a8-8150-36f97890c3b8",
              "size": "UNIVERSAL",
              "ageCategory": "ADULT",
              "quantity": 12,
              "availableQuantity": 12,
              "color": "ADULT - UNIVERSAL",
              "originalQuantity": 12,
              "rentedQuantity": 0
            }
          }
        }
      ],
      "tglMulai": "2026-02-18T00:00:00.000Z",
      "tglSelesai": "2026-02-21T00:00:00.000Z",
      "metodeBayar": "tunai",
      "discountType": "percent",
      "discountValue": 10
    }
  📦 Items Summary
    Item 1: {
      index: 1,
      productId: '205a744f-fd9c-4277-a05a-2aaacca5072d',
      quantity: 1,
      duration: 4,
      sizeInfo: 'Size: 3ac36180-e85a-41cd-946d-b261bf1d5f56',
      price: undefined,
      hasManualAdjustment: false,
      adjustmentAmount: 0,
      finalPrice: undefined,
      hasLinkedSarung: true,
      linkedSarungId: '63b0ff83-4055-4257-957b-c19d0145db1b'
    }
    Item 2: {
      index: 2,
      productId: '205a744f-fd9c-4277-a05a-2aaacca5072d',
      quantity: 1,
      duration: 4,
      sizeInfo: 'Size: 3ac36180-e85a-41cd-946d-b261bf1d5f56',
      price: undefined,
      hasManualAdjustment: false,
      adjustmentAmount: 0,
      finalPrice: undefined,
      hasLinkedSarung: true,
      linkedSarungId: '4395eae1-9422-4e48-8eb9-fc4a293b6299'
    }
    Item 3: {
      index: 3,
      productId: '6ba4659a-6343-4ced-ada6-eec595fd00b5',
      quantity: 2,
      duration: 4,
      sizeInfo: 'Size: bebc185b-e8f4-4b9a-a3dc-8b3dccc7f984',
      price: undefined,
      hasManualAdjustment: false,
      adjustmentAmount: 0,
      finalPrice: undefined,
      hasLinkedSarung: true,
      linkedSarungId: 'd5fdf8b3-60b9-4e58-a7ba-780a0660b9a5'
    }
    Item 4: {
      index: 4,
      productId: '629aa8cd-e91e-4fab-855b-de90cb520be0',
      quantity: 1,
      duration: 4,
      sizeInfo: 'Size: 57fc4030-531f-4146-8af2-b32c9a407da9',
      price: undefined,
      hasManualAdjustment: false,
      adjustmentAmount: 0,
      finalPrice: undefined,
      hasLinkedSarung: true,
      linkedSarungId: '1f75b0ef-0fa3-4440-b27b-200e30b7868a'
    }
  👤 Customer Info
    Customer ID: 3704d273-299c-4ebc-800b-faed79ed332c
  💼 Kasir Info
    Kasir ID: 96930b03-8ddf-4d45-ab6b-fb5ea9620bd8
  💰 Pricing Summary
    Total Items: 5
    Jas-Sarung Pairings: 4 pairs
    Discount Applied: 10% (percent)
================================================================================
 POST /api/kasir/transaksi 201 in 26.9s (compile: 736ms, proxy.ts: 4.3s, render: 21.9s)
 POST /api/kasir/pembayaran 201 in 7.6s (compile: 855ms, proxy.ts: 17ms, render: 6.7s)
 GET /dashboard?refresh=true 200 in 56ms (compile: 10ms, proxy.ts: 21ms, render: 25ms)
 GET /dashboard 200 in 151ms (compile: 29ms, proxy.ts: 26ms, render: 96ms)
 GET /api/kasir/transaksi?page=1&limit=20 200 in 3.9s (compile: 17ms, proxy.ts: 25ms, render: 3.9s)
