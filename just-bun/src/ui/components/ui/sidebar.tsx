import * as React from "react"
import { cn } from "../../../lib/utils"
import { Button } from "./button"
import { Menu, Home, User, Wallet, ArrowLeft, Sun, Moon, X, Plus, ChevronDown, ChevronRight } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { client } from "@/api/client"
import { StoredChain } from "@/api/chains"
import { useAccount } from "@/ui/account/AccountContext"
import { useEffect, useState } from "react"
import { StoredContract } from "@/api/contracts"

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
    actionButton?: React.ReactNode
    leftActionButton?: React.ReactNode
    indent?: boolean
}

interface NavigationItem {
    href: string
    icon: React.ReactNode
    label: string
    actionButton?: React.ReactNode
    leftActionButton?: React.ReactNode
    indent?: boolean
}

const SidebarItem = ({ href, icon, children, onClick, showText = true, actionButton, leftActionButton, indent = false }: SidebarItemProps) => {
    const location = useLocation()
    const isActive = location.pathname === href

    return (
        <div className={cn("flex items-center justify-between group", indent && "ml-4")}>
            <Link
                to={href}
                onClick={onClick}
                className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors flex-1",
                    indent ? "py-1 min-h-[32px]" : "py-2 min-h-[40px]",
                    isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
            >
                {leftActionButton && showText && (
                    <div className="mr-2">
                        {leftActionButton}
                    </div>
                )}
                <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center ml-2">
                    {icon}
                </div>
                {showText && (
                    <div className="ml-3">
                        {children}
                    </div>
                )}
            </Link>
            {actionButton && showText && (
                <div className="ml-2">
                    {actionButton}
                </div>
            )}
        </div>
    )
}

const Sidebar = ({ className, children }: SidebarProps) => {
    const [open, setOpen] = React.useState(false)
    const [desktopOpen, setDesktopOpen] = React.useState(true)
    const [chainsExpanded, setChainsExpanded] = React.useState(true)
    const [expandedChains, setExpandedChains] = React.useState<Set<string>>(new Set())
    const [addChainModalOpen, setAddChainModalOpen] = React.useState(false)
    const [chainName, setChainName] = React.useState("")
    const { theme, setTheme } = useTheme()
    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const origin = params.get("origin")
    const [chains, setChains] = useState<StoredChain[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const { currentAccount } = useAccount();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

    const refreshChains = () => {


        client().listChains().then((chains: StoredChain[]) => {
            if (chains && Array.isArray(chains)) {
                setChains(chains);
            }
        });
        client().listContracts().then((contracts: StoredContract[]) => {
            if (contracts && Array.isArray(contracts)) {
                setContracts(contracts);
            }
        });


    }

    const handleAddChain = () => {
        if (currentAccount && chainName.trim()) {
            client().registerChain({
                name: chainName,
                creatorAddress: currentAccount.address
            }).then(() => {
                refreshChains();
                setChainName("");
                setAddChainModalOpen(false);
            });
        }
    };

    const toggleChainExpanded = (chainId: string) => {
        const newExpanded = new Set(expandedChains);
        if (newExpanded.has(chainId)) {
            newExpanded.delete(chainId);
        } else {
            newExpanded.add(chainId);
        }
        setExpandedChains(newExpanded);
    };

    const getContractsForChain = (chainId: string) => {
        return contracts.filter(contract => contract.chainId === chainId);
    };

    useEffect(() => refreshChains(), []);

    const chainItems = currentAccount ? [{
        href: "/",
        icon: <Home className="h-4 w-4" />,
        label: "Chains",
        actionButton: (
            <div className="flex items-center gap-1">
                <Button
                    variant="default"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAddChainModalOpen(true);
                    }}
                >
                    <Plus className="h-3 w-3" />
                </Button>
                {chains.length > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setChainsExpanded(!chainsExpanded);
                        }}
                    >
                        {chainsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                )}
            </div>
        ),
    },
    ...(chainsExpanded ? chains.flatMap((chain) => {
        const chainContracts = getContractsForChain(chain.chainId);
        const hasContracts = chainContracts.length > 0;
        const isChainExpanded = expandedChains.has(chain.chainId);

        const chainMenuItem = {
            href: `/chain/${chain.chainId}`,
            icon: <svg className="h-4 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 5.656l-1.1 1.1" />
            </svg>,
            label: chain.name,
            actionButton: hasContracts ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 mr-2"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleChainExpanded(chain.chainId);
                    }}
                >
                    {isChainExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
            ) : undefined,
        };

        const contractItems = hasContracts && isChainExpanded ? chainContracts.map((contract) => ({
            href: `/chain/${chain.chainId}/contract/${contract.contractAddress}`,
            icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>,
            label: contract.name || contract.contractAddress.slice(0, 8) + "...",
            indent: true,
        })) : [];

        return [chainMenuItem, ...contractItems];
    }) : [])] : []

    const navigationItems = [
        ...chainItems,
        {
            href: "/account",
            icon: <User className="h-4 w-4" />,
            label: "Accounts",
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
                    <nav className="flex-1 p-4">
                        <div className="space-y-0.5">
                            {navigationItems.map((item: NavigationItem) => (
                                <SidebarItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    showText={open}
                                    actionButton={item.actionButton}
                                    leftActionButton={item.leftActionButton}
                                    indent={item.indent}
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
                        </div>
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
                    <nav className="flex-1 p-4">
                        <div className="space-y-0.5">
                            {navigationItems.map((item: NavigationItem) => (
                                <SidebarItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    showText={desktopOpen}
                                    actionButton={item.actionButton}
                                    leftActionButton={item.leftActionButton}
                                    indent={item.indent}
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
                        </div>
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

            {/* Add Chain Modal */}
            {addChainModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 w-full max-w-sm border">
                        <h2 className="text-xl font-semibold mb-4">Add Chain</h2>
                        <input
                            type="text"
                            className="w-full border border-input rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                            placeholder="Chain name"
                            value={chainName}
                            onChange={e => setChainName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => { setAddChainModalOpen(false); setChainName(""); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddChain}
                                disabled={!chainName.trim()}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export { Sidebar } 