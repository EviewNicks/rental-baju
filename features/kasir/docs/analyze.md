[{
"resource": "/d:/.work/rental-software/features/kasir/services/transaksiService.ts",
"owner": "typescript",
"code": "2353",
"severity": 8,
"message": "Object literal may only specify known properties, and 'kondisiAkhir' does not exist in type 'TransaksiItemSelect<DefaultArgs>'.",
"source": "ts",
"startLineNumber": 312,
"startColumn": 13,
"endLineNumber": 312,
"endColumn": 25,
"modelVersionId": 1
},{
"resource": "/d:/.work/rental-software/features/kasir/services/transaksiService.ts",
"owner": "typescript",
"code": "2352",
"severity": 8,
"message": "Conversion of type '{ pembayaran: never[]; aktivitas: never[]; id: string; kode: string; penyewaId: string; status: string; totalHarga: Decimal; jumlahBayar: Decimal; ... 8 more ...; updatedAt: Date; }' to type 'TransaksiForValidation' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.\n Type '{ pembayaran: never[]; aktivitas: never[]; id: string; kode: string; penyewaId: string; status: string; totalHarga: Decimal; jumlahBayar: Decimal; sisaBayar: Decimal; ... 7 more ...; updatedAt: Date; }' is missing the following properties from type 'TransaksiForValidation': penyewa, items",
"source": "ts",
"startLineNumber": 328,
"startColumn": 12,
"endLineNumber": 332,
"endColumn": 32,
"modelVersionId": 1
}]
