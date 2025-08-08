PS D:\.work\rental-software> npx prisma migrate dev --name tsk-24-multi-condition-return
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-0-ap-northeast-1.pooler.supabase.com:5432"

Drift detected: Your database schema is not in sync with your migration history.

The following is a summary of the differences between the expected database schema given your migrations files, and the actual schema of the database.

It should be understood as the set of changes to get from the expected schema to the actual schema.

[+] Added tables

- transaksi_item_return

[*] Changed the `Product` table
[-] Removed index on columns (availableStock)
[-] Removed column `availableStock`
[-] Removed column `hargaSewa`
[-] Removed column `totalPendapatan`
[*] Altered column `currentPrice` (default changed from `Some(Value(Float(BigDecimal("0"))))` to `None`)
[+] Added index on columns (id, modalAwal)

[*] Changed the `transaksi` table
[+] Added index on columns (id, tglSelesai, status)
[+] Added index on columns (status, id)

[*] Changed the `transaksi_item` table
[+] Added column `isMultiCondition`
[+] Added column `multiConditionSummary`
[+] Added column `totalReturnPenalty`
[+] Added index on columns (id, isMultiCondition, statusKembali)
[+] Added index on columns (produkId, transaksiId, statusKembali)
[+] Added index on columns (id, statusKembali, jumlahDiambil)

[*] Changed the `transaksi_item_return` table
[+] Added index on columns (transaksiItemId, penaltyAmount)
[+] Added index on columns (transaksiItemId, createdAt)
[+] Added foreign key on columns (transaksiItemId)

We need to reset the "public" schema at "aws-0-ap-northeast-1.pooler.supabase.com:5432"

You may use prisma migrate reset to drop the development database.
All data will be lost.
PS D:\.work\rental-software>
