"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface QRCodeActionsProps {
  content: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onDelete?: () => void;
  className?: string;
}

export function QRCodeActions({
  content,
  canvasRef,
  onDelete,
  className,
}: QRCodeActionsProps) {
  const handleDownload = useCallback(() => {
    if (!canvasRef?.current) {
      toast.error("Download not available");
      return;
    }

    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR code downloaded");
  }, [canvasRef]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  }, [content]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "QR Code",
          text: content,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  }, [content, handleCopy]);

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="border-border-default text-text-primary hover:bg-bg-hover"
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="border-border-default text-text-primary hover:bg-bg-hover"
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="border-border-default text-text-primary hover:bg-bg-hover"
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      {onDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="border-error/50 text-error hover:bg-error/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      )}
    </div>
  );
}
