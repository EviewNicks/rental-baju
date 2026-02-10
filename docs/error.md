 GET /api/products/81335d70-ba9d-4c40-8a30-8efed664beaf/history?page=1&limit=10&sortBy=date&sortOrder=desc 200 in 7.1s (compile: 1553ms, proxy.ts: 17ms, render: 5.5s)
 GET /api/kasir/transaksi/product-history?productSizeId=81335d70-ba9d-4c40-8a30-8efed664beaf 404 in 1599ms (compile: 1326ms, proxy.ts: 17ms, render: 255ms)
[ProductHistoryAPI] Calling history service: {
  productSizeId: '81335d70-ba9d-4c40-8a30-8efed664beaf',
  statuses: [ 'active', 'diambil' ],
  limit: 50,
  sortBy: 'date_proximity',
  timestamp: '2026-02-09T14:57:38.250Z'
}
[ItemHistoryService] Fetching transaction history: {
  productSizeId: '81335d70-ba9d-4c40-8a30-8efed664beaf',
  statuses: [ 'active', 'diambil' ],
  limit: 50,
  sortBy: 'date_proximity',
  timestamp: '2026-02-09T14:57:38.256Z'
}
[ItemHistoryService] Query pattern: {
  productSizeId: '81335d70-ba9d-4c40-8a30-8efed664beaf',
  queryPattern: '81335d70-ba9d-4c40-8a30-8efed664beaf|',
  expectedFormat: '"productSizeId|size|ageCategory|condition"'
}
[ItemHistoryService] Query results: {
  productSizeId: '81335d70-ba9d-4c40-8a30-8efed664beaf',
  transactionsFound: 0,
  transactionCodes: [],
  timestamp: '2026-02-09T14:57:39.247Z'
}
[ProductHistoryAPI] History service returned: {
  productSizeId: '81335d70-ba9d-4c40-8a30-8efed664beaf',
  resultsCount: 0,
  timestamp: '2026-02-09T14:57:39.256Z'
}
 GET /api/kasir/transaksi/product-history?productSizeId=81335d70-ba9d-4c40-8a30-8efed664beaf 200 in 1110ms (compile: 37ms, proxy.ts: 31ms, render: 1041ms)



{
    "success": true,
    "data": [],
    "cached": false,
    "metadata": {
        "productSizeId": "81335d70-ba9d-4c40-8a30-8efed664beaf",
        "statuses": [
            "active",
            "diambil"
        ],
        "limit": 50,
        "sortBy": "date_proximity",
        "totalResults": 0,
        "cacheExpiresAt": "2026-02-09T15:02:39.260Z",
        "serviceUsed": "ItemHistoryService"
    }
}