│ Revised Design Plan: Rental Inventory System (Keep quantity field) │ │
│ │ │ │
│ │ User Requirement ✅ │ │
│ │ │ │
│ │ - KEEP Product.quantity field (used in product creation) │ │
│ │ - REDEFINE quantity as "Total Inventory" (immutable during rentals) │ │
│ │ - ADD new fields for rental tracking │ │
│ │ │ │
│ │ Revised Database Schema Design │ │
│ │ │ │
│ │ Phase 1: Add Rental Tracking Fields (Additive Changes) │ │
│ │ │ │
│ │ model Product { │ │
│ │ -- EXISTING FIELD (Keep & Redefine) │ │
│ │ quantity Int -- TOTAL INVENTORY (used in product creation, │ │
│ │ NEVER changes during rentals) │ │
│ │ │ │
│ │ -- NEW RENTAL TRACKING FIELDS │ │
│ │ availableStock Int @default(0) -- Currently available for rent │ │
│ │ rentedStock Int @default(0) -- Currently rented out │ │
│ │ -- Invariant: quantity = availableStock + rentedStock │ │
│ │ │ │
│ │ -- All other existing fields remain unchanged │ │
│ │ } │ │
│ │ │ │
│ │ Phase 2: Business Logic Redesign │ │
│ │ │ │
│ │ Product Creation: │ │
│ │ - quantity = Total inventory input by user ✅ (existing behavior preserved) │ │
│ │ - availableStock = quantity (initially all available) │ │
│ │ - rentedStock = 0 │ │
│ │ │ │
│ │ Rental Operations: │ │
│ │ - Rent: availableStock -= rentalQty, rentedStock += rentalQty │ │
│ │ - Return: availableStock += returnQty, rentedStock -= returnQty │ │
│ │ - quantity NEVER changes during rentals ✅ │ │
│ │ │ │
│ │ Availability Check: │ │
│ │ - Simply read product.availableStock (no complex calculations needed) │ │
│ │ │ │
│ │ Phase 3: Migration Strategy (Zero Downtime) │ │
│ │ │ │
│ │ 1. Add new columns: availableStock, rentedStock │ │
│ │ 2. Data migration: Set availableStock = quantity, rentedStock = 0 for existing │ │
│ │ products │ │
│ │ 3. Update business logic: Use new fields for rental operations │ │
│ │ 4. Keep quantity: Preserve for product creation/management │ │
│ │ │ │
│ │ Phase 4: Service Layer Updates │ │
│ │ │ │
│ │ // AvailabilityService - SIMPLIFIED │ │
│ │ getProductAvailability(productId: string) { │ │
│ │ const product = await prisma.product.findUnique({...}) │ │
│ │ return { │ │
│ │ totalInventory: product.quantity, // Total stock (immutable) │ │
│ │ availableQuantity: product.availableStock, // Available for rent │ │
│ │ rentedQuantity: product.rentedStock // Currently rented │ │
│ │ } │ │
│ │ } │ │
│ │ │ │
│ │ // TransactionService - SIMPLIFIED │ │
│ │ async rentProducts(items) { │ │
│ │ // Simple field updates, no complex calculations │ │
│ │ await prisma.product.update({ │ │
│ │ where: { id: productId }, │ │
│ │ data: { │ │
│ │ availableStock: { decrement: rentalQty }, │ │
│ │ rentedStock: { increment: rentalQty } │ │
│ │ // quantity stays the same ✅ │ │
│ │ } │ │
│ │ }) │ │
│ │ } │ │
│ │ │ │
│ │ Benefits of This Approach │ │
│ │ │ │
│ │ - ✅ Preserves existing product creation workflow │ │
│ │ - ✅ Eliminates complex availability calculations │ │
│ │ - ✅ Removes race conditions │ │
│ │ - ✅ Clear semantic separation: quantity = inventory, availableStock = rentable │ │
│ │ - ✅ Backward compatible migration │ │
│ │ │ │
│ │ Expected Outcomes │ │
│ │ │ │
│ │ - Product creation unchanged (quantity field preserved) │ │
│ │ - Rental operations simplified and reliable │ │
│ │ - Cache issues eliminated (simple field reads) │ │
│ │ - Clear business logic separation │ │
│ │ │ │
│ │ Ready to implement this revised rental inventory design?
