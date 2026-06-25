"use client";

import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { PresentationList } from "./PresentationList";
import { PresentationUploader } from "./PresentationUploader";
import { PresentationDetailSheet } from "./PresentationDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search } from "lucide-react";
import type { Presentation, PresentationFilters } from "../types";

export function PresentationsView() {
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [filters, setFilters] = useState<PresentationFilters>({});

  const handleSelect = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setDetailSheetOpen(true);
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Presentations"
        description="Manage and share your uploaded presentations."
        actions={
          <Button
            onClick={() => setUploaderOpen(true)}
            className="bg-accent-primary text-bg-base hover:bg-accent-primary-hover"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        }
      />

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search presentations..."
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-bg-surface border-border-default text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Presentation list */}
      <PresentationList
        filters={filters}
        onSelect={handleSelect}
        onCreateNew={() => setUploaderOpen(true)}
      />

      {/* Uploader dialog */}
      <PresentationUploader open={uploaderOpen} onOpenChange={setUploaderOpen} />

      {/* Detail sheet */}
      <PresentationDetailSheet
        presentationId={selectedPresentation?.id ?? null}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </PageContainer>
  );
}
