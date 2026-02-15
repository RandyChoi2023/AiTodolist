import * as React from "react";
import { Label } from "~/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";

type Option = {
  label: string;
  value: string;
};

type SelectPairProps = {
  label: string;
  description: string;
  name: string;
  placeholder?: string;
  options: Option[];
  required?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
};

export default function SelectPair({
  label,
  description,
  name,
  placeholder = "Select an option",
  options,
  required,
  value,
  onValueChange,
}: SelectPairProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex flex-col items-start text-left">
        <span className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
        <small className="text-muted-foreground">{description}</small>
      </Label>

      <Select name={name} value={value} onValueChange={onValueChange}>
        <SelectTrigger id={name}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
