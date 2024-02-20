import { cn } from "@/lib/utils"

export function TypographyOrderedList({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <ol className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
            {children}
        </ol>
    )
}
