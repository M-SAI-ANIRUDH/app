import { useEffect, useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { FlowerMark } from "../../components/Reveal";
import AdminPanel from "./AdminPanel";

const AdminGate = () => {
  const [state, setState] = useState("checking"); // checking | login | panel
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("bta_admin_token");
    if (!token) {
      setState("login");
      return;
    }
    api
      .get("/admin/verify")
      .then(() => setState("panel"))
      .catch(() => {
        sessionStorage.removeItem("bta_admin_token");
        setState("login");
      });
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/admin/login", { password });
      sessionStorage.setItem("bta_admin_token", data.token);
      setState("panel");
    } catch (err) {
      setError(formatApiError(err, "Could not sign in. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="text-sm text-taupe">Checking session…</p>
      </div>
    );
  }

  if (state === "panel") {
    return <AdminPanel onLogout={() => setState("login")} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4" data-testid="admin-login-page">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-sand bg-white p-8 shadow-[0_20px_50px_-25px_rgba(57,46,40,0.25)]">
          <div className="flex items-center gap-2.5">
            <FlowerMark className="h-12 w-12" />
            <span className="font-serif text-2xl font-medium text-charcoal">bless to art.</span>
          </div>
          <h1 className="mt-6 font-serif text-2xl text-charcoal">Owner access</h1>
          <p className="mt-1 text-sm text-taupe">Manage your collections and products.</p>
          <form onSubmit={login} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-password" className="text-xs font-semibold uppercase tracking-wider text-taupe">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                data-testid="admin-password-input"
                className="mt-1.5 w-full rounded-xl border border-sand bg-ivory px-4 py-3 text-sm text-charcoal focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                placeholder="Enter admin password"
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive" data-testid="admin-login-error">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              data-testid="admin-login-button"
              className="w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-ivory transition-all duration-300 hover:bg-terracotta-dark disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
        <p className="mt-4 rounded-2xl border border-blush bg-blush/30 px-4 py-3 text-center text-xs leading-relaxed text-taupe" data-testid="admin-simulated-notice">
          Prototype demo — this sign-in is simulated for preview purposes and is not
          production-grade security.
        </p>
      </div>
    </div>
  );
};

export default AdminGate;
