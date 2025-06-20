
'use client';

import React from 'react';
import { Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTimezoneContext } from '@/components/timezone-provider';

const commonTimezones = [
  { value: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
  { value: 'Asia/Makassar', label: 'WITA (Makassar)' },
  { value: 'Asia/Jayapura', label: 'WIT (Jayapura)' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia' },
  { value: 'Asia/Bangkok', label: 'Thailand' },
  { value: 'Asia/Tokyo', label: 'Japan' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific (US)' },
  { value: 'Europe/London', label: 'London' },
];

export function TimezoneSelector() {
  const { timezone, setTimezone, isLoading } = useTimezoneContext();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Clock className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  const currentTimezoneLabel = commonTimezones.find(tz => tz.value === timezone)?.label || timezone;

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={timezone} onValueChange={setTimezone}>
        <SelectTrigger className="w-auto min-w-[140px] h-8 text-sm">
          <SelectValue placeholder="Pilih zona waktu">
            {currentTimezoneLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {commonTimezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
