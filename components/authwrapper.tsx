"use client";
import { updateHeartbeat } from "@/lib/actions/heartbeat";
import { useSession, SessionProvider } from "next-auth/react";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

function Heartbeat() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    // Initial ping
    updateHeartbeat();

    // Ping every 5 minutes
    const interval = setInterval(() => {
      updateHeartbeat();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [status]);

  return null;
}

export default function AuthWrapper({ children }: Props) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <Heartbeat />
      {children}
    </SessionProvider>
  );
}
