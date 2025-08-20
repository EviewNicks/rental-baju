 Konteks: Berdasarkan analysis di docs/analyze.md, telah diidentifikasi         
  bahwa image preview gagal karena Next.js Image component tidak dapat
  menangani blob URLs dari FileReader.

  Request: Implementasikan fix untuk local image preview di file 
  features/manage-product/components/products/ImageUpload.tsx menggunakan        
  Option 2 (conditional rendering approach) dari analysis report.

  Spesifikasi Implementation:
  1. Deteksi URL type: Tambahkan logic untuk detect blob/data URLs vs HTTP       
  URLs
  2. Conditional rendering: Gunakan <img> tag untuk blob URLs, <Image> 
  component untuk saved images
  3. Preserve existing functionality: Pastikan file upload ke Supabase tetap     
   berfungsi
  4. Maintain styling: Gunakan className yang sama untuk konsistensi visual      

  Code Requirements:
  - Tambahkan variable isPreviewUrl untuk detect blob URLs
  - Implement conditional rendering di preview section (lines 68-89)
  - Preserve existing error handling dan file validation
  - Maintain TypeScript type safety

  Acceptance Criteria:
  - Image preview muncul immediately setelah file selection
  - No more blob URL errors di console
  - File upload ke Supabase tetap berfungsi normal
  - Visual styling tetap konsisten

  Testing Steps:
  1. Select image file → verify preview shows instantly
  2. Submit form → verify upload to Supabase works
  3. Check browser console → no blob URL errors
  4. Test dengan different image formats (JPG, PNG, WebP)

  Expected Changes: ~10 lines of code modification di ImageUpload.tsx