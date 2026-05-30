import { fetchJson } from "./http";
import type { InviteDetail, InviteListItem } from "../types/crewGoals";
import type { InviteDetailResponse, InvitesListResponse } from "../../../../packages/shared/src/index";
import {
  mapInviteDetailResponse,
  mapInvitesListResponse
} from "./apiContracts";

export async function listInvites(signal?: AbortSignal) {
  const response = await fetchJson<InvitesListResponse>("/api/invites", { signal });
  return mapInvitesListResponse(response);
}

export async function getInvite(inviteId: string, signal?: AbortSignal) {
  const response = await fetchJson<InviteDetailResponse>(`/api/invites/${inviteId}`, {
    signal
  });
  return mapInviteDetailResponse(response);
}
