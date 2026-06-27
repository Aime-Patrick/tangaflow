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

interface FundraisingData {
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  name: string;
}

export function PresentationWorkspace() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPptLoaded, setIsPptLoaded] = useState(false);
  const [eventNameDialogOpen, setEventNameDialogOpen] = useState(false);

  const [sessionKey, setSessionKeyState] = useState<string | null>(getSessionKey);

  const { data: campaign, isLoading: campaignLoading } = useCampaign({
    id: sessionKey,
  });

  const codeType = campaign?.barcodeType ?? "qr";

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign({ campaignId: sessionKey ?? "" });

  // Poll fundraising data every 5 seconds
  const [fundraising, setFundraising] = useState<FundraisingData | null>(null);

  useEffect(() => {
    if (!sessionKey) return;

    const fetchFundraising = async () => {
      try {
        const res = await fetch(`/api/fundraising?campaignId=${sessionKey}`);
        if (res.ok) {
          const data = await res.json();
          setFundraising(data);
        }
      } catch (err) {
        console.error("Failed to fetch fundraising data:", err);
      }
    };

    fetchFundraising();
    const interval = setInterval(fetchFundraising, 5000);
    return () => clearInterval(interval);
  }, [sessionKey]);

  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tangaflow-layout");
      if (saved && saved in PRESETS) return saved as LayoutPreset;
      if (saved === "custom") return null;
    }
    return "default";
  });
  const [splitRatio, setSplitRatio] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tangaflow-layout");
      if (saved === "custom") {
        const custom = localStorage.getItem("tangaflow-custom-ratio");
        if (custom) return parseFloat(custom);
      }
      if (saved && PRESETS[saved]) return PRESETS[saved];
    }
    return PRESETS.default;
  });
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const startXRef = useRef(0);
  const startRatioRef = useRef(0);
  const currentRatioRef = useRef(splitRatio);

  useEffect(() => {
    currentRatioRef.current = splitRatio;
  }, [splitRatio]);

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
      
      // Save custom ratio to localStorage
      localStorage.setItem("tangaflow-layout", "custom");
      localStorage.setItem("tangaflow-custom-ratio", currentRatioRef.current.toString());
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

  const handleNewEvent = useCallback(() => {
    localStorage.removeItem("tangaflow-session-key");
    setSessionKeyState(null);
    setFundraising(null);
    setEventNameDialogOpen(true);
  }, []);

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

  const handleBarcodeTypeChange = useCallback(
    (value: "qr" | "zerocode") => {
      if (sessionKey) {
        debouncedUpdate(sessionKey, { barcodeType: value });
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
      });
    }
  }, [sessionKey, updateCampaign, campaign]);

  // Polar Checkout URL from campaign
  const polarCheckoutUrl = campaign?.checkoutUrl || "";

  const showPanels = sessionKey !== null && isPptLoaded;
  const raisedAmount = fundraising?.raisedAmount ?? campaign?.raisedAmount ?? 0;
  const targetAmount = fundraising?.targetAmount ?? campaign?.targetAmount ?? 10000;
  const currency = fundraising?.currency ?? campaign?.currency ?? "USD";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base text-text-primary">
      <WorkspaceHeader
        onSettingsOpen={() => setSettingsOpen(true)}
        onNewEvent={handleNewEvent}
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
        targetAmount={targetAmount}
        onTargetChange={handleTargetChange}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        polarCheckoutUrl={polarCheckoutUrl}
        codeType={codeType}
        onCodeTypeChange={handleBarcodeTypeChange}
        onSave={handleSaveSettings}
        isSaving={updateCampaign.isPending}
      />

      <main className="flex-1 flex overflow-hidden p-6 gap-6 min-h-0">
        <div
          ref={wrapperRef}
          className="flex-1 flex h-full w-full gap-0"
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
              raisedAmount={raisedAmount}
              targetAmount={targetAmount}
              currency={currency}
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
                transition={{
                  flex: { duration: isDragging ? 0 : 0.2, ease: "easeInOut" },
                  opacity: { duration: 0.2 },
                }}
                className="h-full overflow-hidden -mr-4 qr-panel-container ml-[8px]"
              >
                <QRCodeDisplay
                  content={polarCheckoutUrl}
                  raisedAmount={raisedAmount}
                  currency={currency}
                  codeType={codeType}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
