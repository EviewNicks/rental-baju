{
    "success": true,
    "data": {
        "id": "0b416e40-88c8-4208-8f8e-4f9f2695d838",
        "kode": "TXN-20251225-001",
        "penyewa": {
            "id": "0e665799-38bb-4054-9d29-72522bcf8673",
            "nama": "muhawal",
            "telepon": "089567896322",
            "alamat": "jl.ompinen no.08 kembali",
            "nik": null,
            "email": "arif4rd222@gmail.com"
        },
        "kasir": {
            "id": "92e1b3c5-538e-4cf1-abc1-749cd3a4bed0",
            "nama": "Inaya",
            "isActive": true,
            "createdAt": "2025-12-19T07:24:52.394Z",
            "updatedAt": "2025-12-19T07:24:52.394Z"
        },
        "status": "active",
        "totalHarga": 448000,
        "jumlahBayar": 448000,
        "sisaBayar": 0,
        "tglMulai": "2025-12-31T00:00:00.000Z",
        "tglSelesai": "2026-01-03T00:00:00.000Z",
        "tglKembali": null,
        "metodeBayar": "bca",
        "catatan": null,
        "discountType": "percent",
        "discountValue": 20,
        "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
        "createdAt": "2025-12-25T08:37:17.827Z",
        "updatedAt": "2025-12-25T08:39:55.068Z",
        "items": [
            {
                "id": "b0bf36f2-9b07-4d9b-ab61-a90ed877fe74",
                "produk": {
                    "id": "683ee614-77bb-4c99-a7b4-6dfed5f1f495",
                    "code": "AMP01",
                    "name": "Anting Mutiara Putih",
                    "modalAwal": 30000,
                    "imageUrl": "https://pmjxdencfgkbjuyjndbp.supabase.co/storage/v1/object/public/products/products/AMP01/1766069051292.jpg",
                    "size": null,
                    "category": "anting"
                },
                "jumlah": 2,
                "jumlahDiambil": 0,
                "hargaSewa": 30000,
                "durasi": 4,
                "subtotal": 60000,
                "kondisiAwal": "e7ff3651-f9c5-435d-be0c-c51550e1f435|UNIVERSAL|UNIVERSAL|baik",
                "statusKembali": "belum",
                "totalReturnPenalty": 0
            },
            {
                "id": "c0781b86-cd3d-4a48-9f1a-07c9d56b06aa",
                "produk": {
                    "id": "f95ae149-5c52-4ce7-bb66-4ee53b09d3ee",
                    "code": "JPM04",
                    "name": "Jaguar Premium Maroon",
                    "modalAwal": 250000,
                    "imageUrl": "https://pmjxdencfgkbjuyjndbp.supabase.co/storage/v1/object/public/products/products/JPM04/1766068426247.jpg",
                    "size": null,
                    "category": "jas-premium"
                },
                "jumlah": 2,
                "jumlahDiambil": 0,
                "hargaSewa": 250000,
                "durasi": 4,
                "subtotal": 500000,
                "kondisiAwal": "e69baa35-f1e6-4f2e-beb5-70a8f9ad9787|UNIVERSAL|ADULT|baik",
                "statusKembali": "belum",
                "totalReturnPenalty": 0
            }
        ],
        "pembayaran": [
            {
                "id": "4511fa5f-d851-4cbf-9b9c-4bbdb80e465a",
                "jumlah": 248000,
                "metode": "qris",
                "referensi": null,
                "catatan": null,
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-25T08:39:54.820Z"
            },
            {
                "id": "f8d49687-83ca-4b6e-8249-14cd33086549",
                "jumlah": 200000,
                "metode": "bca",
                "referensi": null,
                "catatan": "Pembayaran awal transaksi",
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-25T08:37:22.665Z"
            }
        ],
        "aktivitas": [
            {
                "id": "a577950c-27be-4933-bac5-97371d21eaf8",
                "tipe": "dibayar",
                "deskripsi": "Pembayaran qris sebesar Rp 248.000",
                "data": {
                    "amount": 248000,
                    "method": "qris",
                    "newTotal": "448000",
                    "paymentId": "4511fa5f-d851-4cbf-9b9c-4bbdb80e465a",
                    "remaining": "0"
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-25T08:39:55.316Z"
            },
            {
                "id": "f05405fd-8351-4e3f-b4b1-a0b0f44d6770",
                "tipe": "dibayar",
                "deskripsi": "Pembayaran bca sebesar Rp 200.000",
                "data": {
                    "amount": 200000,
                    "method": "bca",
                    "newTotal": "200000",
                    "paymentId": "f8d49687-83ca-4b6e-8249-14cd33086549",
                    "remaining": "248000"
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-25T08:37:23.273Z"
            },
            {
                "id": "1c1fa438-f503-44e6-ac14-7d7faa3e89e1",
                "tipe": "dibuat",
                "deskripsi": "Transaksi TXN-20251225-001 dibuat dengan kasir ter assign dengan diskon percent",
                "data": {
                    "items": 2,
                    "kasirId": "92e1b3c5-538e-4cf1-abc1-749cd3a4bed0",
                    "duration": 4,
                    "subtotal": "560000",
                    "sizeAware": true,
                    "totalHarga": "448000",
                    "discountType": "percent",
                    "discountValue": 20,
                    "discountAmount": "112000",
                    "enhancedSystem": true,
                    "durationMultiplier": 1,
                    "transactionDuration": 6018
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-25T08:37:20.823Z"
            }
        ]
    },
    "message": "Detail transaksi berhasil diambil"
}