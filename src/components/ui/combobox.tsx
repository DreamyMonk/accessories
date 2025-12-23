'use client'

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    items: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    creatable?: boolean;
}

export function Combobox({ items, value, onChange, placeholder, creatable }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setInputValue("");
    setOpen(false);
  };

  const handleCreate = () => {
    if (creatable && inputValue) {
      onChange(inputValue);
      setInputValue("");
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || (placeholder ?? "Select item...")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <div className="p-2">
            <Input 
                placeholder={placeholder ?? "Search..."} 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
            />
        </div>
        <ul className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <li
                key={item.value}
                onClick={() => handleSelect(item.value)}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </li>
            ))
          ) : (
            <li className="py-6 text-center text-sm">
              {creatable ? (
                <Button variant="link" onClick={handleCreate}>Create "{inputValue}"</Button>
              ) : (
                "No results found."
              )}
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
