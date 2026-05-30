import { ApiError } from "../services/http";

export function getErrorStatus(error: unknown) {
  return error instanceof ApiError ? error.status : null;
}

export function isNotFoundError(error: unknown) {
  return getErrorStatus(error) === 404;
}
