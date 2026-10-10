let token = "";

export function githubSessionToken() {
  return token;
}

export function rememberGithubSessionToken(value = "") {
  token = String(value || "").trim();
  return token;
}

export function hasGithubSessionToken() {
  return Boolean(token);
}
