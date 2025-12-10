{
    "success": true,
    "data": {
        "id": "3c219f64-9ea0-4efe-b7f3-6e9f7d1839b8",
        "kode": "TXN-20251126-001",
        "penyewa": {
            "id": "e102c9f8-3cc6-4dd1-b480-7b36f4bce025",
            "nama": "Ardiansyah",
            "telepon": "08123456789",
            "alamat": "Indonesia jL. Andi tonro no.4"
        },
        "status": "active",
        "totalHarga": 240000,
        "jumlahBayar": 240000,
        "sisaBayar": 0,
        "tglMulai": "2025-11-27T00:00:00.000Z",
        "tglSelesai": "2025-12-01T00:00:00.000Z",
        "tglKembali": null,
        "metodeBayar": "tunai",
        "catatan": null,
        "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
        "createdAt": "2025-11-26T12:58:34.224Z",
        "updatedAt": "2025-11-26T12:58:43.751Z",
        "items": [
            {
                "id": "e2e9100a-a7e2-4cb7-9de8-41677659948a",
                "produk": {
                    "id": "3fa344e0-12b7-4cdf-99a7-53b65bb61097",
                    "code": "PRD01",
                    "name": "Dress Pesta Merah ",
                    "modalAwal": 800000,
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
                "id": "b8347f84-24bf-4fe2-8789-7f46a5491b59",
                "produk": {
                    "id": "3fa344e0-12b7-4cdf-99a7-53b65bb61097",
                    "code": "PRD01",
                    "name": "Dress Pesta Merah ",
                    "modalAwal": 800000,
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
                "id": "12411b2c-bf1d-467e-94ad-0f93aebbce20",
                "jumlah": 240000,
                "metode": "tunai",
                "referensi": null,
                "catatan": "Pembayaran awal transaksi",
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-11-26T12:58:43.484Z"
            }
        ],
        "aktivitas": [
            {
                "id": "fea94e02-7350-44b3-a625-f3a1526f4adc",
                "tipe": "dibayar",
                "deskripsi": "Pembayaran tunai sebesar Rp 240.000",
                "data": {
                    "amount": 240000,
                    "method": "tunai",
                    "newTotal": "240000",
                    "paymentId": "12411b2c-bf1d-467e-94ad-0f93aebbce20",
                    "remaining": "0"
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-11-26T12:58:44.078Z"
            },
            {
                "id": "d3693ea0-a945-4a12-8a28-9d840ae92e4e",
                "tipe": "dibuat",
                "deskripsi": "Transaksi TXN-20251126-001 dibuat dengan kasir ter assign",
                "data": {
                    "items": 2,
                    "kasirId": "87b1808d-f6cc-4e55-8749-24903cccc3b4",
                    "sizeAware": true,
                    "totalHarga": "240000",
                    "optimizedSystem": true,
                    "transactionDuration": 3463
                },
                "createdBy": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
                "createdAt": "2025-11-26T12:58:37.416Z"
            }
        ],
        "kasir": {
            "id": "user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH",
            "name": "owner+clerk_test@example.com",
            "email": "owner+clerk_test@example.com",
            "avatar": "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yem5qSElTc1J4b1k2NDFkblVsWTZ5eklONUQiLCJyaWQiOiJ1c2VyXzJ6cU45a2R0WnNJRmNRY0g0SXdjMURydEtvSCJ9"
        }
    },
    "message": "Detail transaksi berhasil diambil"
}