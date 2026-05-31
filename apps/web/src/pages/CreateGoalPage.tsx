import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import { appRoutes, buildGoalPath } from "../app/routes";
import { ActionButton, ActionLink } from "../components/Action";
import { ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { formatDistanceKm, getInitials } from "../lib/formatters";
import type {
  GoalDistanceRecommendationResponse,
  GoalRecommendationTier
} from "../types/crewGoals";

interface InviteableFriend {
  id: string;
  displayName: string;
  activityLabel: string;
  groupLabel: "Recent teammate" | "Active friend";
}

const INVITEABLE_FRIENDS: InviteableFriend[] = [
  {
    id: "nora",
    displayName: "Nora",
    activityLabel: "Ran together last week",
    groupLabel: "Recent teammate"
  },
  {
    id: "isaac",
    displayName: "Isaac",
    activityLabel: "3 runs this month",
    groupLabel: "Recent teammate"
  },
  {
    id: "zoe",
    displayName: "Zoe",
    activityLabel: "Active this week",
    groupLabel: "Active friend"
  },
  {
    id: "ava",
    displayName: "Ava",
    activityLabel: "Weekly runner",
    groupLabel: "Active friend"
  },
  {
    id: "liam",
    displayName: "Liam",
    activityLabel: "Trail runner",
    groupLabel: "Active friend"
  }
];

const FLOW_STEPS = [
  {
    label: "Invite friends",
    body: "Pick 1 to 3 familiar friends for a 2-4 person weekly crew."
  },
  {
    label: "Run separately",
    body: "Nobody needs to start at the same time or join the same run."
  },
  {
    label: "Distance adds automatically",
    body: "Eligible Run and Trail Run activities move the shared target after sync."
  }
];

const FALLBACK_RECOMMENDATION: Omit<
  GoalDistanceRecommendationResponse,
  "selectedFriendIds"
> = {
  screen: "goal_recommendation",
  durationDays: 7,
  options: [
    {
      tier: "easy",
      label: "Easy",
      distanceKm: 20,
      description: "A lighter week using the default Crew Goals distance."
    },
    {
      tier: "recommended",
      label: "Recommended",
      distanceKm: 35,
      description: "The default weekly distance when recommendations are unavailable."
    },
    {
      tier: "stretch",
      label: "Stretch",
      distanceKm: 50,
      description: "A bigger default target if the crew wants an extra push."
    }
  ],
  defaultSelectedTier: "recommended",
  source: "default",
  explanation:
    "Using the default weekly distance presets because recommendation data could not load."
};

function toggleFriend(selectedFriendIds: string[], friendId: string) {
  if (selectedFriendIds.includes(friendId)) {
    return selectedFriendIds.filter((id) => id !== friendId);
  }

  if (selectedFriendIds.length >= 3) {
    return selectedFriendIds;
  }

  return [...selectedFriendIds, friendId];
}

function getTierTone(tier: GoalRecommendationTier) {
  switch (tier) {
    case "easy":
      return "A lighter week";
    case "recommended":
      return "Best starting point";
    case "stretch":
      return "Bigger team push";
  }
}

function buildFallbackRecommendation(
  selectedFriendIds: string[]
): GoalDistanceRecommendationResponse {
  return {
    ...FALLBACK_RECOMMENDATION,
    selectedFriendIds
  };
}

export function CreateGoalPage() {
  const api = useCrewGoalsApi();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [recommendation, setRecommendation] =
    useState<GoalDistanceRecommendationResponse | null>(null);
  const [selectedTier, setSelectedTier] =
    useState<GoalRecommendationTier>("recommended");
  const [recommendationState, setRecommendationState] =
    useState<"idle" | "loading" | "ready" | "fallback">("idle");
  const [submitState, setSubmitState] =
    useState<"idle" | "submitting" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasAppliedRestartPrefill = useRef(false);
  const restartMemberIds = useMemo(
    () =>
      searchParams
        .get("restartMemberIds")
        ?.split(",")
        .map((id) => id.trim())
        .filter(Boolean) ?? [],
    [searchParams]
  );

  const filteredFriends = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return INVITEABLE_FRIENDS;
    }

    return INVITEABLE_FRIENDS.filter((friend) =>
      friend.displayName.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  useEffect(() => {
    if (selectedFriendIds.length === 0) {
      setRecommendation(null);
      setRecommendationState("idle");
      setSelectedTier("recommended");
      return;
    }

    const abortController = new AbortController();
    setRecommendationState("loading");

    api
      .getGoalDistanceRecommendation(selectedFriendIds, abortController.signal)
      .then((response) => {
        setRecommendation(response);
        setSelectedTier(response.defaultSelectedTier);
        setRecommendationState("ready");
      })
      .catch(() => {
        if (!abortController.signal.aborted) {
          setRecommendation(buildFallbackRecommendation(selectedFriendIds));
          setSelectedTier("recommended");
          setRecommendationState("fallback");
        }
      });

    return () => abortController.abort();
  }, [api, selectedFriendIds]);

  useEffect(() => {
    if (hasAppliedRestartPrefill.current || restartMemberIds.length === 0 || selectedFriendIds.length > 0) {
      return;
    }

    const prefills = INVITEABLE_FRIENDS.filter((friend) => restartMemberIds.includes(friend.id))
      .slice(0, 3)
      .map((friend) => friend.id);

    if (prefills.length) {
      hasAppliedRestartPrefill.current = true;
      setSelectedFriendIds(prefills);
    }
  }, [restartMemberIds, selectedFriendIds.length]);

  const selectedFriends = selectedFriendIds.map((friendId) =>
    INVITEABLE_FRIENDS.find((friend) => friend.id === friendId)
  ).filter((friend): friend is InviteableFriend => Boolean(friend));
  const canSubmit =
    selectedFriendIds.length >= 1 &&
    selectedFriendIds.length <= 3 &&
    (recommendationState === "ready" || recommendationState === "fallback") &&
    submitState !== "submitting";

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const result = await api.createGoal(selectedFriendIds, selectedTier);
      navigate(buildGoalPath(result.goalId));
    } catch {
      setSubmitState("error");
      setSubmitError(
        "Could not send invites yet. Check whether you already have an active goal, then try again."
      );
    }
  }

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow="Create goal"
        title="Start a 7-day distance goal"
        description="Choose familiar friends, pick a team distance, and send invites. The goal starts as soon as invites are sent."
      />

      <section className="hero-card">
        <div className="hero-card__top">
          <p className="eyebrow">Distance goal</p>
          <span className="pill">7 days</span>
        </div>

        <div className="hero-card__body">
          <h1>Run separately. Finish together.</h1>
          <p>
            Crew Goals keeps the target shared while everyone runs on their own
            schedule.
          </p>
        </div>

        <div className="rule-list">
          {FLOW_STEPS.map((step) => (
            <article className="rule-item" key={step.label}>
              <span className="rule-item__mark">{step.label[0]}</span>
              <p>
                <strong>{step.label}</strong>
                <br />
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Choose friends</p>
          <h2>Select 1 to 3 friends</h2>
        </div>

        <label className="field">
          <span>Search friends</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name"
            type="search"
          />
        </label>

        {INVITEABLE_FRIENDS.length === 0 ? (
          <div className="subsection">
            <ErrorState
              title="No friends to invite yet"
              body="Come back after more friends are available, or return to the goals hub."
            />
          </div>
        ) : (
          <div className="stack-list">
            {filteredFriends.map((friend) => {
              const selected = selectedFriendIds.includes(friend.id);
              const disabled = !selected && selectedFriendIds.length >= 3;

              return (
                <button
                  className={`select-card${selected ? " select-card--selected" : ""}`}
                  disabled={disabled}
                  key={friend.id}
                  onClick={() =>
                    setSelectedFriendIds((current) =>
                      toggleFriend(current, friend.id)
                    )
                  }
                  type="button"
                >
                  <span className="avatar">{getInitials(friend.displayName)}</span>
                  <span>
                    <strong>{friend.displayName}</strong>
                    <small>{friend.groupLabel} · {friend.activityLabel}</small>
                  </span>
                  <span className="select-card__status">
                    {selected ? "Selected" : disabled ? "Limit" : "Add"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {filteredFriends.length === 0 ? (
          <p className="support-copy">No friends match that search.</p>
        ) : null}
      </section>

      <section className="panel panel--accent">
        <div className="section-heading">
          <p className="eyebrow">Preview</p>
          <h2>Pick the team distance</h2>
        </div>

        {selectedFriends.length > 0 ? (
          <>
            <div className="avatar-stack" aria-label="Selected crew">
              {selectedFriends.map((friend) => (
                <span className="avatar" key={friend.id}>
                  {getInitials(friend.displayName)}
                </span>
              ))}
              <p>{selectedFriends.length + 1} people including you</p>
            </div>
            {restartMemberIds.length ? (
              <p className="support-copy">
                We preselected joined members from the last goal. You can adjust the crew before sending invites.
              </p>
            ) : null}
          </>
        ) : (
          <p className="support-copy">
            Select at least one friend to calculate Easy, Recommended, and
            Stretch distances.
          </p>
        )}

        {recommendationState === "loading" ? (
          <LoadingState
            title="Calculating distances"
            body="Checking the selected crew's recent weekly rhythm."
          />
        ) : null}

        {recommendationState === "fallback" ? (
          <article className="info-card">
            <span>Default distances</span>
            <strong>Recommendation could not load</strong>
            <p>
              You can still send invites using the default 20 km, 35 km, and
              50 km distance options.
            </p>
          </article>
        ) : null}

        {recommendation ? (
          <>
            <div className="tier-grid">
              {recommendation.options.map((option) => (
                <button
                  className={`tier-card${selectedTier === option.tier ? " tier-card--selected" : ""}`}
                  key={option.tier}
                  onClick={() => setSelectedTier(option.tier)}
                  type="button"
                >
                  <span>{option.label}</span>
                  <strong>{formatDistanceKm(option.distanceKm)}</strong>
                  <small>{getTierTone(option.tier)}</small>
                  <p>{option.description}</p>
                </button>
              ))}
            </div>

            <article className="info-card">
              <span>{recommendation.source === "recent_training" ? "Recent training" : "Default"}</span>
              <strong>{recommendation.explanation}</strong>
              <p>
                Friends who join later only contribute future runs. Eligible
                Run and Trail Run activities add automatically after sync.
              </p>
            </article>
          </>
        ) : null}

        {submitError ? (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="inline-actions">
          <ActionButton block disabled={!canSubmit} onClick={handleSubmit}>
            {submitState === "submitting" ? "Sending invites..." : "Send Invite"}
          </ActionButton>
          <ActionLink block tone="secondary" to={appRoutes.goals}>
            Back to goals
          </ActionLink>
        </div>
      </section>
    </div>
  );
}
