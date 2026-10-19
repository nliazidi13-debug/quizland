"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";

const MAX_DURATION_MS = 9000;
const SESSION_KEY = "quizland.introPlayed.v1";

export function IntroSplash({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
  };

  // The intro is a "once per app launch" experience: if it already played
  // earlier this tab session (e.g. an internal navigation fell back to a
  // full page reload), skip it instead of replaying from scratch. Checked
  // in an effect — not a lazy initial state — so the server-rendered markup
  // (always showing the intro) matches the client's first paint.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(false);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(dismiss, MAX_DURATION_MS);
    return () => clearTimeout(t);
  }, [visible]);

  // Browsers block autoplay with sound unless the page already has "media
  // engagement" (e.g. a repeat visit). Try with sound first — most reliable
  // way to know is the play() promise itself — and fall back to a silent
  // autoplay plus a one-tap "enable sound" button when it's rejected.
  useEffect(() => {
    if (!visible) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      setShowUnmuteHint(true);
      v.play().catch(() => {});
    });
  }, [visible]);

  const unmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setShowUnmuteHint(false);
    v.play().catch(() => {});
  };

  // The page underneath (quiz timers, effects, etc.) must not start running
  // while the intro is covering it, so it is only mounted after dismissal
  // rather than rendered-but-hidden behind the overlay.
  if (visible) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          src="/brand/intro-quizland.mp4"
          playsInline
          onEnded={dismiss}
          onError={dismiss}
          className="max-h-full max-w-full"
        />
        {showUnmuteHint && (
          <button
            type="button"
            onClick={unmute}
            className="absolute bottom-8 left-8 flex items-center gap-2 rounded-full border-2 border-white/25 bg-black/40 px-5 py-2 text-xs font-bold text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            <Volume2 className="size-4" /> Activer le son
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="absolute bottom-8 right-8 rounded-full border-2 border-white/25 px-5 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Passer →
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
