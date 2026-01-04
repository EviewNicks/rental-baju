POST /dashboard/transaction/TXN-20260103-002 200 in 144ms (compile: 67ms, proxy.ts: 46ms, render: 31ms)
🔍 Skipping paired sarung item: {
  itemId: '31d9b3bd-8881-4f10-ab9f-7cd1dec926d1',
  produkId: 'c861ab71-27a8-4968-9472-64a3395ed78a'
}
 GET /api/kasir/transaksi/TXN-20260103-002 200 in 5.0s (compile: 56ms, proxy.ts: 37ms, render: 4.9s)
[pickup-TXN-20260103-002-1767504743215-yh4cuh2gd] Pickup request started: {
  transactionCode: 'TXN-20260103-002',
  clientIP: '::1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  timestamp: '2026-01-04T05:32:23.215Z'
}
🔍 Skipping paired sarung item: {
  itemId: '31d9b3bd-8881-4f10-ab9f-7cd1dec926d1',
  produkId: 'c861ab71-27a8-4968-9472-64a3395ed78a'
}
Pickup processing failed: {
  transactionId: '87d295c4-6794-40a4-98fd-473261d08ec3',
  items: [
    { id: '3bbf0b03-2cb8-409e-b2cf-a5f9fb0afd81', jumlahDiambil: 2 },
    { id: 'a3308e43-db3f-410b-8256-55cd7adf19ad', jumlahDiambil: 1 }
  ],
  userId: 'user_2zqN9kdtZsIFcQcH4Iwc1DrtKoH',
  timestamp: '2026-01-04T05:32:32.772Z',
  error: {
    message: 'Failed to update stock on create: \n' +
      'Invalid `this.prisma.productSize.update()` invocation in\n' +
      'D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\[root-of-the-server]__cb87ddfe._.js:1043:43\n' +
      '\n' +
      "  1040     throw new Error('Quantity must be greater than 0');\n" +
      '  1041 }\n' +
      '  1042 try {\n' +
      '→ 1043     await this.prisma.productSize.update(\n' +
      'An operation failed because it depends on one or more records that were required but not found. No record was found for an update.',
    stack: 'Error: Failed to update stock on create: \n' +
      'Invalid `this.prisma.productSize.update()` invocation in\n' +
      'D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\[root-of-the-server]__cb87ddfe._.js:1043:43\n' +
      '\n' +
      "  1040     throw new Error('Quantity must be greater than 0');\n" +
      '  1041 }\n' +
      '  1042 try {\n' +
      '→ 1043     await this.prisma.productSize.update(\n' +
      'An operation failed because it depends on one or more records that were required but not found. No record was found for an update.\n' +
      '    at InventoryService.updateStockOnCreate (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\[root-of-the-server]__cb87ddfe._.js:1057:19)\n' +
      '    at async resultTransactionId.prisma.$transaction.timeout (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\[root-of-the-server]__f415256c._.js:1085:25)\n' +       
      '    at async Proxy._transactionWithCallback (D:\\.work\\rental-software\\node_modules\\@prisma\\client\\runtime\\library.js:130:8173)\n' +
      '    at async PickupService.processPickup (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\[root-of-the-server]__f415256c._.js:1016:41)\n' +
      '    at async PATCH (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\[root-of-the-server]__f415256c._.js:5616:24)\n' +
      '    at async AppRouteRouteModule.do (D:\\.work\\rental-software\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:5:37789)\n' +
      '    at async AppRouteRouteModule.handle (D:\\.work\\rental-software\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:5:45045)\n' +
      '    at async responseGenerator (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\node_modules_next_eacbb077._.js:14964:38)\n' +
      '    at async AppRouteRouteModule.handleResponse (D:\\.work\\rental-software\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:1:187851)\n' +   
      '    at async handleResponse (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\node_modules_next_eacbb077._.js:15026:32)\n' +
      '    at async handler (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\node_modules_next_eacbb077._.js:15079:13)\n' +
      '    at async DevServer.renderToResponseWithComponentsImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:1413:9)\n' +
      '    at async DevServer.renderPageComponent (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:1465:24)\n' +
      '    at async DevServer.renderToResponseImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:1515:32)\n' +
      '    at async DevServer.pipeImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:1021:25)\n' +
      '    at async NextNodeServer.handleCatchallRenderRequest (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\next-server.js:394:17)\n' +
      '    at async DevServer.handleRequestImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:912:17)\n' +
      '    at async D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:382:20\n' +
      '    at async Span.traceAsyncFn (D:\\.work\\rental-software\\node_modules\\next\\dist\\trace\\trace.js:157:20)\n' +
      '    at async DevServer.handleRequest (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:378:24)\n' +
      '    at async invokeRender (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\lib\\router-server.js:240:21)\n' +
      '    at async handleRequest (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\lib\\router-server.js:436:24)\n' +
      '    at async requestHandlerImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\lib\\router-server.js:484:13)\n' +
      '    at async Server.requestListener (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\lib\\start-server.js:226:13)',
    name: 'Error'
  }
}
[pickup-TXN-20260103-002-1767504752783] Pickup processing failed: {
  transactionCode: 'TXN-20260103-002',
  error: {
    message: 'Item transaksi tidak ditemukan. Transaksi mungkin telah diubah.',
    stack: 'Error: Item transaksi tidak ditemukan. Transaksi mungkin telah diubah.\n' +
      '    at PickupService.processPickup (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\[root-of-the-server]__f415256c._.js:1253:19)\n' +
      '    at async PATCH (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\[root-of-the-server]__f415256c._.js:5616:24)\n' +
      '    at async AppRouteRouteModule.do (D:\\.work\\rental-software\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:5:37789)\n' +
      '    at async AppRouteRouteModule.handle (D:\\.work\\rental-software\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:5:45045)\n' +
      '    at async responseGenerator (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\node_modules_next_eacbb077._.js:14964:38)\n' +
      '    at async AppRouteRouteModule.handleResponse (D:\\.work\\rental-software\\node_modules\\next\\dist\\compiled\\next-server\\app-route-turbo.runtime.dev.js:1:187851)\n' +   
      '    at async handleResponse (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\node_modules_next_eacbb077._.js:15026:32)\n' +
      '    at async handler (D:\\.work\\rental-software\\.next\\dev\\server\\chunks\\node_modules_next_eacbb077._.js:15079:13)\n' +
      '    at async DevServer.renderToResponseWithComponentsImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:1413:9)\n' +
      '    at async DevServer.renderPageComponent (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:1465:24)\n' +
      '    at async DevServer.renderToResponseImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:1515:32)\n' +
      '    at async DevServer.pipeImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:1021:25)\n' +
      '    at async NextNodeServer.handleCatchallRenderRequest (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\next-server.js:394:17)\n' +
      '    at async DevServer.handleRequestImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\base-server.js:912:17)\n' +
      '    at async D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:382:20\n' +
      '    at async Span.traceAsyncFn (D:\\.work\\rental-software\\node_modules\\next\\dist\\trace\\trace.js:157:20)\n' +
      '    at async DevServer.handleRequest (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:378:24)\n' +
      '    at async invokeRender (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\lib\\router-server.js:240:21)\n' +
      '    at async handleRequest (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\lib\\router-server.js:436:24)\n' +
      '    at async requestHandlerImpl (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\lib\\router-server.js:484:13)\n' +
      '    at async Server.requestListener (D:\\.work\\rental-software\\node_modules\\next\\dist\\server\\lib\\start-server.js:226:13)',
    name: 'Error'
  },
  timestamp: '2026-01-04T05:32:32.784Z',
  clientIP: '::1'
}
 PATCH /api/kasir/transaksi/TXN-20260103-002/ambil 404 in 9.8s (compile: 149ms, proxy.ts: 22ms, render: 9.6s)
🔍 Skipping paired sarung item: {
  itemId: '31d9b3bd-8881-4f10-ab9f-7cd1dec926d1',
  produkId: 'c861ab71-27a8-4968-9472-64a3395ed78a'
}
 GET /api/kasir/transaksi/TXN-20260103-002 200 in 4.5s (compile: 50ms, proxy.ts: 21ms, render: 4.4s)
