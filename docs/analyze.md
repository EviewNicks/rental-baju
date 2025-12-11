{
    "success": true,
    "data": {
        "id": "6e187d7e-5eda-492d-ad56-251f39e355be",
        "kode": "TXN-20251209-005",
        "penyewa": {
            "id": "1bb8111f-e344-47f5-a4e9-78d78c3df0fa",
            "nama": "Abdul",
            "telepon": "089675423222",
            "alamat": "Jl. kunuba no.8 tenri ajeng bolong ringgi"
        },
        "kasir": {
            "id": "cbd0f1ad-5838-47e8-8ddb-8c3c147b9382",
            "nama": "Intan",
            "isActive": true,
            "createdAt": "2025-12-09T10:42:48.230Z",
            "updatedAt": "2025-12-09T10:42:48.230Z"
        },
        "status": "active",
        "totalHarga": 240000,
        "jumlahBayar": 240000,
        "sisaBayar": 0,
        "tglMulai": "2025-12-11T00:00:00.000Z",
        "tglSelesai": "2025-12-15T00:00:00.000Z",
        "tglKembali": null,
        "metodeBayar": "tunai",
        "catatan": null,
        "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
        "createdAt": "2025-12-09T13:07:38.167Z",
        "updatedAt": "2025-12-09T13:07:44.989Z",
        "items": [
            {
                "id": "29690ac0-b3f6-44ce-bf8b-a5b663b59736",
                "produk": {
                    "id": "3fa344e0-12b7-4cdf-99a7-53b65bb61097",
                    "code": "PRD01",
                    "name": "Dress Pesta Merah ",
                    "modalAwal": 2000000,
                    "imageUrl": "https://pmjxdencfgkbjuyjndbp.supabase.co/storage/v1/object/public/products/products/PRD01/1764161669099.jpg",
                    "size": null,
                    "category": "organza"
                },
                "jumlah": 2,
                "jumlahDiambil": 0,
                "hargaSewa": 60000,
                "durasi": 4,
                "subtotal": 120000,
                "kondisiAwal": "d0b09c4c-29ac-4730-8157-bf11e39aa935|XL|ADULT|baik",
                "statusKembali": "belum",
                "totalReturnPenalty": 0
            },
            {
                "id": "ecfb61cc-76a9-40a5-ad2f-49b17c11fc6d",
                "produk": {
                    "id": "3fa344e0-12b7-4cdf-99a7-53b65bb61097",
                    "code": "PRD01",
                    "name": "Dress Pesta Merah ",
                    "modalAwal": 2000000,
                    "imageUrl": "https://pmjxdencfgkbjuyjndbp.supabase.co/storage/v1/object/public/products/products/PRD01/1764161669099.jpg",
                    "size": null,
                    "category": "organza"
                },
                "jumlah": 2,
                "jumlahDiambil": 0,
                "hargaSewa": 60000,
                "durasi": 4,
                "subtotal": 120000,
                "kondisiAwal": "bb385d3f-d3c1-4e17-ae91-0f234760a740|XS|CHILD|baik",
                "statusKembali": "belum",
                "totalReturnPenalty": 0
            }
        ],
        "pembayaran": [
            {
                "id": "10c18886-10fd-4e58-b758-08517d4c9cff",
                "jumlah": 240000,
                "metode": "tunai",
                "referensi": null,
                "catatan": "Pembayaran awal transaksi",
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-09T13:07:44.647Z"
            }
        ],
        "aktivitas": [
            {
                "id": "a20d558e-2e6a-428d-a7dd-70269069f28b",
                "tipe": "dibayar",
                "deskripsi": "Pembayaran tunai sebesar Rp 240.000",
                "data": {
                    "amount": 240000,
                    "method": "tunai",
                    "newTotal": "240000",
                    "paymentId": "10c18886-10fd-4e58-b758-08517d4c9cff",
                    "remaining": "0"
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-09T13:07:45.313Z"
            },
            {
                "id": "09ef290b-2901-4dbf-bc4b-d6f45021b36e",
                "tipe": "dibuat",
                "deskripsi": "Transaksi TXN-20251209-005 dibuat dengan kasir ter assign",
                "data": {
                    "items": 2,
                    "kasirId": "cbd0f1ad-5838-47e8-8ddb-8c3c147b9382",
                    "sizeAware": true,
                    "totalHarga": "240000",
                    "optimizedSystem": true,
                    "transactionDuration": 4480
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-12-09T13:07:41.783Z"
            }
        ]
    },
    "message": "Detail transaksi berhasil diambil"
}