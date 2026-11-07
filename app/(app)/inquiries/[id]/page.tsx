import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/app/coming-soon";
import { en } from "@/lib/strings/en";

export const metadata: Metadata = { title: "Inquiry" };

// Placeholder: the real detail page (timeline, replies, actions) is built in a later phase.
// It deliberately does not read `id`, so no inquiry data is requested yet.
export default function InquiryDetailPage() {
  return <ComingSoonPage title={en.inquiries.detailTitle} />;
}
