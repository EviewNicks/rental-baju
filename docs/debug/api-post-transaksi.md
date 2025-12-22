🚀 TRANSACTION API PAYLOAD
  📊 Metadata
    description: Final API request payload that will be sent to POST /api/kasir/transaksi
    timestamp: 2025-12-22T09:11:55.035Z
    source: useTransactionForm.submitTransaction
    endpoint: POST /api/kasir/transaksi
    format: size-aware
  📄 Data Payload
    {
      "penyewaId": "b7513986-9255-4901-bf5c-3ab4f2143f65",
      "kasirId": "3736c6a1-0d87-45fb-8818-3aef983d2c8d",
      "items": [
        {
          "produkId": "c0690c6a-fad1-4077-81df-7b2d61241f9e",
          "productSizeId": "6df6b1be-dae2-4a4a-812d-75b5b240cb06",
          "jumlah": 4,
          "durasi": 4,
          "kondisiAwal": "baik"
        }
      ],
      "tglMulai": "2025-12-25T00:00:00.000Z",
      "tglSelesai": "2025-12-28T00:00:00.000Z",
      "metodeBayar": "tunai",
      "discountType": null,
      "discountValue": null
    }
  📦 Items Summary
    Item 1: {
      index: 1,
      productId: 'c0690c6a-fad1-4077-81df-7b2d61241f9e',
      quantity: 4,
      duration: 4,
      sizeInfo: 'Size: 6df6b1be-dae2-4a4a-812d-75b5b240cb06',
      price: undefined
    }
  👤 Customer Info
    Customer ID: b7513986-9255-4901-bf5c-3ab4f2143f65
  💼 Kasir Info
    Kasir ID: 3736c6a1-0d87-45fb-8818-3aef983d2c8d
  💰 Pricing Summary
    Total Items: 4
================================================================================     
🔍 KASIR FLOW DEBUG
  📊 Metadata
    description: Kasir validation and assignment tracking for debugging
    timestamp: 2025-12-22T09:12:13.637Z
    source: TransaksiService.createTransaksiSizeAware
    endpoint: Kasir Flow Tracking
    format: debug-log
  📄 Data Payload
    {
      "transactionCode": "TXN-20251222-003",
      "transactionId": "a0e12429-961b-4f75-bff2-1f568f737205",
      "kasirId": "3736c6a1-0d87-45fb-8818-3aef983d2c8d",
      "success": "transaction_created_with_enhancements",
      "discountType": null,
      "discountValue": null,
      "duration": 4,
      "timestamp": "2025-12-22T09:12:13.636Z",
      "source": "TransaksiService.createTransaksiSizeAware"
    }
  💼 Kasir Info
    Kasir ID: 3736c6a1-0d87-45fb-8818-3aef983d2c8d
================================================================================
 POST /api/kasir/transaksi 201 in 18.7s (compile: 10ms, proxy.ts: 23ms, render: 18.7s)