"use client";

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  X
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface SimpleDatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function SimpleDatePicker({ 
  date, 
  onDateChange, 
  placeholder = "Select date",
  label,
  className = ""
}: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(date || new Date());
  
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    onDateChange(selectedDate);
    setIsOpen(false);
  };
  
  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month);
    setViewDate(new Date(currentYear, monthIndex, 1));
  };
  
  const handleYearChange = (year: string) => {
    setViewDate(new Date(parseInt(year), currentMonth, 1));
  };
  
  const handleClear = () => {
    onDateChange(undefined);
    setIsOpen(false);
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setViewDate(new Date(currentYear, currentMonth - 1, 1));
    } else {
      setViewDate(new Date(currentYear, currentMonth + 1, 1));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-8"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : placeholder}
            {date && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Select value={months[currentMonth]} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {emptyCells.map((_, index) => (
                  <div key={`empty-${index}`} className="h-8" />
                ))}
                
                {/* Days of the month */}
                {days.map((day) => {
                  const isSelected = date && 
                    date.getDate() === day && 
                    date.getMonth() === currentMonth && 
                    date.getFullYear() === currentYear;
                  
                  const isToday = new Date().getDate() === day && 
                    new Date().getMonth() === currentMonth && 
                    new Date().getFullYear() === currentYear;
                  
                  return (
                    <Button
                      key={day}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        isToday && !isSelected ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleDateSelect(day)}
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDateChange(new Date());
                  setIsOpen(false);
                }}
                className="h-8 px-3"
              >
                Today
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="h-8 px-3"
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}