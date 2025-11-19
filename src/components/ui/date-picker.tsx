'use client'

import * as React from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { type Matcher } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange: (date?: Date) => void
  className?: string
  placeholder?: string
  fromYear?: number
  toYear?: number
}

export function DatePicker({ 
  value, 
  onChange, 
  className, 
  placeholder, 
  fromYear,
  toYear
}: DatePickerProps) {
  const fromDate = fromYear ? new Date(fromYear, 0, 1) : undefined;
  const toDate = toYear ? new Date(toYear, 11, 31) : undefined;

  const hiddenDays: Matcher[] = [];
  if (fromDate) hiddenDays.push({ before: fromDate });
  if (toDate) hiddenDays.push({ after: toDate });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd MMM yyyy", { locale: id }) : <span>{placeholder || 'Pilih tanggal'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          locale={id}
          mode="single"
          selected={value}
          onSelect={onChange}
          captionLayout="dropdown"
          hidden={hiddenDays.length > 0 ? hiddenDays : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
