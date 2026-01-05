# Manual Testing Guide: Transaction Date Filter

## Overview

This document provides step-by-step manual testing scenarios for the transaction date filter feature. Each test case includes expected results and validation criteria to ensure the feature works correctly in the browser.

## Prerequisites

- [ ] Development server is running (`yarn dev`)
- [ ] Database contains sample transaction data with various `tglMulai` dates
- [ ] Browser developer tools are available for URL inspection
- [ ] Test with both desktop and mobile viewport sizes

## Test Scenarios

### 1. Basic Date Filter Functionality

#### Test Case 1.1: Date Filter Component Visibility
**Objective:** Verify the date filter component is properly displayed

**Steps:**
1. [ ] Navigate to `/dashboard`
2. [ ] Locate the date filter component in the TransactionTabs section
3. [ ] Verify the date filter is positioned alongside search input and reset button

**Expected Results:**
- [ ] Date filter input is visible with calendar icon
- [ ] Placeholder text shows "Filter tanggal..."
- [ ] Component is properly aligned with other filter controls
- [ ] Responsive layout works on mobile and desktop

#### Test Case 1.2: Date Selection and Filtering
**Objective:** Test basic date filtering functionality

**Steps:**
1. [ ] Click on the date filter input
2. [ ] Select a specific date (e.g., today's date)
3. [ ] Observe the transaction list updates
4. [ ] Check that only transactions with matching `tglMulai` are displayed

**Expected Results:**
- [ ] Date picker opens when clicking the input
- [ ] Selected date appears in the input field
- [ ] Transaction list filters to show only matching dates
- [ ] Loading indicator appears briefly during filtering
- [ ] Transaction counts in status tabs update accordingly

#### Test Case 1.3: Date Filter Clearing
**Objective:** Test clearing the date filter

**Steps:**
1. [ ] Select a date in the date filter
2. [ ] Click the "X" clear button in the date filter input
3. [ ] Observe the transaction list updates

**Expected Results:**
- [ ] Clear button (X) is visible when date is selected
- [ ] Clicking clear button removes the selected date
- [ ] Transaction list shows all transactions again
- [ ] Input field returns to placeholder state

### 2. Filter Combination Testing

#### Test Case 2.1: Date + Status Filter Combination
**Objective:** Test combining date filter with status filters

**Steps:**
1. [ ] Select a specific date in the date filter
2. [ ] Click on different status tabs (Active, Diambil, Selesai, etc.)
3. [ ] Verify results show transactions matching both date and status

**Expected Results:**
- [ ] Transactions match both selected date and status
- [ ] Status tab counts reflect the combined filtering
- [ ] Switching status tabs maintains the date filter
- [ ] Empty states show when no transactions match both criteria

#### Test Case 2.2: Date + Search Filter Combination
**Objective:** Test combining date filter with search functionality

**Steps:**
1. [ ] Select a specific date in the date filter
2. [ ] Enter a search term in the search input
3. [ ] Verify results match both date and search criteria

**Expected Results:**
- [ ] Transactions match both date and search term
- [ ] Search debouncing works with date filter active
- [ ] Both filters remain active simultaneously
- [ ] Clearing one filter maintains the other

#### Test Case 2.3: All Filters Combined
**Objective:** Test all three filters working together

**Steps:**
1. [ ] Select a specific date
2. [ ] Choose a specific status tab
3. [ ] Enter a search term
4. [ ] Verify all filters work together

**Expected Results:**
- [ ] Results match all three filter criteria
- [ ] All filter states are maintained
- [ ] Performance remains acceptable with all filters active

### 3. Reset Functionality Testing

#### Test Case 3.1: Reset Button Visibility
**Objective:** Test reset button conditional visibility

**Steps:**
1. [ ] Start with no filters active - verify reset button is hidden
2. [ ] Apply date filter - verify reset button appears
3. [ ] Apply search filter - verify reset button remains visible
4. [ ] Clear all filters manually - verify reset button disappears

**Expected Results:**
- [ ] Reset button only visible when filters are active
- [ ] Button appears/disappears based on `hasActiveFilters` state
- [ ] Visual styling is consistent with design

#### Test Case 3.2: Reset All Filters
**Objective:** Test complete filter reset functionality

**Steps:**
1. [ ] Apply date filter, status filter, and search filter
2. [ ] Click the reset button
3. [ ] Verify all filters are cleared

**Expected Results:**
- [ ] Date filter is cleared
- [ ] Search input is cleared
- [ ] Status tab returns to "Semua" (All)
- [ ] Transaction list shows all transactions
- [ ] Reset button disappears after clearing

### 4. URL State Persistence Testing

#### Test Case 4.1: URL Parameter Generation
**Objective:** Test URL updates when date filter is applied

**Steps:**
1. [ ] Apply a date filter (e.g., 2024-01-15)
2. [ ] Check the browser URL
3. [ ] Verify `tglMulai` parameter is present

**Expected Results:**
- [ ] URL contains `?tglMulai=2024-01-15` parameter
- [ ] URL updates immediately when date is selected
- [ ] Other filter parameters are also included if active

#### Test Case 4.2: URL State Restoration
**Objective:** Test filter restoration from URL on page load

**Steps:**
1. [ ] Apply date filter and note the URL
2. [ ] Refresh the page
3. [ ] Verify the date filter is restored
4. [ ] Test with direct URL navigation

**Expected Results:**
- [ ] Date filter is restored after page refresh
- [ ] Transaction list shows filtered results immediately
- [ ] All URL parameters are properly parsed
- [ ] Invalid date parameters are handled gracefully

#### Test Case 4.3: URL Sharing
**Objective:** Test sharing URLs with date filters

**Steps:**
1. [ ] Apply date filter and copy URL
2. [ ] Open URL in new browser tab/window
3. [ ] Verify the same filtered view is displayed

**Expected Results:**
- [ ] Shared URL opens with same filter state
- [ ] Date filter is properly applied
- [ ] Transaction list matches the original filtered view

### 5. Loading States and UX Testing

#### Test Case 5.1: Loading Indicators
**Objective:** Test loading states during date filtering

**Steps:**
1. [ ] Select a date and observe loading indicators
2. [ ] Check for spinner in date filter input
3. [ ] Verify input is disabled during loading

**Expected Results:**
- [ ] Loading spinner replaces calendar icon during filtering
- [ ] Date input is disabled while loading
- [ ] Clear button is hidden during loading
- [ ] Loading state is brief but visible

#### Test Case 5.2: Visual Feedback
**Objective:** Test visual feedback for selected dates

**Steps:**
1. [ ] Select a date in the filter
2. [ ] Observe visual changes in the input
3. [ ] Test hover and focus states

**Expected Results:**
- [ ] Selected date has distinct visual styling (yellow background)
- [ ] Input border changes color when date is selected
- [ ] Hover and focus states work correctly
- [ ] Visual feedback is clear and intuitive

### 6. Error Handling Testing

#### Test Case 6.1: Invalid Date Handling
**Objective:** Test handling of invalid date inputs

**Steps:**
1. [ ] Try to manually enter invalid date in URL (`?tglMulai=invalid-date`)
2. [ ] Navigate to the URL
3. [ ] Verify error handling

**Expected Results:**
- [ ] Invalid date parameter is ignored
- [ ] URL is cleaned up automatically
- [ ] No application errors occur
- [ ] Console shows appropriate warning messages

#### Test Case 6.2: Network Error Handling
**Objective:** Test behavior during API failures

**Steps:**
1. [ ] Disconnect network or block API requests
2. [ ] Try to apply date filter
3. [ ] Observe error handling

**Expected Results:**
- [ ] Graceful error handling without crashes
- [ ] User-friendly error messages if applicable
- [ ] Filter state is maintained
- [ ] Recovery works when network is restored

### 7. Accessibility Testing

#### Test Case 7.1: Keyboard Navigation
**Objective:** Test keyboard accessibility

**Steps:**
1. [ ] Use Tab key to navigate to date filter
2. [ ] Use Enter/Space to open date picker
3. [ ] Use arrow keys to navigate dates
4. [ ] Use Escape key to close/clear

**Expected Results:**
- [ ] Date filter is reachable via keyboard
- [ ] Date picker opens with keyboard interaction
- [ ] Date navigation works with arrow keys
- [ ] Escape key clears the filter

#### Test Case 7.2: Screen Reader Support
**Objective:** Test screen reader compatibility

**Steps:**
1. [ ] Enable screen reader (or test with browser accessibility tools)
2. [ ] Navigate to date filter
3. [ ] Verify ARIA labels and descriptions

**Expected Results:**
- [ ] Date filter has proper ARIA labels
- [ ] Screen reader announces filter purpose
- [ ] Error states are announced
- [ ] Filter changes are communicated

### 8. Performance Testing

#### Test Case 8.1: Debouncing Effectiveness
**Objective:** Test date filter debouncing

**Steps:**
1. [ ] Open browser developer tools (Network tab)
2. [ ] Rapidly change dates multiple times
3. [ ] Observe API call frequency

**Expected Results:**
- [ ] API calls are debounced (300ms delay)
- [ ] Rapid changes don't cause excessive requests
- [ ] Final date selection triggers API call
- [ ] Performance remains smooth

#### Test Case 8.2: Large Dataset Performance
**Objective:** Test performance with many transactions

**Steps:**
1. [ ] Test with large transaction dataset (if available)
2. [ ] Apply date filters and measure response time
3. [ ] Check for any performance degradation

**Expected Results:**
- [ ] Date filtering remains responsive
- [ ] No significant delays in UI updates
- [ ] Memory usage stays reasonable
- [ ] Cache effectiveness is maintained

### 9. Mobile Responsiveness Testing

#### Test Case 9.1: Mobile Layout
**Objective:** Test date filter on mobile devices

**Steps:**
1. [ ] Switch to mobile viewport (or use actual mobile device)
2. [ ] Test date filter functionality
3. [ ] Verify responsive layout

**Expected Results:**
- [ ] Date filter is properly sized for mobile
- [ ] Touch interactions work correctly
- [ ] Layout doesn't break on small screens
- [ ] All functionality remains accessible

#### Test Case 9.2: Touch Interactions
**Objective:** Test touch-specific interactions

**Steps:**
1. [ ] Use touch to open date picker
2. [ ] Test date selection with touch
3. [ ] Test clear button with touch

**Expected Results:**
- [ ] Touch targets are appropriately sized
- [ ] Date picker opens reliably with touch
- [ ] All touch interactions work smoothly

## Test Completion Checklist

### Core Functionality
- [ ] Date filter displays correctly
- [ ] Date selection works
- [ ] Date clearing works
- [ ] Filter combination works (date + status + search)
- [ ] Reset functionality works

### URL State Persistence
- [ ] URL updates with date parameter
- [ ] Page refresh restores filter state
- [ ] URL sharing works correctly
- [ ] Invalid URL parameters handled gracefully

### User Experience
- [ ] Loading states display correctly
- [ ] Visual feedback for selected dates
- [ ] Error handling works
- [ ] Performance is acceptable

### Accessibility
- [ ] Keyboard navigation works
- [ ] ARIA labels are present
- [ ] Screen reader compatibility
- [ ] Focus management is correct

### Responsiveness
- [ ] Mobile layout works
- [ ] Touch interactions work
- [ ] All screen sizes supported

## Bug Reporting Template

If you find any issues during testing, use this template:

**Bug Title:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:** [What should happen]

**Actual Result:** [What actually happened]

**Browser/Device:** [Browser version and device info]

**Additional Notes:** [Any other relevant information]

## Notes

- Test with different browsers (Chrome, Firefox, Safari, Edge)
- Test with various screen sizes and orientations
- Pay attention to console errors and warnings
- Verify that existing functionality is not broken
- Test with both empty and populated transaction datasets