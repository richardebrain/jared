import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface TimeZonePickerProps {
  value: string;
  onChange: (value: string) => void;
}

// Complete list of time zones
const allTimeZones = [
  "UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:30", "UTC-09:00", 
  "UTC-08:00", "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00", 
  "UTC-03:30", "UTC-03:00", "UTC-02:00", "UTC-01:00", "UTC+00:00", 
  "UTC+01:00", "UTC+02:00", "UTC+03:00", "UTC+03:30", "UTC+04:00", 
  "UTC+04:30", "UTC+05:00", "UTC+05:30", "UTC+05:45", "UTC+06:00", 
  "UTC+06:30", "UTC+07:00", "UTC+08:00", "UTC+08:45", "UTC+09:00", 
  "UTC+09:30", "UTC+10:00", "UTC+10:30", "UTC+11:00", "UTC+12:00", 
  "UTC+12:45", "UTC+13:00", "UTC+14:00"
];

// Common time zone names and their UTC offsets
const commonTimeZones = [
  { name: "Pacific Time (PT)", offset: "UTC-08:00" },
  { name: "Mountain Time (MT)", offset: "UTC-07:00" },
  { name: "Central Time (CT)", offset: "UTC-06:00" },
  { name: "Eastern Time (ET)", offset: "UTC-05:00" },
  { name: "Greenwich Mean Time (GMT)", offset: "UTC+00:00" },
  { name: "Central European Time (CET)", offset: "UTC+01:00" },
  { name: "Eastern European Time (EET)", offset: "UTC+02:00" },
  { name: "Japan Standard Time (JST)", offset: "UTC+09:00" },
  { name: "Australian Eastern Time (AET)", offset: "UTC+10:00" }
];

export function TimeZonePicker({ value, onChange }: TimeZonePickerProps) {
  const [search, setSearch] = useState("");
  const [filteredTimeZones, setFilteredTimeZones] = useState(allTimeZones);
  
  // Filter time zones based on search
  useEffect(() => {
    if (!search) {
      setFilteredTimeZones(allTimeZones);
      return;
    }
    
    const searchLower = search.toLowerCase();
    const filtered = allTimeZones.filter(tz => 
      tz.toLowerCase().includes(searchLower) ||
      commonTimeZones.some(common => 
        common.offset === tz && common.name.toLowerCase().includes(searchLower)
      )
    );
    
    setFilteredTimeZones(filtered);
  }, [search]);
  
  // Get user's local time zone on component mount
  useEffect(() => {
    if (!value) {
      const offset = -new Date().getTimezoneOffset() / 60;
      const sign = offset >= 0 ? "+" : "-";
      const absOffset = Math.abs(offset);
      const hours = Math.floor(absOffset).toString().padStart(2, "0");
      const minutes = ((absOffset - Math.floor(absOffset)) * 60).toString().padStart(2, "0");
      
      // Find the closest matching time zone from our list
      const userTimeZone = `UTC${sign}${hours}:${minutes}`;
      const closestTimeZone = allTimeZones.find(tz => 
        tz.includes(`UTC${sign}${hours}:`) || tz === userTimeZone
      ) || "UTC+00:00";
      
      onChange(closestTimeZone);
    }
  }, [value, onChange]);
  
  // Get friendly name for the current time zone if available
  const getFriendlyName = (utcOffset: string) => {
    const match = commonTimeZones.find(tz => tz.offset === utcOffset);
    return match ? match.name : utcOffset;
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <i className="ri-global-line"></i>
          {getFriendlyName(value)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Select Time Zone</DropdownMenuLabel>
        <div className="px-2 py-2">
          <Input
            placeholder="Search time zones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {search && filteredTimeZones.length === 0 ? (
            <div className="px-2 py-2 text-sm text-muted-foreground text-center">
              No time zones found
            </div>
          ) : (
            filteredTimeZones.map((timeZone) => {
              // Check if there's a common name for this time zone
              const friendlyName = getFriendlyName(timeZone);
              const isCommonName = friendlyName !== timeZone;
              
              return (
                <DropdownMenuItem
                  key={timeZone}
                  className="cursor-pointer"
                  onClick={() => {
                    onChange(timeZone);
                    setSearch("");
                  }}
                >
                  <div className="flex flex-col">
                    <span className={isCommonName ? "font-semibold" : ""}>
                      {timeZone}
                    </span>
                    {isCommonName && (
                      <span className="text-xs text-muted-foreground">
                        {friendlyName}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
