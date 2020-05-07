export const DEFAULT_LIMIT = 500;
export const GROUP_MEMBERS_API = {
  sort: ["-member_since", "id"],
};
export const GROUP_REQUESTS_API = {
  sort: ["-at", "member_id"],
};
export const ERROR_MESSAGE = {
  fail: "The action cannot be executed. If the problem persists, contact us."
};
export const PENDING_REQUEST_SUCCESS_MESSAGE = {
  accept: "The selected request(s) have been accepted",
  reject: "The selected request(s) have been rejected"
};