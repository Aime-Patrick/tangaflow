"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  FileUp,
  RefreshCw,
  FileText,
  X,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PptxViewer, RECOMMENDED_ZIP_LIMITS } from "@aiden0z/pptx-renderer";
import { savePPTX, savePPTXCloud, loadPPTX, loadPPTXFromCloud, listPPTX, deletePPTX, type PPTXMeta } from "@/lib/pptxStorage";
import { CampaignProgressBar } from "./CampaignProgressBar";
import { toast } from "sonner";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB localStorage safe limit

interface PresentationPlayerProps {
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fs: boolean) => void;
  raisedAmount: number;
  targetAmount: number;
  currency?: string;
  onLoadedChange?: (loaded: boolean) => void;
}

export function PresentationPlayer({
  activeSlideIndex,
  setActiveSlideIndex,
  isPlaying,
  setIsPlaying,
  isFullscreen,
  setIsFullscreen,
  raisedAmount,
  targetAmount,
  currency = "USD",
  onLoadedChange,
}: PresentationPlayerProps) {
  const [view, setView] = useState<"empty" | "loading" | "loaded">("empty");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pptxSlideCount, setPptxSlideCount] = useState(0);
  const [savedFiles, setSavedFiles] = useState<
    { fileName: string; size: number }[]
  >([]);
  const [isHoveringViewport, setIsHoveringViewport] = useState(false);
  const [isTopHoveringControls, setIsTopHoveringControls] = useState(false);
  const [isBottomHoveringControls, setIsBottomHoveringControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pptxContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PptxViewer | null>(null);
  const topControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bottomControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSavedFiles(listPPTX());
  }, []);

  useEffect(() => {
    onLoadedChange?.(view === "loaded");
  }, [view, onLoadedChange]);

  // Autoplay
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && view === "loaded" && pptxSlideCount > 0) {
      interval = setInterval(() => {
        const next = activeSlideIndex + 1;
        setActiveSlideIndex(next >= pptxSlideCount ? 0 : next);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, view, pptxSlideCount, activeSlideIndex, setActiveSlideIndex]);

  // Navigate slides
  useEffect(() => {
    if (view === "loaded" && viewerRef.current) {
      viewerRef.current.goToSlide(activeSlideIndex);
    }
  }, [activeSlideIndex, view]);

  const handleNext = () => {
    if (activeSlideIndex < pptxSlideCount - 1)
      setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handlePrev = () => {
    if (activeSlideIndex > 0) setActiveSlideIndex(activeSlideIndex - 1);
  };

  const toggleFullscreen = useCallback(() => {
    const el = document.getElementById("presentation-viewport");
    if (!el) return;
    if (!isFullscreen) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen, setIsFullscreen]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, [setIsFullscreen]);

  // Force viewer reflow when viewport resizes
  useEffect(() => {
    const el = document.getElementById("presentation-viewport");
    if (!el) return;
    const ro = new ResizeObserver(() => {
      viewerRef.current?.setFitMode("contain");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (view !== "loaded") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case " ":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [view, isPlaying, isFullscreen, handlePrev, handleNext, setIsPlaying, toggleFullscreen]);


  const handleViewportMouseEnter = () => {
    setIsHoveringViewport(true);
  };

  const handleViewportMouseLeave = () => {
    setIsHoveringViewport(false);
  };

  const handleTopControlsMouseEnter = () => {
    if (topControlsTimeoutRef.current) clearTimeout(topControlsTimeoutRef.current);
    setIsTopHoveringControls(true);
  };

  const handleTopControlsMouseLeave = () => {
    topControlsTimeoutRef.current = setTimeout(() => {
      setIsTopHoveringControls(false);
    }, 300);
  };

  const handleBottomControlsMouseEnter = () => {
    if (bottomControlsTimeoutRef.current) clearTimeout(bottomControlsTimeoutRef.current);
    setIsBottomHoveringControls(true);
  };

  const handleBottomControlsMouseLeave = () => {
    bottomControlsTimeoutRef.current = setTimeout(() => {
      setIsBottomHoveringControls(false);
    }, 300);
  };

  const processPPTX = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith(".pptx")) {
      toast.error("Only .pptx files are supported.");
      return;
    }

    setView("loading");
    setUploadProgress(0);

    try {
      await new Promise((r) => setTimeout(r, 300));
      setUploadProgress(15);

      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress(30);

      await new Promise((r) => setTimeout(r, 200));

      // Check file size for localStorage
      const exceedsLimit = file.size > MAX_FILE_SIZE;
      if (!exceedsLimit) {
        try {
          savePPTX(file.name, arrayBuffer);
          setSavedFiles(listPPTX());
        } catch {
          toast.warning(
            "File saved to memory only (too large for local storage).",
          );
        }
      } else {
        // Upload to Cloudinary
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = "tangaflow_unsigned";
        const folder = "tangaflow/pptx";
        if (cloudName) {
          setUploadProgress(35);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);
          formData.append("folder", folder);
          formData.append("resource_type", "raw");
          try {
            const res = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
              { method: "POST", body: formData }
            );
            if (res.ok) {
              const data = await res.json();
              savePPTXCloud(file.name, file.size, data.secure_url);
              setSavedFiles(listPPTX());
              toast.success("File saved to cloud storage.");
            } else {
              toast.warning("Cloud upload failed — session only.");
            }
          } catch {
            toast.warning("Cloud upload failed — session only.");
          }
        } else {
          toast.warning("File too large for local storage — session only.");
        }
      }

      setUploadProgress(50);

      // Destroy old viewer
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }

      await new Promise((r) => setTimeout(r, 200));
      setUploadProgress(65);

      // Wait for container ref to be available
      await new Promise((r) => setTimeout(r, 50));

      if (!pptxContainerRef.current) {
        throw new Error("Renderer container not found");
      }

      pptxContainerRef.current.innerHTML = "";

      const viewer = new PptxViewer(pptxContainerRef.current, {
        fitMode: "contain",
        zipLimits: RECOMMENDED_ZIP_LIMITS,
        lazySlides: true,
        lazyMedia: true,
        onSlideChange: (index: number) => setActiveSlideIndex(index),
        onSlideError: (index: number, error: unknown) => {
          console.warn(`Slide ${index + 1} rendering error:`, error);
        },
      });

      await new Promise((r) => setTimeout(r, 300));
      setUploadProgress(80);
      await viewer.open(arrayBuffer, {
        renderMode: "slide",
        lazySlides: true,
        lazyMedia: true,
      });

      viewerRef.current = viewer;
      setPptxSlideCount(viewer.slideCount);
      setActiveSlideIndex(0);
      await new Promise((r) => setTimeout(r, 200));
      setUploadProgress(100);

      // Brief delay so skeleton is visible, then fade in PPT
      setTimeout(() => setView("loaded"), 300);
    } catch (err) {
      console.error("Failed to parse PPTX:", err);
      toast.error(
        "Failed to parse the PowerPoint file. Please try another file.",
      );
      setIsPlaying(false);
      setView("empty");
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processPPTX(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPPTX(file);
    e.target.value = "";
  };

  const handleRestoreFile = async (fileName: string) => {
    // Check if it's a cloud file
    const meta = listPPTX().find((f) => f.fileName === fileName);
    let buffer: ArrayBuffer | null = null;

    if (meta?.cloudUrl) {
      toast.info("Downloading from cloud...");
      buffer = await loadPPTXFromCloud(meta.cloudUrl);
      if (!buffer) {
        toast.error("Failed to download from cloud.");
        return;
      }
    } else {
      buffer = loadPPTX(fileName);
      if (!buffer) return;
    }

    const file = new File([buffer], fileName, {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    await processPPTX(file);
  };

  const handleDeleteSaved = (fileName: string) => {
    deletePPTX(fileName);
    setSavedFiles(listPPTX());
  };

  const handleReset = () => {
    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }
    if (pptxContainerRef.current) {
      pptxContainerRef.current.innerHTML = "";
    }
    setView("empty");
    setActiveSlideIndex(0);
    setPptxSlideCount(0);
    setView("empty");
  };

  return (
    <div className="flex flex-col items-center justify-start h-full space-y-4 min-h-0 w-full">
      {view === "loaded" && raisedAmount > 0 && (
        <motion.div
          layoutId="progress-bar"
          className="shrink-0 w-full mb-2"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <CampaignProgressBar raisedAmount={raisedAmount} targetAmount={targetAmount} currency={currency} />
        </motion.div>
      )}

      {/* Main workspace container wrapping player & empty/loading state to restrict size */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center [container-type:size]">
        {/* PPTX container - always in DOM so ref is available, hidden conditionally */}
        <div
          id="presentation-viewport"
          className={`relative overflow-hidden shadow-xl bg-bg-base ${view === "loaded" ? "block animate-[fadeIn_0.4s_ease-out]" : "hidden"}`}
          style={{
            aspectRatio: "16/9",
            // min() picks: full panel width OR height-derived width — whichever is smaller
            // This is the CSS "contain" pattern using container query units
            width: "min(100cqw, calc(100cqh * 16 / 9))",
          }}
          onMouseEnter={handleViewportMouseEnter}
          onMouseLeave={handleViewportMouseLeave}
        >
          <div
            ref={pptxContainerRef}
            className="w-full h-full"
          />

          {/* Top-right controls - dot that expands on hover */}
          <div
            className="absolute top-4 right-4 z-10"
            onMouseEnter={handleTopControlsMouseEnter}
            onMouseLeave={handleTopControlsMouseLeave}
          >
            <motion.div
              className="flex items-center gap-1.5 overflow-hidden"
              initial={false}
              animate={{
                width: isTopHoveringControls ? "auto" : 32,
                height: 32,
                padding: isTopHoveringControls ? "6px 10px" : "6px",
                opacity: isHoveringViewport || isTopHoveringControls ? 1 : 0,
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {isTopHoveringControls ? (
                <>
                  <Badge className="bg-bg-elevated/70 text-text-secondary text-xs px-1 py-0.5 font-bold backdrop-blur-sm rounded-none">
                    {activeSlideIndex + 1} / {pptxSlideCount}
                  </Badge>
                  <div className="w-px h-4 bg-border-default/20 mx-0.5" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    className="h-7 w-7 text-text-secondary hover:text-text-primary hover:bg-border-default/10 rounded-none"
                    title="Close presentation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <MoreVertical className="h-4 w-4 text-text-secondary" />
              )}
            </motion.div>
          </div>

          {/* Bottom controls - dot that expands on hover */}
          <div
            className="absolute bottom-3 right-3 z-10"
            onMouseEnter={handleBottomControlsMouseEnter}
            onMouseLeave={handleBottomControlsMouseLeave}
          >
            <motion.div
              className="flex items-center gap-1.5 overflow-hidden"
              initial={false}
              animate={{
                width: isBottomHoveringControls ? "auto" : 32,
                height: 32,
                padding: isBottomHoveringControls ? "6px 10px" : "6px",
                opacity: isHoveringViewport || isBottomHoveringControls ? 1 : 0,
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {isBottomHoveringControls ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    className="h-7 w-7 text-text-secondary hover:text-text-primary hover:bg-border-default/10 rounded-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-7 w-7 text-text-secondary hover:text-text-primary hover:bg-border-default/10 rounded-none"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="h-7 w-7 text-text-secondary hover:text-text-primary hover:bg-border-default/10 rounded-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-4 bg-border-default/20 mx-0.5" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-7 w-7 text-text-secondary hover:text-text-primary hover:bg-border-default/10 rounded-none"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </>
              ) : (
                <MoreVertical className="h-4 w-4 text-text-secondary" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Empty / Loading state */}
        {view !== "loaded" && (
          <div
            className="relative overflow-hidden flex items-center justify-center w-full bg-bg-base"
            style={{
              aspectRatio: "16/9",
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <AnimatePresence mode="wait">
              {view === "empty" ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col z-10 w-full h-full justify-center"
                >
                  {savedFiles.length > 0 ? (
                    /* Has saved files — centered list */
                    <>
                      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full">
                        {raisedAmount > 0 && (
                          <motion.div
                            layoutId="progress-bar"
                            className="shrink-0 mb-6 w-full max-w-lg"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          >
                            <CampaignProgressBar raisedAmount={raisedAmount} targetAmount={targetAmount} currency={currency} />
                          </motion.div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pptx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        <div className="w-full max-w-md flex flex-col items-center">
                          <AnimatePresence>
                            {savedFiles.map((f, i) => (
                              <motion.div
                                key={f.fileName}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                onClick={() => handleRestoreFile(f.fileName)}
                                className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-elevated hover:bg-bg-hover transition-colors group text-left mb-2 cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                                  <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary truncate">
                                    {f.fileName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[9px] text-text-muted">
                                    {(f.size / 1024 / 1024).toFixed(1)}MB
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSaved(f.fileName);
                                    }}
                                    className="text-text-muted hover:text-red-400 p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: savedFiles.length * 0.05 + 0.1 }}
                            className="mt-3"
                          >
                            <Button
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-accent-primary hover:bg-accent-primary-hover text-bg-base font-bold text-xs h-7 border-none rounded-none"
                            >
                              <FileUp className="h-3 w-3 mr-1" />
                              Upload New
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* No saved files — upload prompt */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center w-full">
                      {raisedAmount > 0 && (
                        <motion.div
                          layoutId="progress-bar"
                          className="shrink-0 mb-4 w-full max-w-lg"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <CampaignProgressBar raisedAmount={raisedAmount} targetAmount={targetAmount} currency={currency} />
                        </motion.div>
                      )}
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated border border-border-subtle shadow-md text-text-primary mb-4">
                        <FileUp className="h-7 w-7" />
                      </div>
                      <h4 className="text-base font-bold text-text-primary">
                        Upload your Presentation
                      </h4>
                      <p className="text-xs text-text-secondary mt-1 max-w-[360px] mx-auto mb-4">
                        Drag and drop your PPTX file here, or click browse to
                        upload.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pptx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-accent-primary hover:bg-accent-primary-hover text-bg-base font-bold"
                      >
                        Browse Files
                      </Button>
                      <span className="text-[10px] text-text-muted mt-3 font-semibold">
                        Supports PowerPoint (.pptx) files
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Loading state */
                <div
                  className="relative overflow-hidden shadow-xl bg-bg-base z-10 mx-auto"
                  style={{
                    aspectRatio: "16/9",
                    width: "100%",
                    height: "100%",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                >
                  <Skeleton className="w-full h-full rounded-none" />
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
