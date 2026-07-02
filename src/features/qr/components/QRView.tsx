"use client";

import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { QRCodeGenerator } from "./QRCodeGenerator";
import { useQRCodes } from "../hooks/useQRCodes";
import { useDeleteQRCode } from "../hooks/useDeleteQRCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatRelativeTime } from "@/lib/utils";
import { QRCodePreview } from "./QRCodePreview";
import { QRCodeActions } from "./QRCodeActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, QrCode, History } from "lucide-react";

export function QRView() {
  const [activeTab, setActiveTab] = useState<"generator" | "history">("generator");
  const { data: qrCodes, isLoading } = useQRCodes();
  const deleteQRCode = useDeleteQRCode();

  const handleDelete = async (id: string) => {
    await deleteQRCode.mutateAsync(id);
  };

  return (
    <PageContainer>
      <PageHeader
        title="QR Generator"
        description="Create and manage QR codes for sharing."
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "generator" | "history")}>
        <TabsList className="mb-6 rounded-md bg-bg-surface border border-border-subtle">
          <TabsTrigger
            value="generator"
            className="data-[state=active]:bg-accent-primary data-[state=active]:text-bg-base"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-accent-primary data-[state=active]:text-bg-base"
          >
            <History className="mr-2 h-4 w-4" />
            History ({qrCodes?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <QRCodeGenerator />
        </TabsContent>

        <TabsContent value="history">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : !qrCodes?.length ? (
            <Card className="bg-bg-card border-border-subtle">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <QrCode className="mb-4 h-12 w-12 text-text-muted" />
                <h3 className="text-lg font-semibold text-text-primary">
                  No QR codes yet
                </h3>
                <p className="mt-2 text-text-secondary">
                  Generate your first QR code to get started.
                </p>
                <Button
                  onClick={() => setActiveTab("generator")}
                  className="mt-4 bg-accent-primary text-bg-base hover:bg-accent-primary-hover"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {qrCodes.map((qrCode) => (
                <Card
                  key={qrCode.id}
                  className="bg-bg-card border-border-subtle transition-all hover:border-border-default hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium text-text-primary">
                        {qrCode.label || "QR Code"}
                      </CardTitle>
                      <span className="text-xs text-text-muted">
                        {formatRelativeTime(qrCode.createdAt)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <QRCodePreview
                      content={qrCode.content}
                      size="SMALL"
                      className="!p-3"
                    />
                    <code className="block truncate text-xs text-text-muted">
                      {qrCode.content}
                    </code>
                    <QRCodeActions
                      content={qrCode.content}
                      onDelete={() => handleDelete(qrCode.id)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
