"use client";

import { useState, useRef } from "react";
import { useCreateQRCode } from "../hooks/useCreateQRCode";
import { QRCodePreview, QRCodeCanvasPreview } from "./QRCodePreview";
import { QRSizeSelector } from "./QRSizeSelector";
import { QRCodeActions } from "./QRCodeActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Type,
  Wifi,
  User,
  Mail,
  MessageSquare,
  QrCode,
} from "lucide-react";
import type { QRContentType, QRSize } from "../types";
import { QR_PRESETS } from "../types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Type,
  Wifi,
  User,
  Mail,
  MessageSquare,
};

interface QRCodeGeneratorProps {
  onGenerated?: (content: string) => void;
}

export function QRCodeGenerator({ onGenerated }: QRCodeGeneratorProps) {
  const [contentType, setContentType] = useState<QRContentType>("url");
  const [content, setContent] = useState("");
  const [size, setSize] = useState<QRSize>("MEDIUM");
  const [label, setLabel] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const createQRCode = useCreateQRCode();

  // Build content based on type
  const buildContent = (): string => {
    return content;
  };

  const displayContent = buildContent();

  const handleGenerate = async () => {
    if (!displayContent) return;

    await createQRCode.mutateAsync({
      content: displayContent,
      size,
      label: label || undefined,
    });

    onGenerated?.(displayContent);
  };

  const currentPreset = QR_PRESETS.find((p) => p.contentType === contentType);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Configuration */}
      <div className="space-y-6">
        <Card className="bg-bg-card border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {QR_PRESETS.map((preset) => {
                const Icon = iconMap[preset.icon] || QrCode;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setContentType(preset.contentType)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                      contentType === preset.contentType
                        ? "border-accent-primary bg-accent-primary-subtle text-accent-primary"
                        : "border-border-default bg-bg-elevated text-text-secondary hover:border-border-strong hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">
              {currentPreset?.name || "Content"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary">
                {contentType === "url"
                  ? "URL"
                  : contentType === "wifi"
                  ? "Network Name (SSID)"
                  : contentType === "email"
                  ? "Email Address"
                  : contentType === "sms"
                  ? "Phone Number"
                  : "Content"}
              </label>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  contentType === "url"
                    ? "https://example.com"
                    : contentType === "wifi"
                    ? "MyNetwork"
                    : contentType === "email"
                    ? "hello@example.com"
                    : contentType === "sms"
                    ? "+1234567890"
                    : "Enter content..."
                }
                className="mt-1 bg-bg-elevated border-border-default text-text-primary"
              />
            </div>

            {contentType === "url" && (
              <p className="text-xs text-text-muted">
                Enter a full URL including https://
              </p>
            )}

            <div>
              <label className="text-sm font-medium text-text-primary">
                Label (optional)
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Website, WiFi, Contact"
                className="mt-1 bg-bg-elevated border-border-default text-text-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Size</CardTitle>
          </CardHeader>
          <CardContent>
            <QRSizeSelector value={size} onChange={setSize} />
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={!displayContent || createQRCode.isPending}
          className="w-full bg-accent-primary text-bg-base hover:bg-accent-primary-hover"
        >
          {createQRCode.isPending ? "Generating..." : "Generate QR Code"}
        </Button>
      </div>

      {/* Right: Preview */}
      <div className="space-y-4">
        <Card className="bg-bg-card border-border-subtle">
          <CardHeader>
            <CardTitle className="text-text-primary">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayContent ? (
              <>
                <QRCodePreview content={displayContent} size={size} />
                <QRCodeCanvasPreview
                  content={displayContent}
                  size={size}
                  ref={canvasRef}
                />
                <Separator className="bg-border-subtle" />
                <QRCodeActions
                  content={displayContent}
                  canvasRef={canvasRef}
                />
              </>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border-default bg-bg-elevated">
                <p className="text-text-muted">
                  Enter content to generate QR code
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {displayContent && (
          <Card className="bg-bg-card border-border-subtle">
            <CardHeader>
              <CardTitle className="text-text-primary">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block rounded-lg bg-bg-elevated p-3 text-sm text-text-secondary break-all">
                {displayContent}
              </code>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
