"use client";

import React from "react";
import { Presentation, Settings, Maximize2, Minimize2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

type LayoutPreset = "default" | "focus" | null;

interface WorkspaceHeaderProps {
  onSettingsOpen?: () => void;
  onNewEvent?: () => void;
  layoutPreset?: LayoutPreset;
  onLayoutChange?: (preset: LayoutPreset) => void;
  isPptLoaded?: boolean;
}

export function WorkspaceHeader({ onSettingsOpen, onNewEvent, layoutPreset, onLayoutChange, isPptLoaded }: WorkspaceHeaderProps) {
  const isDefault = layoutPreset === "default" || layoutPreset === null;

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
                  onClick={onSettingsOpen}
                  className="text-text-muted hover:text-text-primary"
                />
              }
            >
              <Settings className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
