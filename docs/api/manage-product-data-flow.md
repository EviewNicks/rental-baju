# Manage-Product Data Flow Diagrams

## Overview

This document provides detailed data flow diagrams for key operations in the manage-product system, illustrating how data moves through the various architectural layers and components.

## Legend

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│ Service │────▶│Database │
└─────────┘     └─────────┘     └─────────┘
     ▲               │               │
     └───────────────┴───────────────┘
         Response with processed data

Symbols:
────▶  Data flow direction
┌───┐  Component/Service
║───║  Database/Storage
╔═══╗  External Service
[...]  Optional/Conditional step
{...}  Data transformation
```

## 1. Create Product Flow

### Basic Product Creation

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │ ProductService  │
│ (Frontend)  │    │ POST /products  │    │                 │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │
       │ Form Data        │                      │
       │ + Image File     │                      │
       ├─────────────────▶│                      │
       │                  │ 1. Auth Check        │
       │                  │ (Clerk)              │
       │                  ├─────────────────────▶│
       │                  │                      │ 2. Validate Input
       │                  │                      │ (Zod Schema)
       │                  │                      │
       │                  │                      │ 3. Check Duplicates
       │                  │                      │ ┌─────────────────┐
       │                  │                      │ │                 │
       │                  │                      ├▶│    Database     │
       │                  │                      │ │  (Product.code) │
       │                  │                      │ │                 │
       │                  │                      │ └─────────────────┘
       │                  │                      │
       │                  │                      │ 4. Validate References
       │                  │                      │ ┌─────────────────┐
       │                  │                      │ │                 │
       │                  │                      ├▶│    Database     │
       │                  │                      │ │ (Category,Color)│
       │                  │                      │ │                 │
       │                  │                      │ └─────────────────┘
       │                  │                      │
       │ [Image Upload]   │                      │ 5. Process Image
       │                  │                      │ ┌─────────────────┐
       │                  │                      │ │ FileUpload      │
       │                  │                      ├▶│ Service         │
       │                  │                      │ │                 │
       │                  │                      │ └──────┬──────────┘
       │                  │                      │        │
       │                  │                      │        │ 5a. Upload to
       │                  │                      │        │ ╔═══════════════╗
       │                  │                      │        │ ║ Supabase      ║
       │                  │                      │        ├▶║ Storage       ║
       │                  │                      │        │ ║               ║
       │                  │                      │        │ ╚═══════════════╝
       │                  │                      │        │
       │                  │                      │◀───────┘ 5b. Return URL
       │                  │                      │
       │                  │                      │ 6. Create Product
       │                  │                      │ ┌─────────────────┐
       │                  │                      │ │                 │
       │                  │                      ├▶│    Database     │
       │                  │                      │ │ INSERT Product  │
       │                  │                      │ │                 │
       │                  │                      │ └─────────────────┘
       │                  │                      │
       │                  │◀─────────────────────┤ 7. Return Product
       │                  │ Product Data         │    Data
       │◀─────────────────┤                      │
       │ Created Product  │                      │
       │                  │                      │
```

### Advanced Product Creation (with Sizes)

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │ ProductService  │
│ (Frontend)  │    │ POST /products  │    │                 │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │
       │ Form Data +      │                      │
       │ hasSizes: true + │                      │
       │ sizes: [...]     │                      │
       ├─────────────────▶│                      │
       │                  │                      │
       │                  │ Steps 1-5 same as   │
       │                  │ basic creation       │
       │                  │                      │
       │                  │                      │ 6a. Validate Sizes
       │                  │                      │ {age category check}
       │                  │                      │ {size enum check}
       │                  │                      │ {quantity > 0}
       │                  │                      │
       │                  │                      │ 6b. Create Product
       │                  │                      │ ┌─────────────────┐
       │                  │                      │ │   Transaction   │
       │                  │                      ├▶│ INSERT Product  │
       │                  │                      │ │ INSERT Sizes[]  │
       │                  │                      │ │                 │
       │                  │                      │ └─────────────────┘
       │                  │                      │
       │                  │                      │ 6c. Calculate Totals
       │                  │                      │ {sum size quantities}
       │                  │                      │ {update product.quantity}
       │                  │                      │
       │                  │◀─────────────────────┤ 7. Return Enhanced
       │                  │ Product + Sizes      │    Product Data
       │◀─────────────────┤                      │
       │ Created Product  │                      │
       │ with Sizes       │                      │
```

## 2. List Products Flow

### Basic Product List

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │ ProductService  │
│ (Frontend)  │    │  GET /products  │    │                 │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │
       │ Query Params:    │                      │
       │ ?page=1&limit=10 │                      │
       │ &search=dress    │                      │
       │ &categoryId=...  │                      │
       ├─────────────────▶│                      │
       │                  │ 1. Auth Check        │
       │                  ├─────────────────────▶│
       │                  │                      │ 2. Parse & Validate
       │                  │                      │    Query Parameters
       │                  │                      │ {pagination limits}
       │                  │                      │ {filter validation}
       │                  │                      │
       │                  │                      │ 3. Build Query
       │                  │                      │ ┌─────────────────┐
       │                  │                      │ │   Database      │
       │                  │                      ├▶│ SELECT Products │
       │                  │                      │ │ WHERE filters   │
       │                  │                      │ │ LIMIT/OFFSET    │
       │                  │                      │ │ INCLUDE relations│
       │                  │                      │ └─────────────────┘
       │                  │                      │
       │                  │                      │ 4. Format Response
       │                  │                      │ {products array}
       │                  │                      │ {pagination meta}
       │                  │                      │ {summary stats}
       │                  │                      │
       │                  │◀─────────────────────┤ 5. Return Results
       │                  │ Product List + Meta  │
       │◀─────────────────┤                      │
       │ Paginated List   │                      │
```

### Enhanced Product List (with Aggregation)

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │ ProductService  │    │ Aggregation     │
│ (Frontend)  │    │  GET /products  │    │                 │    │ Service         │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │                      │
       │ Query Params:    │                      │                      │
       │ ?includeAggregation │                   │                      │
       │ =true             │                      │                      │
       ├─────────────────▶│                      │                      │
       │                  │                      │                      │
       │                  │ Steps 1-3 same as   │                      │
       │                  │ basic list           │                      │
       │                  │                      │                      │
       │                  │                      │ 4. Get Products      │
       │                  │                      │ ┌─────────────────┐  │
       │                  │                      │ │   Database      │  │
       │                  │                      ├▶│ Base Product    │  │
       │                  │                      │ │ Query           │  │
       │                  │                      │ └─────────────────┘  │
       │                  │                      │                      │
       │                  │                      │ 5. For Each Product: │
       │                  │                      │    Get Aggregation   │
       │                  │                      ├─────────────────────▶│
       │                  │                      │                      │ 5a. Check Cache
       │                  │                      │                      │ ┌─────────────────┐
       │                  │                      │                      │ │                 │
       │                  │                      │                      ├▶│ Cache Store     │
       │                  │                      │                      │ │ (Redis/Memory)  │
       │                  │                      │                      │ └─────────────────┘
       │                  │                      │                      │
       │                  │                      │                      │ [Cache Miss]
       │                  │                      │                      │ 5b. Calculate
       │                  │                      │                      │ ┌─────────────────┐
       │                  │                      │                      │ │   Database      │
       │                  │                      │                      ├▶│ ProductSize     │
       │                  │                      │                      │ │ Aggregation     │
       │                  │                      │                      │ └─────────────────┘
       │                  │                      │                      │
       │                  │                      │                      │ 5c. Store in Cache
       │                  │                      │                      │ ┌─────────────────┐
       │                  │                      │                      │ │                 │
       │                  │                      │                      ├▶│ Cache Store     │
       │                  │                      │                      │ │ TTL: 5min       │
       │                  │                      │                      │ └─────────────────┘
       │                  │                      │                      │
       │                  │                      │◀─────────────────────┤ 5d. Return
       │                  │                      │ Aggregation Data     │    Aggregation
       │                  │                      │                      │
       │                  │                      │ 6. Merge Data        │
       │                  │                      │ {product + aggregation}
       │                  │                      │                      │
       │                  │◀─────────────────────┤ 7. Return Enhanced  │
       │                  │ Products with        │    Results           │
       │                  │ Aggregation          │                      │
       │◀─────────────────┤                      │                      │
       │ Enhanced List    │                      │                      │
```

## 3. Update Product Flow

### Product Update with Image Replacement

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │ ProductService  │    │ FileUpload      │
│ (Frontend)  │    │PUT /products/id │    │                 │    │ Service         │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │                      │
       │ Form Data +      │                      │                      │
       │ New Image        │                      │                      │
       ├─────────────────▶│                      │                      │
       │                  │ 1. Auth Check        │                      │
       │                  ├─────────────────────▶│                      │
       │                  │                      │ 2. Get Current       │
       │                  │                      │    Product           │
       │                  │                      │ ┌─────────────────┐  │
       │                  │                      │ │   Database      │  │
       │                  │                      ├▶│ SELECT Product  │  │
       │                  │                      │ │ BY ID           │  │
       │                  │                      │ └─────────────────┘  │
       │                  │                      │                      │
       │                  │                      │ 3. Process New Image │
       │                  │                      ├─────────────────────▶│
       │                  │                      │                      │ 3a. Validate
       │                  │                      │                      │     New Image
       │                  │                      │                      │
       │                  │                      │                      │ 3b. Upload New
       │                  │                      │                      │ ╔═══════════════╗
       │                  │                      │                      │ ║ Supabase      ║
       │                  │                      │                      ├▶║ Storage       ║
       │                  │                      │                      │ ║               ║
       │                  │                      │                      │ ╚═══════════════╝
       │                  │                      │                      │
       │                  │                      │                      │ 3c. Delete Old
       │                  │                      │                      │ ╔═══════════════╗
       │                  │                      │                      │ ║ Supabase      ║
       │                  │                      │                      ├▶║ Storage       ║
       │                  │                      │                      │ ║ (Old Path)    ║
       │                  │                      │                      │ ╚═══════════════╝
       │                  │                      │                      │
       │                  │                      │◀─────────────────────┤ 3d. Return
       │                  │                      │ New Image URL        │    New URL
       │                  │                      │                      │
       │                  │                      │ 4. Update Product    │
       │                  │                      │ ┌─────────────────┐  │
       │                  │                      │ │   Database      │  │
       │                  │                      ├▶│ UPDATE Product  │  │
       │                  │                      │ │ SET fields      │  │
       │                  │                      │ └─────────────────┘  │
       │                  │                      │                      │
       │                  │◀─────────────────────┤ 5. Return Updated   │
       │                  │ Updated Product      │    Product           │
       │◀─────────────────┤                      │                      │
       │ Success Response │                      │                      │
```

## 4. Product History Flow

### History Retrieval with Role-Based Masking

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │ History         │    │   Database      │
│ (Frontend)  │    │GET /products/   │    │ Service         │    │                 │
│             │    │   {id}/history  │    │                 │    │                 │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │                      │
       │ Query: page,     │                      │                      │
       │ limit, sortBy    │                      │                      │
       ├─────────────────▶│                      │                      │
       │                  │ 1. Auth Check +      │                      │
       │                  │    Role Extraction   │                      │
       │                  │ ╔═══════════════╗    │                      │
       │                  │ ║ Clerk         ║    │                      │
       │                  ├▶║ Session +     ║    │                      │
       │                  │ ║ Role Claims   ║    │                      │
       │                  │ ╚═══════════════╝    │                      │
       │                  │                      │                      │
       │                  │ 2. Validate Product  │                      │
       │                  │    Exists            │                      │
       │                  ├─────────────────────▶│                      │
       │                  │                      │ 2a. Check Product    │
       │                  │                      │ ┌─────────────────┐  │
       │                  │                      │ │                 │  │
       │                  │                      ├▶│ SELECT Product  │◀─┤
       │                  │                      │ │ WHERE id        │  │
       │                  │                      │ └─────────────────┘  │
       │                  │                      │                      │
       │                  │                      │ 3. Get History Data  │
       │                  │                      │ ┌─────────────────┐  │
       │                  │                      │ │                 │  │
       │                  │                      ├▶│ SELECT History  │◀─┤
       │                  │                      │ │ WHERE productId │  │
       │                  │                      │ │ ORDER BY date   │  │
       │                  │                      │ │ LIMIT/OFFSET    │  │
       │                  │                      │ └─────────────────┘  │
       │                  │                      │                      │
       │                  │                      │ 4. Apply Role-Based  │
       │                  │                      │    Data Masking      │
       │                  │                      │                      │
       │                  │                      │ IF role == 'owner':  │
       │                  │                      │   {return full data} │
       │                  │                      │                      │
       │                  │                      │ IF role == 'producer':│
       │                  │                      │   {mask customer PII}│
       │                  │                      │                      │
       │                  │                      │ IF role == 'kasir':  │
       │                  │                      │   {partial masking}  │
       │                  │                      │                      │
       │                  │                      │ 5. Calculate Summary │
       │                  │                      │ {total rentals}      │
       │                  │                      │ {revenue stats}      │
       │                  │                      │ {frequency metrics}  │
       │                  │                      │                      │
       │                  │◀─────────────────────┤ 6. Return Masked     │
       │                  │ History + Summary    │    History Data      │
       │◀─────────────────┤                      │                      │
       │ Role-Appropriate │                      │                      │
       │ History Data     │                      │                      │
```

## 5. Size Aggregation Flow

### Aggregated Size Data Retrieval

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │ Aggregation     │    │ Cache Store     │
│ (Frontend)  │    │GET /products/   │    │ Service         │    │                 │
│             │    │{id}/sizes/      │    │                 │    │                 │
│             │    │aggregated       │    │                 │    │                 │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │                      │
       │ Query:           │                      │                      │
       │ includeBreakdown │                      │                      │
       │ includeMetadata  │                      │                      │
       ├─────────────────▶│                      │                      │
       │                  │ 1. Auth & Validation │                      │
       │                  ├─────────────────────▶│                      │
       │                  │                      │ 2. Generate Cache Key │
       │                  │                      │ {productId + params} │
       │                  │                      │                      │
       │                  │                      │ 3. Check Cache       │
       │                  │                      ├─────────────────────▶│
       │                  │                      │                      │ 3a. Cache Lookup
       │                  │                      │                      │ key: "agg:prod123:
       │                  │                      │                      │      breakdown:true"
       │                  │                      │                      │
       │                  │                      │◀─────────────────────┤ 3b. Cache Result
       │                  │                      │ HIT/MISS/EXPIRED     │
       │                  │                      │                      │
       │ [Cache MISS]     │                      │                      │
       │                  │                      │ 4. Calculate Fresh   │
       │                  │                      │    Aggregation       │
       │                  │                      │ ┌─────────────────┐  │
       │                  │                      │ │   Database      │  │
       │                  │                      ├▶│ SELECT          │  │
       │                  │                      │ │   ProductSize   │  │
       │                  │                      │ │ WHERE productId │  │
       │                  │                      │ │   AND isActive  │  │
       │                  │                      │ └─────────────────┘  │
       │                  │                      │                      │
       │                  │                      │ 5. Process Data      │
       │                  │                      │ {calculate totals}   │
       │                  │                      │ {group by age cat}   │
       │                  │                      │ {group by size}      │
       │                  │                      │ {breakdown arrays}   │
       │                  │                      │                      │
       │                  │                      │ 6. Store in Cache    │
       │                  │                      ├─────────────────────▶│
       │                  │                      │                      │ 6a. Cache Store
       │                  │                      │                      │ TTL: 300 seconds
       │                  │                      │                      │ with metadata
       │                  │                      │                      │
       │                  │                      │ 7. Format Response   │
       │                  │                      │ {aggregated sizes}   │
       │                  │                      │ {breakdown data}     │
       │                  │                      │ {metadata if req}    │
       │                  │                      │                      │
       │                  │◀─────────────────────┤ 8. Return Response   │
       │                  │ Aggregated Data      │                      │
       │◀─────────────────┤ + Cache Headers      │                      │
       │ Size Aggregation │                      │                      │
       │ with Breakdown   │                      │                      │
```

## 6. Business Logic Validation Flow

### Comprehensive System Validation

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │ ProductService  │    │ Validation      │
│ (Admin)     │    │GET /products/   │    │                 │    │ Components      │
│             │    │{id}/validation  │    │                 │    │                 │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │                      │
       │ Validation       │                      │                      │
       │ Request          │                      │                      │
       ├─────────────────▶│                      │                      │
       │                  │ 1. Auth & Role Check │                      │
       │                  │    (Owner/Producer)  │                      │
       │                  ├─────────────────────▶│                      │
       │                  │                      │ 2. Load Product Data │
       │                  │                      │ ┌─────────────────┐  │
       │                  │                      │ │   Database      │  │
       │                  │                      ├▶│ SELECT Product  │  │
       │                  │                      │ │ INCLUDE sizes   │  │
       │                  │                      │ │ INCLUDE history │  │
       │                  │                      │ └─────────────────┘  │
       │                  │                      │                      │
       │                  │                      │ 3. Run Validations   │
       │                  │                      ├─────────────────────▶│
       │                  │                      │                      │ 3a. Consistency Check
       │                  │                      │                      │ ┌─────────────────┐
       │                  │                      │                      │ │                 │
       │                  │                      │                      ├▶│ Check: quantity │
       │                  │                      │                      │ │ = sum(sizes)    │
       │                  │                      │                      │ └─────────────────┘
       │                  │                      │                      │
       │                  │                      │                      │ 3b. Business Rules
       │                  │                      │                      │ ┌─────────────────┐
       │                  │                      │                      │ │                 │
       │                  │                      │                      ├▶│ Check: rental   │
       │                  │                      │                      │ │ capabilities    │
       │                  │                      │                      │ └─────────────────┘
       │                  │                      │                      │
       │                  │                      │                      │ 3c. Integration Test
       │                  │                      │                      │ ┌─────────────────┐
       │                  │                      │                      │ │                 │
       │                  │                      │                      ├▶│ Check: service  │
       │                  │                      │                      │ │ integrations    │
       │                  │                      │                      │ └─────────────────┘
       │                  │                      │                      │
       │                  │                      │                      │ 3d. Performance Test
       │                  │                      │                      │ ┌─────────────────┐
       │                  │                      │                      │ │                 │
       │                  │                      │                      ├▶│ Check: query    │
       │                  │                      │                      │ │ performance     │
       │                  │                      │                      │ └─────────────────┘
       │                  │                      │                      │
       │                  │                      │◀─────────────────────┤ 4. Validation Results
       │                  │                      │ Health Score +       │
       │                  │                      │ Issues + Recommendations
       │                  │                      │                      │
       │                  │                      │ 5. Generate Report   │
       │                  │                      │ {overall health}     │
       │                  │                      │ {detailed findings}  │
       │                  │                      │ {recommendations}    │
       │                  │                      │ {system metadata}    │
       │                  │                      │                      │
       │                  │◀─────────────────────┤ 6. Return Report     │
       │                  │ Validation Report    │                      │
       │◀─────────────────┤                      │                      │
       │ System Health    │                      │                      │
       │ Assessment       │                      │                      │
```

## 7. Error Handling Flow

### Error Processing and Recovery

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   API Route     │    │   Service       │    │ Error Handler   │
│             │    │                 │    │                 │    │                 │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │                      │
       │ Request with     │                      │                      │
       │ Invalid Data     │                      │                      │
       ├─────────────────▶│                      │                      │
       │                  │                      │                      │
       │                  │ Try: Process Request │                      │
       │                  ├─────────────────────▶│                      │
       │                  │                      │ Try: Business Logic  │
       │                  │                      │                      │
       │                  │                      │ ❌ Error Occurs       │
       │                  │                      │                      │
       │                  │                      │ 1. Catch Error       │
       │                  │                      ├─────────────────────▶│
       │                  │                      │                      │ 1a. Classify Error
       │                  │                      │                      │ {validation/business/
       │                  │                      │                      │  system/auth}
       │                  │                      │                      │
       │                  │                      │                      │ 1b. Log Error
       │                  │                      │                      │ ┌─────────────────┐
       │                  │                      │                      │ │                 │
       │                  │                      │                      ├▶│ Logger          │
       │                  │                      │                      │ │ {context + stack}
       │                  │                      │                      │ └─────────────────┘
       │                  │                      │                      │
       │                  │                      │                      │ 1c. Determine Recovery
       │                  │                      │                      │ {retry/fallback/fail}
       │                  │                      │                      │
       │                  │                      │                      │ 1d. Format Response
       │                  │                      │                      │ {user-friendly msg}
       │                  │                      │                      │ {error code}
       │                  │                      │                      │ {HTTP status}
       │                  │                      │                      │
       │                  │                      │◀─────────────────────┤ 2. Return Error Info
       │                  │                      │ Formatted Error      │
       │                  │◀─────────────────────┤                      │
       │                  │ Error Response       │                      │
       │◀─────────────────┤                      │                      │
       │ {                │                      │                      │
       │   "error": {     │                      │                      │
       │     "message":   │                      │                      │
       │     "code":      │                      │                      │
       │     "details"    │                      │                      │
       │   }              │                      │                      │
       │ }                │                      │                      │
```

## 8. Cache Management Flow

### Cache Lifecycle Management

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │ Aggregation     │    │ Cache Store     │    │   Database      │
│             │    │ Service         │    │                 │    │                 │
└──────┬──────┘    └──────┬──────────┘    └──────┬──────────┘    └──────┬──────────┘
       │                  │                      │                      │
       │ Request Data     │                      │                      │
       ├─────────────────▶│                      │                      │
       │                  │ 1. Generate Key      │                      │
       │                  │ {product:id:params}  │                      │
       │                  │                      │                      │
       │                  │ 2. Check Cache       │                      │
       │                  ├─────────────────────▶│                      │
       │                  │                      │ 2a. Key Lookup       │
       │                  │                      │ {key exists?}        │
       │                  │                      │ {expired?}           │
       │                  │                      │                      │
       │ [Cache HIT]      │◀─────────────────────┤ 2b. Return Data      │
       │                  │ Cached Data          │ {with metadata}      │
       │◀─────────────────┤                      │                      │
       │ Fast Response    │                      │                      │
       │                  │                      │                      │
       │ [Cache MISS]     │                      │                      │
       │                  │ 3. Fetch Fresh Data  │                      │
       │                  ├─────────────────────────────────────────────▶│
       │                  │                      │                      │ 3a. Execute Query
       │                  │                      │                      │ {complex aggregation}
       │                  │                      │                      │
       │                  │◀─────────────────────────────────────────────┤ 3b. Return Raw Data
       │                  │ Fresh Data           │                      │
       │                  │                      │                      │
       │                  │ 4. Process & Store   │                      │
       │                  │ {calculate metrics}  │                      │
       │                  │ {format response}    │                      │
       │                  │                      │                      │
       │                  │ 5. Store in Cache    │                      │
       │                  ├─────────────────────▶│                      │
       │                  │                      │ 5a. Store Data       │
       │                  │                      │ TTL: 300 seconds     │
       │                  │                      │ Metadata: timestamp  │
       │                  │                      │                      │
       │                  │ 6. Return to Client  │                      │
       │◀─────────────────┤                      │                      │
       │ Fresh Data       │                      │                      │
       │ + Cache Headers  │                      │                      │
       │                  │                      │                      │
       │ [Later Update]   │                      │                      │
       │ Product Modified │                      │                      │
       ├─────────────────▶│ 7. Invalidate Cache  │                      │
       │                  ├─────────────────────▶│                      │
       │                  │                      │ 7a. Delete Keys      │
       │                  │                      │ {pattern matching}   │
       │                  │                      │ {related entries}    │
```

## Summary

These data flow diagrams illustrate the sophisticated data processing patterns in the manage-product system:

### Key Patterns Observed:

1. **Layered Architecture**: Clear separation between API, Service, and Data layers
2. **Authentication Integration**: Consistent Clerk authentication across all flows
3. **Role-Based Access**: Data masking based on user roles
4. **Caching Strategy**: Intelligent caching with invalidation
5. **Error Handling**: Comprehensive error classification and recovery
6. **File Management**: Secure upload/replacement with cleanup
7. **Business Logic Preservation**: Validation ensuring system integrity
8. **Performance Optimization**: Efficient querying and response formatting

### Integration Points:

- **External Services**: Clerk (auth), Supabase (storage, database)
- **Internal Services**: Cross-service communication patterns
- **Caching**: Multi-level caching strategy
- **Validation**: Comprehensive business rule enforcement

These flows demonstrate a production-ready system with enterprise-level considerations for security, performance, and maintainability.

---

*This document completes the comprehensive documentation suite for the manage-product backend system. See also: [manage-product-system-flow.md](./manage-product-system-flow.md), [manage-product-endpoints.md](./manage-product-endpoints.md), and [manage-product-business-logic.md](./manage-product-business-logic.md).*