"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ZeroCode } from "@pryro/00code-react";
import { useUIStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { MoveUp } from "lucide-react";

type CodeType = "qr" | "zerocode";

interface QRCodeDisplayProps {
  content: string;
  raisedAmount?: number;
  targetAmount?: number;
  currency?: string;
  codeType?: CodeType;
  eventName?: string;
}

export function QRCodeDisplay({
  content,
  raisedAmount = 0,
  targetAmount,
  currency = "USD",
  codeType = "qr",
  eventName,
}: QRCodeDisplayProps) {
  const theme = useUIStore((s) => s.theme);
  const bgColor = theme === "dark" ? "#000000" : "#FFFFFF";
  const fgColor = theme === "dark" ? "#DFDFDF" : "#000000";

  // Dynamic counting animation state
  const [displayAmount, setDisplayAmount] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const prevAmountRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const controls = useAnimation();

  // Card flip state — start on correct face based on codeType
  const [cardRotation, setCardRotation] = useState(codeType === "zerocode" ? 180 : 0);
  const [labelCodeType, setLabelCodeType] = useState<"qr" | "zerocode">(codeType);
  const [showBackContent, setShowBackContent] = useState(false);
  const prevCodeType = useRef(codeType);

  // Detect codeType changes and trigger flip
  useEffect(() => {
    if (prevCodeType.current !== codeType) {
      setCardRotation((prev) => prev + 180);
      prevCodeType.current = codeType;
    }
  }, [codeType]);

  // Pre-render inactive code near 90° midpoint
  useEffect(() => {
    const normalizedRotation = ((cardRotation % 360) + 360) % 360;
    const shouldPreRender = (normalizedRotation > 60 && normalizedRotation < 120) ||
                            (normalizedRotation > 240 && normalizedRotation < 300);
    if (shouldPreRender) {
      const handle = requestAnimationFrame(() => {
        setShowBackContent(true);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [cardRotation]);

  // Handle flip completion — then animate amount label
  const handleFlipComplete = useCallback(() => {
    setLabelCodeType(codeType);
    setShowBackContent(false);
  }, [codeType]);

  // Counting animation
  useEffect(() => {
    const start = prevAmountRef.current;
    const end = raisedAmount;
    prevAmountRef.current = end;

    if (start === end) {
      setDisplayAmount(end);
      return;
    }

    setIsCounting(true);
    let current = start;

    const animateCount = () => {
      const diff = end - current;
      if (diff === 0) {
        setDisplayAmount(end);
        setIsCounting(false);
        controls.start({
          scale: [1, 1.25, 1],
          transition: { duration: 0.4, ease: "easeOut" },
        });
        return;
      }

      let step = 0;
      if (diff > 0) {
        if (diff > 1000) {
          step = Math.max(10, Math.ceil(diff / 12));
        } else {
          step = Math.max(1, Math.ceil(diff * 0.04));
        }
        current = Math.min(end, current + step);
      } else {
        if (Math.abs(diff) > 1000) {
          step = Math.max(10, Math.ceil(Math.abs(diff) / 12));
        } else {
          step = Math.max(1, Math.ceil(Math.abs(diff) * 0.04));
        }
        current = Math.max(end, current - step);
      }

      setDisplayAmount(current);
      animationRef.current = requestAnimationFrame(animateCount);
    };

    animationRef.current = requestAnimationFrame(animateCount);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [raisedAmount, controls]);

  // Determine which face to show based on cumulative rotation
  const normalizedRotation = ((cardRotation % 360) + 360) % 360;
  const showZeroCode = normalizedRotation >= 90 && normalizedRotation < 270;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center min-h-0 w-full qr-inner-wrapper">
        {/* Amount label — left on QR, centered on ZeroCode */}
        <div className="w-full max-w-sm mb-4 qr-amount-wrapper" style={{ textAlign: labelCodeType === "zerocode" ? "center" : "left" }}>
          <motion.div
            animate={controls}
            className="inline-flex items-center gap-1.5 select-none"
          >
            <motion.span
              animate={isCounting ? {
                y: [0, -6, 0],
                transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" }
              } : {
                y: 0
              }}
              className="flex items-center justify-center qr-amount-icon"
            >
              <MoveUp className="h-8 w-8 text-primary text-5xl" />
            </motion.span>
            <span className="text-3xl font-medium text-text-primary qr-amount-text">
              {formatCurrency(displayAmount, currency)}
            </span>
          </motion.div>
        </div>
        <div
          className="w-full max-w-sm"
          style={{ perspective: "1200px" }}
        >
          <motion.div
            animate={{ rotateY: cardRotation }}
            onAnimationComplete={handleFlipComplete}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            style={{
              transformStyle: "preserve-3d",
              position: "relative",
              width: "100%",
              aspectRatio: "1/1",
            }}
          >
            {/* Front face — QR Code */}
            <div
              style={{
                backfaceVisibility: "hidden",
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: bgColor,
              }}
              className="flex items-center justify-center w-full h-full"
            >
              <QRCodeSVG
                value={content || "https://tangaflow.app"}
                size={280}
                fgColor={fgColor}
                bgColor={bgColor}
                includeMargin={false}
                level="Q"
                className="w-full h-full"
              />
            </div>

            {/* Back face — ZeroCode */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: bgColor,
              }}
              className="flex items-center justify-center zerocode-wrapper w-full h-full"
            >
              {(showBackContent || showZeroCode) && (
                <ZeroCode
                  value={content || "https://tangaflow.app"}
                  type="morphing"
                  size={340}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
