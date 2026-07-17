"use client";

import React, { useState } from "react";
import { Smartphone, Plus, Trash2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDevices, useCreateDevice, useDeleteDevice } from "@/features/devices";

export function DevicesTab() {
  const { data: devices = [], isLoading } = useDevices();
  const createDevice = useCreateDevice();
  const deleteDevice = useDeleteDevice();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const handleCreate = () => {
    if (!newDeviceName.trim()) return;

    createDevice.mutate(
      { name: newDeviceName.trim() },
      {
        onSuccess: () => {
          setNewDeviceName("");
          setAddDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = (deviceId: string) => {
    deleteDevice.mutate(deviceId);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + "..." + key.substring(key.length - 8);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border border-border-subtle p-6">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-default border-t-accent-primary" />
          Loading devices...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MoMo Devices */}
      <div className="rounded-md border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-primary">
            MoMo Watcher Devices
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md h-8 px-3 text-xs"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Device
          </Button>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="h-8 w-8 mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-muted">
              No devices configured yet
            </p>
            <p className="text-xs text-text-muted mt-1">
              Add a device to start receiving MoMo SMS donations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device._id}
                className="rounded-md border border-border-default p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-accent-primary/10 flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-accent-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {device.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {device.isActive ? "Active" : "Inactive"}
                        {device.lastSeenAt && (
                          <> · Last seen {new Date(device.lastSeenAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-text-muted hover:text-red-500"
                    onClick={() => handleDelete(device._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* API Key */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 font-mono text-xs bg-bg-muted rounded px-2 py-1.5">
                    {visibleKeys.has(device._id)
                      ? device.apiKey
                      : maskKey(device.apiKey)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-text-muted hover:text-text-primary"
                    onClick={() => toggleKeyVisibility(device._id)}
                  >
                    {visibleKeys.has(device._id) ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-text-muted hover:text-text-primary"
                    onClick={() => copyToClipboard(device.apiKey, device._id)}
                  >
                    {copiedId === device._id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Device Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-md backdrop-blur-md bg-bg-elevated/90">
          <DialogHeader>
            <DialogTitle>Add MoMo Device</DialogTitle>
            <DialogDescription>
              Add a new device to receive MoMo SMS donations. The API key will be
              generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-primary">
                Device Name
              </label>
              <Input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g., Receiver Phone 1"
                className="rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="rounded-md"
                onClick={handleCreate}
                disabled={createDevice.isPending || !newDeviceName.trim()}
              >
                {createDevice.isPending ? "Creating..." : "Create Device"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
