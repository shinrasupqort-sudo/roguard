import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GuestLogin() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const guestLoginMutation = trpc.auth.loginGuest.useMutation({
    onSuccess: () => {
      navigate("/dashboard");
    },
    onError: (err) => {
      console.error("Guest login failed:", err);
      const msg = err.data?.message ?? "Unable to create guest account. Please try again later.";
      setError(msg);
      toast.error(msg);
    },
  });

  useEffect(() => {
    guestLoginMutation.mutate();
  }, []);

  const handleRetry = () => {
    setError(null);
    guestLoginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {guestLoginMutation.isPending && <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />}
        <p className="text-lg font-medium">
          {guestLoginMutation.isPending ? "Creating guest account..." : error ? "Something went wrong" : ""}
        </p>
        {guestLoginMutation.isPending && <p className="text-sm text-muted-foreground">You'll be redirected shortly</p>}
        {error && (
          <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
