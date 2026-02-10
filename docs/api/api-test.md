{{base_url}}/api/products/{{product_id}}/history?page=1&limit=10

{
    "success": true,
    "data": [
        {
            "id": "e65869d8-419e-4c86-9555-ee5a5b871748",
            "transactionCode": "TXN-20260209-001",
            "transactionDate": "2026-02-09T13:39:04.051Z",
            "rentalStart": "2026-02-12T00:00:00.000Z",
            "rentalEnd": "2026-02-15T00:00:00.000Z",
            "customerName": "Army",
            "customerContact": "082****915",
            "baseRevenue": 300000,
            "penaltyAmount": 0,
            "totalRevenue": 300000,
            "status": "active",
            "itemQuantity": 2,
            "duration": 4,
            "activities": [
                {
                    "id": "d9f397b9-fcac-44d1-ad0e-469b15f0fe95",
                    "type": "dibayar",
                    "typeLabel": "Aktivitas Lainnya",
                    "description": "Pembayaran tunai sebesar Rp 405.000",
                    "createdAt": "2026-02-09T13:39:13.808Z",
                    "createdBy": "user_2zqMR8BytXixaDKNlvkF8Hm7pOp"
                },
                {
                    "id": "ff85398c-7ec5-4879-8ab8-390338e0e11a",
                    "type": "dibuat",
                    "typeLabel": "Transaksi Dibuat",
                    "description": "Transaksi TXN-20260209-001 dibuat dengan kasir ter assign dengan diskon percent dengan 2 pairing jas-sarung",
                    "createdAt": "2026-02-09T13:39:09.280Z",
                    "createdBy": "user_2zqMR8BytXixaDKNlvkF8Hm7pOp",
                    "metadata": {
                        "kasirId": "96930b03-8ddf-4d45-ab6b-fb5ea9620bd8",
                        "items": 2
                    }
                }
            ]
        },
        {
            "id": "cc91a98d-7f99-4ce6-9a4b-5895cc241ee5",
            "transactionCode": "TXN-20260209-001",
            "transactionDate": "2026-02-09T13:39:04.051Z",
            "rentalStart": "2026-02-12T00:00:00.000Z",
            "rentalEnd": "2026-02-15T00:00:00.000Z",
            "customerName": "Army",
            "customerContact": "082****915",
            "baseRevenue": 150000,
            "penaltyAmount": 0,
            "totalRevenue": 150000,
            "status": "active",
            "itemQuantity": 1,
            "duration": 4,
            "activities": [
                {
                    "id": "d9f397b9-fcac-44d1-ad0e-469b15f0fe95",
                    "type": "dibayar",
                    "typeLabel": "Aktivitas Lainnya",
                    "description": "Pembayaran tunai sebesar Rp 405.000",
                    "createdAt": "2026-02-09T13:39:13.808Z",
                    "createdBy": "user_2zqMR8BytXixaDKNlvkF8Hm7pOp"
                },
                {
                    "id": "ff85398c-7ec5-4879-8ab8-390338e0e11a",
                    "type": "dibuat",
                    "typeLabel": "Transaksi Dibuat",
                    "description": "Transaksi TXN-20260209-001 dibuat dengan kasir ter assign dengan diskon percent dengan 2 pairing jas-sarung",
                    "createdAt": "2026-02-09T13:39:09.280Z",
                    "createdBy": "user_2zqMR8BytXixaDKNlvkF8Hm7pOp",
                    "metadata": {
                        "kasirId": "96930b03-8ddf-4d45-ab6b-fb5ea9620bd8",
                        "items": 2
                    }
                }
            ]
        },
        {
            "id": "e84424a0-c83c-48a3-a508-907e9a081902",
            "transactionCode": "TXN-20260204-001",
            "transactionDate": "2026-02-04T07:58:24.753Z",
            "rentalStart": "2026-02-20T00:00:00.000Z",
            "rentalEnd": "2026-02-23T00:00:00.000Z",
            "customerName": "aina",
            "customerContact": "088****577",
            "baseRevenue": 300000,
            "penaltyAmount": 0,
            "totalRevenue": 300000,
            "status": "active",
            "itemQuantity": 2,
            "duration": 4,
            "activities": [
                {
                    "id": "5dd07665-e4f7-43de-8739-6a9298bcb0c2",
                    "type": "dibuat",
                    "typeLabel": "Transaksi Dibuat",
                    "description": "Transaksi TXN-20260204-001 dibuat dengan kasir ter assign dengan 1 pairing jas-sarung",
                    "createdAt": "2026-02-04T07:58:28.633Z",
                    "createdBy": "user_2zqMR8BytXixaDKNlvkF8Hm7pOp",
                    "metadata": {
                        "kasirId": "14c3d488-d11d-4830-a20d-c838d0df745a",
                        "items": 1
                    }
                }
            ]
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 3,
        "totalPages": 1
    },
    "summary": {
        "totalRevenue": 750000,
        "totalTransactions": 3,
        "averageRentalDuration": 4
    }
}