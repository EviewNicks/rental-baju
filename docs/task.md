Implementasi Frontend Task RPK-45: Material Management dengan User Flow  
 Consistency

KONTEKS DAN DEPENDENCIES:

- Backend RPK-45 selesai (commits: 31e8b92, 78b85d)
- Target implementasi:
  features/manage-product/docs/task/RPK-45/fe-rpk-45.md
- Referensi utama: features/manage-product/docs/task/RPK-45/RPK-45.md
- User flow analysis: docs/analyze.md Material Management User Flow analysis
- Goal: Menyamakan user flow pattern untuk 3 features: materials, colors, categories

TUJUAN UTAMA:
Implementasikan frontend material management yang mengikuti user flow pattern konsisten dengan existing color dan category features,berdasarkan analisis di docs/analyze.md

DELIVERABLES YANG DIHARAPKAN:

1. Material management components (list, form, detail views)
2. Consistent navigation pattern dengan color/category features
3. Unified UI/UX patterns across ketiga features
4. API integration untuk material CRUD operations
5. Form validation dan error handling sesuai existing patterns
6. TypeScript interfaces konsisten dengan backend schema
7. Updated documentation untuk user flow consistency

LANGKAH IMPLEMENTASI:

1. **Analisis Pattern**: Review docs/analyze.md untuk understand user flow requirements
2. **Pattern Audit**: Bandingkan existing color dan category components  
   untuk identify patterns
3. **API Integration**: Review backend endpoints dari be-rpk-45.md
   implementation
4. **Component Design**: Design material components mengikuti pattern  
   yang sudah ada
5. **Implementation**: Develop components with consistent styling dan  
   behavior
6. **Integration Testing**: Validate consistency across
   materials/colors/categories
7. **Documentation Update**: Document unified patterns untuk future
   features

KRITERIA KONSISTENSI USER FLOW:

- Navigation pattern sama untuk materials, colors, categories
- Form layout dan validation behavior konsisten
- Error handling dan loading states uniform
- Table/list view functionality aligned
- CRUD operations follow same interaction pattern
- Styling dan spacing mengikuti design system

FORMAT OUTPUT:

- Analysis summary dari pattern audit
- Daftar components yang akan dibuat/dimodifikasi
- Code implementation dengan consistent patterns
- Integration points dengan backend APIs
- Testing approach untuk validate consistency
- Documentation updates untuk maintain patterns

QUALITY GATES:

- All components render without errors
- User flow tests pass untuk ketiga features
- TypeScript compilation success
- Linting passes dengan zero warnings
- Visual consistency validation across features
- API integration functional testing

Gunakan existing project architecture dari CLAUDE.md dan follow
established patterns.

