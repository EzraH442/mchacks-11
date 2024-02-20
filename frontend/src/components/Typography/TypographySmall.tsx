import { cn } from "../../lib/utils"

export function TypographySmall({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <small className={cn("text-sm font-medium leading-none", className)}>
            {children}
        </small>
    )
}

