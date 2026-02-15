import type {
    InputHTMLAttributes,
    TextareaHTMLAttributes,
  } from "react";
  import { Input } from "~/common/components/ui/input";
  import { Textarea } from "~/common/components/ui/textarea";
  import { Label } from "~/common/components/ui/label";
  
  type BaseProps = {
    label: string;
    description: string;
    textArea?: boolean;
  };
  
  type InputProps = BaseProps &
    InputHTMLAttributes<HTMLInputElement> & {
      textArea?: false;
    };
  
  type TextAreaProps = BaseProps &
    TextareaHTMLAttributes<HTMLTextAreaElement> & {
      textArea: true;
    };
  
  type InputPairProps = InputProps | TextAreaProps;
  
  export default function InputPair({
    label,
    description,
    textArea,
    ...rest
  }: InputPairProps) {
    return (
      <div className="space-y-2">
        <Label htmlFor={rest.id} className="flex flex-col items-start text-left">
          <span className="flex items-center gap-1">
            {label}
            {rest.required && <span className="text-red-500">*</span>}
          </span>
          <small className="text-muted-foreground">{description}</small>
        </Label>
  
        {textArea ? (
          <Textarea
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <Input
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
    );
  }
  