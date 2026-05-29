"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/useI18n";

export default function FloatingCTA() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);

  const isLoggedIn = status === "authenticated" && !!session?.user;

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoggedIn) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="lg:hidden fixed bottom-4 inset-x-4 z-40"
        >
          <Link
            href="/register"
            className="rowi-btn-primary flex items-center justify-center gap-2 px-6 py-4 text-base shadow-2xl rounded-2xl"
          >
            {t("landing.floatingCta")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
