import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  Check,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  Gauge,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Monitor,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, firebaseConfigured, googleProvider } from "./firebase.js";

const TARGET_URL = "https://auto83.vercel.app/";

function formatTime(value) {
  if (!value) return "No checks yet";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatLatency(value) {
  return typeof value === "number" ? `${Math.round(value)} ms` : "--";
}

function getAuthErrorMessage(error) {
  if (error.code === "auth/unauthorized-domain") {
    return `Add ${window.location.hostname} to Firebase Authentication > Settings > Authorized domains, then reload this page.`;
  }
  return error.message.replace("Firebase: ", "");
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Fieldnote site monitor">
        <div className="auth-visual-top">
          <a className="brand brand-light" href="#home" aria-label="Fieldnote home">
            <span className="brand-mark"><Activity size={19} strokeWidth={2.5} /></span>
            <span>fieldnote<span className="brand-period">.</span></span>
          </a>
          <span className="visual-edition"><span className="live-dot" /> SITE MONITOR</span>
        </div>
        <div className="visual-content">
          <div className="visual-kicker"><span>01</span> PERFORMANCE, IN PLAIN SIGHT</div>
          <h1>A clearer view<br />of your <em>uptime.</em></h1>
          <p>One quiet check at a time. Keep an eye on response speed and availability without the noise.</p>
          <div className="visual-chart" aria-hidden="true">
            <div className="chart-caption"><span>RESPONSE TREND</span><span>LAST 7 CHECKS</span></div>
            <div className="visual-chart-grid">
              <span className="grid-label">400 ms</span>
              <span className="grid-label">200 ms</span>
              <span className="grid-label">0 ms</span>
              <svg viewBox="0 0 540 150" preserveAspectRatio="none" role="presentation">
                <path className="chart-grid-line" d="M0 22H540M0 76H540M0 130H540" />
                <path className="chart-fill" d="M0 92 C48 78 54 100 101 82 S160 68 200 80 S261 54 302 68 S363 42 404 59 S465 34 510 45 L540 39V150H0Z" />
                <path className="chart-line" d="M0 92 C48 78 54 100 101 82 S160 68 200 80 S261 54 302 68 S363 42 404 59 S465 34 510 45 L540 39" />
                <circle className="chart-point" cx="510" cy="45" r="5" />
              </svg>
              <div className="chart-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
            </div>
          </div>
        </div>
        <div className="visual-footer"><ShieldCheck size={15} /> PRIVATE BY DESIGN <span>·</span> FIREBASE AUTH</div>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand brand">
          <span className="brand-mark"><Activity size={19} strokeWidth={2.5} /></span>
          <span>fieldnote<span className="brand-period">.</span></span>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-eyebrow"><span className="eyebrow-line" /> YOUR MONITORING SPACE</div>
          <h2>{mode === "login" ? "Welcome back." : "Create your account."}</h2>
          <p className="auth-subtitle">{mode === "login" ? "Sign in to see how your site is doing." : "Set up a private space for your site checks."}</p>

          {!firebaseConfigured && (
            <div className="config-note" role="status">
              <CircleAlert size={18} />
              <span>Firebase is not configured. Add the web app values from <code>.env.local</code> to enable sign-in.</span>
            </div>
          )}

          <button className="google-button" type="button" onClick={googleSignIn} disabled={!firebaseConfigured || busy}>
            <span className="google-g">G</span> Continue with Google
          </button>
          <div className="form-divider"><span /> OR WITH EMAIL <span /></div>

          <form onSubmit={submit} className="auth-form">
            <label htmlFor="email">Email address</label>
            <div className="input-wrap">
              <Mail size={17} />
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={!firebaseConfigured || busy} />
            </div>
            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <span className="password-hint">At least 6 characters</span>
            </div>
            <div className="input-wrap">
              <LockKeyhole size={17} />
              <input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required disabled={!firebaseConfigured || busy} />
              <button className="icon-button password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {error && <p className="form-error" role="alert"><CircleAlert size={15} /> {error}</p>}
            <button className="submit-button" type="submit" disabled={!firebaseConfigured || busy}>
              {busy ? <LoaderCircle className="spin" size={17} /> : null}
              {mode === "login" ? "Sign in" : "Create account"}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="switch-mode">
            {mode === "login" ? "New to Fieldnote?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="auth-terms">By continuing, you agree to keep your checks respectful and within your authorization.</p>
        </div>
        <div className="auth-bottom-note"><span>FIELDNOTE / 2026</span><span>BUILT FOR A LITTLE MORE CLARITY</span></div>
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, detail, accent = false }) {
  return (
    <article className={`stat-card${accent ? " stat-card-accent" : ""}`}>
      <div className="stat-top"><span>{label}</span><Icon size={17} strokeWidth={1.8} /></div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </article>
  );
}

function Dashboard({ user }) {
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");
  const latest = runs[0];
  const latencyValues = runs.map((run) => run.response_ms).filter((value) => typeof value === "number");
  const average = latencyValues.length
    ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
    : null;
  const chartRuns = useMemo(() => [...runs].slice(0, 7).reverse(), [runs]);
  const maxLatency = Math.max(...chartRuns.map((run) => run.response_ms || 0), 1);

  async function triggerCheck() {
    setRunning(true);
    setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The check could not be started.");
      setRuns((current) => [payload, ...current].slice(0, 20));
      if (payload.error) {
        setNotice(`The page did not respond: ${payload.error}`);
        setNoticeType("error");
      } else {
        setNotice("Check complete. The latest result is ready below.");
        setNoticeType("success");
      }
    } catch (error) {
      setNotice(error.message);
      setNoticeType("error");
    } finally {
      setRunning(false);
    }
  }

  const statusText = latest?.error
    ? "No response"
    : latest?.status
      ? `${latest.status} ${latest.status >= 200 && latest.status < 400 ? "OK" : "Error"}`
      : "Waiting";
  const statusGood = latest?.status >= 200 && latest?.status < 400;

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="#overview">
          <span className="brand-mark"><Activity size={19} strokeWidth={2.5} /></span>
          <span>fieldnote<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <a className="nav-item nav-item-active" href="#overview"><ChartNoAxesColumnIncreasing size={18} /> Overview</a>
          <a className="nav-item" href="#recent-checks"><Clock3 size={18} /> Recent checks</a>
        </nav>
        <div className="sidebar-target">
          <div className="sidebar-label">MONITORED SITE</div>
          <div className="target-mini-icon"><Globe2 size={17} /></div>
          <div className="target-mini-url">auto83.vercel.app</div>
          <div className="target-mini-status"><span className={latest ? (statusGood ? "live-dot" : "status-dot-warn") : "status-dot-idle"} />{latest ? (statusGood ? "Responding" : "Needs attention") : "Awaiting first check"}</div>
        </div>
        <div className="sidebar-bottom">
          <div className="secure-note"><ShieldCheck size={17} /><span>Private workspace<br /><small>Secured with Firebase</small></span></div>
          <div className="user-row">
            <div className="user-avatar">{(user.displayName || user.email || "U").slice(0, 1).toUpperCase()}</div>
            <div className="user-info"><strong>{user.displayName || "Signed in"}</strong><span>{user.email}</span></div>
            <button className="icon-button logout-button" type="button" onClick={() => signOut(auth)} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>Overview</strong></div>
          <div className="topbar-right"><span className="topbar-secure"><span className="live-dot" /> MONITOR READY</span><button className="mobile-logout icon-button" type="button" onClick={() => signOut(auth)} aria-label="Sign out"><LogOut size={18} /></button></div>
        </header>

        <div className="dashboard-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> YOUR SITE AT A GLANCE</div>
              <h1>Overview<span className="heading-period">.</span></h1>
              <p>A calm read on speed and availability.</p>
            </div>
            <button className="run-button" type="button" onClick={triggerCheck} disabled={running}>
              {running ? <LoaderCircle className="spin" size={17} /> : <RotateCw size={17} />}
              {running ? "Checking…" : "Run a check"}
              {!running && <ArrowUpRight size={15} />}
            </button>
          </section>

          <section className="site-banner" aria-label="Monitored website">
            <div className="site-identity">
              <span className="site-icon"><Globe2 size={21} /></span>
              <div><div className="site-url">auto83.vercel.app</div><div className="site-meta"><span className="https-mark"><LockKeyhole size={11} /> HTTPS</span><span className="meta-divider" />Passive response check</div></div>
            </div>
            <div className={`site-status${latest ? (statusGood ? " site-status-good" : " site-status-warn") : " site-status-idle"}`}>
              <span className="status-indicator" />{latest ? statusText : "No data yet"}
            </div>
          </section>

          {notice && <div className={`notice notice-${noticeType}`} role="status"><span>{noticeType === "success" ? <Check size={17} /> : <CircleAlert size={17} />}</span>{notice}<button className="icon-button" type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}

          <section className="stats-grid" aria-label="Latest performance statistics">
            <StatCard icon={Zap} label="RESPONSE TIME" value={formatLatency(latest?.response_ms)} detail="Time to response headers" accent />
            <StatCard icon={Gauge} label="AVG RESPONSE" value={average === null ? "--" : `${average} ms`} detail={average === null ? "Across this session" : `Across ${latencyValues.length} ${latencyValues.length === 1 ? "check" : "checks"}`} />
            <StatCard icon={Monitor} label="HTTP STATUS" value={latest?.status ?? "--"} detail={latest ? statusText : "Waiting for first check"} />
            <StatCard icon={Activity} label="LAST CHECKED" value={latest ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(latest.timestamp)) : "--:--"} detail={latest ? formatTime(latest.timestamp) : "No checks yet"} />
          </section>

          <section className="insights-grid">
            <article className="panel performance-panel">
              <div className="panel-heading">
                <div><div className="panel-overline">RESPONSE OVER TIME</div><h2>Performance</h2></div>
                <div className="range-chip"><span className="range-dot" /> THIS SESSION</div>
              </div>
              <div className="performance-chart">
                <div className="chart-y-labels"><span>{maxLatency === 1 ? "--" : `${Math.round(maxLatency)} ms`}</span><span>{maxLatency === 1 ? "--" : `${Math.round(maxLatency / 2)} ms`}</span><span>0 ms</span></div>
                <div className="chart-plot">
                  <div className="plot-grid"><i /><i /><i /></div>
                  {chartRuns.length ? (
                    <div className="bar-list" aria-label="Response time by check">
                      {chartRuns.map((run, index) => <div className="bar-column" key={`${run.timestamp}-${index}`} title={`${formatTime(run.timestamp)}: ${formatLatency(run.response_ms)}`}><div className={`bar${run.error ? " bar-error" : ""}`} style={{ height: `${Math.max(8, ((run.response_ms || 0) / maxLatency) * 100)}%` }} /><span>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(run.timestamp))}</span></div>)}
                    </div>
                  ) : (
                    <div className="chart-empty"><span className="empty-chart-icon"><Activity size={18} /></span><strong>Your first check starts the picture.</strong><span>Response times will appear here.</span></div>
                  )}
                </div>
              </div>
              <div className="chart-footnote"><span><span className="legend-dot" /> RESPONSE TIME</span><span>Updates when you run a check</span></div>
            </article>

            <article className="panel quick-panel">
              <div className="panel-overline">MONITORING SETUP</div>
              <h2>Simple by design.</h2>
              <p>A single HTTPS request checks the page response. No browser scripts, link traversal, or ad interaction.</p>
              <div className="setup-list">
                <div className="setup-row"><span className="setup-icon"><Timer size={16} /></span><span><strong>Manual check</strong><small>On demand, from this dashboard</small></span><Check className="setup-check" size={16} /></div>
                <div className="setup-row"><span className="setup-icon"><ShieldCheck size={16} /></span><span><strong>Authorized target</strong><small>auto83.vercel.app</small></span><Check className="setup-check" size={16} /></div>
              </div>
              <button className="text-action" type="button" onClick={triggerCheck} disabled={running}>{running ? "Check in progress" : "Check site now"}<ArrowRight size={16} /></button>
            </article>
          </section>

          <section className="panel recent-panel" id="recent-checks">
            <div className="panel-heading recent-heading">
              <div><div className="panel-overline">YOUR LATEST ACTIVITY</div><h2>Recent checks</h2></div>
              <span className="session-count">{runs.length} {runs.length === 1 ? "check" : "checks"}</span>
            </div>
            {runs.length ? (
              <div className="checks-table-wrap">
                <table className="checks-table">
                  <thead><tr><th>RESULT</th><th>TIME</th><th>RESPONSE</th><th>HTTP</th><th>SAMPLED</th></tr></thead>
                  <tbody>{runs.slice(0, 8).map((run, index) => {
                    const good = !run.error && run.status >= 200 && run.status < 400;
                    return <tr key={`${run.timestamp}-${index}`}><td><span className={`result-pill${good ? " result-good" : " result-bad"}`}><span />{good ? "Responded" : "Issue"}</span></td><td className="mono-cell">{formatTime(run.timestamp)}</td><td className="mono-cell">{formatLatency(run.response_ms)}</td><td className="mono-cell">{run.status ?? "--"}</td><td className="mono-cell">{run.bytes_sampled ? `${(run.bytes_sampled / 1024).toFixed(1)} KB` : "--"}</td></tr>;
                  })}</tbody>
                </table>
              </div>
            ) : (
              <div className="table-empty"><span className="empty-table-icon"><Clock3 size={18} /></span><span><strong>No checks recorded yet</strong><small>Run a check to see your site’s latest response here.</small></span><button className="empty-run-button" type="button" onClick={triggerCheck} disabled={running}>{running ? "Checking…" : "Run first check"}<ArrowRight size={15} /></button></div>
            )}
          </section>

          <footer className="dashboard-footer"><span>FIELDNOTE <i>·</i> SITE MONITOR</span><span><span className="live-dot" /> SECURE SESSION</span></footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
  }, []);

  if (authLoading) return <div className="loading-screen"><span className="brand-mark"><Activity size={19} /></span><LoaderCircle className="spin" size={20} /></div>;
  return user ? <Dashboard user={user} /> : <AuthScreen />;
}