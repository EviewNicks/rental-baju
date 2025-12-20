PS D:\.work\rental-software> yarn test --testPathPatterns="enhanced" --verbose
yarn run v1.22.22
$ jest app/creator/dashboard/page.test.tsx  --verbose --testPathPatterns=enhanced --verbose
ℹ️ Environment validation skipped for CI/Test environment
 FAIL  __tests__/features/kasir/services/transaksiService.enhanced.test.ts
  TransaksiService Enhanced Tests
    createTransaksiSizeAware with Discount System
      × should create transaction without discount (4-day package) (5 ms)
      × should create transaction with 10% discount (4-day package) (1 ms)
      × should create transaction with nominal discount (7-day package) (1 ms)
      √ should validate discount consistency (3 ms)
      × should handle duration multiplier correctly (1 ms)                                                                                                                                                  
      × should calculate return date correctly (2 ms)                                                                                                                                                       
    Error Handling                                                                                                                                                                                          
      √ should handle penyewa not found (1 ms)                                                                                                                                                              
      √ should handle product size not found (1 ms)                                                                                                                                                         
      √ should handle price calculation failure (1 ms)                                                                                                                                                      
                                                                                                                                                                                                            
  ● TransaksiService Enhanced Tests › createTransaksiSizeAware with Discount System › should create transaction without discount (4-day package)                                                            
                                                                                                                                                                                                            
    Size M (ADULT) untuk Test Product tidak mencukupi. Tersedia: 0, Diminta: 2

      718 |       if (!isAvailable) {
      719 |         const stockStatus = await txInventoryService.getStockStatus(item.productSizeId)
    > 720 |         throw new Error(
          |               ^
      721 |           `Size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${stockStatus.availableQuantity}, Diminta: ${item.jumlah}`,       
      722 |         )
      723 |       }

      at TransaksiService.validateStockAvailabilityInTransaction (features/kasir/services/transaksiService.ts:720:15)
      at transaksi.prisma.$transaction.timeout (features/kasir/services/transaksiService.ts:499:11)
      at TransaksiService.createTransaksiSizeAware (features/kasir/services/transaksiService.ts:495:25)
      at Object.<anonymous> (__tests__/features/kasir/services/transaksiService.enhanced.test.ts:169:22)

  ● TransaksiService Enhanced Tests › createTransaksiSizeAware with Discount System › should create transaction with 10% discount (4-day package)

    Size M (ADULT) untuk Test Product tidak mencukupi. Tersedia: 0, Diminta: 2

      718 |       if (!isAvailable) {
      719 |         const stockStatus = await txInventoryService.getStockStatus(item.productSizeId)
    > 720 |         throw new Error(
          |               ^
      721 |           `Size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${stockStatus.availableQuantity}, Diminta: ${item.jumlah}`,       
      722 |         )
      723 |       }

      at TransaksiService.validateStockAvailabilityInTransaction (features/kasir/services/transaksiService.ts:720:15)
      at transaksi.prisma.$transaction.timeout (features/kasir/services/transaksiService.ts:499:11)
      at TransaksiService.createTransaksiSizeAware (features/kasir/services/transaksiService.ts:495:25)
      at Object.<anonymous> (__tests__/features/kasir/services/transaksiService.enhanced.test.ts:230:22)

  ● TransaksiService Enhanced Tests › createTransaksiSizeAware with Discount System › should create transaction with nominal discount (7-day package)

    Size M (ADULT) untuk Test Product tidak mencukupi. Tersedia: 0, Diminta: 2

      718 |       if (!isAvailable) {
      719 |         const stockStatus = await txInventoryService.getStockStatus(item.productSizeId)
    > 720 |         throw new Error(
          |               ^
      721 |           `Size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${stockStatus.availableQuantity}, Diminta: ${item.jumlah}`,       
      722 |         )
      723 |       }

      at TransaksiService.validateStockAvailabilityInTransaction (features/kasir/services/transaksiService.ts:720:15)
      at transaksi.prisma.$transaction.timeout (features/kasir/services/transaksiService.ts:499:11)
      at TransaksiService.createTransaksiSizeAware (features/kasir/services/transaksiService.ts:495:25)
      at Object.<anonymous> (__tests__/features/kasir/services/transaksiService.enhanced.test.ts:299:22)

  ● TransaksiService Enhanced Tests › createTransaksiSizeAware with Discount System › should handle duration multiplier correctly

    Size M (ADULT) untuk Test Product tidak mencukupi. Tersedia: 0, Diminta: 2

      718 |       if (!isAvailable) {
      719 |         const stockStatus = await txInventoryService.getStockStatus(item.productSizeId)
    > 720 |         throw new Error(
          |               ^
      721 |           `Size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${stockStatus.availableQuantity}, Diminta: ${item.jumlah}`,       
      722 |         )
      723 |       }

      at TransaksiService.validateStockAvailabilityInTransaction (features/kasir/services/transaksiService.ts:720:15)
      at transaksi.prisma.$transaction.timeout (features/kasir/services/transaksiService.ts:499:11)
      at TransaksiService.createTransaksiSizeAware (features/kasir/services/transaksiService.ts:495:25)
      at Object.<anonymous> (__tests__/features/kasir/services/transaksiService.enhanced.test.ts:348:7)

  ● TransaksiService Enhanced Tests › createTransaksiSizeAware with Discount System › should calculate return date correctly

    Size M (ADULT) untuk Test Product tidak mencukupi. Tersedia: 0, Diminta: 2

      718 |       if (!isAvailable) {
      719 |         const stockStatus = await txInventoryService.getStockStatus(item.productSizeId)
    > 720 |         throw new Error(
          |               ^
      721 |           `Size ${productSize.size} (${productSize.ageCategory}) untuk ${productSize.product.name} tidak mencukupi. Tersedia: ${stockStatus.availableQuantity}, Diminta: ${item.jumlah}`,       
      722 |         )
      723 |       }

      at TransaksiService.validateStockAvailabilityInTransaction (features/kasir/services/transaksiService.ts:720:15)
      at transaksi.prisma.$transaction.timeout (features/kasir/services/transaksiService.ts:499:11)
      at TransaksiService.createTransaksiSizeAware (features/kasir/services/transaksiService.ts:495:25)
      at Object.<anonymous> (__tests__/features/kasir/services/transaksiService.enhanced.test.ts:366:7)

 PASS  __tests__/features/kasir/lib/utils/priceCalculator.enhanced.test.ts
  PriceCalculator Enhanced Tests
    calculateTransactionTotalWithEnhancements                                                                                                                                                               
      √ should calculate 4-day package without discount (1 ms)                                                                                                                                              
      √ should calculate 7-day package without discount (1 ms)
      √ should calculate 4-day package with 10% discount (1 ms)                                                                                                                                             
      √ should calculate 7-day package with 15% discount (1 ms)                                                                                                                                             
      √ should calculate 4-day package with nominal discount (4 ms)                                                                                                                                         
      √ should calculate 7-day package with nominal discount                                                                                                                                                
      √ should prevent negative totals with excessive nominal discount (1 ms)                                                                                                                               
      √ should handle zero discount value (1 ms)                                                                                                                                                            
      √ should handle 100% discount                                                                                                                                                                         
      √ should handle single item transaction                                                                                                                                                               
      √ should validate discount parameters (1 ms)                                                                                                                                                          
    Edge Cases                                                                                                                                                                                              
      √ should handle empty items array (1 ms)                                                                                                                                                              
      √ should handle very large quantities                                                                                                                                                                 
      √ should handle decimal prices correctly (1 ms)                                                                                                                                                       
                                                                                                                                                                                                            
[DetailedJsonReporter] Total: 23, Passed: 18, Failed: 5                                                                                                                                                     
Test Suites: 1 failed, 1 passed, 2 total                                                                                                                                                                    
Tests:       5 failed, 18 passed, 23 total
Snapshots:   0 total
Time:        1.846 s
Ran all test suites matching app/creator/dashboard/page.test.tsx|enhanced.
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
PS D:\.work\rental-software> 