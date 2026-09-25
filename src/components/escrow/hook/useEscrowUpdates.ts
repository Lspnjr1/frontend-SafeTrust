"use client";
import { useState, useEffect } from "react";

type EscrowStatus =
  | "pending"
  | "pending_action"
  | "milestone_approved"
  | "disputed";

export const useEscrowUpdates = (escrowId: string) => {
  const [status, setStatus] = useState<EscrowStatus>("milestone_approved");

  useEffect(() => {
    let active = true;
    if (!escrowId) return;

    const fetchUpdates = async () => {
      try {
        const request = (kind: string) =>
          fetch(`/api/notifications/${kind}/${encodeURIComponent(escrowId)}`).then(response =>
            response.ok ? response.json() : []
          );
        const [pending, milestones, disputes] = await Promise.all([
          request("pending"),
          request("milestones"),
          request("disputes"),
        ]);

        if (!active) return;

        if (pending?.length > 0) {
          setStatus("pending_action");
        }

        if (milestones?.some((m: any) => m.status === "approved")) {
          setStatus("milestone_approved");
        }

        if (disputes?.length > 0) {
          setStatus("disputed");
        }
      } catch (error) {
        console.error("Failed to fetch escrow updates:", error);
      }
    };

    fetchUpdates();

    const interval = setInterval(fetchUpdates, 15000);

    return () => {
      clearInterval(interval);
      active = false;
    };
  }, [escrowId]);

  return { status };
};
