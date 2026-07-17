/**
 * Server-Sent Events broadcast utility for real-time campaign updates.
 *
 * Maintains a map of campaign IDs to their connected SSE clients.
 * When a transaction is matched to a campaign, all listeners for that
 * campaign receive an immediate update.
 */

type Listener = {
  id: string;
  send: (data: string) => void;
};

// campaignId -> set of listeners
const listeners = new Map<string, Set<Listener>>();

let listenerCounter = 0;

export function addListener(
  campaignId: string,
  send: (data: string) => void
): () => void {
  const id = `listener_${++listenerCounter}`;

  if (!listeners.has(campaignId)) {
    listeners.set(campaignId, new Set());
  }
  listeners.get(campaignId)!.add({ id, send });

  // Return cleanup function
  return () => {
    const set = listeners.get(campaignId);
    if (set) {
      for (const listener of set) {
        if (listener.id === id) {
          set.delete(listener);
          break;
        }
      }
      if (set.size === 0) {
        listeners.delete(campaignId);
      }
    }
  };
}

export function broadcastCampaignUpdate(
  campaignId: string,
  data: Record<string, unknown>
) {
  const set = listeners.get(campaignId);
  if (!set || set.size === 0) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const listener of set) {
    try {
      listener.send(payload);
    } catch {
      // Client disconnected — will be cleaned up on next iteration
    }
  }
}

export function getListenerCount(campaignId: string): number {
  return listeners.get(campaignId)?.size ?? 0;
}
