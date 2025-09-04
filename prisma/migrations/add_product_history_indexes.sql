-- Database Performance Optimization for Product History API (RPK-46)
-- Adds indexes to improve query performance from ~3-4s to <500ms

-- Index for product history main query optimization
-- Supports WHERE produkId + transaksi.status + transaksi.isActive with ORDER BY
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_item_product_history_optimized 
ON transaksi_item (produk_id, subtotal DESC, durasi DESC) 
WHERE status_kembali IS NOT NULL;

-- Composite index for transaction status and active filtering  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_status_active_filter
ON transaksi (status, is_active, created_at DESC)
WHERE status != 'cancelled' AND is_active = true;

-- Index for pagination performance with revenue sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_item_revenue_pagination
ON transaksi_item (produk_id, subtotal DESC, id)
WHERE status_kembali IS NOT NULL;

-- Index for date-based sorting optimization  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_date_sorting_optimized
ON transaksi (created_at DESC, id)
WHERE status != 'cancelled' AND is_active = true;

-- Covering index for customer data access (reduces I/O)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_penyewa_covering_history
ON penyewa (id) INCLUDE (nama, telepon);

-- Index for return conditions penalty calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_item_return_penalty_calc
ON transaksi_item_return (transaksi_item_id, penalty_amount DESC, modal_awal_used);