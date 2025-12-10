# Dana Kasir Components

UI components for Dana Kasir Management feature.

## Component Structure

```
DanaKasirDashboard (Main Container)
├── DateNavigation (Date controls + Export button)
├── SummaryCards (Income, Expense, Net Balance)
├── IncomeList (Rental transactions)
└── ExpenseList (Pengeluaran with CRUD)
```

## Components

### DanaKasirDashboard
Main dashboard component that orchestrates all sub-components.

**Props:**
```typescript
interface DanaKasirDashboardProps {
  initialDate: Date
  userRole: string
}
```

**Features:**
- State management for selected date
- Data fetching with React Query
- URL synchronization
- Role-based rendering
- Error handling
- Loading states

**Usage:**
```tsx
<DanaKasirDashboard 
  initialDate={new Date()}
  userRole="kasir"
/>
```

### DateNavigation
Date selection controls with navigation buttons.

**Props:**
```typescript
interface DateNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  canExport?: boolean
}
```

**Features:**
- Date picker (calendar input)
- Previous/Next day buttons
- "Today" quick button
- Export CSV button (Owner only)
- Indonesian date formatting
- URL updates on date change

**Usage:**
```tsx
<DateNavigation
  selectedDate={selectedDate}
  onDateChange={handleDateChange}
  canExport={userRole === 'owner'}
/>
```

### SummaryCards
Three summary cards showing daily totals.

**Props:**
```typescript
interface SummaryCardsProps {
  summary?: DailySummary
  isLoading?: boolean
}
```

**Features:**
- Total Income card (green)
- Total Expense card (orange)
- Net Balance card (blue/red)
- Loading skeleton
- Rupiah formatting
- Icons for visual clarity

**Usage:**
```tsx
<SummaryCards
  summary={data?.summary}
  isLoading={isLoading}
/>
```

### IncomeList
List of income from rental transactions.

**Props:**
```typescript
interface IncomeListProps {
  income: IncomeItem[]
  isLoading?: boolean
}
```

**Features:**
- Transaction code (blue)
- Customer name
- Rental amount
- Penalty amount (red if > 0)
- Status badges
- Kasir information
- Empty state
- Total calculation
- Scrollable (max 600px)

**Usage:**
```tsx
<IncomeList
  income={data?.income || []}
  isLoading={isLoading}
/>
```

### ExpenseList
List of expenses with CRUD actions.

**Props:**
```typescript
interface ExpenseListProps {
  expenses: PengeluaranKasir[]
  isLoading?: boolean
  canWrite?: boolean
  onRefresh?: () => void
}
```

**Features:**
- Category badges (color-coded)
- Amount display
- Description
- Kasir information
- Edit button (Kasir only)
- Delete button (Kasir only)
- "Tambah" button (Kasir only)
- Empty state
- Total calculation
- Scrollable (max 600px)

**Category Colors:**
- Operasional: Blue
- Maintenance: Purple
- Transport: Green
- Lainnya: Gray

**Usage:**
```tsx
<ExpenseList
  expenses={data?.expenses || []}
  isLoading={isLoading}
  canWrite={userRole === 'kasir'}
  onRefresh={refetch}
/>
```

### DanaKasirSkeleton
Loading skeleton for entire dashboard.

**Features:**
- Matches actual layout
- Animated pulse effect
- All sections included

**Usage:**
```tsx
<Suspense fallback={<DanaKasirSkeleton />}>
  <DashboardContent />
</Suspense>
```

## Styling

### Color Scheme
- **Green**: Income, positive values
- **Orange**: Expenses
- **Blue**: Neutral, info
- **Red**: Negative balance, penalties
- **Gray**: Neutral, disabled

### Responsive Breakpoints
- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (2 columns)

### Layout
- Container: max-w-7xl
- Padding: px-4 py-8
- Gap: 6 (24px)
- Rounded corners: rounded-lg
- Shadows: shadow, hover:shadow-md

## Data Flow

```
Page Component
  ↓
DanaKasirDashboard
  ↓
useDanaSummary Hook
  ↓
API: /api/kasir/dana-summary
  ↓
DanaSummaryService
  ↓
Database (Prisma)
```

## State Management

### Local State
- `selectedDate`: Current selected date
- `selectedExpense`: Expense being edited/deleted

### Server State (React Query)
- Query key: `['dana-summary', dateStr]`
- Stale time: 5 minutes
- Cache time: 10 minutes
- Auto-refetch on reconnect

### URL State
- Query param: `?date=YYYY-MM-DD`
- Synced with selectedDate
- Bookmarkable URLs

## Error Handling

### Error States
- Network errors: Show error message with retry button
- Auth errors: Redirect to login
- Permission errors: Show access denied message
- Data errors: Show error boundary fallback

### Loading States
- Initial load: Full skeleton
- Refetch: Keep existing data visible
- Mutations: Show loading indicators

### Empty States
- No income: Friendly message with icon
- No expenses: Friendly message with icon + add button

## Integration Points

### Authentication
- Uses `useUserRole()` hook from `@/features/auth`
- Checks for kasir, owner, admin, producer roles
- Redirects unauthorized users

### Error Boundary
- Uses `ErrorBoundary` from `@/features/kasir/components/ui/error-boundary`
- Catches and displays errors gracefully

### Icons
- Uses `lucide-react` icon library
- Consistent icon sizing (w-4 h-4 or w-5 h-5)

### Utilities
- `formatRupiah()`: Currency formatting
- `formatWITADate()`: Date formatting
- `getCurrentWITADate()`: Get current date in WITA

## Future Enhancements

### Planned (Next Tasks)
1. **PengeluaranForm**: Modal for add/edit expense
2. **DeleteConfirmation**: Confirmation dialog
3. **ExportDialog**: CSV export with date range
4. **Optimistic Updates**: Instant UI feedback
5. **Real-time Updates**: WebSocket or polling

### Possible
1. **Filters**: Filter by category, kasir
2. **Search**: Search expenses by description
3. **Sorting**: Sort by amount, date, category
4. **Pagination**: For large datasets
5. **Charts**: Visual representation of data
6. **Print**: Print-friendly view
7. **Notifications**: Toast notifications
8. **Keyboard Shortcuts**: Quick actions

## Testing

### Manual Testing
1. Navigate to `/dana-kasir`
2. Check authentication
3. Test date navigation
4. Verify summary calculations
5. Check income list display
6. Check expense list display
7. Test role-based buttons
8. Test responsive layout
9. Test empty states
10. Test loading states

### Automated Testing (Future)
- Component unit tests
- Integration tests
- E2E tests with Playwright
- Visual regression tests

## Troubleshooting

### Issue: Components not rendering
**Solution**: Check if React Query provider is set up in app layout

### Issue: Date not updating
**Solution**: Verify URL params are being read correctly

### Issue: Icons not showing
**Solution**: Ensure lucide-react is installed

### Issue: Styling not applied
**Solution**: Check Tailwind CSS configuration

### Issue: Auth errors
**Solution**: Verify Clerk is configured and user has correct role

---

**Created**: 2025-12-03  
**Status**: ✅ Complete  
**Next**: Task 10 - Expense Form Component
