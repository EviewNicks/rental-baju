# Maguru Public API Documentation

## 📖 Overview

Dokumentasi lengkap untuk **Maguru Public Product API** - endpoint publik untuk mengakses data produk rental tanpa autentikasi. API ini dirancang khusus untuk integrasi homepage dan konsumsi data publik.

**Base URL**: `http://localhost:3001` (development)
**Version**: 1.0.0
**Content-Type**: `application/json`

## 🔐 Authentication

**Tidak diperlukan autentikasi** - semua endpoint publik dapat diakses langsung tanpa header authorization.

## 📋 API Endpoints

### 1. Get All Products

**GET** `/api/public/products`

Mengambil daftar semua produk yang tersedia untuk rental dengan pagination dan filtering.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Nomor halaman untuk pagination |
| `limit` | integer | No | 10 | Jumlah item per halaman (max: 100) |
| `search` | string | No | - | Pencarian berdasarkan nama atau deskripsi produk |
| `categoryId` | string | No | - | Filter berdasarkan ID kategori |
| `status` | string | No | AVAILABLE | Filter berdasarkan status (AVAILABLE/RENTED/MAINTENANCE) |

#### Example Request

```http
GET /api/public/products?page=1&limit=5&search=dress&status=AVAILABLE
```

#### Example Response

```json
{
  "products": [
    {
      "id": "67d31de1-f7a6-4e78-af34-6b2786017bb7",
      "code": "87Y9",
      "name": "Baju Pesta Kini",
      "description": null,
      "category": {
        "name": "organic",
        "color": "#EC4899"
      },
      "color": {
        "name": "Pink",
        "hexCode": "#EC4899"
      },
      "currentPrice": 50000,
      "modalAwal": 900000,
      "imageUrl": "https://example.com/image.jpg",
      "status": "AVAILABLE",
      "sizes": [
        {
          "size": "M",
          "ageCategory": "ADULT",
          "quantity": 5
        }
      ],
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

#### Response Status Codes

- `200 OK` - Request berhasil
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Database connection timeout

---

### 2. Get Product Detail

**GET** `/api/public/products/{id}`

Mengambil detail lengkap satu produk berdasarkan ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | ID unik produk |

#### Example Request

```http
GET /api/public/products/67d31de1-f7a6-4e78-af34-6b2786017bb7
```

#### Example Response

```json
{
  "id": "67d31de1-f7a6-4e78-af34-6b2786017bb7",
  "code": "87Y9",
  "name": "Baju Pesta Kini",
  "description": null,
  "category": {
    "name": "organic",
    "color": "#EC4899"
  },
  "color": {
    "name": "Pink",
    "hexCode": "#EC4899"
  },
  "currentPrice": 50000,
  "modalAwal": 900000,
  "imageUrl": "https://example.com/image.jpg",
  "status": "AVAILABLE",
  "sizes": [
    {
      "size": "M",
      "ageCategory": "ADULT",
      "quantity": 5
    },
    {
      "size": "L",
      "ageCategory": "ADULT",
      "quantity": 3
    }
  ],
  "isActive": true
}
```

#### Response Status Codes

- `200 OK` - Product ditemukan
- `400 Bad Request` - Format ID tidak valid
- `404 Not Found` - Product tidak ditemukan
- `500 Internal Server Error` - Server error

---

## 📊 Data Models

### PublicProduct

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID unik produk |
| `code` | string | Kode produk (unique) |
| `name` | string | Nama produk |
| `description` | string \| null | Deskripsi produk |
| `category` | Category | Informasi kategori |
| `color` | Color \| null | Informasi warna (optional) |
| `currentPrice` | number | Harga sewa per hari (IDR) |
| `modalAwal` | number | Nilai/harga asli produk (IDR) |
| `imageUrl` | string \| null | URL gambar produk |
| `status` | string | Status ketersediaan (AVAILABLE/RENTED/MAINTENANCE) |
| `sizes` | Size[] | Array ukuran dan stok |
| `isActive` | boolean | Status aktif produk |

### Category

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Nama kategori |
| `color` | string | Kode warna kategori (hex) |

### Color

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Nama warna |
| `hexCode` | string \| null | Kode warna (hex format) |

### Size

| Field | Type | Description |
|-------|------|-------------|
| `size` | string | Ukuran (S/M/L/XL) |
| `ageCategory` | string | Kategori usia (CHILD/TEEN/ADULT) |
| `quantity` | number | Jumlah stok tersedia |

### Pagination

| Field | Type | Description |
|-------|------|-------------|
| `page` | number | Halaman saat ini |
| `limit` | number | Jumlah item per halaman |
| `total` | number | Total item keseluruhan |
| `totalPages` | number | Total halaman |

---

## ❌ Error Responses

Semua error menggunakan format standar:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_ID` | 400 | Format ID tidak valid |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `INTERNAL_ERROR` | 500 | Server error umum |
| `CONNECTION_ERROR` | 503 | Database connection timeout |

---

## 🔒 Data Security

### Data Yang Disertakan (Public-Safe)

✅ **Informasi dasar**: id, code, name, description
✅ **Data kategori**: name, color
✅ **Data warna**: name, hexCode
✅ **Pricing**: currentPrice (harga sewa), modalAwal (nilai barang)
✅ **Ketersediaan**: status, sizes, isActive
✅ **Media**: imageUrl

### Data Yang Disembunyikan (Sensitive)

❌ **Business data**: totalPendapatan (revenue)
❌ **Internal tracking**: createdBy, createdAt, updatedAt
❌ **Cost information**: materialCost, materialQuantity
❌ **Internal fields**: materialId, rentedStock

---

## 🧪 Testing dengan Postman

### Import Collection

1. Download file `docs/api/public-api.json`
2. Import ke Postman: **File → Import → Upload Files**
3. Set environment variables:
   - `base_url`: URL server (default: http://localhost:3001)
   - `product_id`: ID produk valid untuk testing

### Test Cases Included

1. **Get All Products (Default)** - Test basic functionality
2. **Get Products with Pagination** - Test pagination parameters
3. **Get Products with Search** - Test search functionality
4. **Get Products by Status** - Test status filtering
5. **Get Product Detail (Valid ID)** - Test single product endpoint
6. **Get Product Detail (Invalid ID)** - Test error handling
7. **Get Product Detail (Non-existent ID)** - Test 404 response

### Automated Tests

Setiap request memiliki automated tests untuk:
- ✅ Status code validation
- ✅ Response structure validation
- ✅ Required fields validation
- ✅ Security validation (no sensitive data)
- ✅ Functional validation (search, filtering, pagination)

---

## 🚀 Usage Examples

### Frontend Integration (JavaScript)

```javascript
// Get products untuk homepage
const getProducts = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(`/api/public/products?page=${page}&limit=${limit}&status=AVAILABLE`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get product detail
const getProductDetail = async (productId) => {
  try {
    const response = await fetch(`/api/public/products/${productId}`);
    if (!response.ok) {
      throw new Error('Product not found');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching product detail:', error);
    throw error;
  }
};

// Search products
const searchProducts = async (searchTerm) => {
  try {
    const response = await fetch(`/api/public/products?search=${encodeURIComponent(searchTerm)}&status=AVAILABLE`);
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};
```

### cURL Examples

```bash
# Get all available products
curl "http://localhost:3001/api/public/products?status=AVAILABLE&limit=5"

# Search for specific products
curl "http://localhost:3001/api/public/products?search=dress&limit=10"

# Get product detail
curl "http://localhost:3001/api/public/products/67d31de1-f7a6-4e78-af34-6b2786017bb7"

# Get products with pagination
curl "http://localhost:3001/api/public/products?page=2&limit=5"
```

---

## 📈 Performance Considerations

### Response Times

- **Target**: < 500ms untuk optimal UX
- **Current**: ~2.6s (needs optimization)
- **Recommendations**: Database indexing, query optimization, caching

### Rate Limiting

Saat ini belum ada rate limiting untuk public endpoints. Untuk production:
- Implementasi rate limiting (contoh: 100 requests/minute per IP)
- Monitor usage patterns
- Add caching layer untuk data yang jarang berubah

### Caching Strategy

Recommendations untuk optimization:
- Cache response untuk GET requests (TTL: 5-15 menit)
- Use CDN untuk static assets (images)
- Implement database query optimization

---

## 🔧 Development & Deployment

### Local Development Setup

1. Clone repository dan install dependencies
2. Setup database dan run migrations
3. Start development server: `yarn app`
4. API available at: `http://localhost:3001`

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Next.js
NEXT_PUBLIC_DEFAULT_COURSE_THUMBNAIL_URL="..."

# Supabase (untuk image hosting)
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

### Production Deployment

1. Set production environment variables
2. Build application: `yarn build`
3. Start production server: `yarn start`
4. Update `base_url` di Postman collection

---

## 📝 Changelog

### Version 1.0.0 (Current)

- ✅ GET `/api/public/products` - List products dengan pagination
- ✅ GET `/api/public/products/{id}` - Product detail
- ✅ Query parameters: page, limit, search, categoryId, status
- ✅ Data filtering untuk security
- ✅ Error handling
- ✅ Postman test collection

### Planned Features

- 🔄 Performance optimization (< 500ms response time)
- 🔄 Rate limiting implementation
- 🔄 Response caching
- 🔄 Enhanced error messages
- 🔄 OpenAPI/Swagger documentation

---

## 🤝 Support

Untuk pertanyaan atau issue terkait API:

1. **Development**: Check application logs
2. **Testing**: Use Postman collection untuk debugging
3. **Documentation**: Update documentation saat ada perubahan API
4. **Performance**: Monitor response times dan optimize queries

---

**Last Updated**: 2025-09-27
**API Version**: 1.0.0
**Project**: Maguru - Sistem Manajemen Penyewaan Pakaian