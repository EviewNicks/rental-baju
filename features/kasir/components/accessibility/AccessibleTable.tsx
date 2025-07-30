import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface AccessibleTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  caption?: string
  description?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

interface AccessibleTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

interface AccessibleTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

interface AccessibleTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode
}

interface AccessibleTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | 'none'
  onSort?: () => void
}

interface AccessibleTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  headers?: string
}

/**
 * Fully accessible table component with proper ARIA support
 * Includes sorting, navigation, and screen reader optimizations
 */
const AccessibleTable = forwardRef<HTMLTableElement, AccessibleTableProps>(
  ({ caption, description, className, children, ...props }, ref) => {
    return (
      <div className="overflow-auto">
        {description && (
          <p id={`${props.id || 'table'}-description`} className="sr-only">
            {description}
          </p>
        )}
        <table
          ref={ref}
          className={cn(
            'w-full border-collapse',
            className
          )}
          role="table"
          aria-describedby={description ? `${props.id || 'table'}-description` : undefined}
          {...props}
        >
          {caption && (
            <caption className="sr-only">
              {caption}
            </caption>
          )}
          {children}
        </table>
      </div>
    )
  }
)
AccessibleTable.displayName = 'AccessibleTable'

const AccessibleTableHeader = forwardRef<HTMLTableSectionElement, AccessibleTableHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('bg-gray-50', className)}
      {...props}
    >
      {children}
    </thead>
  )
)
AccessibleTableHeader.displayName = 'AccessibleTableHeader'

const AccessibleTableBody = forwardRef<HTMLTableSectionElement, AccessibleTableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('divide-y divide-gray-200', className)}
      {...props}
    >
      {children}
    </tbody>
  )
)
AccessibleTableBody.displayName = 'AccessibleTableBody'

const AccessibleTableRow = forwardRef<HTMLTableRowElement, AccessibleTableRowProps>(
  ({ className, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('hover:bg-gray-50 transition-colors', className)}
      {...props}
    >
      {children}
    </tr>
  )
)
AccessibleTableRow.displayName = 'AccessibleTableRow'

const AccessibleTableHead = forwardRef<HTMLTableCellElement, AccessibleTableHeadProps>(
  ({ 
    className, 
    children, 
    scope = 'col',
    sortable = false,
    sortDirection = 'none',
    onSort,
    ...props 
  }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (sortable && onSort && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onSort()
      }
    }

    const content = sortable ? (
      <button
        type="button"
        onClick={onSort}
        onKeyDown={handleKeyDown}
        className="w-full text-left font-semibold text-gray-900 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
        aria-sort={sortDirection}
        aria-label={`${children} - ${sortDirection === 'none' ? 'klik untuk mengurutkan' : `diurutkan ${sortDirection === 'asc' ? 'naik' : 'turun'}`}`}
      >
        <span className="flex items-center gap-1">
          {children}
          {sortDirection !== 'none' && (
            <span aria-hidden="true">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </span>
      </button>
    ) : children

    return (
      <th
        ref={ref}
        scope={scope}
        className={cn(
          'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
          sortable && 'cursor-pointer select-none',
          className
        )}
        {...props}
      >
        {content}
      </th>
    )
  }
)
AccessibleTableHead.displayName = 'AccessibleTableHead'

const AccessibleTableCell = forwardRef<HTMLTableCellElement, AccessibleTableCellProps>(
  ({ className, children, headers, ...props }, ref) => (
    <td
      ref={ref}
      headers={headers}
      className={cn('px-4 py-3 text-sm', className)}
      {...props}
    >
      {children}
    </td>
  )
)
AccessibleTableCell.displayName = 'AccessibleTableCell'

export {
  AccessibleTable,
  AccessibleTableHeader,
  AccessibleTableBody,
  AccessibleTableRow,
  AccessibleTableHead,
  AccessibleTableCell,
}