import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { SetupForm } from "../components/setup-form";
import { Button } from "../components/ui/button";

export function ScorerSetupPage() {
  return (
    <div className="grid gap-4">
      <Link to="/matches">
        <Button variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Matches
        </Button>
      </Link>
      <SetupForm />
    </div>
  );
}
