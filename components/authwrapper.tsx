import { useSession, SessionProvider } from "next-auth/react";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export default function AuthWrapper({ children }: Props) {
  return (
    <SessionProvider 
      refetchOnWindowFocus={true}
      refetchInterval={5 * 60}
    >
      {children}
    </SessionProvider>
  );
}
