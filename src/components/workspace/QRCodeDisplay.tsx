"use client";

import React, { useState, useEffect, useRef } from "react";
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
  currency?: string;
  codeType?: CodeType;
}

export function QRCodeDisplay({
  content,
  raisedAmount = 0,
  currency = "USD",
  codeType = "qr",
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
        // Trigger scale-in bounce animation upon reaching the final target
        controls.start({
          scale: [1, 1.25, 1],
          transition: { duration: 0.4, ease: "easeOut" },
        });
        return;
      }

      let step = 0;
      if (diff > 0) {
        if (diff > 1000) {
          // Fast count phase for large increments
          step = Math.max(10, Math.ceil(diff / 12));
        } else {
          // Slow down phase (decays dynamically when in the last 3 digits / <= 1000)
          step = Math.max(1, Math.ceil(diff * 0.04));
        }
        current = Math.min(end, current + step);
      } else {
        // Handling decrementing values safely
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

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center min-h-0 w-full qr-inner-wrapper">
        <div className="w-full max-w-sm flex flex-col gap-1">
          {/* Amount label aligned to the top-left of the QR card */}
          <motion.div
            animate={controls}
            className="flex items-center gap-1.5 self-start select-none"
          >
            <motion.span
              animate={isCounting ? {
                y: [0, -6, 0],
                transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" }
              } : {
                y: 0
              }}
              className="flex items-center justify-center"
            >
              <MoveUp className="h-8 w-8 text-primary text-5xl" />
            </motion.span>
            <span className="text-3xl font-medium text-text-primary">
              {formatCurrency(displayAmount, currency)}
            </span>
          </motion.div>

          {/* QR Card */}
          <div
            className="flex items-center justify-center w-full aspect-square qr-card"
            style={{ backgroundColor: bgColor }}
          >
            <div className="w-full h-full flex items-center justify-center zerocode-wrapper">
              {codeType === "qr" ? (
                <QRCodeSVG
                  value={content || "https://tangaflow.app"}
                  size={280}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  includeMargin={false}
                  level="Q"
                  className="w-full h-full"
                />
              ) : (
                <ZeroCode
                  value={content || "https://tangaflow.app"}
                  type="circular"
                  size={280}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
