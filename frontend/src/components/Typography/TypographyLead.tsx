import { cn } from "../../lib/utils"

export function TypographyLead({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <p className={cn("text-xl text-muted-foreground", className)}>
            {children}
        </p>
    )
}
