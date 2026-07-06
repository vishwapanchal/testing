import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Activity,
  Search,
  Globe,
  Loader2
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<{ title: string, url: string }[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&origin=*`)
        const data = await response.json()
        
        if (data && data[1] && data[3]) {
          const titles = data[1]
          const urls = data[3]
          const results = titles.map((title: string, index: number) => ({
            title,
            url: urls[index]
          }))
          setSearchResults(results)
        }
      } catch (error) {
        console.error("Web search failed", error)
      } finally {
        setIsSearching(false)
      }
    }, 400) // Debounce delay

    return () => clearTimeout(timer)
  }, [query])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  // To prevent cmdk from filtering out our results based on strict matching
  // we can append the query to the value so it always passes the internal filter.
  // Alternatively, cmdk filters by textContent if value is omitted, which is often enough, 
  // but this ensures robust behavior.

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline-flex">Search web & patients...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Type a command or search web..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Searching web...</span>
              </div>
            ) : (
              "No results found."
            )}
          </CommandEmpty>
          
          <div className={query ? "hidden" : "block"}>
            <CommandGroup heading="Patients">
              <CommandItem onSelect={() => runCommand(() => navigate("/patient/1"))}>
                <User className="mr-2 h-4 w-4" />
                <span>John Doe</span>
                <CommandShortcut>ICU-1</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/patient/2"))}>
                <User className="mr-2 h-4 w-4" />
                <span>Jane Smith</span>
                <CommandShortcut>ICU-2</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
                <Activity className="mr-2 h-4 w-4" />
                <span>View Ward Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/admin"))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Staff Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </div>

          {searchResults.length > 0 && (
            <CommandGroup heading="Web Search Results">
              {searchResults.map((result) => (
                <CommandItem 
                  key={result.url}
                  value={`${query} ${result.title}`}
                  onSelect={() => runCommand(() => window.open(result.url, "_blank"))}
                >
                  <Globe className="mr-2 h-4 w-4 text-blue-500" />
                  <span>{result.title}</span>
                  <CommandShortcut>Web</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
