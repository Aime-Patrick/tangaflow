"use client";

import { useState, useCallback } from "react";
import { useCreatePresentation } from "../hooks/useCreatePresentation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, X } from "lucide-react";
import type { CreatePresentationInput } from "../types";

interface PresentationUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PresentationUploader({ open, onOpenChange }: PresentationUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<Partial<CreatePresentationInput>>({
    title: "",
    description: "",
    category: "",
    visibility: "PUBLIC",
  });

  const createPresentation = useCreatePresentation();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".pptx") || droppedFile.name.endsWith(".ppt")) {
        setFile(droppedFile);
        if (!form.title) {
          setForm((prev) => ({ ...prev, title: droppedFile.name.replace(/\.[^/.]+$/, "") }));
        }
      }
    }
  }, [form.title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      if (!form.title) {
        setForm((prev) => ({ ...prev, title: e.target.files![0].name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !form.title) return;

    // TODO: Implement actual file upload when storage backend is added.
    // For now we store presentation metadata with a local object URL for preview.
    const localPreviewUrl = URL.createObjectURL(file);

    await createPresentation.mutateAsync({
      title: form.title,
      description: form.description,
      category: form.category,
      visibility: form.visibility as "PUBLIC" | "PRIVATE",
      fileUrl: localPreviewUrl,
      fileName: file.name,
      fileSize: file.size,
      thumbnailUrl: undefined,
    });

    // Revoke the object URL after it has been stored in state
    URL.revokeObjectURL(localPreviewUrl);

    // Reset and close
    setFile(null);
    setForm({ title: "", description: "", category: "", visibility: "PUBLIC" });
    onOpenChange(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-card border-border-default sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Upload Presentation</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Upload a PowerPoint file (.pptx or .ppt)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload area */}
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
              dragActive
                ? "border-accent-primary bg-accent-primary-subtle"
                : file
                ? "border-success bg-success/5"
                : "border-border-default hover:border-border-strong"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-accent-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-text-muted">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-text-muted hover:text-text-primary"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-text-muted" />
                <p className="text-sm text-text-secondary">
                  Drag & drop or{" "}
                  <label className="cursor-pointer text-accent-primary hover:underline">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".pptx,.ppt"
                      onChange={handleFileChange}
                    />
                  </label>
                </p>
                <p className="mt-1 text-xs text-text-muted">.pptx or .ppt files only</p>
              </>
            )}
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-text-primary">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Presentation title"
                className="mt-1 bg-bg-elevated border-border-default text-text-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description (optional)"
                className="mt-1 bg-bg-elevated border-border-default text-text-primary resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary">Category</label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Fundraiser"
                  className="mt-1 bg-bg-elevated border-border-default text-text-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary">Visibility</label>
                <Select
                  value={form.visibility}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value as "PUBLIC" | "PRIVATE" }))}
                >
                  <SelectTrigger className="mt-1 bg-bg-elevated border-border-default text-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-card border-border-default">
                    <SelectItem value="PUBLIC" className="text-text-primary">Public</SelectItem>
                    <SelectItem value="PRIVATE" className="text-text-primary">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border-default text-text-primary hover:bg-bg-hover"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || !form.title || createPresentation.isPending}
            className="bg-accent-primary text-bg-base hover:bg-accent-primary-hover"
          >
            {createPresentation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
