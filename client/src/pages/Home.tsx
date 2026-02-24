import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getRegisterUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Shield, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";

// Home page is intentionally minimal; marketing details have been removed.

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // if already logged in, forward to dashboard
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to Roguard</h1>
      <div className="space-x-4">
        <Link href={getLoginUrl()}>
          <Button size="lg" className="px-8">
            Sign in
          </Button>
        </Link>
        <Link href={getRegisterUrl()}>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
            Sign up
          </Button>
        </Link>
      </div>
    </div>
  );
}
