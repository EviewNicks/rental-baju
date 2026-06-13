GET /api/products/c861ab71-27a8-4968-9472-64a3395ed78a/history?page=1&limit=10&sortBy=date&sortOrder=desc 200 in 3.9s (compile: 58ms, proxy.ts: 37ms, render: 3.8s)
 GET /api/kasir/transaksi/TXN-20260611-001 200 in 4.0s (compile: 32ms, proxy.ts: 20ms, render: 3.9s)
2026-06-11T02:16:52.372Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] 🔍 DEBUG: Items before sarung gratis filter
{
  "transaksiId": "c0af39b0-d99b-4d90-a252-d3f5e23b336e",
  "totalRequestItems": 3,
  "itemsDetail": [
    {
      "itemId": "071f4af0-1ca9-4c8c-bed0-4eafe71d2ff5",
      "productName": "Jas Jaguar Abu",
      "productCategory": {
        "id": "302f2581-9de3-40ff-abce-e9a97c79b7d4",
        "name": "jas-jaguar",
        "color": "#1F2937",
        "type": "clothing",
        "createdAt": "2025-10-25T10:00:00.000Z",
        "updatedAt": "2025-10-25T10:00:00.000Z",
        "createdBy": "user_2zqMz12Mqg2OSWBunmkffp7r5Ek"
      },
      "subtotal": 150000,
      "hasLinkedSarung": false,
      "productSizeId": "0206dfc7-b840-4900-96c4-97e3eef7543c"
    },
    {
      "itemId": "41fec579-8f28-4131-863e-3da2fab2810b",
      "productName": "Sarung Abu/Cream",
      "productCategory": {
        "id": "d50fbc08-26f9-499f-bce1-189c7e18a171",
        "name": "sarung",
        "color": "#EA580C",
        "type": "accessories_age_based",
        "createdAt": "2025-10-25T10:00:00.000Z",
        "updatedAt": "2025-10-25T10:00:00.000Z",
        "createdBy": "user_2zqMz12Mqg2OSWBunmkffp7r5Ek"
      },
      "subtotal": 60000,
      "hasLinkedSarung": false,
      "productSizeId": "b49b8e48-5578-40f5-a7bf-58b4047b3cc0"
    },
    {
      "itemId": "6379ccd4-d614-4f06-b693-6b4bd45cbb34",
      "productName": "Jas Jaguar Abu",
      "productCategory": {
        "id": "302f2581-9de3-40ff-abce-e9a97c79b7d4",
        "name": "jas-jaguar",
        "color": "#1F2937",
        "type": "clothing",
        "createdAt": "2025-10-25T10:00:00.000Z",
        "updatedAt": "2025-10-25T10:00:00.000Z",
        "createdBy": "user_2zqMz12Mqg2OSWBunmkffp7r5Ek"
      },
      "subtotal": 300000,
      "hasLinkedSarung": true,
      "productSizeId": "0206dfc7-b840-4900-96c4-97e3eef7543c"
    }
  ],
  "performance": {
    "timestamp": 1781144212372,
    "memory": {
      "rss": 1020772352,
      "heapTotal": 349454336,
      "heapUsed": 316660528,
      "external": 6417463,
      "arrayBuffers": 728708
    }
  }
}
2026-06-11T02:16:52.376Z [INFO] [kasir:return-process][isSarungGratisItem] [KASIR] ✅ Sarung gratis detected via cross-reference check
{
  "sarungItemId": "41fec579-8f28-4131-863e-3da2fab2810b",
  "sarungProductName": "Sarung Abu/Cream",
  "sarungProductSizeId": "b49b8e48-5578-40f5-a7bf-58b4047b3cc0",
  "categoryInfo": {
    "categoryId": "d50fbc08-26f9-499f-bce1-189c7e18a171",
    "categoryName": "sarung",
    "categoryType": "object"
  },
  "detectionMethod": "cross_reference_from_jas",
  "reason": "another_item_references_this_sarung_as_linked",
  "performance": {
    "timestamp": 1781144212376,
    "memory": {
      "rss": 1020837888,
      "heapTotal": 349454336,
      "heapUsed": 316775288,
      "external": 6417463,
      "arrayBuffers": 728708
    }
  }
}
2026-06-11T02:16:52.379Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] 📊 SUMMARY: Items after sarung gratis filter
{
  "transaksiId": "c0af39b0-d99b-4d90-a252-d3f5e23b336e",
  "originalItemsCount": 3,
  "afterFilterCount": 2,
  "filteredOutCount": 1,
  "itemsToProcess": [
    {
      "itemId": "071f4af0-1ca9-4c8c-bed0-4eafe71d2ff5",
      "productName": "Jas Jaguar Abu"
    },
    {
      "itemId": "6379ccd4-d614-4f06-b693-6b4bd45cbb34",
      "productName": "Jas Jaguar Abu"
    }
  ],
  "performance": {
    "timestamp": 1781144212379,
    "memory": {
      "rss": 1020837888,
      "heapTotal": 349454336,
      "heapUsed": 316828176,
      "external": 6417463,
      "arrayBuffers": 728708
    }
  }
}
2026-06-11T02:16:52.382Z [INFO] [kasir:return-process][isSarungGratisItem] [KASIR] ✅ Sarung gratis detected via cross-reference check
{
  "sarungItemId": "41fec579-8f28-4131-863e-3da2fab2810b",
  "sarungProductName": "Sarung Abu/Cream",
  "sarungProductSizeId": "b49b8e48-5578-40f5-a7bf-58b4047b3cc0",
  "categoryInfo": {
    "categoryId": "d50fbc08-26f9-499f-bce1-189c7e18a171",
    "categoryName": "sarung",
    "categoryType": "object"
  },
  "detectionMethod": "cross_reference_from_jas",
  "reason": "another_item_references_this_sarung_as_linked",
  "performance": {
    "timestamp": 1781144212382,
    "memory": {
      "rss": 1020837888,
      "heapTotal": 349454336,
      "heapUsed": 316878800,
      "external": 6417463,
      "arrayBuffers": 728708
    }
  }
}
2026-06-11T02:16:52.385Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] 🔍 DEBUG: Sarung gratis detected - SKIP stock restoration
{
  "itemId": "41fec579-8f28-4131-863e-3da2fab2810b",
  "productName": "Sarung Abu/Cream",
  "productCategory": {
    "id": "d50fbc08-26f9-499f-bce1-189c7e18a171",
    "name": "sarung",
    "color": "#EA580C",
    "type": "accessories_age_based",
    "createdAt": "2025-10-25T10:00:00.000Z",
    "updatedAt": "2025-10-25T10:00:00.000Z",
    "createdBy": "user_2zqMz12Mqg2OSWBunmkffp7r5Ek"
  },
  "subtotal": 60000,
  "reason": "sarung_gratis_will_be_restored_via_jas_dual_restoration",
  "performance": {
    "timestamp": 1781144212385,
    "memory": {
      "rss": 1020837888,
      "heapTotal": 349454336,
      "heapUsed": 316928888,
      "external": 6417463,
      "arrayBuffers": 728708
    }
  }
}
2026-06-11T02:16:52.387Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] 🔍 DEBUG: About to call processStockForReturn
{
  "itemId": "071f4af0-1ca9-4c8c-bed0-4eafe71d2ff5",
  "productName": "Jas Jaguar Abu",
  "nonHilangQuantity": 1,
  "willProcessStock": true,
  "kondisiAwalHasLinkedSarung": false,
  "performance": {
    "timestamp": 1781144212387,
    "memory": {
      "rss": 1020837888,
      "heapTotal": 349454336,
      "heapUsed": 316985760,
      "external": 6417463,
      "arrayBuffers": 728708
    }
  }
}
2026-06-11T02:16:52.389Z [INFO] [kasir:return-process][🔍 AUDIT: Stock restoration pre-processing initiated] [KASIR] [object Object]
2026-06-11T02:16:52.391Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] 🔍 DEBUG: About to call processStockForReturn
{
  "itemId": "6379ccd4-d614-4f06-b693-6b4bd45cbb34",
  "productName": "Jas Jaguar Abu",
  "nonHilangQuantity": 2,
  "willProcessStock": true,
  "kondisiAwalHasLinkedSarung": true,
  "performance": {
    "timestamp": 1781144212390,
    "memory": {
      "rss": 1020837888,
      "heapTotal": 349454336,
      "heapUsed": 317058024,
      "external": 6417463,
      "arrayBuffers": 728708
    }
  }
}
2026-06-11T02:16:52.393Z [INFO] [kasir:return-process][🔍 AUDIT: Stock restoration pre-processing initiated] [KASIR] [object Object]
2026-06-11T02:16:52.394Z [INFO] [kasir:return-process][🔄 AUDIT: Pairing detection and restoration decision] [KASIR] [object Object]
🔧 Stock restoration initiated {
  sizeId: '0206dfc7-b840-4900-96c4-97e3eef7543c',
  linkedSarungSizeId: undefined,
  quantity: 1,
  isDualRestoration: false,
  transactionContext: 'r',
  timestamp: '2026-06-11T02:16:52.396Z'
}
🔍 DEBUG: Single restoration path executed {
  sizeId: '0206dfc7-b840-4900-96c4-97e3eef7543c',
  quantity: 1,
  operation: 'decrement_rented_increment_available',
  timestamp: '2026-06-11T02:16:52.397Z'
}
2026-06-11T02:16:52.399Z [INFO] [kasir:return-process][🔄 AUDIT: Pairing detection and restoration decision] [KASIR] [object Object]
🔧 Stock restoration initiated {
  sizeId: '0206dfc7-b840-4900-96c4-97e3eef7543c',
  linkedSarungSizeId: 'b49b8e48-5578-40f5-a7bf-58b4047b3cc0',
  quantity: 2,
  isDualRestoration: true,
  transactionContext: 'r',
  timestamp: '2026-06-11T02:16:52.400Z'
}
🔍 DEBUG: DUAL RESTORATION PATH - Restoring JAS + SARUNG {
  jasProductSizeId: '0206dfc7-b840-4900-96c4-97e3eef7543c',
  sarungProductSizeId: 'b49b8e48-5578-40f5-a7bf-58b4047b3cc0',
  quantity: 2,
  operation: 'dual_restoration_sequential',
  warning: 'This will restore BOTH jas and sarung stock',
  timestamp: '2026-06-11T02:16:52.401Z'
}
🔍 DEBUG: Jas stock restored, now restoring sarung... {
  jasProductSizeId: '0206dfc7-b840-4900-96c4-97e3eef7543c',
  sarungProductSizeId: 'b49b8e48-5578-40f5-a7bf-58b4047b3cc0'
}
2026-06-11T02:16:52.864Z [INFO] [kasir:return-process][✅ AUDIT: Single stock restoration completed successfully] [KASIR] [object Object]
🔍 DEBUG: Dual restoration completed for both jas and sarung {
  jasProductSizeId: '0206dfc7-b840-4900-96c4-97e3eef7543c',
  sarungProductSizeId: 'b49b8e48-5578-40f5-a7bf-58b4047b3cc0',
  restorationComplete: true
}
2026-06-11T02:16:53.102Z [INFO] [kasir:return-process][✅ AUDIT: Dual stock restoration completed successfully] [KASIR] [object Object]
2026-06-11T02:16:55.046Z [WARN] [kasir:return-process][processBackgroundActivities] [KASIR] Transaction status maintained for partial return
{
  "transaksiId": "c0af39b0-d99b-4d90-a252-d3f5e23b336e",
  "status": "diambil",
  "reason": "partial_return_in_progress",
  "performance": {
    "timestamp": 1781144215046,
    "memory": {
      "rss": 1020764160,
      "heapTotal": 349454336,
      "heapUsed": 317692408,
      "external": 6417507,
      "arrayBuffers": 728752
    }
  }
}
 PUT /api/kasir/transaksi/TXN-20260611-001/pengembalian 200 in 13.1s (compile: 358ms, proxy.ts: 18ms, render: 12.7s)
 GET /dashboard/transaction/TXN-20260611-001 200 in 169ms (compile: 85ms, proxy.ts: 35ms, render: 49ms)
🔧 AUTO-CORRECT RETURN: Updating transaction status from return state {
  transactionId: 'c0af39b0-d99b-4d90-a252-d3f5e23b336e',
  transactionCode: 'TXN-20260611-001',
  currentStatus: 'diambil',
  newStatus: 'selesai',
  reason: 'all_items_returned',
  returnAnalysis: {
    hasUnresolvedLostItems: false,
    allItemsReturned: true,
    itemsAnalysis: [ [Object], [Object], [Object] ]
  },
  itemsReturnStatus: [
    {
      itemId: '071f4af0-1ca9-4c8c-bed0-4eafe71d2ff5',
      productName: 'Jas Jaguar Abu',
      statusKembali: 'lengkap',
      isReturned: true,
      reason: 'Already processed by return service'
    },
    {
      itemId: '41fec579-8f28-4131-863e-3da2fab2810b',
      productName: 'Sarung Abu/Cream',
      statusKembali: 'lengkap',
      isReturned: true,
      reason: 'Already processed by return service'
    },
    {
      itemId: '6379ccd4-d614-4f06-b693-6b4bd45cbb34',
      productName: 'Jas Jaguar Abu',
      statusKembali: 'lengkap',
      isReturned: true,
      reason: 'Already processed by return service'
    }
  ],
  warningMessage: '⚠️ CRITICAL: Stock restoration will be skipped for items with statusKembali=lengkap to prevent DOUBLE RESTORATION BUG'
}
🔍 DEBUG: AUTO-CORRECT stock restoration analysis {
  transactionId: 'c0af39b0-d99b-4d90-a252-d3f5e23b336e',
  currentStatus: 'diambil',
  newStatus: 'selesai',
  totalItems: 4,
  itemsDetail: [
    {
      itemId: 'ac0ab196-4fcb-4093-b3c9-7d0197fe7c24',
      jumlah: 2,
      jumlahDiambil: 0,
      statusKembali: 'belum',
      hasKondisiAwal: true
    },
    {
      itemId: '071f4af0-1ca9-4c8c-bed0-4eafe71d2ff5',
      jumlah: 1,
      jumlahDiambil: 1,
      statusKembali: 'lengkap',
      hasKondisiAwal: true
    },
    {
      itemId: '41fec579-8f28-4131-863e-3da2fab2810b',
      jumlah: 2,
      jumlahDiambil: 2,
      statusKembali: 'lengkap',
      hasKondisiAwal: true
    },
    {
      itemId: '6379ccd4-d614-4f06-b693-6b4bd45cbb34',
      jumlah: 2,
      jumlahDiambil: 2,
      statusKembali: 'lengkap',
      hasKondisiAwal: true
    }
  ],
  timestamp: '2026-06-11T02:17:00.812Z'
}
🔍 DEBUG: Item restoration decision {
  itemId: 'ac0ab196-4fcb-4093-b3c9-7d0197fe7c24',
  statusKembali: 'belum',
  isAlreadyReturned: false,
  wasNeverPickedUp: true,
  jumlah: 2,
  jumlahDiambil: 0,
  quantityToRestore: 0,
  willRestore: false,
  reason: 'SKIP - Sarung gratis (never picked up, restored via dual restoration)',
  timestamp: '2026-06-11T02:17:00.813Z'
}
🔍 DEBUG: Item restoration decision {
  itemId: '071f4af0-1ca9-4c8c-bed0-4eafe71d2ff5',
  statusKembali: 'lengkap',
  isAlreadyReturned: true,
  wasNeverPickedUp: false,
  jumlah: 1,
  jumlahDiambil: 1,
  quantityToRestore: 0,
  willRestore: false,
  reason: 'SKIP - Already returned via return service',
  timestamp: '2026-06-11T02:17:00.814Z'
}
🔍 DEBUG: Item restoration decision {
  itemId: '41fec579-8f28-4131-863e-3da2fab2810b',
  statusKembali: 'lengkap',
  isAlreadyReturned: true,
  wasNeverPickedUp: false,
  jumlah: 2,
  jumlahDiambil: 2,
  quantityToRestore: 0,
  willRestore: false,
  reason: 'SKIP - Already returned via return service',
  timestamp: '2026-06-11T02:17:00.815Z'
}
🔍 DEBUG: Item restoration decision {
  itemId: '6379ccd4-d614-4f06-b693-6b4bd45cbb34',
  statusKembali: 'lengkap',
  isAlreadyReturned: true,
  wasNeverPickedUp: false,
  jumlah: 2,
  jumlahDiambil: 2,
  quantityToRestore: 0,
  willRestore: false,
  reason: 'SKIP - Already returned via return service',
  timestamp: '2026-06-11T02:17:00.816Z'
}
✅ DEBUG: Stock restoration completed {
  transactionId: 'c0af39b0-d99b-4d90-a252-d3f5e23b336e',
  newStatus: 'selesai',
  totalItems: 4,
  itemsRestored: 0,
  itemsSkipped: 4,
  restoredItems: [],
  skippedItems: [
    {
      itemId: 'ac0ab196-4fcb-4093-b3c9-7d0197fe7c24',
      statusKembali: 'belum',
      jumlahDiambil: 0,
      reason: 'Sarung gratis (never picked up)'
    },
    {
      itemId: '071f4af0-1ca9-4c8c-bed0-4eafe71d2ff5',
      statusKembali: 'lengkap',
      jumlahDiambil: 1,
      reason: 'Already returned'
    },
    {
      itemId: '41fec579-8f28-4131-863e-3da2fab2810b',
      statusKembali: 'lengkap',
      jumlahDiambil: 2,
      reason: 'Already returned'
    },
    {
      itemId: '6379ccd4-d614-4f06-b693-6b4bd45cbb34',
      statusKembali: 'lengkap',
      jumlahDiambil: 2,
      reason: 'Already returned'
    }
  ],
  criticalFix: '✅ DOUBLE RESTORATION BUG PREVENTED - Items with statusKembali=lengkap AND sarung gratis (jumlahDiambil=0) were skipped',
  timestamp: '2026-06-11T02:17:00.817Z'
}
 GET /api/kasir/transaksi/TXN-20260611-001 200 in 5.2s (compile: 57ms, proxy.ts: 22ms, render: 5.1s)
