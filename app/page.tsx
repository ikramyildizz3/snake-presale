"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/snake-token.html";
  }, []);

  return null;
}
