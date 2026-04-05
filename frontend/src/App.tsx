import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/app-shell";
import { ProtectedRoute } from "./components/protected-route";
import { Toaster } from "./components/ui/toaster";
import { AdminLoginPage } from "./pages/admin-login-page";
import { LeagueDetailPage } from "./pages/league-detail-page";
import { LeaguesPage } from "./pages/leagues-page";
import { MatchesDashboardPage } from "./pages/matches-dashboard-page";
import { MatchViewerPage } from "./pages/match-viewer-page";
import { ScorerPage } from "./pages/scorer-page";
import { ScorerSetupPage } from "./pages/scorer-setup-page";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/leagues" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AppShell />}>
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/leagues/:id" element={<LeagueDetailPage />} />
          <Route path="/matches" element={<MatchesDashboardPage />} />
          <Route path="/match/:id" element={<MatchViewerPage />} />
          <Route
            path="/scorer/new"
            element={
              <ProtectedRoute>
                <ScorerSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scorer/:matchId"
            element={
              <ProtectedRoute>
                <ScorerPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
