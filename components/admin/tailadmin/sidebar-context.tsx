"use client";

// Adapted from TailAdmin free-nextjs-admin-dashboard (MIT).
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const value = useMemo<SidebarContextType>(
    () => ({
      isExpanded: isMobile ? false : isExpanded,
      isMobileOpen,
      isHovered,
      toggleSidebar: () => setIsExpanded((current) => !current),
      toggleMobileSidebar: () => setIsMobileOpen((current) => !current),
      setIsHovered,
    }),
    [isExpanded, isHovered, isMobile, isMobileOpen],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
