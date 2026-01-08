[BACKEND AUDIT] PUT /api/products/[id] - Form data received: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  allFormFields: [
    { key: 'name', valueType: 'string', valueSize: 15, isFile: false },
    {
      key: 'description',
      valueType: 'string',
      valueSize: 0,
      isFile: false
    },
    {
      key: 'modalAwal',
      valueType: 'string',
      valueSize: 7,
      isFile: false
    },
    {
      key: 'currentPrice',
      valueType: 'string',
      valueSize: 5,
      isFile: false
    },
    {
      key: 'quantity',
      valueType: 'string',
      valueSize: 2,
      isFile: false
    },
    {
      key: 'categoryId',
      valueType: 'string',
      valueSize: 36,
      isFile: false
    },
    { key: 'sizes', valueType: 'string', valueSize: 78, isFile: false },
    {
      key: 'selectedCosts',
      valueType: 'string',
      valueSize: 164,
      isFile: false
    },
    {
      key: 'imageUrl',
      valueType: 'string',
      valueSize: 18,
      isFile: false
    }
  ],
  timestamp: '2026-01-08T15:47:32.380Z',
  action: 'UPDATE_FORM_DATA_RECEIVED'
}
[BACKEND AUDIT] Cost items parsed for update: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  costItemsCount: 2,
  costItems: [
    {
      costItemId: '550e8400-e29b-41d4-a716-446655440003',
      amount: 3500000,
      notes: ''
    },
    {
      costItemId: '44d26e52-c305-4afe-8bbc-deddd76b5930',
      amount: 300000,
      notes: ''
    }
  ],
  timestamp: '2026-01-08T15:47:32.384Z',
  action: 'UPDATE_COST_ITEMS_PARSED'
}
[BACKEND AUDIT] Update form fields parsed: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  hasName: true,
  hasModalAwal: true,
  hasCurrentPrice: true,
  hasCostItems: true,
  costItemsCount: 2,
  modalAwalValue: 3800000,
  costItemsData: [
    {
      costItemId: '550e8400-e29b-41d4-a716-446655440003',
      amount: 3500000,
      notes: ''
    },
    {
      costItemId: '44d26e52-c305-4afe-8bbc-deddd76b5930',
      amount: 300000,
      notes: ''
    }
  ],
  timestamp: '2026-01-08T15:47:32.386Z',
  action: 'UPDATE_FORM_FIELDS_PARSED'
}
[BACKEND AUDIT] Cost items added to update data: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  costItemsCount: 2,
  costItems: [
    {
      costItemId: '550e8400-e29b-41d4-a716-446655440003',
      amount: 3500000,
      notes: ''
    },
    {
      costItemId: '44d26e52-c305-4afe-8bbc-deddd76b5930',
      amount: 300000,
      notes: ''
    }
  ],
  timestamp: '2026-01-08T15:47:32.389Z',
  action: 'COST_ITEMS_ADDED_TO_UPDATE_DATA'
}
[BACKEND AUDIT] Update data prepared: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  updateDataKeys: [
    'name',
    'modalAwal',
    'currentPrice',
    'quantity',
    'categoryId',
    'sizes',
    'selectedCosts'
  ],
  hasSelectedCosts: true,
  costItemsCount: 2,
  modalAwalValue: 3800000,
  costItemsData: [
    {
      costItemId: '550e8400-e29b-41d4-a716-446655440003',
      amount: 3500000,
      notes: ''
    },
    {
      costItemId: '44d26e52-c305-4afe-8bbc-deddd76b5930',
      amount: 300000,
      notes: ''
    }
  ],
  timestamp: '2026-01-08T15:47:32.391Z',
  action: 'UPDATE_DATA_PREPARED'
}
(node:25764) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[AUDIT] ProductService.updateProduct - START {
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  hasCostItems: true,
  costItemsCount: 2,
  timestamp: '2026-01-08T15:47:33.720Z'
}
[AUDIT] ProductService.updateProduct - MODAL_AWAL_RECALCULATED {
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  userFlow: 'OWNER',
  previousModalAwal: 3800000,
  originalModalAwal: 3800000,
  calculatedModalAwal: 3800000,
  costItemsBreakdown: [
    {
      costItemId: '550e8400-e29b-41d4-a716-446655440003',
      amount: 3500000
    },
    {
      costItemId: '44d26e52-c305-4afe-8bbc-deddd76b5930',
      amount: 300000
    }
  ],
  flowTransition: 'OWNER_UPDATE',
  timestamp: '2026-01-08T15:47:35.351Z'
}
[AUDIT] ProductService.updateProduct - COST_ITEMS_UPDATED {
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  userFlow: 'OWNER',
  costItemsUpdated: 2,
  totalModalAwal: 3800000,
  flowTransition: 'OWNER_UPDATE',
  timestamp: '2026-01-08T15:47:36.423Z'
}
[AUDIT] ProductService.updateProduct - SUCCESS {
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  finalModalAwal: 3800000,
  flowResult: 'OWNER_FLOW',
  hasCostItems: true,
  sizesUpdated: true,
  message: 'Product update completed successfully with enhanced producer/owner flow support',
  timestamp: '2026-01-08T15:47:36.958Z'
}
 PUT /api/products/6ea1677c-85bc-4408-8112-730019bcdd36 200 in 6.3s (compile: 63ms, proxy.ts: 26ms, render: 6.2s)
 GET /producer/manage-product/6ea1677c-85bc-4408-8112-730019bcdd36 200 in 139ms (compile: 64ms, proxy.ts: 38ms, render: 37ms)
[BACKEND AUDIT] Product retrieved for GET request: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  hasProduct: true,
  hasCosts: false,
  costsCount: 0,
  modalAwal: 3800000,
  costItemsDetails: [],
  calculatedModalAwal: 0,
  modalAwalMatch: false,
  timestamp: '2026-01-08T15:47:40.014Z',
  action: 'PRODUCT_RETRIEVED'
}
[BACKEND AUDIT] Response data prepared: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  responseDataKeys: [
    'id',              'code',
    'name',            'description',
    'categoryId',      'category',
    'modalAwal',       'currentPrice',
    'simplifiedCosts', 'status',
    'imageUrl',        'sizes',
    'isActive',        'createdAt',
    'updatedAt',       'createdBy'
  ],
  hasCostsInResponse: false,
  costsCountInResponse: 0,
  modalAwalInResponse: 3800000,
  includeCostsParam: true,
  timestamp: '2026-01-08T15:47:40.016Z',
  action: 'RESPONSE_DATA_PREPARED'
}
(node:23352) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Slow aggregation calculation for product 6ea1677c-85bc-4408-8112-730019bcdd36: 903ms
[BACKEND AUDIT] Final response ready to send: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  finalResponseKeys: [
    'id',              'code',
    'name',            'description',
    'categoryId',      'category',
    'modalAwal',       'currentPrice',
    'simplifiedCosts', 'status',
    'imageUrl',        'sizes',
    'isActive',        'createdAt',
    'updatedAt',       'createdBy',
    'aggregation',     'inventoryStatus',
    'sizeDetails'
  ],
  hasCostsInFinalResponse: false,
  costsCountInFinalResponse: 0,
  modalAwalInFinalResponse: 3800000,
  hasAggregation: true,
  hasInventoryStatus: true,
  hasBreakEvenStatus: false,
  timestamp: '2026-01-08T15:47:41.438Z',
  action: 'FINAL_RESPONSE_READY'
}
 GET /api/products/6ea1677c-85bc-4408-8112-730019bcdd36?includeAggregation=true 200 in 2.9s (compile: 42ms, proxy.ts: 38ms, render: 2.8s)
 GET /api/products/6ea1677c-85bc-4408-8112-730019bcdd36/history?page=1&limit=10&sortBy=date&sortOrder=desc 200 in 2.8s (compile: 46ms, proxy.ts: 30ms, render: 2.8s)
[BACKEND AUDIT] Product retrieved for GET request: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  hasProduct: true,
  hasCosts: false,
  costsCount: 0,
  modalAwal: 3800000,
  costItemsDetails: [],
  calculatedModalAwal: 0,
  modalAwalMatch: false,
  timestamp: '2026-01-08T15:47:42.308Z',
  action: 'PRODUCT_RETRIEVED'
}
[BACKEND AUDIT] Response data prepared: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  responseDataKeys: [
    'id',              'code',
    'name',            'description',
    'categoryId',      'category',
    'modalAwal',       'currentPrice',
    'simplifiedCosts', 'status',
    'imageUrl',        'sizes',
    'isActive',        'createdAt',
    'updatedAt',       'createdBy'
  ],
  hasCostsInResponse: false,
  costsCountInResponse: 0,
  modalAwalInResponse: 3800000,
  includeCostsParam: true,
  timestamp: '2026-01-08T15:47:42.309Z',
  action: 'RESPONSE_DATA_PREPARED'
}
(node:26852) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[BACKEND AUDIT] Product retrieved for GET request: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  hasProduct: true,
  hasCosts: false,
  costsCount: 0,
  modalAwal: 3800000,
  costItemsDetails: [],
  calculatedModalAwal: 0,
  modalAwalMatch: false,
  timestamp: '2026-01-08T15:47:42.823Z',
  action: 'PRODUCT_RETRIEVED'
}
[BACKEND AUDIT] Response data prepared: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  responseDataKeys: [
    'id',              'code',
    'name',            'description',
    'categoryId',      'category',
    'modalAwal',       'currentPrice',
    'simplifiedCosts', 'status',
    'imageUrl',        'sizes',
    'isActive',        'createdAt',
    'updatedAt',       'createdBy'
  ],
  hasCostsInResponse: false,
  costsCountInResponse: 0,
  modalAwalInResponse: 3800000,
  includeCostsParam: true,
  timestamp: '2026-01-08T15:47:42.824Z',
  action: 'RESPONSE_DATA_PREPARED'
}
Slow aggregation calculation for product 6ea1677c-85bc-4408-8112-730019bcdd36: 1314ms
Slow aggregation calculation for product 6ea1677c-85bc-4408-8112-730019bcdd36: 2197ms
[BACKEND AUDIT] Final response ready to send: {
  productId: '6ea1677c-85bc-4408-8112-730019bcdd36',
  finalResponseKeys: [
    'id',              'code',
    'name',            'description',
    'categoryId',      'category',
    'modalAwal',       'currentPrice',
    'simplifiedCosts', 'status',
    'imageUrl',        'sizes',
    'isActive',        'createdAt',
    'updatedAt',       'createdBy',
    'aggregation',     'inventoryStatus',
    'sizeDetails'
  ],
  hasCostsInFinalResponse: false,
  costsCountInFinalResponse: 0,
  modalAwalInFinalResponse: 3800000,
  hasAggregation: true,
  hasInventoryStatus: true,
  hasBreakEvenStatus: false,
  timestamp: '2026-01-08T15:47:44.639Z',
  action: 'FINAL_RESPONSE_READY'
}
 GET /api/products/6ea1677c-85bc-4408-8112-730019bcdd36?includeAggregation=true 200 in 3.2s (compile: 27ms, proxy.ts: 20ms, render: 3.1s)
