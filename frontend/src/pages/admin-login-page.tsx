import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { AdminLoginCard } from "../components/admin-login-card";
import { Button } from "../components/ui/button";

export function AdminLoginPage() {
  return (
    <div className="grid gap-4">
      <Link to="/matches">
        <Button variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Matches
        </Button>
      </Link>
      <AdminLoginCard />
    </div>
  );
}
