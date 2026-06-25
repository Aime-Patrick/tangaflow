"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { PresentationPlayer } from "./PresentationPlayer";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { SettingsDialog } from "./SettingsDialog";
import { EventNameDialog } from "./EventNameDialog";
import { useCampaign, useCreateCampaign, useUpdateCampaign } from "@/features/campaign";
import { debounce } from "@/lib/utils";

type LayoutPreset = "default" | "focus" | null;

const PRESETS: Record<string, number> = {
  default: 66.67,
  focus: 83.33,
};

function getSessionKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tangaflow-session-key");
}

export function PresentationWorkspace() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPptLoaded, setIsPptLoaded] = useState(false);
  const [eventNameDialogOpen, setEventNameDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("polar");
  const [customQrContent, setCustomQrContent] = useState("");

  const [sessionKey, setSessionKeyState] = useState<string | null>(getSessionKey);

  const { data: campaign, isLoading: campaignLoading } = useCampaign({
    id: sessionKey,
  });

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign({ campaignId: sessionKey ?? "" });

  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tangaflow-layout");
      if (saved && saved in PRESETS) return saved as LayoutPreset;
    }
    return "default";
  });
  const [splitRatio, setSplitRatio] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tangaflow-layout");
      if (saved && PRESETS[saved]) return PRESETS[saved];
    }
    return PRESETS.default;
  });
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const startXRef = useRef(0);
  const startRatioRef = useRef(0);

  const handlePreset = useCallback((preset: LayoutPreset) => {
    setLayoutPreset(preset);
    if (preset) {
      setSplitRatio(PRESETS[preset]);
      localStorage.setItem("tangaflow-layout", preset);
    }
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startRatioRef.current = splitRatio;
    setIsDragging(true);
    setLayoutPreset(null);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [splitRatio]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const wrapperWidth = wrapper.getBoundingClientRect().width;
        const deltaX = e.clientX - startXRef.current;
        const deltaRatio = (deltaX / wrapperWidth) * 100;
        const newRatio = Math.min(85, Math.max(30, startRatioRef.current + deltaRatio));
        setSplitRatio(newRatio);
      });
    };

    const handleMouseUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging]);

  const handlePptLoaded = useCallback((loaded: boolean) => {
    setIsPptLoaded(loaded);
    if (loaded && !sessionKey) {
      setEventNameDialogOpen(true);
    }
  }, [sessionKey]);

  const handleEventNameSubmit = useCallback(
    (name: string) => {
      createCampaign.mutate(
        { name, targetAmount: 10000 },
        {
          onSuccess: (data) => {
            localStorage.setItem("tangaflow-session-key", data._id);
            setSessionKeyState(data._id);
            setEventNameDialogOpen(false);
          },
        }
      );
    },
    [createCampaign]
  );

  const debouncedUpdate = useMemo(
    () =>
      debounce((id: string, input: Parameters<typeof updateCampaign.mutate>[0]) => {
        updateCampaign.mutate(input);
      }, 500),
    [updateCampaign]
  );

  const handleTargetChange = useCallback(
    (value: number) => {
      if (sessionKey) {
        debouncedUpdate(sessionKey, { targetAmount: value });
      }
    },
    [sessionKey, debouncedUpdate]
  );

  const handleCurrencyChange = useCallback(
    (value: string) => {
      if (sessionKey) {
        debouncedUpdate(sessionKey, { currency: value });
      }
    },
    [sessionKey, debouncedUpdate]
  );

  const handleQrTextChange = useCallback(
    (value: string) => {
      if (sessionKey) {
        debouncedUpdate(sessionKey, { qrText: value });
      }
    },
    [sessionKey, debouncedUpdate]
  );

  const handleSaveSettings = useCallback(() => {
    if (sessionKey) {
      updateCampaign.mutate({
        name: campaign?.name,
        targetAmount: campaign?.targetAmount,
        currency: campaign?.currency,
        qrText: campaign?.qrText,
      });
    }
  }, [sessionKey, updateCampaign, campaign]);

  const donationUrl = sessionKey
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/donate/${sessionKey}`
    : "";

  const showPanels = sessionKey !== null && isPptLoaded;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base text-text-primary">
      <WorkspaceHeader
        onSettingsOpen={() => setSettingsOpen(true)}
        layoutPreset={layoutPreset}
        onLayoutChange={handlePreset}
        isPptLoaded={isPptLoaded}
      />

      <EventNameDialog
        open={eventNameDialogOpen}
        onSubmit={handleEventNameSubmit}
        isPending={createCampaign.isPending}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        eventName={campaign?.name ?? ""}
        onEventNameChange={(value) => {
          if (sessionKey) {
            debouncedUpdate(sessionKey, { name: value });
          }
        }}
        targetAmount={campaign?.targetAmount ?? 10000}
        onTargetChange={handleTargetChange}
        currency={campaign?.currency ?? "USD"}
        onCurrencyChange={handleCurrencyChange}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        donationUrl={donationUrl}
        qrContent={customQrContent}
        onQrContentChange={setCustomQrContent}
        onSave={handleSaveSettings}
        isSaving={updateCampaign.isPending}
      />

      <main className="flex-1 flex overflow-hidden p-6 gap-6 min-h-0">
        <div
          ref={wrapperRef}
          className="flex-1 flex h-full max-w-7xl mx-auto w-full gap-0"
          style={{
            "--ppt-ratio": `${splitRatio}%`,
            "--qr-ratio": `${100 - splitRatio}%`,
          } as React.CSSProperties}
        >
          <div
            className={`h-full overflow-hidden ${isDragging ? "" : "transition-[flex] duration-200"}`}
            style={{
              flex: showPanels ? `0 0 var(--ppt-ratio)` : "1 1 100%",
            }}
          >
            <PresentationPlayer
              activeSlideIndex={activeSlideIndex}
              setActiveSlideIndex={setActiveSlideIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              raisedAmount={campaign?.raisedAmount ?? 0}
              targetAmount={campaign?.targetAmount ?? 10000}
              currency={campaign?.currency ?? "USD"}
              onLoadedChange={handlePptLoaded}
            />
          </div>

          {showPanels && (
            <div
              className={`w-2 flex-shrink-0 flex items-center justify-center cursor-col-resize group ${isDragging ? "" : "transition-colors duration-200"}`}
              onMouseDown={handleDragStart}
            >
              <div className={`h-8 w-0.5 rounded-full transition-colors ${isDragging ? "bg-accent-primary" : "bg-border-default group-hover:bg-border-strong"}`} />
            </div>
          )}

          <AnimatePresence>
            {showPanels && (
              <motion.div
                key="qr-panel"
                initial={{ opacity: 0, flex: "0 0 0%" }}
                animate={{ opacity: 1, flex: `0 0 var(--qr-ratio)` }}
                exit={{ opacity: 0, flex: "0 0 0%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`h-full overflow-hidden ${isDragging ? "" : "transition-[flex] duration-200"}`}
              >
                <QRCodeDisplay
                  content={paymentMethod === "polar" ? donationUrl : customQrContent}
                  raisedAmount={campaign?.raisedAmount ?? 0}
                  currency={campaign?.currency ?? "USD"}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
