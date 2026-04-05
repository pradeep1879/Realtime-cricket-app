import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Card } from "./ui/card";
import { LoadingSpinner } from "./ui/loading-spinner";
import { useMatchStore } from "../store/match-store";

type ProtectedRouteProps = {
  children: JSX.Element;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAdmin = useMatchStore((state) => state.isAdmin);
  const adminChecking = useMatchStore((state) => state.adminChecking);
  const verifyAdmin = useMatchStore((state) => state.verifyAdmin);
  const location = useLocation();

  React.useEffect(() => {
    void verifyAdmin();
  }, [verifyAdmin]);

  if (adminChecking) {
    return (
      <Card className="p-6">
        <LoadingSpinner label="Checking scorer access..." />
      </Card>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
