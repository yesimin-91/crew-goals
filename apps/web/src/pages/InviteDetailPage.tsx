import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { ActionButton, ActionLink } from "../components/Action";
import { ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import {
  appRoutes,
  buildGoalPath,
  buildInviteUnavailablePath
} from "../app/routes";
import { mapInviteDetailView } from "../features/invites/inviteViewModels";
import { useAsyncData } from "../hooks/useAsyncData";
import { getErrorCode, isNotFoundError } from "../lib/apiErrors";

function getInviteActionErrorMessage(error: unknown) {
  const code = getErrorCode(error);

  switch (code) {
    case "active_goal_conflict":
      return "You already have an active Crew Goal. View your current goal before joining another invite.";
    case "full":
      return "This crew is already full, so the invite can no longer be joined.";
    case "completed":
      return "This Crew Goal has already been completed and the result is locked.";
    case "expired":
      return "This invite ended with the crew's 7-day goal window.";
    case "ignored":
    case "invite_unavailable":
      return "This invite is no longer available. Refresh the invite status for the latest state.";
    default:
      return "We could not update this invite yet. Try again in a moment.";
  }
}

export function InviteDetailPage() {
  const api = useCrewGoalsApi();
  const navigate = useNavigate();
  const { inviteId } = useParams<{ inviteId: string }>();
  const [actionState, setActionState] = useState<"idle" | "joining" | "ignoring">("idle");
  const [actionError, setActionError] = useState<string | null>(null);
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
        title="Loading join goal"
        body="Checking whether this invite is joinable, blocked, or unavailable."
      />
    );
  }

  if (state.status === "error") {
    if (inviteId && isNotFoundError(state.error)) {
      return <Navigate replace to={buildInviteUnavailablePath(inviteId)} />;
    }

    return (
      <ErrorState
        title="Invite could not load"
        body="We could not determine the current availability for this invite."
        onRetry={reload}
      />
    );
  }

  if (state.data.isUnavailable) {
    return <Navigate replace to={buildInviteUnavailablePath(state.data.id)} />;
  }

  if (state.data.isAccepted) {
    return <Navigate replace to={buildGoalPath(state.data.goalId)} />;
  }

  const isActing = actionState !== "idle";

  async function handleJoinGoal() {
    if (!inviteId || state.status !== "ready" || !state.data.canAct) {
      return;
    }

    setActionError(null);
    setActionState("joining");

    try {
      const result = await api.acceptInvite(inviteId);
      navigate(buildGoalPath(result.goalId));
    } catch (error) {
      const code = getErrorCode(error);
      setActionError(getInviteActionErrorMessage(error));

      if (code === "full" || code === "completed" || code === "expired" || code === "ignored") {
        navigate(buildInviteUnavailablePath(inviteId));
        return;
      }

      reload();
    } finally {
      setActionState("idle");
    }
  }

  async function handleIgnoreInvite() {
    if (!inviteId || state.status !== "ready" || !state.data.canAct) {
      return;
    }

    setActionError(null);
    setActionState("ignoring");

    try {
      await api.ignoreInvite(inviteId);
      navigate(appRoutes.invites);
    } catch (error) {
      const code = getErrorCode(error);
      setActionError(getInviteActionErrorMessage(error));

      if (code === "full" || code === "completed" || code === "expired" || code === "ignored") {
        navigate(buildInviteUnavailablePath(inviteId));
        return;
      }

      reload();
    } finally {
      setActionState("idle");
    }
  }

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow="Join goal"
        title={state.data.title}
        description={`Invited by ${state.data.inviterName}. Only runs completed after you join will count toward this goal.`}
      />

      <section className="hero-card">
        <div className="hero-card__top">
          <p className="eyebrow">Availability</p>
          <span
            className={`pill pill--${state.data.availabilityTone === "warning" ? "warning" : "positive"}`}
          >
            {state.data.availabilityLabel}
          </span>
        </div>

        <div className="hero-card__body">
          <h1>{state.data.targetLabel}</h1>
          <p>{state.data.availabilityDescription}</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span>Duration</span>
            <strong>{state.data.durationLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Members</span>
            <strong>{state.data.currentMembersLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Joined</span>
            <strong>{state.data.joinedMembersLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Pending</span>
            <strong>{state.data.pendingInvitesLabel}</strong>
          </article>
        </div>

        <div className="inline-actions">
          {state.data.isConflict && state.data.currentUserActiveGoalId ? (
            <>
              <ActionLink block to={buildGoalPath(state.data.currentUserActiveGoalId)}>
                View current goal
              </ActionLink>
              <ActionLink block tone="secondary" to={appRoutes.invites}>
                Back to invites
              </ActionLink>
            </>
          ) : (
            <>
              <ActionButton
                block
                disabled={!state.data.canAct || isActing}
                onClick={handleJoinGoal}
              >
                {actionState === "joining" ? "Joining..." : "Join Goal"}
              </ActionButton>
              <ActionButton
                block
                disabled={!state.data.canAct || isActing}
                onClick={handleIgnoreInvite}
                tone="secondary"
              >
                {actionState === "ignoring" ? "Closing invite..." : "Not now"}
              </ActionButton>
            </>
          )}
        </div>

        {actionError ? (
          <p className="form-error" role="alert">
            {actionError}
          </p>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Invite rules</p>
          <h2>What joining means</h2>
        </div>

        <div className="rule-list">
          <article className="rule-item">
            <span className="rule-item__mark">1</span>
            <p>Goal progress is asynchronous, so nobody needs to start the same run together.</p>
          </article>
          <article className="rule-item">
            <span className="rule-item__mark">2</span>
            <p>Only future Run and Trail Run activities count after the moment you join.</p>
          </article>
          <article className="rule-item">
            <span className="rule-item__mark">3</span>
            <p>{state.data.startsLabel}. {state.data.endsLabel}.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
