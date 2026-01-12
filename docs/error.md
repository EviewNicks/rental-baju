🎯 [AUDIT-1] InlinePriceEditor - User Adjustment Input ObjectadjustmentAmount: 75000currentTotalAdjustment: 0inputValue: "75000"itemIndex: 0newTotalAdjustment: 75000newTotalPrice: 175000originalPrice: 100000productId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"productName: "Jas Polos Krem"source: "InlinePriceEditor.handleAdjustmentConfirm"timestamp: "2026-01-12T14:38:18.175Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-2] PaymentSummaryStep - Form State Update ObjectadjustmentAmount: 75000beforeUpdate: undefinedcurrentTotalAdjustment: 0finalPrice: 175000itemIndex: 0newTotalAdjustment: 75000originalPrice: 100000productId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"productName: "Jas Polos Krem"source: "PaymentSummaryStep.handleCumulativeAdjustment"timestamp: "2026-01-12T14:38:18.177Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-3] PaymentSummaryStep - Updated Product Data ObjectitemIndex: 0manualPriceAdjustment: {isManuallyAdjusted: true, originalPrice: 100000, adjustmentAmount: 75000, lastModified: '2026-01-12T14:38:18.177Z'}productId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"source: "PaymentSummaryStep.handleCumulativeAdjustment"timestamp: "2026-01-12T14:38:18.177Z"updatedItem: {product: {…}, quantity: 1, duration: 4, productSizeId: 'd468dc6c-caaa-43bd-aa86-287f0c705b5f', selectedSize: {…}, …}[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-1] InlinePriceEditor - User Adjustment Input ObjectadjustmentAmount: 25000currentTotalAdjustment: 0inputValue: "25000"itemIndex: 1newTotalAdjustment: 25000newTotalPrice: 125000originalPrice: 100000productId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"productName: "Jas Polos Krem"source: "InlinePriceEditor.handleAdjustmentConfirm"timestamp: "2026-01-12T14:38:21.253Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-2] PaymentSummaryStep - Form State Update ObjectadjustmentAmount: 25000beforeUpdate: undefinedcurrentTotalAdjustment: 0finalPrice: 125000itemIndex: 1newTotalAdjustment: 25000originalPrice: 100000productId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"productName: "Jas Polos Krem"source: "PaymentSummaryStep.handleCumulativeAdjustment"timestamp: "2026-01-12T14:38:21.254Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-3] PaymentSummaryStep - Updated Product Data ObjectitemIndex: 1manualPriceAdjustment: {isManuallyAdjusted: true, originalPrice: 100000, adjustmentAmount: 25000, lastModified: '2026-01-12T14:38:21.254Z'}productId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"source: "PaymentSummaryStep.handleCumulativeAdjustment"timestamp: "2026-01-12T14:38:21.254Z"updatedItem: {product: {…}, quantity: 1, duration: 4, productSizeId: 'd468dc6c-caaa-43bd-aa86-287f0c705b5f', selectedSize: {…}, …}[[Prototype]]: Object
forward-logs-shared.ts:95 📋 TRANSACTION FORM DATA
forward-logs-shared.ts:95 📊 Metadata
forward-logs-shared.ts:95 description: Data collected from user input form before API transformation
forward-logs-shared.ts:95 timestamp: 2026-01-12T14:38:30.329Z
forward-logs-shared.ts:95 source: TransactionFormPage.handleSubmitTransaction
forward-logs-shared.ts:95 📄 Data Payload
forward-logs-shared.ts:95 {  "productCount": 3,  "products": [    {      "id": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",      "name": "Jas Polos Krem",      "quantity": 1,      "availableQuantity": 13    },    {      "id": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",      "name": "Jas Polos Krem",      "quantity": 1,      "availableQuantity": 13    },    {      "id": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",      "name": "Jas Polos Krem",      "quantity": 1,      "availableQuantity": 13    }  ],  "customer": {    "id": "e40877c2-2ca2-465d-b7a3-d538c9a2b5f3",    "name": "Arunggah"  },  "totalAmount": 360000,  "step": 4}
forward-logs-shared.ts:95 👤 Customer Info
forward-logs-shared.ts:95 Customer: Object
forward-logs-shared.ts:95 💰 Pricing Summary
forward-logs-shared.ts:95 Total Amount: Rp 360.000
forward-logs-shared.ts:95 ================================================================================
forward-logs-shared.ts:95 🎯 [AUDIT-4] useTransactionForm - Product Before API Serialization ObjecthasLinkedSarung: truehasManualAdjustment: truemanualPriceAdjustment: {isManuallyAdjusted: true, originalPrice: 100000, adjustmentAmount: 75000, lastModified: '2026-01-12T14:38:18.177Z'}productId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"productName: "Jas Polos Krem"quantity: 1source: "useTransactionForm.submitTransaction"timestamp: "2026-01-12T14:38:30.332Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-5] useTransactionForm - Final API Item ObjectbaseItem: {produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52', jumlah: 1, durasi: 4, kondisiAwal: 'baik', productSizeId: 'd468dc6c-caaa-43bd-aa86-287f0c705b5f', …}hasLinkedSarungInPayload: truehasManualAdjustment: truelinkedSarungInPayload: {productId: '580300fa-7edb-41f4-a5b9-53b595cb0a68', productSizeId: '8f9345b1-1a9e-4441-ab86-843afb541d4a', quantity: 1, selectedSize: {…}}manualPriceAdjustmentInPayload: {isManuallyAdjusted: true, originalPrice: 100000, adjustmentAmount: 75000, lastModified: '2026-01-12T14:38:18.177Z'}source: "useTransactionForm.submitTransaction"timestamp: "2026-01-12T14:38:30.332Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-4] useTransactionForm - Product Before API Serialization ObjecthasLinkedSarung: truehasManualAdjustment: truemanualPriceAdjustment: {isManuallyAdjusted: true, originalPrice: 100000, adjustmentAmount: 25000, lastModified: '2026-01-12T14:38:21.254Z'}productId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"productName: "Jas Polos Krem"quantity: 1source: "useTransactionForm.submitTransaction"timestamp: "2026-01-12T14:38:30.332Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-5] useTransactionForm - Final API Item ObjectbaseItem: {produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52', jumlah: 1, durasi: 4, kondisiAwal: 'baik', productSizeId: 'd468dc6c-caaa-43bd-aa86-287f0c705b5f', …}hasLinkedSarungInPayload: truehasManualAdjustment: truelinkedSarungInPayload: {productId: '40c48325-4b78-41a6-bb5a-4ca5d814276f', productSizeId: '0c585eab-52a3-4f07-9a22-c06f687ddb1b', quantity: 1, selectedSize: {…}}manualPriceAdjustmentInPayload: {isManuallyAdjusted: true, originalPrice: 100000, adjustmentAmount: 25000, lastModified: '2026-01-12T14:38:21.254Z'}source: "useTransactionForm.submitTransaction"timestamp: "2026-01-12T14:38:30.332Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-4] useTransactionForm - Product Before API Serialization ObjecthasLinkedSarung: falsehasManualAdjustment: falsemanualPriceAdjustment: undefinedproductId: "e2bdb444-f781-4b15-b6d2-9e96df03cd52"productName: "Jas Polos Krem"quantity: 1source: "useTransactionForm.submitTransaction"timestamp: "2026-01-12T14:38:30.332Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🎯 [AUDIT-5] useTransactionForm - Final API Item ObjectbaseItem: {produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52', jumlah: 1, durasi: 4, kondisiAwal: 'baik', productSizeId: 'd468dc6c-caaa-43bd-aa86-287f0c705b5f'}hasLinkedSarungInPayload: falsehasManualAdjustment: falselinkedSarungInPayload: nullmanualPriceAdjustmentInPayload: nullsource: "useTransactionForm.submitTransaction"timestamp: "2026-01-12T14:38:30.333Z"[[Prototype]]: Object
forward-logs-shared.ts:95 🔍 DEBUG POINT 2 - Complete API Payload: ObjectdebugPoint: "API_PAYLOAD_SERIALIZATION"itemsWithLinkedSarung: 2payload: {penyewaId: 'e40877c2-2ca2-465d-b7a3-d538c9a2b5f3', kasirId: 'c91c9a25-bb32-4790-a617-317a284574b2', items: Array(3), tglMulai: '2026-01-28T00:00:00.000Z', tglSelesai: '2026-01-31T00:00:00.000Z', …}timestamp: "2026-01-12T14:38:30.333Z"totalItems: 3[[Prototype]]: Object
forward-logs-shared.ts:95 🚀 TRANSACTION API PAYLOAD
forward-logs-shared.ts:95 📊 Metadata
forward-logs-shared.ts:95 description: Final API request payload that will be sent to POST /api/kasir/transaksi
forward-logs-shared.ts:95 timestamp: 2026-01-12T14:38:30.333Z
forward-logs-shared.ts:95 source: useTransactionForm.submitTransaction
forward-logs-shared.ts:95 endpoint: POST /api/kasir/transaksi
forward-logs-shared.ts:95 format: size-aware
forward-logs-shared.ts:95 📄 Data Payload
forward-logs-shared.ts:95 {  "penyewaId": "e40877c2-2ca2-465d-b7a3-d538c9a2b5f3",  "kasirId": "c91c9a25-bb32-4790-a617-317a284574b2",  "items": [    {      "produkId": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",      "jumlah": 1,      "durasi": 4,      "kondisiAwal": "baik",      "productSizeId": "d468dc6c-caaa-43bd-aa86-287f0c705b5f",      "manualPriceAdjustment": {        "isManuallyAdjusted": true,        "originalPrice": 100000,        "adjustmentAmount": 75000,        "lastModified": "2026-01-12T14:38:18.177Z"      },      "linkedSarung": {        "productId": "580300fa-7edb-41f4-a5b9-53b595cb0a68",        "productSizeId": "8f9345b1-1a9e-4441-ab86-843afb541d4a",        "quantity": 1,        "selectedSize": {          "id": "8f9345b1-1a9e-4441-ab86-843afb541d4a",          "ageCategory": "CHILD",          "size": "UNIVERSAL",          "quantity": 2,          "originalQuantity": 2,          "rentedQuantity": 0,          "availableQuantity": 2,          "color": "CHILD - UNIVERSAL"        }      }    },    {      "produkId": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",      "jumlah": 1,      "durasi": 4,      "kondisiAwal": "baik",      "productSizeId": "d468dc6c-caaa-43bd-aa86-287f0c705b5f",      "manualPriceAdjustment": {        "isManuallyAdjusted": true,        "originalPrice": 100000,        "adjustmentAmount": 25000,        "lastModified": "2026-01-12T14:38:21.254Z"      },      "linkedSarung": {        "productId": "40c48325-4b78-41a6-bb5a-4ca5d814276f",        "productSizeId": "0c585eab-52a3-4f07-9a22-c06f687ddb1b",        "quantity": 1,        "selectedSize": {          "id": "0c585eab-52a3-4f07-9a22-c06f687ddb1b",          "ageCategory": "ADULT",          "size": "UNIVERSAL",          "quantity": 8,          "originalQuantity": 8,          "rentedQuantity": 0,          "availableQuantity": 8,          "color": "ADULT - UNIVERSAL"        }      }    },    {      "produkId": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",      "jumlah": 1,      "durasi": 4,      "kondisiAwal": "baik",      "productSizeId": "d468dc6c-caaa-43bd-aa86-287f0c705b5f"    }  ],  "tglMulai": "2026-01-28T00:00:00.000Z",  "tglSelesai": "2026-01-31T00:00:00.000Z",  "metodeBayar": "tunai",  "catatan": "1. 75K\n2 25K ",  "discountType": "percent",  "discountValue": 10}
forward-logs-shared.ts:95 📦 Items Summary
forward-logs-shared.ts:95 Item 1: Object
forward-logs-shared.ts:95 Item 2: Object
forward-logs-shared.ts:95 Item 3: Object
forward-logs-shared.ts:95 👤 Customer Info
forward-logs-shared.ts:95 Customer ID: e40877c2-2ca2-465d-b7a3-d538c9a2b5f3
forward-logs-shared.ts:95 💼 Kasir Info
forward-logs-shared.ts:95 Kasir ID: c91c9a25-bb32-4790-a617-317a284574b2
forward-logs-shared.ts:95 💰 Pricing Summary
forward-logs-shared.ts:95 Total Items: 3
forward-logs-shared.ts:95 ================================================================================
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 119ms



GET /api/kasir/produk/available?available=true&page=1&limit=12&sortBy=name&sortOrder=asc 200 in 2.7s (compile: 60ms, proxy.ts: 49ms, render: 2.6s)
🚀 TRANSACTION API PAYLOAD
  📊 Metadata
    description: Final API request payload that will be sent to POST /api/kasir/transaksi
    timestamp: 2026-01-12T14:38:30.451Z
    source: useTransactionForm.submitTransaction
    endpoint: POST /api/kasir/transaksi
    format: size-aware
  📄 Data Payload
    {
      "penyewaId": "e40877c2-2ca2-465d-b7a3-d538c9a2b5f3",
      "kasirId": "c91c9a25-bb32-4790-a617-317a284574b2",
      "items": [
        {
          "produkId": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",
          "productSizeId": "d468dc6c-caaa-43bd-aa86-287f0c705b5f",
          "jumlah": 1,
          "durasi": 4,
          "kondisiAwal": "baik",
          "manualPriceAdjustment": {
            "isManuallyAdjusted": true,
            "originalPrice": 100000,
            "adjustmentAmount": 75000,
            "lastModified": "2026-01-12T14:38:18.177Z"
          },
          "linkedSarung": {
            "productId": "580300fa-7edb-41f4-a5b9-53b595cb0a68",
            "productSizeId": "8f9345b1-1a9e-4441-ab86-843afb541d4a",
            "quantity": 1,
            "selectedSize": {
              "id": "8f9345b1-1a9e-4441-ab86-843afb541d4a",
              "size": "UNIVERSAL",
              "ageCategory": "CHILD",
              "quantity": 2,
              "availableQuantity": 2,
              "color": "CHILD - UNIVERSAL",
              "originalQuantity": 2,
              "rentedQuantity": 0
            }
          }
        },
        {
          "produkId": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",
          "productSizeId": "d468dc6c-caaa-43bd-aa86-287f0c705b5f",
          "jumlah": 1,
          "durasi": 4,
          "kondisiAwal": "baik",
          "manualPriceAdjustment": {
            "isManuallyAdjusted": true,
            "originalPrice": 100000,
            "adjustmentAmount": 25000,
            "lastModified": "2026-01-12T14:38:21.254Z"
          },
          "linkedSarung": {
            "productId": "40c48325-4b78-41a6-bb5a-4ca5d814276f",
            "productSizeId": "0c585eab-52a3-4f07-9a22-c06f687ddb1b",
            "quantity": 1,
            "selectedSize": {
              "id": "0c585eab-52a3-4f07-9a22-c06f687ddb1b",
              "size": "UNIVERSAL",
              "ageCategory": "ADULT",
              "quantity": 8,
              "availableQuantity": 8,
              "color": "ADULT - UNIVERSAL",
              "originalQuantity": 8,
              "rentedQuantity": 0
            }
          }
        },
        {
          "produkId": "e2bdb444-f781-4b15-b6d2-9e96df03cd52",
          "productSizeId": "d468dc6c-caaa-43bd-aa86-287f0c705b5f",
          "jumlah": 1,
          "durasi": 4,
          "kondisiAwal": "baik"
        }
      ],
      "tglMulai": "2026-01-28T00:00:00.000Z",
      "tglSelesai": "2026-01-31T00:00:00.000Z",
      "metodeBayar": "tunai",
      "catatan": "1. 75K\n2 25K ",
      "discountType": "percent",
      "discountValue": 10
    }
  📦 Items Summary
    Item 1: {
      index: 1,
      productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
      quantity: 1,
      duration: 4,
      sizeInfo: 'Size: d468dc6c-caaa-43bd-aa86-287f0c705b5f',
      price: undefined
    }
    Item 2: {
      index: 2,
      productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
      quantity: 1,
      duration: 4,
      sizeInfo: 'Size: d468dc6c-caaa-43bd-aa86-287f0c705b5f',
      price: undefined
    }
    Item 3: {
      index: 3,
      productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
      quantity: 1,
      duration: 4,
      sizeInfo: 'Size: d468dc6c-caaa-43bd-aa86-287f0c705b5f',
      price: undefined
    }
  👤 Customer Info
    Customer ID: e40877c2-2ca2-465d-b7a3-d538c9a2b5f3
  💼 Kasir Info
    Kasir ID: c91c9a25-bb32-4790-a617-317a284574b2
  💰 Pricing Summary
    Total Items: 3
================================================================================
🎯 [AUDIT-10] TransaksiService - Total Calculation with Manual Adjustments {
  originalTotal: 270000,
  totalWithManualAdjustments: 400000,
  finalTotalWithAdjustments: 360000,
  hasManualAdjustments: true,
  discountType: 'percent',
  discountValue: 10,
  timestamp: '2026-01-12T14:38:41.895Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
🎯 [AUDIT-7] TransaksiService - Backend Item Processing {
  itemIndex: 0,
  productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  productName: 'Jas Polos Krem',
  hasManualAdjustment: true,
  manualPriceAdjustment: {
    isManuallyAdjusted: true,
    originalPrice: 100000,
    adjustmentAmount: 75000,
    lastModified: '2026-01-12T14:38:18.177Z'
  },
  calculationFinalPrice: 100000,
  originalItemData: {
    produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
    productSizeId: 'd468dc6c-caaa-43bd-aa86-287f0c705b5f',
    jumlah: 1,
    durasi: 4,
    kondisiAwal: 'baik',
    manualPriceAdjustment: {
      isManuallyAdjusted: true,
      originalPrice: 100000,
      adjustmentAmount: 75000,
      lastModified: '2026-01-12T14:38:18.177Z'
    },
    linkedSarung: {
      productId: '580300fa-7edb-41f4-a5b9-53b595cb0a68',
      productSizeId: '8f9345b1-1a9e-4441-ab86-843afb541d4a',
      quantity: 1,
      selectedSize: [Object]
    }
  },
  timestamp: '2026-01-12T14:38:44.576Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
🎯 [AUDIT-8] TransaksiService - Manual Price Adjustment Applied {
  itemIndex: 0,
  productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  originalPrice: 100000,
  adjustmentAmount: 75000,
  finalPrice: 175000,
  calculationPrice: 100000,
  pricePerUnit: 175000,
  timestamp: '2026-01-12T14:38:44.584Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
🎯 [AUDIT-9] TransaksiService - Final Database Item Data {
  itemIndex: 0,
  productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  mainItemData: {
    transaksiId: '65d85295-463b-4e37-bffc-5de869f8dc8d',
    produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
    jumlah: 1,
    hargaSewa: 175000,
    durasi: 4,
    subtotal: 175000,
    kondisiAwal: '{"productSizeId":"d468dc6c-caaa-43bd-aa86-287f0c705b5f","size":"M","ageCategory":"ADULT","condition":"baik","linkedSarung":{"productId":"580300fa-7edb-41f4-a5b9-53b595cb0a68","productSizeId":"8f9345b1-1a9e-4441-ab86-843afb541d4a","quantity":1,"selectedSize":{"id":"8f9345b1-1a9e-4441-ab86-843afb541d4a","productId":"580300fa-7edb-41f4-a5b9-53b595cb0a68","size":"UNIVERSAL","ageCategory":"CHILD","quantity":1,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-01-12T14:38:44.588Z","updatedAt":"2026-01-12T14:38:44.588Z"}}}'       
  },
  subtotalUsed: 175000,
  pricePerUnitUsed: 175000,
  wasManuallyAdjusted: true,
  timestamp: '2026-01-12T14:38:44.588Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
🔍 DEBUG - Simplified KondisiAwal Storage: {
  itemIndex: 1,
  produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  kondisiAwalJSON: '{"productSizeId":"d468dc6c-caaa-43bd-aa86-287f0c705b5f","size":"M","ageCategory":"ADULT","condition":"baik","linkedSarung":{"productId":"580300fa-7edb-41f4-a5b9-53b595cb0a68","productSizeId":"8f9345b1-1a9e-4441-ab86-843afb541d4a","quantity":1,"selectedSize":{"id":"8f9345b1-1a9e-4441-ab86-843afb541d4a","productId":"580300fa-7edb-41f4-a5b9-53b595cb0a68","size":"UNIVERSAL","ageCategory":"CHILD","quantity":1,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-01-12T14:38:44.588Z","updatedAt":"2026-01-12T14:38:44.588Z"}}}',    
  timestamp: '2026-01-12T14:38:44.591Z',
  debugPoint: 'SIMPLIFIED_STORAGE'
}
🎯 [AUDIT-7] TransaksiService - Backend Item Processing {
  itemIndex: 1,
  productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  productName: 'Jas Polos Krem',
  hasManualAdjustment: true,
  manualPriceAdjustment: {
    isManuallyAdjusted: true,
    originalPrice: 100000,
    adjustmentAmount: 25000,
    lastModified: '2026-01-12T14:38:21.254Z'
  },
  calculationFinalPrice: 100000,
  originalItemData: {
    produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
    productSizeId: 'd468dc6c-caaa-43bd-aa86-287f0c705b5f',
    jumlah: 1,
    durasi: 4,
    kondisiAwal: 'baik',
    manualPriceAdjustment: {
      isManuallyAdjusted: true,
      originalPrice: 100000,
      adjustmentAmount: 25000,
      lastModified: '2026-01-12T14:38:21.254Z'
    },
    linkedSarung: {
      productId: '40c48325-4b78-41a6-bb5a-4ca5d814276f',
      productSizeId: '0c585eab-52a3-4f07-9a22-c06f687ddb1b',
      quantity: 1,
      selectedSize: [Object]
    }
  },
  timestamp: '2026-01-12T14:38:45.382Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
🎯 [AUDIT-8] TransaksiService - Manual Price Adjustment Applied {
  itemIndex: 1,
  productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  originalPrice: 100000,
  adjustmentAmount: 25000,
  finalPrice: 125000,
  calculationPrice: 100000,
  pricePerUnit: 125000,
  timestamp: '2026-01-12T14:38:45.388Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
🎯 [AUDIT-9] TransaksiService - Final Database Item Data {
  itemIndex: 1,
  productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  mainItemData: {
    transaksiId: '65d85295-463b-4e37-bffc-5de869f8dc8d',
    produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
    jumlah: 1,
    hargaSewa: 125000,
    durasi: 4,
    subtotal: 125000,
    kondisiAwal: '{"productSizeId":"d468dc6c-caaa-43bd-aa86-287f0c705b5f","size":"M","ageCategory":"ADULT","condition":"baik","linkedSarung":{"productId":"40c48325-4b78-41a6-bb5a-4ca5d814276f","productSizeId":"0c585eab-52a3-4f07-9a22-c06f687ddb1b","quantity":1,"selectedSize":{"id":"0c585eab-52a3-4f07-9a22-c06f687ddb1b","productId":"40c48325-4b78-41a6-bb5a-4ca5d814276f","size":"UNIVERSAL","ageCategory":"ADULT","quantity":1,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-01-12T14:38:45.392Z","updatedAt":"2026-01-12T14:38:45.392Z"}}}'       
  },
  subtotalUsed: 125000,
  pricePerUnitUsed: 125000,
  wasManuallyAdjusted: true,
  timestamp: '2026-01-12T14:38:45.392Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
🔍 DEBUG - Simplified KondisiAwal Storage: {
  itemIndex: 2,
  produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  kondisiAwalJSON: '{"productSizeId":"d468dc6c-caaa-43bd-aa86-287f0c705b5f","size":"M","ageCategory":"ADULT","condition":"baik","linkedSarung":{"productId":"40c48325-4b78-41a6-bb5a-4ca5d814276f","productSizeId":"0c585eab-52a3-4f07-9a22-c06f687ddb1b","quantity":1,"selectedSize":{"id":"0c585eab-52a3-4f07-9a22-c06f687ddb1b","productId":"40c48325-4b78-41a6-bb5a-4ca5d814276f","size":"UNIVERSAL","ageCategory":"ADULT","quantity":1,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-01-12T14:38:45.392Z","updatedAt":"2026-01-12T14:38:45.392Z"}}}',    
  timestamp: '2026-01-12T14:38:45.398Z',
  debugPoint: 'SIMPLIFIED_STORAGE'
}
🎯 [AUDIT-7] TransaksiService - Backend Item Processing {
  itemIndex: 2,
  productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  productName: 'Jas Polos Krem',
  hasManualAdjustment: false,
  manualPriceAdjustment: undefined,
  calculationFinalPrice: 100000,
  originalItemData: {
    produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
    productSizeId: 'd468dc6c-caaa-43bd-aa86-287f0c705b5f',
    jumlah: 1,
    durasi: 4,
    kondisiAwal: 'baik'
  },
  timestamp: '2026-01-12T14:38:45.998Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
ℹ️ No linkedSarung detected for item: {
  itemId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  hasLinkedSarungField: false,
  linkedSarungValue: undefined,
  linkedSarungType: 'undefined',
  timestamp: '2026-01-12T14:38:45.999Z'
}
🎯 [AUDIT-9] TransaksiService - Final Database Item Data {
  itemIndex: 2,
  productId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  mainItemData: {
    transaksiId: '65d85295-463b-4e37-bffc-5de869f8dc8d',
    produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
    jumlah: 1,
    hargaSewa: 100000,
    durasi: 4,
    subtotal: 100000,
    kondisiAwal: '{"productSizeId":"d468dc6c-caaa-43bd-aa86-287f0c705b5f","size":"M","ageCategory":"ADULT","condition":"baik","linkedSarung":null}'
  },
  subtotalUsed: 100000,
  pricePerUnitUsed: 100000,
  wasManuallyAdjusted: false,
  timestamp: '2026-01-12T14:38:46.000Z',
  source: 'TransaksiService.createTransaksiSizeAware'
}
🔍 DEBUG - Simplified KondisiAwal Storage: {
  itemIndex: 3,
  produkId: 'e2bdb444-f781-4b15-b6d2-9e96df03cd52',
  kondisiAwalJSON: '{"productSizeId":"d468dc6c-caaa-43bd-aa86-287f0c705b5f","size":"M","ageCategory":"ADULT","condition":"baik","linkedSarung":null}',
  timestamp: '2026-01-12T14:38:46.000Z',
  debugPoint: 'SIMPLIFIED_STORAGE'
}
🔍 KASIR FLOW DEBUG
  📊 Metadata
    description: Kasir validation and assignment tracking for debugging
    timestamp: 2026-01-12T14:38:48.292Z
    source: TransaksiService.createTransaksiSizeAware
    endpoint: Kasir Flow Tracking
    format: debug-log
  📄 Data Payload
    {
      "transactionCode": "TXN-20260112-007",
      "transactionId": "65d85295-463b-4e37-bffc-5de869f8dc8d",
      "kasirId": "c91c9a25-bb32-4790-a617-317a284574b2",
      "success": "transaction_created_with_enhancements",
      "discountType": "percent",
      "discountValue": 10,
      "duration": 4,
      "timestamp": "2026-01-12T14:38:48.291Z",
      "source": "TransaksiService.createTransaksiSizeAware"
    }
  💼 Kasir Info
    Kasir ID: c91c9a25-bb32-4790-a617-317a284574b2
================================================================================
 POST /api/kasir/transaksi 201 in 17.9s (compile: 8ms, proxy.ts: 18ms, render: 17.9s)
 POST /api/kasir/pembayaran 201 in 7.5s (compile: 460ms, proxy.ts: 28ms, render: 7.0s)
 GET /dashboard?refresh=true 200 in 150ms (compile: 18ms, proxy.ts: 63ms, render: 69ms)
 GET /dashboard 200 in 100ms (compile: 30ms, proxy.ts: 27ms, render: 43ms)
 GET /api/kasir/transaksi?page=1&limit=20 200 in 11.4s (compile: 15ms, proxy.ts: 23ms, r