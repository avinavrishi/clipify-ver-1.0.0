"use client";

import "./globals.css";
import React from "react";
import { QueryClientProvider } from "../providers/QueryClientProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { AuthModalProvider } from "../providers/AuthModalProvider";
import { ThemePresetProvider } from "../providers/ThemeModeProvider";
import {
  DEFAULT_THEME_PRESET_ID,
  DEPRECATED_THEME_PRESET_MAP,
  THEME_PRESET_IDS,
} from "../theme/presetIds";
import {
  LEGACY_THEME_STORAGE_KEY,
  THEME_BOOT_BODY,
  THEME_PRESET_STORAGE_KEY,
} from "../theme/presetMetadata";

const THEME_BOOT_SCRIPT = `
(function(){
  var PK=${JSON.stringify(THEME_PRESET_STORAGE_KEY)};
  var LK=${JSON.stringify(LEGACY_THEME_STORAGE_KEY)};
  var DEF=${JSON.stringify(DEFAULT_THEME_PRESET_ID)};
  var IDS=${JSON.stringify([...THEME_PRESET_IDS])};
  var DEP=${JSON.stringify(DEPRECATED_THEME_PRESET_MAP)};
  var BODY=${JSON.stringify(THEME_BOOT_BODY)};
  function resolvePreset(raw){
    if(!raw) return DEF;
    if(IDS.indexOf(raw)>=0) return raw;
    if(DEP[raw]) return DEP[raw];
    return DEF;
  }
  try {
    var raw=localStorage.getItem(PK);
    if(!raw){
      var leg=localStorage.getItem(LK);
      raw=leg==="light"?"light-default":DEF;
    }
    var id=resolvePreset(raw);
    localStorage.setItem(PK,id);
    var r=document.documentElement;
    r.setAttribute("data-theme-preset",id);
    var mode=id.indexOf("light-")===0?"light":"dark";
    r.setAttribute("data-theme",mode);
    Array.prototype.slice.call(r.classList).forEach(function(c){
      if(c==="dark"||c==="light"||c.indexOf("theme-")===0) r.classList.remove(c);
    });
    r.classList.add(mode,"theme-"+id);
    var c=BODY[id];
    document.body.style.backgroundColor=c.bg;
    document.body.style.color=c.fg;
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemePresetProvider>
          <QueryClientProvider>
            <AuthProvider>
              <AuthModalProvider>{children}</AuthModalProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemePresetProvider>
      </body>
    </html>
  );
}
