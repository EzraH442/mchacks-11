import { cn } from "../../lib/utils"

export function TypographyUnorderedList({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
            {children}
        </ul>
    )
}
