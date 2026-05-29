import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rowi — NVIDIA Inception Pitch",
  description: "From Emotional Recession to AI-Powered Emotional Infrastructure. Built on 27 years of Six Seconds validated science.",
  robots: "noindex, nofollow",
};

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {children}
    </div>
  );
}
