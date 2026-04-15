"use client";

import { useEffect } from "react";

/**
 * Global copy/content protection for rowiia.com
 * Prevents: copy, cut, paste, right-click, drag, print, select,
 * DevTools shortcuts, and view-source.
 */
export default function CopyProtection() {
  useEffect(() => {
    // --- Block copy, cut, paste, select-all via events ---
    const blockClipboard = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // --- Block right-click context menu ---
    const blockContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // --- Block drag (images, text, links) ---
    const blockDrag = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // --- Block select start ---
    const blockSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // --- Block DevTools keyboard shortcuts and view-source ---
    const blockDevToolsKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I / Cmd+Opt+I (Inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J / Cmd+Opt+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C / Cmd+Opt+C (Element picker)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        return false;
      }

      // Ctrl+U / Cmd+U (View source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        return false;
      }

      // Ctrl+S / Cmd+S (Save page)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        return false;
      }

      // Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        return false;
      }

      // Ctrl+A / Cmd+A (Select all)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        return false;
      }

      // Ctrl+C / Cmd+C (Copy)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        return false;
      }

      // Ctrl+X / Cmd+X (Cut)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        e.preventDefault();
        return false;
      }

      // Ctrl+V / Cmd+V (Paste) - block in general context
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        // Allow paste inside input/textarea elements for usability
        const target = e.target as HTMLElement;
        const tag = target.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || target.isContentEditable) {
          return true;
        }
        e.preventDefault();
        return false;
      }
    };

    // --- Block print via beforeprint event ---
    const blockPrint = (e: Event) => {
      e.preventDefault();
    };

    // --- DevTools detection: debugger trap ---
    // When DevTools is open, the debugger statement pauses execution,
    // making the site unusable with inspector open.
    let devtoolsInterval: ReturnType<typeof setInterval>;
    if (process.env.NODE_ENV === "production") {
      const devtoolsCheck = () => {
        const start = performance.now();
        // eslint-disable-next-line no-debugger
        debugger;
        const end = performance.now();
        // If debugger paused for more than 100ms, DevTools is open
        if (end - start > 100) {
          document.body.innerHTML = "";
          window.location.href = "/";
        }
      };
      devtoolsInterval = setInterval(devtoolsCheck, 1000);
    }

    // --- DevTools detection: window size difference ---
    const detectDevToolsBySize = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = "";
      }
    };
    window.addEventListener("resize", detectDevToolsBySize);

    // --- Neutralize console to prevent code inspection via console ---
    if (process.env.NODE_ENV === "production") {
      const noop = () => {};
      Object.defineProperty(window, "console", {
        value: {
          log: noop,
          warn: noop,
          error: noop,
          info: noop,
          debug: noop,
          dir: noop,
          dirxml: noop,
          table: noop,
          trace: noop,
          group: noop,
          groupCollapsed: noop,
          groupEnd: noop,
          clear: noop,
          count: noop,
          countReset: noop,
          assert: noop,
          profile: noop,
          profileEnd: noop,
          time: noop,
          timeLog: noop,
          timeEnd: noop,
          timeStamp: noop,
        },
        writable: false,
        configurable: false,
      });
    }

    // --- Block view-source: protocol ---
    if (process.env.NODE_ENV === "production") {
      const blockViewSource = () => {
        if (window.location.href.startsWith("view-source:")) {
          window.location.href = "/";
        }
      };
      blockViewSource();
    }

    // --- Disable right-click "Inspect Element" by clearing the selection ---
    const clearSelection = () => {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    };
    document.addEventListener("mouseup", clearSelection, true);

    // Attach listeners
    document.addEventListener("copy", blockClipboard, true);
    document.addEventListener("cut", blockClipboard, true);
    document.addEventListener("contextmenu", blockContextMenu, true);
    document.addEventListener("dragstart", blockDrag, true);
    document.addEventListener("selectstart", blockSelectStart, true);
    document.addEventListener("keydown", blockDevToolsKeys, true);
    window.addEventListener("beforeprint", blockPrint);

    // --- Inject global CSS to disable selection, drag, and print ---
    const style = document.createElement("style");
    style.id = "rowi-copy-protection";
    style.textContent = `
      /* Disable text selection globally */
      *, *::before, *::after {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }

      /* Allow selection inside form inputs for usability */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }

      /* Disable image dragging */
      img, a, svg {
        -webkit-user-drag: none !important;
        user-drag: none !important;
        pointer-events: auto;
      }

      /* Block printing */
      @media print {
        html, body {
          display: none !important;
        }
      }

      /* Hide page content when printed via other means */
      @media print {
        * {
          visibility: hidden !important;
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.removeEventListener("copy", blockClipboard, true);
      document.removeEventListener("cut", blockClipboard, true);
      document.removeEventListener("contextmenu", blockContextMenu, true);
      document.removeEventListener("dragstart", blockDrag, true);
      document.removeEventListener("selectstart", blockSelectStart, true);
      document.removeEventListener("keydown", blockDevToolsKeys, true);
      document.removeEventListener("mouseup", clearSelection, true);
      window.removeEventListener("beforeprint", blockPrint);
      window.removeEventListener("resize", detectDevToolsBySize);
      if (devtoolsInterval) clearInterval(devtoolsInterval);
      const el = document.getElementById("rowi-copy-protection");
      if (el) el.remove();
    };
  }, []);

  return null;
}
