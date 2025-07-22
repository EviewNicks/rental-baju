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
    <Card className="shadow-sm py-2 " data-testid="product-table-container">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="shadow-sm border-0" data-testid="product-table">
            <TableHeader>
              <TableRow className="bg-gray-50" data-testid="product-table-header">
                <TableHead className="w-16 text-center" data-testid="header-no">No</TableHead>
                <TableHead className="w-20 text-center" data-testid="header-image">Gambar</TableHead>
                <TableHead className="w-24" data-testid="header-code">Kode</TableHead>
                <TableHead className="min-w-48" data-testid="header-name">Nama Produk</TableHead>
                <TableHead className="w-32 text-center" data-testid="header-category">Kategori</TableHead>
                <TableHead className="w-32 text-right" data-testid="header-modal">Modal Awal</TableHead>
                <TableHead className="w-32 text-right" data-testid="header-price">Harga Sewa</TableHead>
                <TableHead className="w-32 text-center" data-testid="header-status">Status</TableHead>
                <TableHead className="w-36 text-right" data-testid="header-revenue">Pendapatan</TableHead>
                <TableHead className="w-32 text-center" data-testid="header-actions">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-testid="product-table-body">
              {products.map((product, index) => (
                <TableRow key={product.id} className="hover:bg-gray-50" data-testid={`product-row-${product.code}`}>
                  <TableCell className="text-center font-medium" data-testid={`product-${product.code}-number`}>{index + 1}</TableCell>
                  <TableCell className="text-center" data-testid={`product-${product.code}-image`}>
                    <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={getValidImageUrl(product.imageUrl)}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        data-testid={`product-${product.code}-image-element`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm" data-testid={`product-${product.code}-code`}>{product.code}</TableCell>
                  <TableCell className="font-medium" data-testid={`product-${product.code}-name`}>{product.name}</TableCell>
                  <TableCell className="text-center" data-testid={`product-${product.code}-category`}>
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: lightenColor(product.category.color, 85),
                        color: getContrastTextColor(lightenColor(product.category.color, 85)),
                        borderColor: product.category.color,
                      }}
                      className="font-medium rounded-full"
                      data-testid={`product-${product.code}-category-badge`}
                    >
                      {product.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" data-testid={`product-${product.code}-modal`}>
                    {formatCurrency(Number(product.modalAwal))}
                  </TableCell>
                  <TableCell className="text-right" data-testid={`product-${product.code}-price`}>
                    {formatCurrency(Number(product.hargaSewa))}
                  </TableCell>
                  <TableCell className="text-center" data-testid={`product-${product.code}-status`}>
                    <Badge variant="outline" className={getStatusBadge(product.status)} data-testid={`product-${product.code}-status-badge`}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600" data-testid={`product-${product.code}-revenue`}>
                    {formatCurrency(Number(product.totalPendapatan))}
                  </TableCell>
                  <TableCell className="text-center" data-testid={`product-${product.code}-actions`}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`product-${product.code}-actions-trigger`}>
                          ⋯
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" data-testid={`product-${product.code}-actions-menu`}>
                        <DropdownMenuItem onClick={() => onViewProduct(product)} data-testid={`product-${product.code}-view-action`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditProduct(product)} data-testid={`product-${product.code}-edit-action`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onDeleteProduct(product)}
                          data-testid={`product-${product.code}-delete-action`}
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
