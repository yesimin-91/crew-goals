import { EmptyState } from "../components/ScreenState";
import { appRoutes } from "../app/routes";

export function NotFoundPage() {
  return (
    <div className="app-screen">
      <EmptyState
        eyebrow="Route not found"
        title="This screen is outside the Phase 1 flow"
        body="The mobile router now covers home, goals, goal detail, invites, join goal, and unavailable states."
        primaryLabel="Back to home"
        primaryTo={appRoutes.home}
      />
    </div>
  );
}
