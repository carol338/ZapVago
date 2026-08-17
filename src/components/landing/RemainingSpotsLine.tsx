"use client";

import { useEffect, useState } from "react";

export function RemainingSpotsLine() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetch("/api/launch-offer/spots")
      .then((r) => r.json())
      .then((d) => {
        setRemaining(d.remaining);
        setActive(d.active);
      })
      .catch(() => setRemaining(null));
  }, []);

  if (remaining === null || !active) return null;

  return <p className="mt-4 text-sm font-medium text-orange-400">Restam {remaining} vagas para novos negócios</p>;
}
