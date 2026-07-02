"use client";

import React from "react";
import { Settings, Maximize2, Minimize2, Plus, User, LogOut, Sun, Moon } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth";

type LayoutPreset = "default" | "focus" | null;

interface WorkspaceHeaderProps {
  onNewEvent?: () => void;
  onProfileOpen?: () => void;
  onSettingsOpen?: () => void;
  layoutPreset?: LayoutPreset;
  onLayoutChange?: (preset: LayoutPreset) => void;
  isPptLoaded?: boolean;
}

export function WorkspaceHeader({
  onNewEvent,
  onProfileOpen,
  onSettingsOpen,
  layoutPreset,
  onLayoutChange,
  isPptLoaded,
}: WorkspaceHeaderProps) {
  const isDefault = layoutPreset === "default" || layoutPreset === null;
  const logoutMutation = useLogout();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLayout = () => {
    if (onLayoutChange) {
      onLayoutChange(isDefault ? "focus" : "default");
    }
  };

  return (
    <TooltipProvider>
      <header className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-text-primary">
            TangaFlow
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onNewEvent && isPptLoaded && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onNewEvent}
                    className="text-text-muted hover:text-text-primary"
                  />
                }
              >
                <Plus className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>New Event</TooltipContent>
            </Tooltip>
          )}
          {onLayoutChange && isPptLoaded && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={toggleLayout}
                    className="text-text-muted hover:text-text-primary"
                  />
                }
              >
                <AnimatePresence mode="wait">
                  {isDefault ? (
                    <motion.div
                      key="maximize"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="minimize"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </TooltipTrigger>
              <TooltipContent>{isDefault ? "Focus" : "Default"}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleTheme}
                  className="text-text-muted hover:text-text-primary"
                />
              }
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </TooltipTrigger>
            <TooltipContent>{theme === "dark" ? "Light Mode" : "Dark Mode"}</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-text-secondary hover:text-text-primary"
                />
              }
            >
              <User className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuItem onClick={onProfileOpen}>
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSettingsOpen}>
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutMutation.mutate()} variant="destructive">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
