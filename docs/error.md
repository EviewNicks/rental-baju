ET /dana-kasir?date=2026-01-07 200 in 127ms (compile: 10ms, proxy.ts: 21ms, render: 95ms)
 POST /dana-kasir?date=2026-01-07 200 in 45ms (compile: 10ms, proxy.ts: 20ms, render: 15ms)
🔐 [AUDIT] Starting authentication check...
✅ [AUDIT] User authenticated: user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH
👤 [AUDIT] Fetching user role from Clerk...
✅ [AUDIT] User role detected: owner
✅ [AUDIT] Owner role - using owner-system kasirId
📋 [AUDIT] Query parameters: { date: '2026-01-07', kasirId: null }
📅 [AUDIT] Date processed: 2026-01-07T00:00:00.000Z
🔄 [AUDIT] Creating service and fetching data...
✅ [AUDIT] Request completed successfully: {
  endpoint: '/api/kasir/dana-summary',
  method: 'GET',
  timestamp: '2026-01-07T14:34:22.765Z',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  ip: '::1',
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  userRole: 'owner',
  userEmail: 'owner+clerk_test@example.com',
  kasirId: 'owner-system',
  kasirSource: 'owner-role',
  queryParams: { date: '2026-01-07', kasirId: null },
  processedDate: '2026-01-07T00:00:00.000Z',
  serviceCallDuration: 1604,
  resultCounts: {
    incomeItems: 0,
    expenseItems: 3,
    totalIncome: 0,
    totalExpense: 5430400
  },
  duration: 2194,
  success: true
}
 GET /api/kasir/dana-summary?date=2026-01-07 200 in 2.2s (compile: 6ms, proxy.ts: 16ms, render: 2.2s)
 GET /dana-kasir?date=2026-01-07 200 in 183ms (compile: 12ms, proxy.ts: 35ms, render: 136ms)
 POST /dana-kasir?date=2026-01-07 200 in 46ms (compile: 11ms, proxy.ts: 19ms, render: 16ms)
🔐 [AUDIT] Starting authentication check...
✅ [AUDIT] User authenticated: user_2zqMR8BytXixaDKNlvkF8Hm7pOp
👤 [AUDIT] Fetching user role from Clerk...
✅ [AUDIT] User role detected: kasir
🔍 [AUDIT] Looking up kasir in database for user: user_2zqMR8BytXixaDKNlvkF8Hm7pOp
🔍 [KASIR-HELPER] Starting kasir lookup for userId: user_2zqMR8BytXixaDKNlvkF8Hm7pOp
📋 [KASIR-HELPER] Strategy 1: Querying by createdBy...
📋 [KASIR-HELPER] Strategy 2: Querying by userId as kasirId...
📋 [KASIR-HELPER] Strategy 3: Finding any active kasir as fallback...
⚠️ [KASIR-HELPER] Strategy 3 fallback - using default kasir: { id: '3736c6a1-0d87-45fb-8818-3aef983d2c8d', nama: 'Ina' }
🔧 [KASIR-HELPER] Consider creating proper kasir mapping for userId: user_2zqMR8BytXixaDKNlvkF8Hm7pOp
✅ [AUDIT] Kasir found: { id: '3736c6a1-0d87-45fb-8818-3aef983d2c8d', nama: 'Ina' }
📋 [AUDIT] Query parameters: { date: '2026-01-07', kasirId: null }
📅 [AUDIT] Date processed: 2026-01-07T00:00:00.000Z
🔄 [AUDIT] Creating service and fetching data...
✅ [AUDIT] Request completed successfully: {
  endpoint: '/api/kasir/dana-summary',
  method: 'GET',
  timestamp: '2026-01-07T14:34:32.293Z',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  ip: '::1',
  userId: 'user_2zqMR8BytXixaDKNlvkF8Hm7pOp',
  userRole: 'kasir',
  userEmail: 'kasir+clerk_test@example.com',
  kasirLookupResult: { id: '3736c6a1-0d87-45fb-8818-3aef983d2c8d', nama: 'Ina' },
  kasirId: '3736c6a1-0d87-45fb-8818-3aef983d2c8d',
  kasirName: 'Ina',
  kasirSource: 'database-lookup',
  queryParams: { date: '2026-01-07', kasirId: null },
  processedDate: '2026-01-07T00:00:00.000Z',
  serviceCallDuration: 1643,
  resultCounts: {
    incomeItems: 0,
    expenseItems: 1,
    totalIncome: 0,
    totalExpense: 200000
  },
  duration: 4167,
  success: true
}
 GET /api/kasir/dana-summary?date=2026-01-07 200 in 4.3s (compile: 17ms, proxy.ts: 38ms, render: 4.2s)
🔐 [AUDIT] Starting authentication check...
✅ [AUDIT] User authenticated: user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH
👤 [AUDIT] Fetching user role from Clerk...
✅ [AUDIT] User role detected: owner
✅ [AUDIT] Owner role - using owner-system kasirId
📋 [AUDIT] Query parameters: { date: '2026-01-07', kasirId: 'owner-system' }
📅 [AUDIT] Date processed: 2026-01-07T00:00:00.000Z
🔄 [AUDIT] Creating service and fetching data...
✅ [AUDIT] Request completed successfully: {
  endpoint: '/api/kasir/dana-summary',
  method: 'GET',
  timestamp: '2026-01-07T14:34:45.887Z',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  ip: '::1',
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  userRole: 'owner',
  userEmail: 'owner+clerk_test@example.com',
  kasirId: 'owner-system',
  kasirSource: 'owner-role',
  queryParams: { date: '2026-01-07', kasirId: 'owner-system' },
  processedDate: '2026-01-07T00:00:00.000Z',
  serviceCallDuration: 1592,
  resultCounts: {
    incomeItems: 0,
    expenseItems: 2,
    totalIncome: 0,
    totalExpense: 5230400
  },
  duration: 2013,
  success: true
}
 GET /api/kasir/dana-summary?date=2026-01-07&kasirId=owner-system 200 in 2.1s (compile: 7ms, proxy.ts: 17ms, render: 2.1s)
