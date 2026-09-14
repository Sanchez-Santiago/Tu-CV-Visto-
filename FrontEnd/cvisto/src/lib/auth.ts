export function capturarTokenOAuth(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("token");
  if (token) {
    sessionStorage.setItem("cvisto_token", token);
    console.info("[auth] token capturado del callback OAuth");
    window.history.replaceState({}, "", "/");
  } else if (window.location.pathname === "/auth/callback") {
    console.warn("[auth] /auth/callback sin token en el fragmento");
    window.history.replaceState({}, "", "/");
  }
}