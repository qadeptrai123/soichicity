
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UserNotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <div className="bg-muted/30 p-6 rounded-full mb-6">
        <UserX className="w-16 h-16 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">User not found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        This account doesn't exist or you may have been blocked.
      </p>
      <Button onClick={() => navigate("/")} variant="secondary">
        Return to Home
      </Button>
    </div>
  );
}
