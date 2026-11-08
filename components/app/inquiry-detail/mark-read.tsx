"use client";

import { useEffect, useRef } from "react";
import { markInquiryRead } from "@/lib/actions/inquiries";

// Marks the inquiry as read once, when it is opened (DET-6). It is a client effect, not a write
// during render, and it is only rendered while the inquiry is unread (Tech.md §11.4). Nothing is shown.
export function MarkRead({ id }: { id: string }) {
  // React runs effects twice in development; the ref keeps this to one call.
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void markInquiryRead(id);
  }, [id]);

  return null;
}
