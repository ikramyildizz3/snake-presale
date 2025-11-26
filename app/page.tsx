"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Root açılınca statik sayfaya gönder
    window.location.href = "/snake-token.html";
  }, []);

  return null;
}
