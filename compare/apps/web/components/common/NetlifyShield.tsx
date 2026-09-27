"use client";

import { useEffect } from "react";

/**
 * NetlifyShield
 * Repo-side fallback shield to ensure Netlify's "Powered by Netlify" HUD / badge
 * is completely hidden and cannot hydrate in case of console resets or site migrations.
 */
export function NetlifyShield() {
  useEffect(() => {
    // 1. Remove any injected Netlify HUD script tags immediately
    const removeHudScripts = () => {
      const scripts = document.querySelectorAll(
        'script[src*=".netlify/scripts/hud"], script[src*="netlify.com/hud"]'
      );
      scripts.forEach((s) => s.remove());
    };

    removeHudScripts();

    // 2. Observer to catch any late script or DOM node injections
    const observer = new MutationObserver(() => {
      removeHudScripts();

      const badgeNodes = document.querySelectorAll(
        '[id^="__netlify"], a[href*="app.netlify.com"], iframe[src*="netlify.com/hud"], .netlify-hud, [data-nf-variant]'
      );
      badgeNodes.forEach((node) => {
        (node as HTMLElement).style.setProperty("display", "none", "important");
        (node as HTMLElement).style.setProperty("visibility", "hidden", "important");
        (node as HTMLElement).style.setProperty("opacity", "0", "important");
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          [id^="__netlify"],
          a[href*="app.netlify.com"],
          iframe[src*="netlify.com/hud"],
          .netlify-hud,
          [data-nf-variant] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `,
      }}
    />
  );
}
