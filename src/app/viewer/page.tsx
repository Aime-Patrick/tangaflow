"use client";

import React, { useState, useEffect, useRef } from "react";

export default function ViewerPage() {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [pptxUrl, setPptxUrl] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [raisedAmount, setRaisedAmount] = useState(0);
  const [targetAmount, setTargetAmount] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InstanceType<
    Awaited<typeof import("@aiden0z/pptx-renderer")>["PptxViewer"]
  > | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Parse query params on the client
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("campaignId");
    const url = params.get("pptxUrl");
    if (cid) setCampaignId(cid);
    if (url) setPptxUrl(url);
  }, []);

  // Load and render the PPTX whenever the URL is available
  useEffect(() => {
    if (!pptxUrl) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch the raw PPTX file (Cloudinary allows CORS for raw assets)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        const res = await fetch(pptxUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
          setError(`Could not download presentation (HTTP ${res.status})`);
          setLoading(false);
          return;
        }

        const buffer = await res.arrayBuffer();

        if (cancelled) return;

        if (buffer.byteLength === 0) {
          setError("Presentation file is empty.");
          setLoading(false);
          return;
        }

        if (!containerRef.current) {
          setError("Render container not ready.");
          setLoading(false);
          return;
        }

        const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import(
          "@aiden0z/pptx-renderer"
        );

        if (cancelled) return;

        // Tear down any previous viewer instance
        viewerRef.current?.destroy();
        viewerRef.current = null;
        containerRef.current.innerHTML = "";

        const viewer = new PptxViewer(containerRef.current, {
          fitMode: "contain",
          zipLimits: RECOMMENDED_ZIP_LIMITS,
          lazySlides: true,
          lazyMedia: true,
          onSlideChange: (index: number) => setCurrentSlide(index),
        });

        await viewer.open(buffer, {
          renderMode: "slide",
          lazySlides: true,
          lazyMedia: true,
        });

        if (cancelled) {
          viewer.destroy();
          return;
        }

        viewerRef.current = viewer;
        setTotalSlides(viewer.slideCount);
        setLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load presentation: ${msg}`);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [pptxUrl]);

  // Keep the viewer in sync with slide index driven by SSE or autoplay
  useEffect(() => {
    if (viewerRef.current && !loading) {
      const max = Math.max(0, totalSlides - 1);
      const clamped = Math.max(0, Math.min(currentSlide, max || currentSlide));
      viewerRef.current.goToSlide(clamped);
    }
  }, [currentSlide, loading, totalSlides]);

  // Connect to SSE for live slide control and fundraising updates.
  // No auth cookie is needed — /api/campaigns/:id/events is public.
  useEffect(() => {
    if (!campaignId) return;

    const origin = window.location.origin;
    const es = new EventSource(`${origin}/api/campaigns/${campaignId}/events`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.currentSlide !== undefined) setCurrentSlide(data.currentSlide);
        if (data.isPlaying !== undefined) setIsPlaying(data.isPlaying);
        if (data.totalSlides !== undefined) setTotalSlides(data.totalSlides);
        if (data.raisedAmount !== undefined) setRaisedAmount(data.raisedAmount);
        if (data.targetAmount !== undefined) setTargetAmount(data.targetAmount);
        if (data.currency) setCurrency(data.currency);
      } catch {
        // Malformed SSE payload — ignore
      }
    };

    es.onerror = () => {
      // SSE will auto-reconnect; nothing to do here
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [campaignId]);

  // Local autoplay when isPlaying is true
  useEffect(() => {
    if (!isPlaying || totalSlides === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1 >= totalSlides ? 0 : prev + 1));
    }, 5_000);
    return () => clearInterval(interval);
  }, [isPlaying, totalSlides]);

  const fmt = (amount: number, cur: string) =>
    `${cur} ${amount.toLocaleString()}`;

  const progressPct =
    targetAmount > 0
      ? Math.min(100, (raisedAmount / targetAmount) * 100)
      : 0;

  return (
    <div className="w-full h-screen bg-black flex flex-col overflow-hidden">
      {/* Fundraising progress bar — only shown once there are donations */}
      {raisedAmount > 0 && (
        <div className="shrink-0 px-4 py-2 bg-black">
          <div className="flex items-baseline justify-between text-sm font-bold text-white mb-1">
            <span>{fmt(raisedAmount, currency)}</span>
            <span className="opacity-60">Target: {fmt(targetAmount, currency)}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-500 transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Slide viewport */}
      <div className="flex-1 min-h-0 relative">
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
              <p className="text-sm opacity-70">Loading presentation…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* PPTX renderer container — always mounted so the ref is stable */}
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ display: loading || error ? "none" : "block" }}
        />
      </div>

      {/* Slide counter footer */}
      {!loading && !error && totalSlides > 0 && (
        <div className="shrink-0 px-4 py-2 bg-black text-center">
          <span className="text-white text-xs opacity-50">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>
      )}
    </div>
  );
}
