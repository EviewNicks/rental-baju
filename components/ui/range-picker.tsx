'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerWithRangeProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
  align?: 'start' | 'center' | 'end'
  numberOfMonths?: 1 | 2
  dateFormat?: string
}

export function DatePickerWithRange({
  date,
  onDateChange,
  placeholder = 'Filter Tanggal',
  className,
  align = 'end',
  numberOfMonths = 2,
  dateFormat = 'dd MMM',
}: DatePickerWithRangeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !date?.from && 'text-muted-foreground',
            className,
          )}
          id="date-picker-range"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, dateFormat)} - {format(date.to, dateFormat)}
              </>
            ) : (
              format(date.from, dateFormat)
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={onDateChange}
          numberOfMonths={numberOfMonths}
        />
      </PopoverContent>
    </Popover>
  )
}
