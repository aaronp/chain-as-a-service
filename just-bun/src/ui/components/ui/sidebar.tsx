import * as React from "react"
import { cn } from "../../../lib/utils"
import { Button } from "./button"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { Menu, Home, User, Wallet, ArrowLeft } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

interface SidebarProps {
    className?: string
    children?: React.ReactNode
}

interface SidebarItemProps {
    href: string
    icon: React.ReactNode
    children: React.ReactNode
    onClick?: () => void
}

const SidebarItem = ({ href, icon, children, onClick }: SidebarItemProps) => {
    const location = useLocation()
    const isActive = location.pathname === href

    return (
        <Link
            to={href}
            onClick={onClick}
            className={cn(
                "flex items-center rounded-lg py-2 text-sm font-medium transition-colors min-h-[40px]",
                isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
        >
            <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center ml-2">
                {icon}
            </div>
            <div className="ml-3">
                {children}
            </div>
        </Link>
    )
}

const Sidebar = ({ className, children }: SidebarProps) => {
    const [open, setOpen] = React.useState(false)
    const [desktopOpen, setDesktopOpen] = React.useState(true)
    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const origin = params.get("origin")

    const navigationItems = [
        {
            href: "/",
            icon: <Home className="h-4 w-4" />,
            label: "Dashboard",
        },
        {
            href: "/account",
            icon: <User className="h-4 w-4" />,
            label: "Account",
        },
        {
            href: "/wallet",
            icon: <Wallet className="h-4 w-4" />,
            label: "Wallet",
        },
    ]

    return (
        <>
            {/* Mobile Sidebar */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b">
                            <h2 className="text-lg font-semibold">Chain Service</h2>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            {navigationItems.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    onClick={() => setOpen(false)}
                                >
                                    {item.label}
                                </SidebarItem>
                            ))}
                        </nav>
                        {origin && (
                            <div className="p-4 border-t">
                                <a
                                    href={decodeURIComponent(origin)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </a>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden lg:block", className)}>
                <div className={cn(
                    "flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
                    desktopOpen ? "w-64" : "w-16"
                )}>
                    <div className="flex items-center justify-between p-4 border-b h-16">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDesktopOpen(!desktopOpen)}
                                className="h-8 w-8"
                                aria-label={desktopOpen ? "Collapse sidebar" : "Expand sidebar"}
                            >
                                <Menu className="h-4 w-4" />
                            </Button>
                            <h2 className={cn(
                                "text-lg font-semibold transition-all duration-300",
                                desktopOpen
                                    ? "opacity-100 delay-150"
                                    : "opacity-0 w-0 overflow-hidden delay-0"
                            )}>
                                Chain Service
                            </h2>
                        </div>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        {navigationItems.map((item) => (
                            <SidebarItem
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                            >
                                <span className={cn(
                                    "transition-all duration-300",
                                    desktopOpen
                                        ? "opacity-100 delay-150"
                                        : "opacity-0 w-0 overflow-hidden delay-0"
                                )}>
                                    {item.label}
                                </span>
                            </SidebarItem>
                        ))}
                    </nav>
                    {origin && desktopOpen && (
                        <div className="p-4 border-t">
                            <a
                                href={decodeURIComponent(origin)}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export { Sidebar } 