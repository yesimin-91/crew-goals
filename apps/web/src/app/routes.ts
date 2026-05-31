export const appRoutes = {
  home: "/",
  goals: "/goals",
  createGoal: "/goals/create",
  chooseGoalFriends: "/goals/friends",
  previewGoal: "/goals/preview",
  invites: "/invites"
} as const;

export function buildGoalPath(goalId: string) {
  return `/goals/${goalId}`;
}

export function buildInvitePath(inviteId: string) {
  return `/invites/${inviteId}`;
}

export function buildInviteUnavailablePath(inviteId: string) {
  return `/invites/${inviteId}/unavailable`;
}

export function buildPostRunPath(activityId: string) {
  return `/post-run/${activityId}`;
}

export function buildGoalResultPath(goalId: string, status: "completed" | "expired") {
  return `/results/${goalId}/${status}`;
}

export function buildRestartGoalPath(memberIds: string[]) {
  const params = new URLSearchParams();

  if (memberIds.length) {
    params.set("restartMemberIds", memberIds.join(","));
  }

  const query = params.toString();
  return query ? `${appRoutes.createGoal}?${query}` : appRoutes.createGoal;
}
