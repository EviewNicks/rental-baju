# Task: Update Transaction Detail UI After Return Processing

## Context

We have successfully implemented the return system (TSK-24) as
documented in `features/kasir/docs/task-docs/TSK-24/design.md`. Now we  
 need to update the transaction detail page to reflect changes after
return processing.

## Objective

Update the transaction detail page
(`app/(kasir)/dashboard/transaction/[kode]/page.tsx`) to properly
display return-related information in:

1. `features/kasir/components/detail/ActivityTimeline.tsx`
2. `features/kasir/components/detail/ProductDetailCard.tsx`

## Requirements

### ActivityTimeline Component Requirements:

- **Display return events** with timestamps and user information
- **Show return status changes** (processing → completed → failed)
- **Include penalty information** in timeline entries
- **Display condition details** for each returned item
- **Format**: Timeline entries with icons, timestamps, and expandable  
  details

### ProductDetailCard Component Requirements:

- **Update product status** to reflect return state
  (returned/partial/pending)
- **Show return quantity** vs original quantity
- **Display condition information** (baik/rusak/hilang) with visual
  indicators
- **Include penalty amounts** per item if applicable
- **Visual state**: Color-coded status badges and progress indicators

## Implementation Approach:

1. **Analysis Phase**: Review current component structure and data flow
2. **Data Integration**: Ensure components receive return-related data  
   from API
3. **UI Implementation**: Add return-specific UI elements and states
4. **State Management**: Update component state handling for return data
5. **Testing**: Validate UI updates with test return transactions

## Success Criteria:

- ✅ ActivityTimeline shows complete return process history
- ✅ ProductDetailCard reflects accurate return status and quantities
- ✅ UI updates in real-time after return processing
- ✅ All return-related data displays correctly
- ✅ Components maintain responsive design and accessibility

## Technical Standards:

- Follow existing TypeScript patterns
- Maintain component performance (<100ms render time)
- Ensure proper error handling for missing return data
- Use existing UI component library (shadcn/ui)

## Deliverables:

1. Updated ActivityTimeline.tsx with return event display
2. Updated ProductDetailCard.tsx with return status indicators
3. Type definitions for return-related data structures
4. Basic component tests for new functionality

## Validation:

Test with transaction code that has completed return processing to
verify UI updates correctly reflect the return state.

== prompt ==

Kita telah menyelesaikan return system (TSK-24). Sekarang perlu update  
 transaction detail page
`app/(kasir)/dashboard/transaction/[kode]/page.tsx` untuk komponen:

1. `ActivityTimeline.tsx` - tambah return events dan status
2. `ProductDetailCard.tsx` - update status barang dan quantity setelah  
   return

Requirements:

- ActivityTimeline: tampilkan return events dengan timestamp dan penalty  
  info
- ProductDetailCard: update status return, quantity, dan kondisi barang
- UI harus update otomatis setelah return processing selesai

Deliverable: kedua komponen sudah menampilkan data return dengan benar.
