const API_BASE = "http://localhost:8000";
const NODE_API_BASE = "http://localhost:5000";

const sendWelcomeEmail = async (name, email) => {
  try {
    await fetch(`${NODE_API_BASE}/api/email/welcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
  } catch (err) {
    console.error("Welcome email request failed", err);
  }
};



const auth = document.getElementById("auth");
const appScreen = document.getElementById("appScreen");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const authPill = document.getElementById("authPill");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const oauthForm = document.getElementById("oauthForm");
const authStatus = document.getElementById("authStatus");
const signupStatus = document.getElementById("signupStatus");
const backToAuthBtn = document.getElementById("backToAuthBtn");
const socialButtonsContainer = document.getElementById("socialButtonsContainer");
const tabsContainer = document.getElementById("tabsContainer");

const logoutBtn = document.getElementById("logoutBtn");
const userLabel = document.getElementById("userLabel");

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("if_users") || "{}");
  } catch {
    return {};
  }
}
function setUsers(users) {
  localStorage.setItem("if_users", JSON.stringify(users));
}
function getEmails() {
  try { return JSON.parse(localStorage.getItem("if_emails") || "{}"); } catch { return {}; }
}
function setEmails(emails) {
  localStorage.setItem("if_emails", JSON.stringify(emails));
}
function setSession(username) {
  localStorage.setItem(
    "if_session",
    JSON.stringify({ username, ts: Date.now() }),
  );
}
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("if_session") || "null");
  } catch {
    return null;
  }
}
function clearSession() {
  localStorage.removeItem("if_session");
}

function showApp(username) {
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  userLabel.textContent = username || "user";
}

function showAuth() {
  appScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
  authStatus.textContent = "";
}

function setAuthMode(mode) {
  const isLogin = mode === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
  if (oauthForm) oauthForm.classList.add("hidden");
  if (socialButtonsContainer) socialButtonsContainer.classList.remove("hidden");
  if (tabsContainer) tabsContainer.classList.remove("hidden");

  loginTab.classList.toggle("bg-panel", isLogin);
  loginTab.classList.toggle("border", isLogin);
  loginTab.classList.toggle("border-stroke", isLogin);

  signupTab.classList.toggle("bg-panel", !isLogin);
  signupTab.classList.toggle("border", !isLogin);
  signupTab.classList.toggle("border-stroke", !isLogin);

  signupTab.classList.toggle("text-slate-300", isLogin);
  loginTab.classList.toggle("text-slate-300", !isLogin);

  authPill.textContent = isLogin ? "Login" : "Sign up";
  authStatus.textContent = "";
  if (signupStatus) signupStatus.textContent = "";
}

loginTab?.addEventListener("click", () => setAuthMode("login"));
signupTab?.addEventListener("click", () => setAuthMode("signup"));

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value;

  if (!u || !p) {
    authStatus.className = "text-sm text-yellow-400 mt-2";
    authStatus.textContent = "⚠️ Enter username and password.";
    alert("⚠️ Error: Enter username and password.");
    return;
  }

  const users = getUsers();
  if (!users[u] || users[u] !== p) {
    authStatus.className = "text-sm text-red-400 mt-2";
    authStatus.textContent = "❌ Invalid credentials (demo auth).";
    alert("❌ Error: Invalid password or username.");
    return;
  }

  setSession(u);
  showApp(u);
});

signupForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const u = document.getElementById("signupUser").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const p = document.getElementById("signupPass").value;

  if (!u || u.length <= 3 || !p || p.length <= 4 || !email) {
    signupStatus.className = "text-sm text-yellow-400 mt-2";
    signupStatus.textContent = "⚠️ Please fill all fields correctly (Username > 3 chars, Password > 4 chars).";
    alert("⚠️ Error: Please fill all fields correctly.");
    return;
  }

  if (p !== document.getElementById("signupPassConfirm")?.value) {
    signupStatus.className = "text-sm text-yellow-400 mt-2";
    signupStatus.textContent = "⚠️ Passwords do not match.";
    alert("⚠️ Error: Passwords do not match.");
    return;
  }

  const users = getUsers();
  if (users[u]) {
    signupStatus.className = "text-sm text-red-400 mt-2";
    signupStatus.textContent = "❌ Username already exists (demo).";
    alert("❌ Error: Username already exists.");
    return;
  }

  users[u] = p;
  setUsers(users);
  
  const emails = getEmails();
  emails[u] = email;
  setEmails(emails);

  setSession(u);

  signupStatus.className = "text-sm text-emerald-400 mt-2";
  signupStatus.textContent = "✅ Account created. Opening immediately…";
  
  
  sendWelcomeEmail(u, email);
  
  showApp(u);
});

logoutBtn?.addEventListener("click", () => {
  clearSession();
  showAuth();
});

document.querySelectorAll(".toggle-password").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (input.type === "password") {
      input.type = "text";
      btn.innerText = "🙈";
    } else {
      input.type = "password";
      btn.innerText = "👁️";
    }
  });
});

let currentProvider = null;

document.querySelectorAll(".oauth-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentProvider = btn.getAttribute("data-provider");
    
    loginForm.classList.add("hidden");
    signupForm.classList.add("hidden");
    if (socialButtonsContainer) socialButtonsContainer.classList.add("hidden");
    if (tabsContainer) tabsContainer.classList.add("hidden");
    
    oauthForm.classList.remove("hidden");
    document.getElementById("oauthEmailLabel").textContent = `Email Address (${currentProvider})`;
  });
});

backToAuthBtn?.addEventListener("click", () => {
  setAuthMode(document.getElementById("authPill").textContent.toLowerCase() === "login" ? "login" : "signup");
});

oauthForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("oauthName").value.trim();
  const email = document.getElementById("oauthEmail").value.trim();
  
  if (!name || !email) return;

  const emails = getEmails();
  emails[name] = email;
  setEmails(emails);

  setSession(name);
  
  // Send welcome email using node backend
  sendWelcomeEmail(name, email);
  
  showApp(name);
});

/* Auto-login if session exists */
(function boot() {
  const sess = getSession();
  if (sess?.username) showApp(sess.username);
  else showAuth();
  
  // Default to signup if no local users exist
  if (Object.keys(getUsers()).length === 0) {
    setAuthMode("signup");
  } else {
    setAuthMode("login");
  }
})();

/* ---------------- DOM (APP) ---------------- */

const urlInput = document.getElementById("urlInput");
const status = document.getElementById("status");
const loader = document.getElementById("loader");
const result = document.getElementById("result");
const summary = document.getElementById("summary");
const topics = document.getElementById("topics");
const history = document.getElementById("history");
const wordCountEl = document.getElementById("wordCount");
const statusPill = document.getElementById("statusPill");

const analyzeBtn = document.getElementById("analyzeBtn");
const copyBtn = document.getElementById("copyBtn");
const newBtn = document.getElementById("newBtn");
const sidebarNewBtn = document.getElementById("sidebarNewBtn");
const sidebarReportBtn = document.getElementById("sidebarReportBtn");
const sampleUrlBtn = document.getElementById("sampleUrlBtn");

urlInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitUrl();
  }
});

const skeleton = document.getElementById("skeleton");

const tabSummary = document.getElementById("tabSummary");
const tabTakeaways = document.getElementById("tabTakeaways");
const summaryView = document.getElementById("summaryView");
const takeawaysView = document.getElementById("takeawaysView");
const takeawaysEl = document.getElementById("takeaways");

const statWords = document.getElementById("statWords");
const statRead = document.getElementById("statRead");

let jobId = null;
let poller = null;
let userHistory = [];

/* ---------------- URL VALIDATION ---------------- */

function isValidPublicUrl(url) {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) return false;

    const host = parsed.hostname;

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.")
    )
      return false;

    return true;
  } catch {
    return false;
  }
}

/* ---------------- UTIL ---------------- */

function setPill(label, colorDotClass) {
  if (!statusPill) return;
  statusPill.innerHTML = `<span class="w-2 h-2 rounded-full ${colorDotClass}"></span>${label}`;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "website";
  }
}

function estimateReadTime(words) {
  // ~200 wpm
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min`;
}

function makeTakeaways(text) {
  // Create 4–6 bullets by splitting sentences intelligently
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const parts = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);

  const unique = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!unique.some((u) => u.toLowerCase() === key)) unique.push(p);
    if (unique.length >= 6) break;
  }

  // If summary is short, fallback
  if (unique.length < 3) {
    const chunks = cleaned
      .split(/[,;]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 18);
    for (const c of chunks) {
      if (unique.length >= 6) break;
      if (!unique.includes(c)) unique.push(c);
    }
  }

  return unique.slice(0, 6);
}



function addToHistory(text, url) {
  userHistory.unshift({ url, title: getDomain(url), summary: text });

  if (history?.children?.[0]?.innerText === "No summaries yet.")
    history.innerHTML = "";

  const domain = getDomain(url);
  const card = document.createElement("div");
  card.className =
    "group relative overflow-hidden rounded-2xl border border-stroke bg-soft";

  card.innerHTML = `
    <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"></div>
    <div class="relative p-4 space-y-2">
      <div class="flex items-center gap-2 text-xs text-slate-400">
        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="w-4 h-4" />
        <span>${domain}</span>
      </div>

      <p class="text-sm text-slate-200 leading-snug line-clamp-2 cursor-pointer">
        ${text.slice(0, 120)}…
      </p>

      <button class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-400" title="Remove">
        🗑️
      </button>
    </div>
  `;

  card.querySelector("p").onclick = () => {
    summary.innerText = text;
    // Update takeaways when clicking history
    renderTakeaways(text);
    result.classList.remove("hidden");
    result.classList.add("reveal");
  };

  card.querySelector("button").onclick = () => card.remove();

  history.prepend(card);
}

/* ---------------- TABS ---------------- */

function setTab(tab) {
  const isSummary = tab === "summary";
  summaryView.classList.toggle("hidden", !isSummary);
  takeawaysView.classList.toggle("hidden", isSummary);

  tabSummary.className = isSummary
    ? "px-4 py-2 rounded-xl text-sm bg-panel border border-stroke"
    : "px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white";

  tabTakeaways.className = !isSummary
    ? "px-4 py-2 rounded-xl text-sm bg-panel border border-stroke"
    : "px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white";
}

tabSummary?.addEventListener("click", () => setTab("summary"));
tabTakeaways?.addEventListener("click", () => setTab("takeaways"));

function renderTakeaways(text) {
  const bullets = makeTakeaways(text);
  takeawaysEl.innerHTML = "";
  bullets.forEach((b) => {
    const li = document.createElement("li");
    li.textContent = b.replace(/[•\-]\s*/g, "");
    takeawaysEl.appendChild(li);
  });
}

/* ---------------- SUBMIT ---------------- */

analyzeBtn?.addEventListener("click", submitUrl);
copyBtn?.addEventListener("click", copySummary);
newBtn?.addEventListener("click", resetApp);
sidebarNewBtn?.addEventListener("click", resetApp);

sidebarReportBtn?.addEventListener("click", async () => {
  const sess = getSession();
  if (!sess || !sess.username) {
    alert("Please log in first!");
    return;
  }

  const emails = getEmails();
  let userEmail = emails[sess.username];

  if (!userEmail) {
    userEmail = prompt("Please enter your email address to link it to your current session and receive your report:");
    if (!userEmail) return;
    
    emails[sess.username] = userEmail;
    setEmails(emails);
  }
  
  const totalLinks = userHistory.length;
  const wordsSummarized = totalLinks * 350; 
  const readTimeSaved = `${Math.max(1, Math.floor(wordsSummarized / 200))} mins`;
  
  const recentLinks = userHistory.slice(0, 7).map(h => ({
    url: h.url,
    title: h.title,
    summary: h.summary
  }));

  sidebarReportBtn.innerHTML = "<span>⏳</span> Sending...";
  
  try {
    const res = await fetch(`${NODE_API_BASE}/api/email/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: sess.username, 
        email: userEmail,
        stats: { totalLinks, wordsSummarized, readTimeSaved },
        recentLinks 
      }),
    });
    
    if (res.ok) {
      alert("✅ Daily report successfully sent to " + userEmail);
    } else {
      alert("❌ Failed to send report.");
    }
  } catch (e) {
    alert("❌ Error connecting to server.");
  } finally {
    sidebarReportBtn.innerHTML = "<span>📊</span> Email Report";
  }
});

sampleUrlBtn?.addEventListener("click", () => {
  urlInput.value = sampleUrlBtn.innerText;
  urlInput.focus();
});

async function submitUrl() {
  const url = urlInput.value.trim();

  status.className = "text-sm text-slate-400";
  status.innerText = "";

  if (!url) {
    status.className = "text-sm text-red-400";
    status.innerText = "❗ Please enter a valid URL.";
    setPill("Idle", "bg-slate-500");
    return;
  }

  if (!isValidPublicUrl(url)) {
    status.className = "text-sm text-yellow-400";
    status.innerText =
      "⚠️ Public HTTPS websites only. Local files/private networks are blocked.";
    setPill("Invalid URL", "bg-yellow-400");
    return;
  }

  result.classList.add("hidden");
  skeleton.classList.remove("hidden");
  loader.classList.remove("hidden");
  wordCountEl.classList.add("hidden");

  setTab("summary");
  setPill("Analyzing", "bg-teal-400");

  status.className = "text-sm text-slate-300 status-pulse dots";
  status.innerText = "Analyzing";

  try {
    const res = await fetch(`${API_BASE}/enqueue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    jobId = data.jobId;

    status.innerText = data.cached
      ? "⚡ Loading from cache"
      : "🧠 Processing with AI";
    setPill(
      data.cached ? "Cache hit" : "Processing",
      data.cached ? "bg-cyan-300" : "bg-teal-400",
    );

    startPolling(url);
  } catch {
    loader.classList.add("hidden");
    skeleton.classList.add("hidden");
    setPill("Server offline", "bg-red-400");
    status.className = "text-sm text-red-400";
    status.innerText = "❌ Server unavailable.";
  }
}

/* ---------------- POLLING ---------------- */

function startPolling(url) {
  clearInterval(poller);
  poller = setInterval(() => checkStatus(url), 2000);
}

async function checkStatus(url) {
  const res = await fetch(`${API_BASE}/status/${jobId}`);
  const data = await res.json();

  if (data.status === "SUCCESS" || data.status === "FAILED") {
    clearInterval(poller);
    fetchResult(url);
  }
}

/* ---------------- RESULT ---------------- */

async function fetchResult(url) {
  loader.classList.add("hidden");

  const res = await fetch(`${API_BASE}/result/${jobId}`);
  const data = await res.json();

  skeleton.classList.add("hidden");

  if (data.status === "SUCCESS") {
    summary.innerText = data.summary;
    renderTakeaways(data.summary);

    topics.innerHTML = "";

    const words = data.wordCount ?? data.summary.trim().split(/\s+/).length;

    wordCountEl.innerText = `${words} words`;
    wordCountEl.classList.remove("hidden");

    // Stats
    statWords.textContent = String(words);
    statRead.textContent = estimateReadTime(words);

    (data.topics || []).forEach((topic) => {
      const tag = document.createElement("span");
      tag.className =
        "px-3 py-1 rounded-full bg-soft border border-stroke text-xs text-slate-200";
      tag.innerText = topic;
      topics.appendChild(tag);
    });

    addToHistory(data.summary, url);

    result.classList.remove("hidden");
    result.classList.add("reveal");

    setPill("Done", "bg-emerald-400");
    status.className = "text-sm text-emerald-400";
    status.innerText = "✅ Done";
  } else {
    setPill("Failed", "bg-yellow-400");
    status.className = "text-sm text-yellow-400";
    status.innerText =
      "❌ This URL couldn’t be summarized (private/restricted/unsupported). Public HTTPS only.";
  }
}

/* ---------------- ACTIONS ---------------- */

function copySummary() {
  navigator.clipboard.writeText(summary.innerText || "");
  status.className = "text-sm text-accent";
  status.innerText = "📋 Copied to clipboard.";
}

function resetApp() {
  urlInput.value = "";
  result.classList.add("hidden");
  skeleton.classList.add("hidden");
  wordCountEl.classList.add("hidden");
  topics.innerHTML = "";
  status.innerText = "";
  setPill("Idle", "bg-slate-500");
}
