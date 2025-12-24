{
    "success": true,
    "data": {
        "id": "ada95869-7879-4829-897f-992b4ce5d2b8",
        "kode": "TXN-20251221-003",
        "penyewa": {
            "id": "b7513986-9255-4901-bf5c-3ab4f2143f65",
            "nama": "Ardiansyah",
            "telepon": "08123456789",
            "alamat": "Indonesia jL. Andi tonro no.4",
            "nik": "1238837212233333",
            "email": "arif4rd759@gmail.com"
        },
        "kasir": {
            "id": "92e1b3c5-538e-4cf1-abc1-749cd3a4bed0",
            "nama": "Inaya",
            "isActive": true,
            "createdAt": "2025-12-19T07:24:52.394Z",
            "updatedAt": "2025-12-19T07:24:52.394Z"
        },
        "status": "active",
        "totalHarga": 823500,
        "jumlahBayar": 823500,
        "sisaBayar": 0,
        "tglMulai": "2025-12-24T00:00:00.000Z",
        "tglSelesai": "2025-12-30T00:00:00.000Z",
        "tglKembali": null,
        "metodeBayar": "tunai",
        "catatan": null,
        "discountType": "percent",
        "discountValue": 10,
        "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
        "createdAt": "2025-12-21T13:53:24.777Z",
        "updatedAt": "2025-12-21T13:53:30.362Z",
        "items": [
            {
                "id": "9225edec-e6bd-41aa-bc38-31dff920b06e",
                "produk": {
                    "id": "97ed3d8e-196a-4b2c-a7bb-e64a410270ca",
                    "code": "TKR08",
                    "name": "Baju Biru Wardah",
                    "modalAwal": 180000,
                    "imageUrl": "/products/image.png",
                    "size": null,
                    "category": "renda"
                },
                "jumlah": 2,
                "jumlahDiambil": 0,
                "hargaSewa": 270000,
                "durasi": 7,
                "subtotal": 540000,
                "kondisiAwal": "ee142fcf-e849-4214-a0a0-194c413b7754|L|ADULT|baik",
                "statusKembali": "belum",
                "totalReturnPenalty": 0
            },
            {
                "id": "9cf7b31f-6d33-474b-b92f-0ab967326972",
                "produk": {
                    "id": "55680f80-662b-4770-8e93-899a324daea1",
                    "code": "JPD05",
                    "name": "Jaguar Premium Datuk",
                    "modalAwal": 250000,
                    "imageUrl": "/products/image.png",
                    "size": null,
                    "category": "jas-premium"
                },
                "jumlah": 1,
                "jumlahDiambil": 0,
                "hargaSewa": 375000,
                "durasi": 7,
                "subtotal": 375000,
                "kondisiAwal": "56a04a95-6066-4b8f-a138-f0f35c2f14a2|UNIVERSAL|ADULT|baik",
                "statusKembali": "belum",
                "totalReturnPenalty": 0
            }
        ],
        "pembayaran": [
            {
                "id": "34637d3a-38eb-4b6c-8a39-b21582661fac",
                "jumlah": 823500,
                "metode": "tunai",
                "referensi": null,
                "catatan": "Pembayaran awal transaksi",
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-21T13:53:30.118Z"
            }
        ],
        "aktivitas": [
            {
                "id": "bac3c7ce-47d1-4b9c-9361-cfc2075e9356",
                "tipe": "dibayar",
                "deskripsi": "Pembayaran tunai sebesar Rp 823.500",
                "data": {
                    "amount": 823500,
                    "method": "tunai",
                    "newTotal": "823500",
                    "paymentId": "34637d3a-38eb-4b6c-8a39-b21582661fac",
                    "remaining": "0"
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-21T13:53:30.616Z"
            },
            {
                "id": "89304ebe-8879-4841-982c-cc1b7e9dc0fc",
                "tipe": "dibuat",
                "deskripsi": "Transaksi TXN-20251221-003 dibuat dengan kasir ter assign dengan diskon percent",
                "data": {
                    "items": 2,
                    "kasirId": "92e1b3c5-538e-4cf1-abc1-749cd3a4bed0",
                    "duration": 7,
                    "subtotal": "915000",
                    "sizeAware": true,
                    "totalHarga": "823500",
                    "discountType": "percent",
                    "discountValue": 10,
                    "discountAmount": "91500",
                    "enhancedSystem": true,
                    "durationMultiplier": 1.5,
                    "transactionDuration": 4024
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-21T13:53:28.097Z"
            }
        ]
    },
    "message": "Detail transaksi berhasil diambil"
}