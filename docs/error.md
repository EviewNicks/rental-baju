[Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 287ms
StrategyFactory.ts:115 StrategyFactory: Created clothing strategy for category "renda" (80c9cc6c-7091-4a2d-af22-e50824a278a0)
StrategyFactory.ts:118 StrategyFactory: Edit mode with 1 existing size entries
StrategyFactory.ts:115 StrategyFactory: Created clothing strategy for category "renda" (80c9cc6c-7091-4a2d-af22-e50824a278a0)
StrategyFactory.ts:118 StrategyFactory: Edit mode with 1 existing size entries
3ProductFormPage.tsx:466 [PRODUCTFORMPAGE] strategySizes updated: [{"ageCategory":"ADULT","size":"L","quantity":4,"isActive":true}]
ProductFormPage.tsx:466 [PRODUCTFORMPAGE] strategySizes updated: [{"ageCategory":"ADULT","size":"L","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"XS","quantity":4,"isActive":true}]
ProductFormPage.tsx:466 [PRODUCTFORMPAGE] strategySizes updated: [{"ageCategory":"ADULT","size":"L","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"XS","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"M","quantity":4,"isActive":true}]
ProductFormPage.tsx:466 [PRODUCTFORMPAGE] strategySizes updated: [{"ageCategory":"ADULT","size":"L","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"XS","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"M","quantity":4,"isActive":true},{"ageCategory":"CHILD","size":"XL","quantity":4,"isActive":true}]
ProductFormPage.tsx:558 [PRODUCTFOMPAGE] Size transformation result: {source: 'strategy', strategySizesCount: 4, strategySizes: '[{"ageCategory":"ADULT","size":"L","quantity":4,"i…CHILD","size":"XL","quantity":4,"isActive":true}]', simplifiedSizesCount: 1, simplifiedSizes: '[{"id":"70e2feaf-b566-4d03-a01a-10ff648a806f","size":"L","ageCategory":"ADULT","quantity":4}]', …}
api.ts:123 [DEBUG][API] updateProduct FormData entries:
api.ts:125   name: Renda Mocca Doping
api.ts:125   description: 
api.ts:125   modalAwal: 0
api.ts:125   currentPrice: 180000
api.ts:125   quantity: 16
api.ts:125   categoryId: 80c9cc6c-7091-4a2d-af22-e50824a278a0
api.ts:125   sizes: [{"ageCategory":"ADULT","size":"L","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"XS","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"M","quantity":4,"isActive":true},{"ageCategory":"CHILD","size":"XL","quantity":4,"isActive":true}]
api.ts:125   imageUrl: https://dwqtihibjnveiplkfanh.supabase.co/storage/v1/object/public/products/products/RMD04/1771640526979.jpg
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 104ms
useProducts.ts:113 [HOOK] Product updated successfully: {productId: '3b71683d-b08b-4c79-9f22-2b533b7d9159', productName: 'Renda Mocca Doping', timestamp: '2026-04-13T13:31:21.444Z'}productId: "3b71683d-b08b-4c79-9f22-2b533b7d9159"productName: "Renda Mocca Doping"timestamp: "2026-04-13T13:31:21.444Z"[[Prototype]]: Object



Slow aggregation calculation for product 3b71683d-b08b-4c79-9f22-2b533b7d9159: 931ms
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159?includeAggregation=true&includeBreakEven=true 200 in 8.1s (compile: 85ms, proxy.ts: 3.1s, render: 4.9s)
 GET /producer/manage-product/3b71683d-b08b-4c79-9f22-2b533b7d9159 200 in 294ms (compile: 67ms, proxy.ts: 43ms, render: 184ms)
 POST /producer/manage-product/3b71683d-b08b-4c79-9f22-2b533b7d9159 200 in 144ms (compile: 98ms, proxy.ts: 28ms, render: 18ms)
Slow aggregation calculation for product 3b71683d-b08b-4c79-9f22-2b533b7d9159: 925ms
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159?includeAggregation=true&includeBreakEven=true 200 in 3.8s (compile: 60ms, proxy.ts: 29ms, render: 3.7s)
[ProductHistoryService] Invalid kondisiAwal format (insufficient parts): {"productSizeId":"ed4effc2-83ac-4481-9f1c-01af6fc38e6c","size":"XS","ageCategory":"CHILD","condition":"baik","linkedSarung":{"productId":"6aa953a1-2935-4b3f-bd25-a81e9f6e1478","productSizeId":

                                                                                                                                                                                                                                                                        :"2dae7ed0-9319-4abc-9af7-635b2d024c75","quantity":2,"selectedSize":{"id":"2dae7ed0-9319-4abc-9af7-635b2d024c75","productId":"6aa953a1-2935-4b3f-bd25-a81e9f6e1478","size":"UNIVERSAL","ageCategory":"CHILD","quantity":2,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-04-12T07:43:14.942Z","updatedAt":"2026-04-12T07:43:14.942Z"}}}
[ProductHistoryService] Invalid kondisiAwal format (insufficient parts): {"productSizeId":"c9ad50d5-c30b-454f-a828-5f8fc8e7509d","size":"M","ageCategory":"CHILD","condition":"baik","linkedSarung":{"productId":"6aa953a1-2935-4b3f-bd25-a81e9f6e1478","productSizeId":"2dae7ed0-9319-4abc-9af7-635b2d024c75","quantity":1,"selectedSize":{"id":"2dae7ed0-9319-4abc-9af7-635b2d024c75","productId":"6aa953a1-2935-4b3f-bd25-a81e9f6e1478","size":"UNIVERSAL","ageCategory":"CHILD","quantity":1,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-04-12T07:43:14.942Z","updatedAt":"2026-04-12T07:43:14.942Z"}}}
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159/history?page=1&limit=10&sortBy=date&sortOrder=desc 200 in 3.6s (compile: 31ms, proxy.ts: 17ms, render: 3.5s)
 GET /producer/manage-product/edit/3b71683d-b08b-4c79-9f22-2b533b7d9159 200 in 1163ms (compile: 954ms, proxy.ts: 32ms, render: 176ms)
Slow aggregation calculation for product 3b71683d-b08b-4c79-9f22-2b533b7d9159: 928ms
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159?includeAggregation=true 200 in 3.4s (compile: 155ms, proxy.ts: 370ms, render: 2.9s)
 GET /api/categories?isActive=true 200 in 701ms (compile: 50ms, proxy.ts: 67ms, render: 585ms)
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159/costs 200 in 2.8s (compile: 257ms, proxy.ts: 104ms, render: 2.4s)
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159/costs 200 in 3.0s (compile: 206ms, proxy.ts: 78ms, render: 2.8s)
[DEBUG][SERVICE] updateProduct request.sizes: [{"ageCategory":"ADULT","size":"L","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"XS","quantity":4,"isActive":true},{"ageCategory":"ADULT","size":"M","quantity":4,"isActive":true},{"ageCategory":"CHILD","size":"XL","quantity":4,"isActive":true}]
[DEBUG][SERVICE] updateProduct validatedData.sizes: [{"ageCategory":"ADULT","size":"L","quantity":4,"rentedQuantity":0,"isActive":true},{"ageCategory":"ADULT","size":"XS","quantity":4,"rentedQuantity":0,"isActive":true},{"ageCategory":"ADULT","size":"M","quantity":4,"rentedQuantity":0,"isActive":true},{"ageCategory":"CHILD","size":"XL","quantity":4,"rentedQuantity":0,"isActive":true}]
[DEBUG][SERVICE] updateProduct - validatedData.sizes: [{"ageCategory":"ADULT","size":"L","quantity":4,"rentedQuantity":0,"isActive":true},{"ageCategory":"ADULT","size":"XS","quantity":4,"rentedQuantity":0,"isActive":true},{"ageCategory":"ADULT","size":"M","quantity":4,"rentedQuantity":0,"isActive":true},{"ageCategory":"CHILD","size":"XL","quantity":4,"rentedQuantity":0,"isActive":true}]
[DEBUG][SERVICE] updateProduct - processedSizes: [{"ageCategory":"ADULT","size":"L","quantity":4,"rentedQuantity":0,"isActive":true,"originalQuantity":4,"availableQuantity":4,"lostQuantity":0},{"ageCategory":"ADULT","size":"XS","quantity":4,"rentedQuantity":0,"isActive":true,"originalQuantity":4,"availableQuantity":4,"lostQuantity":0},{"ageCategory":"ADULT","size":"M","quantity":4,"rentedQuantity":0,"isActive":true,"originalQuantity":4,"availableQuantity":4,"lostQuantity":0},{"ageCategory":"CHILD","size":"XL","quantity":4,"rentedQuantity":0,"isActive":true,"originalQuantity":4,"availableQuantity":4,"lostQuantity":0}]
[DEBUG][TX] existingSizes from DB: [{"id":"f121bcbb-d9a3-4c00-abac-98a82c3590d4","ageCategory":"CHILD","size":"S","rentedQuantity":0,"lostQuantity":0,"isActive":false},{"id":"baf6f6e4-dc41-4470-9b75-7d77f1bb873d","ageCategory":"ADULT","size":"XXL","rentedQuantity":0,"lostQuantity":0,"isActive":false},{"id":"5506c19d-97d3-4c95-a8d8-6e893685cfa0","ageCategory":"ADULT","size":"XS","rentedQuantity":0,"lostQuantity":0,"isActive":false},{"id":"8af02551-47af-4df8-8158-a938305312b1","ageCategory":"ADULT","size":"S","rentedQuantity":0,"lostQuantity":0,"isActive":false},{"id":"a8da2026-f5c5-421b-be82-705852f3917d","ageCategory":"ADULT","size":"XL","rentedQuantity":0,"lostQuantity":0,"isActive":false},{"id":"c9ad50d5-c30b-454f-a828-5f8fc8e7509d","ageCategory":"CHILD","size":"M","rentedQuantity":0,"lostQuantity":0,"isActive":false},{"id":"ed4effc2-83ac-4481-9f1c-01af6fc38e6c","ageCategory":"CHILD","size":"XS","rentedQuantity":0,"lostQuantity":0,"isActive":false},{"id":"70e2feaf-b566-4d03-a01a-10ff648a806f","ageCategory":"ADULT","size":"L","rentedQuantity":0,"lostQuantity":0,"isActive":true},{"id":"348a5258-8caa-4fdd-a5c1-2e0747deb69d","ageCategory":"CHILD","size":"L","rentedQuantity":0,"lostQuantity":0,"isActive":false},{"id":"519595fd-2884-472f-bcc9-d07e3028f54e","ageCategory":"ADULT","size":"M","rentedQuantity":0,"lostQuantity":0,"isActive":false}]
[DEBUG][TX] processedSizes to apply: [{"ageCategory":"ADULT","size":"L","quantity":4,"rentedQuantity":0,"isActive":true,"originalQuantity":4,"availableQuantity":4,"lostQuantity":0},{"ageCategory":"ADULT","size":"XS","quantity":4,"rentedQuantity":0,"isActive":true,"originalQuantity":4,"availableQuantity":4,"lostQuantity":0},{"ageCategory":"ADULT","size":"M","quantity":4,"rentedQuantity":0,"isActive":true,"originalQuantity":4,"availableQuantity":4,"lostQuantity":0},{"ageCategory":"CHILD","size":"XL","quantity":4,"rentedQuantity":0,"isActive":true,"originalQuantity":4,"availableQuantity":4,"lostQuantity":0}]
[DEBUG][TX] Processing size key=ADULT-L, existing=UPDATE
[DEBUG][TX] UPDATED size ADULT-L qty=4
[DEBUG][TX] Processing size key=ADULT-XS, existing=CREATE
[DEBUG][TX] RE-ACTIVATED soft-deleted size ADULT-XS qty=4
[DEBUG][TX] Processing size key=ADULT-M, existing=CREATE
[DEBUG][TX] RE-ACTIVATED soft-deleted size ADULT-M qty=4
[DEBUG][TX] Processing size key=CHILD-XL, existing=CREATE
[DEBUG][TX] CREATED size CHILD-XL qty=4
[DEBUG][TX] sizesToDelete (soft-delete): []
 PUT /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159 200 in 6.0s (compile: 100ms, proxy.ts: 16ms, render: 5.9s)
 GET /producer/manage-product/3b71683d-b08b-4c79-9f22-2b533b7d9159 200 in 192ms (compile: 117ms, proxy.ts: 33ms, render: 42ms)
Slow aggregation calculation for product 3b71683d-b08b-4c79-9f22-2b533b7d9159: 975ms
Slow aggregation calculation for product 3b71683d-b08b-4c79-9f22-2b533b7d9159: 1545ms
[ProductHistoryService] Invalid kondisiAwal format (insufficient parts): {"productSizeId":"ed4effc2-83ac-4481-9f1c-01af6fc38e6c","size":"XS","ageCategory":"CHILD","condition":"baik","linkedSarung":{"productId":"6aa953a1-2935-4b3f-bd25-a81e9f6e1478","productSizeId":"2dae7ed0-9319-4abc-9af7-635b2d024c75","quantity":2,"selectedSize":{"id":"2dae7ed0-9319-4abc-9af7-635b2d024c75","productId":"6aa953a1-2935-4b3f-bd25-a81e9f6e1478","size":"UNIVERSAL","ageCategory":"CHILD","quantity":2,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-04-12T07:43:14.942Z","updatedAt":"2026-04-12T07:43:14.942Z"}}}
[ProductHistoryService] Invalid kondisiAwal format (insufficient parts): {"productSizeId":"c9ad50d5-c30b-454f-a828-5f8fc8e7509d","size":"M","ageCategory":"CHILD","condition":"baik","linkedSarung":{"productId":"6aa953a1-2935-4b3f-bd25-a81e9f6e1478","productSizeId":"2dae7ed0-9319-4abc-9af7-635b2d024c75","quantity":1,"selectedSize":{"id":"2dae7ed0-9319-4abc-9af7-635b2d024c75","productId":"6aa953a1-2935-4b3f-bd25-a81e9f6e1478","size":"UNIVERSAL","ageCategory":"CHILD","quantity":1,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-04-12T07:43:14.942Z","updatedAt":"2026-04-12T07:43:14.942Z"}}}
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159?includeAggregation=true 200 in 3.5s (compile: 81ms, proxy.ts: 36ms, render: 3.4s)
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159?includeAggregation=true 200 in 3.6s (compile: 62ms, proxy.ts: 35ms, render: 3.5s)
Slow aggregation calculation for product 3b71683d-b08b-4c79-9f22-2b533b7d9159: 1008ms
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159/history?page=1&limit=10&sortBy=date&sortOrder=desc 200 in 4.3s (compile: 56ms, proxy.ts: 24ms, render: 4.2s)
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159?includeAggregation=true&includeBreakEven=true 200 in 5.8s (compile: 60ms, proxy.ts: 32ms, render: 5.7s)
 GET /producer/manage-product/edit/3b71683d-b08b-4c79-9f22-2b533b7d9159 200 in 1704ms (compile: 57ms, proxy.ts: 1605ms, render: 42ms)
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159/costs 200 in 1314ms (compile: 37ms, proxy.ts: 12ms, render: 1265ms)
 GET /api/products/3b71683d-b08b-4c79-9f22-2b533b7d9159/costs 200 in 2.4s (compile: 10ms, proxy.ts: 21ms, render: 2.3s)
