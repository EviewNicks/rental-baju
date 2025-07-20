'use client'

import Image from 'next/image'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Product } from '@/features/manage-product/types'
import { getStatusBadge, formatCurrency } from '@/features/manage-product/lib/utils/product'
import { lightenColor } from '../../lib/utils/color'
import { getContrastTextColor } from '../../lib/utils/color'
import { getValidImageUrl } from '../../lib/utils/imageValidate'

interface ProductTableProps {
  products: Product[]
  onViewProduct: (product: Product) => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => void
  loading?: boolean
}

export function ProductTable({
  products,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}: ProductTableProps) {
  return (
    <Card className="shadow-sm py-2 ">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="shadow-sm border-0">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16 text-center">No</TableHead>
                <TableHead className="w-20 text-center">Gambar</TableHead>
                <TableHead className="w-24">Kode</TableHead>
                <TableHead className="min-w-48">Nama Produk</TableHead>
                <TableHead className="w-32 text-center">Kategori</TableHead>
                <TableHead className="w-32 text-right">Modal Awal</TableHead>
                <TableHead className="w-32 text-right">Harga Sewa</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-36 text-right">Pendapatan</TableHead>
                <TableHead className="w-32 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={getValidImageUrl(product.imageUrl)}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.code}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: lightenColor(product.category.color, 85),
                        color: getContrastTextColor(lightenColor(product.category.color, 85)),
                        borderColor: product.category.color,
                      }}
                      className="font-medium rounded-full"
                    >
                      {product.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(product.modalAwal))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(product.hargaSewa))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getStatusBadge(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(Number(product.totalPendapatan))}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          ⋯
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewProduct(product)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditProduct(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onDeleteProduct(product)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
