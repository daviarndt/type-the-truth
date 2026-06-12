"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EnrollButtonProps {
  pathId: string;
}

export function EnrollButton({ pathId }: EnrollButtonProps) {
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (enrolled) return null;

  const handleEnroll = async () => {
    setLoading(true);
    try {
      await fetch("/api/plans/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathId }),
      });
      setEnrolled(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="btn-secondary"
      style={{ fontSize: ".75rem", padding: "6px 12px" }}
    >
      {loading ? "..." : "Inscrever-se no plano"}
    </button>
  );
}
