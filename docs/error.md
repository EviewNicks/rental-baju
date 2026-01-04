2026-01-04T19:44:12.521Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] Starting simplified return processing
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "itemCount": 3,
  "totalConditions": 3,
  "performance": {
    "timestamp": 1767555852521,
    "memory": {
      "rss": 780718080,
      "heapTotal": 772673536,
      "heapUsed": 735043184,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:12.522Z [INFO] [kasir:return-process][validateReturnRequest] [KASIR] Starting enhanced partial return validation with data consistency protection
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "itemCount": 3,
  "totalConditions": 3,
  "performance": {
    "timestamp": 1767555852522,
    "memory": {
      "rss": 780726272,
      "heapTotal": 772673536,
      "heapUsed": 735095736,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:15.848Z [INFO] [kasir:return-process][validateReturnRequest] [KASIR] 🔍 AUDIT: Pairing validation initiated
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "totalReturnItems": 3,
  "returnItemsData": [
    {
      "itemId": "181036a6-0032-4734-9164-128066767171",
      "conditionsCount": 1,
      "totalQuantity": 2
    },
    {
      "itemId": "42132fda-bf9c-4351-89d0-b920070e8456",
      "conditionsCount": 1,
      "totalQuantity": 1
    },
    {
      "itemId": "b5ed9524-5933-46ac-887b-4dc295b6548a",
      "conditionsCount": 1,
      "totalQuantity": 1
    }
  ],
  "transactionItemsCount": 4,
  "validationStep": "format_conversion_start",
  "timestamp": "2026-01-04T19:44:15.848Z",
  "performance": {
    "timestamp": 1767555855848,
    "memory": {
      "rss": 780738560,
      "heapTotal": 772673536,
      "heapUsed": 735638952,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:15.850Z [INFO] [kasir:return-process][validateReturnRequest] [KASIR] 🔄 AUDIT: Format conversion and pairing detection completed
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "pairingDetection": [
    {
      "itemId": "181036a6-0032-4734-9164-128066767171",
      "isPaired": true,
      "kondisiAwalFormat": "JSON"
    },
    {
      "itemId": "42132fda-bf9c-4351-89d0-b920070e8456",
      "isPaired": false,
      "kondisiAwalFormat": "JSON"
    },
    {
      "itemId": "b5ed9524-5933-46ac-887b-4dc295b6548a",
      "isPaired": false,
      "kondisiAwalFormat": "JSON"
    }
  ],
  "totalPairedItems": 1,
  "formatDistribution": {
    "json": 3,
    "pipe": 0,
    "null": 0
  },
  "validationStep": "pairing_validation_start",
  "timestamp": "2026-01-04T19:44:15.850Z",
  "performance": {
    "timestamp": 1767555855850,
    "memory": {
      "rss": 780738560,
      "heapTotal": 772673536,
      "heapUsed": 735705888,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:15.852Z [INFO] [kasir:return-process][validateReturnRequest] [KASIR] Pairing validation completed
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "pairingValidationResult": {
    "isValid": true,
    "errorsCount": 0,
    "warningsCount": 1,
    "hasPairingInfo": true
  },
  "performance": {
    "timestamp": 1767555855852,
    "memory": {
      "rss": 780738560,
      "heapTotal": 772673536,
      "heapUsed": 735773944,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:15.853Z [INFO] [kasir:return-process][validateReturnRequest] [KASIR] ✅ AUDIT: Pairing validation results detailed analysis
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "validationResult": {
    "isValid": true,
    "errorsCount": 0,
    "warningsCount": 1,
    "hasPairingInfo": true,
    "pairingInfo": {
      "jasItemId": "181036a6-0032-4734-9164-128066767171",
      "sarungItemId": "metadata",
      "requiredRatio": "1:1"
    }
  },
  "errorDetails": [],
  "warningDetails": [
    "Pairing terdeteksi: Jas Polos Pink + Sarung (2 set) - sarung sebagai metadata"
  ],
  "validationStep": "pairing_validation_complete",
  "timestamp": "2026-01-04T19:44:15.853Z",
  "performance": {
    "timestamp": 1767555855853,
    "memory": {
      "rss": 780738560,
      "heapTotal": 772673536,
      "heapUsed": 735812408,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:15.854Z [WARN] [kasir:return-process][validateReturnRequest] [KASIR] Pairing validation warnings
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "warnings": [
    "Pairing terdeteksi: Jas Polos Pink + Sarung (2 set) - sarung sebagai metadata"
  ],
  "performance": {
    "timestamp": 1767555855854,
    "memory": {
      "rss": 780738560,
      "heapTotal": 772673536,
      "heapUsed": 735866720,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:15.855Z [INFO] [kasir:return-process][validateReturnRequest] [KASIR] Enhanced partial return validation with data consistency completed
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "duration": 3332,
  "itemsValidated": 3,
  "isValid": true,
  "currentRemainingQuantities": {
    "b5ed9524-5933-46ac-887b-4dc295b6548a": 1,
    "e3d984bd-1aa5-4da0-abd0-c609b7b7934f": 0,
    "181036a6-0032-4734-9164-128066767171": 2,
    "42132fda-bf9c-4351-89d0-b920070e8456": 1
  },
  "requestedQuantities": {
    "181036a6-0032-4734-9164-128066767171": 2,
    "42132fda-bf9c-4351-89d0-b920070e8456": 1,
    "b5ed9524-5933-46ac-887b-4dc295b6548a": 1
  },
  "partialValidationResult": {
    "isValid": true,
    "errors": []
  },
  "existingReturnRecords": 0,
  "validationType": "enhanced_with_data_consistency",
  "performance": {
    "timestamp": 1767555855855,
    "memory": {
      "rss": 780742656,
      "heapTotal": 772673536,
      "heapUsed": 735905400,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:15.856Z [INFO] [kasir:return-process][calculateBasicPenalties] [KASIR] Starting optimized penalty calculation
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "itemCount": 3,
  "performance": {
    "timestamp": 1767555855856,
    "memory": {
      "rss": 780742656,
      "heapTotal": 772673536,
      "heapUsed": 735967320,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:15.857Z [INFO] [kasir:return-process][calculateBasicPenalties] [KASIR] Using pairing-aware penalty calculation
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "itemCount": 3,
  "performance": {
    "timestamp": 1767555855857,
    "memory": {
      "rss": 780742656,
      "heapTotal": 772673536,
      "heapUsed": 736002408,
      "external": 11740302,
      "arrayBuffers": 7740489
    }
  }
}
2026-01-04T19:44:17.418Z [INFO] [kasir:return-process][validateAgainstCurrentDatabaseState] [KASIR] Database state validation completed
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "currentRemainingQuantities": {
    "b5ed9524-5933-46ac-887b-4dc295b6548a": 1,
    "e3d984bd-1aa5-4da0-abd0-c609b7b7934f": 0,
    "181036a6-0032-4734-9164-128066767171": 2,
    "42132fda-bf9c-4351-89d0-b920070e8456": 1
  },
  "requestedQuantities": {
    "181036a6-0032-4734-9164-128066767171": 2,
    "42132fda-bf9c-4351-89d0-b920070e8456": 1,
    "b5ed9524-5933-46ac-887b-4dc295b6548a": 1
  },
  "isValid": true,
  "errorsCount": 0,
  "performance": {
    "timestamp": 1767555857418,
    "memory": {
      "rss": 780750848,
      "heapTotal": 772673536,
      "heapUsed": 736255960,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:17.419Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] Final validation passed within transaction - proceeding with atomic processing
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "currentRemainingQuantities": {
    "b5ed9524-5933-46ac-887b-4dc295b6548a": 1,
    "e3d984bd-1aa5-4da0-abd0-c609b7b7934f": 0,
    "181036a6-0032-4734-9164-128066767171": 2,
    "42132fda-bf9c-4351-89d0-b920070e8456": 1
  },
  "requestedQuantities": {
    "181036a6-0032-4734-9164-128066767171": 2,
    "42132fda-bf9c-4351-89d0-b920070e8456": 1,
    "b5ed9524-5933-46ac-887b-4dc295b6548a": 1
  },
  "performance": {
    "timestamp": 1767555857419,
    "memory": {
      "rss": 780750848,
      "heapTotal": 772673536,
      "heapUsed": 736305928,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:17.420Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] Dual stock restoration prepared for jas-sarung pairing
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "itemId": "181036a6-0032-4734-9164-128066767171",
  "jasProductSizeId": "ce1b0dc6-6fac-4c09-a273-4918f604f8b5",
  "sarungProductSizeId": "b49b8e48-5578-40f5-a7bf-58b4047b3cc0",
  "quantity": 2,
  "restorationMode": "DUAL_RESTORATION",
  "performance": {
    "timestamp": 1767555857420,
    "memory": {
      "rss": 780750848,
      "heapTotal": 772673536,
      "heapUsed": 736360904,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:18.598Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] 📦 AUDIT: Stock restoration process initiated
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "totalItemsToProcess": 3,
  "sizeUpdatesCount": 3,
  "stockRestorationContext": {
    "transactionScope": "INSIDE_TRANSACTION",
    "inventoryServiceType": "PAIRING_AWARE",
    "atomicOperation": true
  },
  "itemsProcessingPlan": [
    {
      "itemId": "181036a6-0032-4734-9164-128066767171",
      "productName": "Jas Polos Pink",
      "nonHilangQuantity": 2,
      "willProcessStock": true,
      "kondisiAwalFormat": "JSON"
    },
    {
      "itemId": "42132fda-bf9c-4351-89d0-b920070e8456",
      "productName": "Jas Polos Pink",
      "nonHilangQuantity": 1,
      "willProcessStock": true,
      "kondisiAwalFormat": "JSON"
    },
    {
      "itemId": "b5ed9524-5933-46ac-887b-4dc295b6548a",
      "productName": "Bando Bunga Emas",
      "nonHilangQuantity": 1,
      "willProcessStock": true,
      "kondisiAwalFormat": "JSON"
    }
  ],
  "processingStep": "stock_restoration_start",
  "timestamp": "2026-01-04T19:44:18.598Z",
  "performance": {
    "timestamp": 1767555858598,
    "memory": {
      "rss": 778952704,
      "heapTotal": 772673536,
      "heapUsed": 736597864,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:18.600Z [INFO] [kasir:return-process][🔍 AUDIT: Stock restoration pre-processing initiated] [KASIR] [object Object]
2026-01-04T19:44:18.602Z [INFO] [kasir:return-process][🔍 AUDIT: Stock restoration pre-processing initiated] [KASIR] [object Object]
2026-01-04T19:44:18.603Z [INFO] [kasir:return-process][🔍 AUDIT: Stock restoration pre-processing initiated] [KASIR] [object Object]
2026-01-04T19:44:18.603Z [INFO] [kasir:return-process][🔄 AUDIT: Pairing detection and restoration decision] [KASIR] [object Object]
🔧 Stock restoration initiated {
  sizeId: 'ce1b0dc6-6fac-4c09-a273-4918f604f8b5',
  linkedSarungSizeId: 'b49b8e48-5578-40f5-a7bf-58b4047b3cc0',
  quantity: 2,
  isDualRestoration: true,
  transactionContext: 'r',
  timestamp: '2026-01-04T19:44:18.604Z'
}
🔄 Executing dual stock restoration {
  jasProductSizeId: 'ce1b0dc6-6fac-4c09-a273-4918f604f8b5',
  sarungProductSizeId: 'b49b8e48-5578-40f5-a7bf-58b4047b3cc0',
  quantity: 2,
  step: 'sequential_updates',
  timestamp: '2026-01-04T19:44:18.605Z'
}
2026-01-04T19:44:18.606Z [INFO] [kasir:return-process][🔄 AUDIT: Pairing detection and restoration decision] [KASIR] [object Object]
🔧 Stock restoration initiated {
  sizeId: 'ce1b0dc6-6fac-4c09-a273-4918f604f8b5',
  linkedSarungSizeId: undefined,
  quantity: 1,
  isDualRestoration: false,
  transactionContext: 'r',
  timestamp: '2026-01-04T19:44:18.606Z'
}
2026-01-04T19:44:18.607Z [INFO] [kasir:return-process][🔄 AUDIT: Pairing detection and restoration decision] [KASIR] [object Object]
🔧 Stock restoration initiated {
  sizeId: '88a34d19-c212-4878-a263-877087b47716',
  linkedSarungSizeId: undefined,
  quantity: 1,
  isDualRestoration: false,
  transactionContext: 'r',
  timestamp: '2026-01-04T19:44:18.608Z'
}
2026-01-04T19:44:19.470Z [INFO] [kasir:return-process][✅ AUDIT: Single stock restoration completed successfully] [KASIR] [object Object]
2026-01-04T19:44:19.471Z [INFO] [kasir:return-process][✅ AUDIT: Single stock restoration completed successfully] [KASIR] [object Object]
2026-01-04T19:44:19.767Z [INFO] [kasir:return-process][✅ AUDIT: Dual stock restoration completed successfully] [KASIR] [object Object]
2026-01-04T19:44:19.769Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] ✅ AUDIT: Stock restoration process completed successfully
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "restorationSummary": {
    "totalItemsProcessed": 3,
    "itemsWithStockRestoration": 3,
    "itemsSkipped": 0,
    "totalQuantityRestored": 4
  },
  "processingStep": "stock_restoration_complete",
  "timestamp": "2026-01-04T19:44:19.768Z",
  "performance": {
    "timestamp": 1767555859769,
    "memory": {
      "rss": 778956800,
      "heapTotal": 772673536,
      "heapUsed": 737224920,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:19.770Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] Optimized transaction completed with atomic stock updates and penalty payment
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "duration": 3911,
  "returnRecords": 3,
  "itemUpdates": 3,
  "stockUpdates": 2,
  "sizeUpdates": 3,
  "penaltyPaymentCreated": false,
  "performance": {
    "timestamp": 1767555859770,
    "memory": {
      "rss": 778956800,
      "heapTotal": 772673536,
      "heapUsed": 737270480,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:19.918Z [INFO] [kasir:return-process][processUnifiedReturn] [KASIR] Transaction completed successfully
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "processingTime": "7396ms",
  "itemsProcessed": 3,
  "totalPenalty": 0,
  "performance": {
    "timestamp": 1767555859917,
    "memory": {
      "rss": 778956800,
      "heapTotal": 772673536,
      "heapUsed": 737337560,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:21.427Z [INFO] [kasir:return-process][processBackgroundActivities] [KASIR] Enhanced transaction status determination for partial returns
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "hasUnresolvedLostItems": false,
  "allItemsFullyReturned": false,
  "currentStatus": "active",
  "newStatus": "active",
  "remainingQuantities": {
    "b5ed9524-5933-46ac-887b-4dc295b6548a": 1,
    "e3d984bd-1aa5-4da0-abd0-c609b7b7934f": 0,
    "181036a6-0032-4734-9164-128066767171": 2,
    "42132fda-bf9c-4351-89d0-b920070e8456": 1
  },
  "currentReturnQuantities": {
    "181036a6-0032-4734-9164-128066767171": 2,
    "42132fda-bf9c-4351-89d0-b920070e8456": 1,
    "b5ed9524-5933-46ac-887b-4dc295b6548a": 1
  },
  "itemsWithHilang": [],
  "performance": {
    "timestamp": 1767555861427,
    "memory": {
      "rss": 778960896,
      "heapTotal": 772673536,
      "heapUsed": 737502792,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:21.430Z [INFO] [kasir:return-process][processBackgroundActivities] [KASIR] Transaction status maintained for partial return
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "status": "active",
  "reason": "partial_return_in_progress",
  "performance": {
    "timestamp": 1767555861430,
    "memory": {
      "rss": 778960896,
      "heapTotal": 772673536,
      "heapUsed": 737556296,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
2026-01-04T19:44:22.144Z [INFO] [kasir:return-process][processBackgroundActivities] [KASIR] Unified activity created successfully
{
  "transaksiId": "f9463a57-58b9-42c4-a8de-e40254406ab4",
  "duration": 2225,
  "totalItems": 3,
  "totalPenalty": 0,
  "activitiesCreated": 1,
  "performance": {
    "timestamp": 1767555862144,
    "memory": {
      "rss": 778964992,
      "heapTotal": 772673536,
      "heapUsed": 737730088,
      "external": 11740324,
      "arrayBuffers": 7740511
    }
  }
}
 PUT /api/kasir/transaksi/TXN-20260105-005/pengembalian 200 in 15.1s (compile: 1230ms, proxy.ts: 44ms, render: 13.9s)
 GET /dashboard/transaction/TXN-20260105-005 200 in 64ms (compile: 18ms, proxy.ts: 17ms, render: 28ms)
🔍 Skipping paired sarung item: {
  itemId: 'e3d984bd-1aa5-4da0-abd0-c609b7b7934f',
  produkId: 'c861ab71-27a8-4968-9472-64a3395ed78a'
}
 GET /api/kasir/transaksi/TXN-20260105-005 200 in 3.5s (compile: 20ms, proxy.ts: 23ms, render: 3.5s)
