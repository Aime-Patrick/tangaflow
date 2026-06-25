"use client";

import { usePresentation } from "../hooks/usePresentation";
import { useDeletePresentation } from "../hooks/useDeletePresentation";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  FileText,
  Share2,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  HardDrive,
  Eye,
} from "lucide-react";

interface PresentationDetailSheetProps {
  presentationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function PresentationDetailSheet({
  presentationId,
  open,
  onOpenChange,
  onEdit,
  onShare,
}: PresentationDetailSheetProps) {
  const { data: presentation, isLoading } = usePresentation(presentationId ?? "");
  const deletePresentation = useDeletePresentation();

  const handleDelete = async () => {
    if (!presentationId) return;
    await deletePresentation.mutateAsync(presentationId);
    onOpenChange(false);
  };

  const handleOpenInNewTab = () => {
    if (presentation?.fileUrl) {
      window.open(presentation.fileUrl, "_blank");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-bg-surface border-border-subtle overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : !presentation ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-text-secondary">Presentation not found</p>
          </div>
        ) : (
          <>
            <SheetHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <SheetTitle className="text-xl text-text-primary">
                    {presentation.title}
                  </SheetTitle>
                  <SheetDescription className="text-text-secondary">
                    {presentation.description || "No description"}
                  </SheetDescription>
                </div>
                <Badge
                  variant={presentation.visibility === "PUBLIC" ? "default" : "secondary"}
                  className="ml-2"
                >
                  {presentation.visibility}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleOpenInNewTab}
                  className="flex-1 bg-accent-primary text-bg-base hover:bg-accent-primary-hover"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onShare?.(presentationId!)}
                  className="border-border-default text-text-primary hover:bg-bg-hover"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onEdit?.(presentationId!)}
                  className="border-border-default text-text-primary hover:bg-bg-hover"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deletePresentation.isPending}
                  className="border-error/50 text-error hover:bg-error/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            <Separator className="my-6 bg-border-subtle" />

            {/* Preview */}
            <div className="mb-6 aspect-video rounded-xl bg-bg-elevated overflow-hidden">
              {presentation.thumbnailUrl ? (
                <img
                  src={presentation.thumbnailUrl}
                  alt={presentation.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <FileText className="h-12 w-12 text-text-muted" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-text-primary">Details</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Calendar className="h-4 w-4" />
                  <span>Uploaded {formatRelativeTime(presentation.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatNumber(presentation.fileSize)} bytes</span>
                </div>
                {presentation.category && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Eye className="h-4 w-4" />
                    <span>{presentation.category}</span>
                  </div>
                )}
                {presentation.pageCount && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <FileText className="h-4 w-4" />
                    <span>{presentation.pageCount} pages</span>
                  </div>
                )}
              </div>

              {presentation.category && (
                <Badge variant="outline" className="border-border-default text-text-secondary">
                  {presentation.category}
                </Badge>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
