import { cn } from "../../lib/utils"

export function TypographyH1({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <h1 className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl", className)}>
            {children}
        </h1>
    )
}
