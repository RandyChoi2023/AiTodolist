import type { InputHTMLAttributes } from "react";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";

export default function InputPair({ label, description, ...rest }: {label: string; description: string;} & InputHTMLAttributes<HTMLInputElement>) {
    return (   
        <div>
            <div className="space-y-2 flex-col">
                <Label htmlFor={rest.id} className="flex flex-col items-start text-left">
                    {label}
                    <small className="text-muted-foreground">
                        {description}
                    </small>
                </Label>
                <Input {...rest} />

            </div>
        </div>
    );
}