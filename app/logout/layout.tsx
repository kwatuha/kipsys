import { AuthProvider } from "@/lib/auth/auth-context";

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
} 