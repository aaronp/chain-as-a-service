import * as React from "react"
import { cn } from "../../../lib/utils"
import { Button } from "./button"
import { Menu, Home, User, Wallet, ArrowLeft, Sun, Moon, X } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

// Create context for sidebar state
const SidebarContext = React.createContext<{
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}>({
    mobileOpen: false,
    setMobileOpen: () => { },
});

// Create context for theme state
const ThemeContext = React.createContext<{
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}>({
    theme: 'light',
    setTheme: () => { },
});

export const useSidebar = () => React.useContext(SidebarContext);
export const useTheme = () => React.useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
        // Check localStorage for saved theme, or system preference, default to light
        const saved = localStorage.getItem('theme');
        if (saved) {
            return saved as 'light' | 'dark';
        }
        // Check system preference
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    React.useEffect(() => {
        // Save theme to localStorage
        localStorage.setItem('theme', theme);

        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

interface SidebarProps {
    className?: string
    children?: React.ReactNode
}

interface SidebarItemProps {
    href: string
    icon: React.ReactNode
    children: React.ReactNode
    onClick?: () => void
    showText?: boolean
}

const SidebarItem = ({ href, icon, children, onClick, showText = true }: SidebarItemProps) => {
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
            {showText && (
                <div className="ml-3">
                    {children}
                </div>
            )}
        </Link>
    )
}

const Sidebar = ({ className, children }: SidebarProps) => {
    const [open, setOpen] = React.useState(false)
    const [desktopOpen, setDesktopOpen] = React.useState(true)
    const { theme, setTheme } = useTheme()
    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const origin = params.get("origin")

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

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
            {/* Mobile Sidebar - Part of flex layout */}
            <div className={cn(
                "lg:hidden flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
                open ? "w-64" : "w-16"
            )}>
                <div className="flex h-full flex-col bg-background">
                    <div className="flex items-center justify-between border-b p-4 h-16">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setOpen(!open)}
                                className="h-8 w-8"
                                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
                            >
                                <Menu className="h-4 w-4" />
                            </Button>
                            <h2 className={cn(
                                "text-lg font-semibold transition-all duration-300",
                                open
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
                                showText={open}
                            >
                                <span className={cn(
                                    "transition-all duration-300",
                                    open
                                        ? "opacity-100 delay-150"
                                        : "opacity-0 w-0 overflow-hidden delay-0"
                                )}>
                                    {item.label}
                                </span>
                            </SidebarItem>
                        ))}
                    </nav>
                    {open && (
                        <div className="p-4 border-t space-y-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleTheme}
                                className="w-full justify-start"
                            >
                                {theme === 'light' ? (
                                    <Moon className="h-4 w-4 mr-2" />
                                ) : (
                                    <Sun className="h-4 w-4 mr-2" />
                                )}
                                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </Button>
                            {origin && (
                                <a
                                    href={decodeURIComponent(origin)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 hover:bg-accent transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
                                showText={desktopOpen}
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
                    {desktopOpen && (
                        <div className="p-4 border-t space-y-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleTheme}
                                className="w-full justify-start"
                            >
                                {theme === 'light' ? (
                                    <Moon className="h-4 w-4 mr-2" />
                                ) : (
                                    <Sun className="h-4 w-4 mr-2" />
                                )}
                                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </Button>
                            {origin && (
                                <a
                                    href={decodeURIComponent(origin)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 hover:bg-accent transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export { Sidebar } 