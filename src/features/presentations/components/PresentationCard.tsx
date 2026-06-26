"use client";
import Image from "next/image";

import { cn, formatRelativeTime } from "@/lib/utils";
import type { Presentation } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
  FileText,
} from "lucide-react";

interface PresentationCardProps {
  presentation: Presentation;
  onSelect?: (presentation: Presentation) => void;
  onEdit?: (presentation: Presentation) => void;
  onDelete?: (presentation: Presentation) => void;
  onShare?: (presentation: Presentation) => void;
  className?: string;
}

export function PresentationCard({
  presentation,
  onSelect,
  onEdit,
  onDelete,
  onShare,
  className,
}: PresentationCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border-subtle bg-bg-card",
        "transition-all duration-200 hover:border-border-default hover:shadow-md",
        "cursor-pointer",
        className
      )}
      onClick={() => onSelect?.(presentation)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-bg-elevated">
        {presentation.thumbnailUrl ? (
          <Image
            src={presentation.thumbnailUrl}
            alt={presentation.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-12 w-12 text-text-muted" />
          </div>
        )}

        {/* Visibility badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant={presentation.visibility === "PUBLIC" ? "default" : "secondary"}
            className="bg-bg-base/80 text-text-primary backdrop-blur-sm"
          >
            {presentation.visibility}
          </Badge>
        </div>

        {/* Actions menu */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-bg-base/80 backdrop-blur-sm hover:bg-bg-base text-text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-bg-card border-border-default">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(presentation);
                }}
                className="text-text-primary focus:bg-bg-hover"
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(presentation);
                }}
                className="text-text-primary focus:bg-bg-hover"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(presentation);
                }}
                className="text-text-primary focus:bg-bg-hover"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(presentation);
                }}
                className="text-error focus:bg-bg-hover"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-text-primary line-clamp-1">
          {presentation.title}
        </h3>
        {presentation.description && (
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">
            {presentation.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {presentation.category && (
            <Badge variant="outline" className="border-border-default text-text-secondary">
              {presentation.category}
            </Badge>
          )}
          <span className="text-xs text-text-muted">
            {formatRelativeTime(presentation.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
