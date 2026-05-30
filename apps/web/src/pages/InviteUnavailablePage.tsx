import { Navigate, useParams } from "react-router-dom";

import { ErrorState, LoadingState, UnavailableState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import {
  appRoutes,
  buildInvitePath
} from "../app/routes";
import { mapInviteDetailView } from "../features/invites/inviteViewModels";
import { useAsyncData } from "../hooks/useAsyncData";
import { isNotFoundError } from "../lib/apiErrors";

export function InviteUnavailablePage() {
  const api = useCrewGoalsApi();
  const { inviteId } = useParams<{ inviteId: string }>();
  const { state, reload } = useAsyncData(
    async (signal) => {
      if (!inviteId) {
        throw new Error("Missing invite id");
      }

      const invite = await api.getInvite(inviteId, signal);
      return mapInviteDetailView(invite);
    },
    [api, inviteId]
  );

  if (state.status === "loading") {
    return (
      <LoadingState
        title="Checking invite status"
        body="Confirming whether this goal is still available to join."
      />
    );
  }

  if (state.status === "error") {
    if (isNotFoundError(state.error)) {
      return (
        <div className="app-screen">
          <PageHeader
            eyebrow="Invite unavailable"
            title="This invite no longer exists"
            description="The unavailable route keeps broken deep links from collapsing into a generic app error."
          />
          <UnavailableState
            eyebrow="Not available"
            title="Invite link is no longer active"
            body="This invite does not point to a current Crew Goal anymore."
            primaryLabel="Back to home"
            primaryTo={appRoutes.home}
            secondaryLabel="View goals"
            secondaryTo={appRoutes.goals}
          />
        </div>
      );
    }

    return (
      <ErrorState
        title="Unavailable state could not load"
        body="We could not resolve why this invite stopped being available."
        onRetry={reload}
      />
    );
  }

  if (!state.data.isUnavailable) {
    return <Navigate replace to={buildInvitePath(state.data.id)} />;
  }

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow="Invite unavailable"
        title={state.data.title}
        description={`Invited by ${state.data.inviterName}. This state is now explicit, so full and ended goals do not look like generic failures.`}
      />

      <UnavailableState
        eyebrow={state.data.availabilityLabel}
        title="You cannot join this goal now"
        body={state.data.availabilityDescription}
        primaryLabel="Back to home"
        primaryTo={appRoutes.home}
        secondaryLabel="View goals"
        secondaryTo={appRoutes.goals}
      />
    </div>
  );
}
