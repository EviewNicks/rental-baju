Saya perlu melakukan re-evaluasi dan simplifikasi untuk task RPK-45
berdasarkan analisis troubleshoot.md. Tolong lakukan evaluasi komprehensif  
 pada dokumentasi berikut:

Files to evaluate:

- features/manage-product/docs/task/RPK-45/RPK-45.md (main task)
- features/manage-product/docs/task/RPK-45/be-rpk-45.md (backend spec)
- features/manage-product/docs/task/RPK-45/fe-rpk-45.md (frontend spec)

Focus Area: Material Field Simplification

Specific Changes Required:

1. Material Model Simplification:


    - Remove type field (hanya fokus kain/fabric)
    - Standardize unit field to "meter" with decimal support (e.g., 1.5 meter)
    - Remove supplier field
    - Remove description field
    - Remove isActive field


Deliverables:

1. Updated Backend Schema: Prisma model dengan field yang disederhanakan
2. Updated Frontend Components: Form dan display components yang sesuai
3. Updated API Specifications: Endpoints yang disesuaikan dengan model baru
4. Migration Strategy: Langkah-langkah untuk update existing data


Validation Criteria:

- Material model hanya memiliki: name, unit (default: meter), quantity, price
- Tidak ada reference ke ProductType di manapun
- API responses tetap konsisten dengan existing frontend expectations
- Migration script dapat handle existing data

====

Tolong evaluasi dan sederhanakan Material field di RPK-45 docs (RPK-45.md,  
 be-rpk-45.md, fe-rpk-45.md):

Material simplification:

- Remove: type, supplier, description, isActive fields
- Keep: name, unit (fixed as "meter" with decimal support), quantity, price
- Remove all ProductType documentation

Output: Updated backend schema, frontend components, API specs, dan migration  
 notes dalam format markdown.
