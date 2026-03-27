import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ccfmbcvlmlvirkattqnv.supabase.co";
const SUPABASE_KEY = "sb_publishable_XO9o2kqTKkcnHmGEqCmOoQ_vcNyBGk9";
const TODO_TABLE = "todos";
const PROFILE_TABLE = "profiles";
const PREFERENCES_TABLE = "user_preferences";
const USERNAME_DOMAIN = "users.taskease.app";

const STATUS_PENDING = "pending";
const STATUS_DONE = "done";

const GUEST_KEY = "taskease_todos_guest";
const THEME_KEY = "taskease_theme_mode";
const LANG_KEY = "taskease_lang";
const CLOCK_KEY = "taskease_clock_format";

const TEXT = {
  "zh-CN": {
    appTitle: "TaskEase",
    settings: "设置",
    language: "语言",
    clockFormat: "时间制式",
    h12: "12 小时制",
    h24: "24 小时制",
    logout: "退出登录",
    login: "登录",
    account: "账号",
    register: "注册",
    username: "用户名",
    password: "密码",
    confirmPassword: "确认密码",
    close: "关闭",
    addTask: "添加任务",
    batchSelect: "批量选择",
    save: "保存",
    all: "全部",
    active: "进行中",
    done: "已完成",
    markDone: "标记完成",
    deleteSelected: "删除选中",
    exitBatch: "退出批量",
    noTask: "暂无任务",
    allDone: "🎉🎉🎉 所有任务均已完成！好好休息一下吧！🎉🎉🎉",
    edit: "编辑",
    remove: "删除",
    pendingSummary: "您还有",
    pendingSuffix: "个任务待完成，预计",
    hourUnit: "小时",
    localOnly: "Supabase 未连接，当前仅本地模式。",
    notLoginLocal: "未登录，使用本地模式。",
    syncFallback: "云同步失败，已回退本地。",
    addFallback: "云端添加失败，已写入本地。",
    updateRollback: "更新失败，已回滚。",
    deleteRollback: "删除失败，已回滚。",
    batchUpdateRollback: "批量更新失败，已回滚。",
    batchDeleteRollback: "批量删除失败，已回滚。",
    supabaseMissing: "Supabase 未连接。",
    invalidLogin: "请输入有效用户名和密码。",
    loginFailed: "登录失败，请检查用户名或密码。",
    invalidUsername: "用户名需为 3-32 位字母/数字/下划线。",
    shortPassword: "密码至少 6 位。",
    passwordMismatch: "两次密码不一致。",
    usernameTaken: "用户名已存在。",
    registerFailed: "注册失败",
    registerSuccess: "注册成功。",
    registerNeedEmailCfg: "注册成功，请检查 Supabase 邮箱确认配置。",
    loggedInAs: "已登录用户",
    editPrompt: "编辑任务",
    titlePlaceholder: "任务标题",
    estHours: "预计小时",
    dueAt: "截止时间",
    label: "标签",
    priority: "优先级",
    remark: "备注",
    weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  },
  "zh-TW": {
    appTitle: "TaskEase",
    settings: "設定",
    language: "語言",
    clockFormat: "時間制式",
    h12: "12 小時制",
    h24: "24 小時制",
    logout: "登出",
    login: "登入",
    account: "帳號",
    register: "註冊",
    username: "使用者名稱",
    password: "密碼",
    confirmPassword: "確認密碼",
    close: "關閉",
    addTask: "新增任務",
    batchSelect: "批次選擇",
    save: "儲存",
    all: "全部",
    active: "進行中",
    done: "已完成",
    markDone: "標記完成",
    deleteSelected: "刪除選取",
    exitBatch: "退出批次",
    noTask: "暫無任務",
    allDone: "🎉🎉🎉 所有任務均已完成！好好休息一下吧！🎉🎉🎉",
    edit: "編輯",
    remove: "刪除",
    pendingSummary: "您還有",
    pendingSuffix: "個任務待完成，預計",
    hourUnit: "小時",
    localOnly: "Supabase 未連線，目前僅本地模式。",
    notLoginLocal: "未登入，使用本地模式。",
    syncFallback: "雲同步失敗，已退回本地。",
    addFallback: "雲端新增失敗，已寫入本地。",
    updateRollback: "更新失敗，已回滾。",
    deleteRollback: "刪除失敗，已回滾。",
    batchUpdateRollback: "批次更新失敗，已回滾。",
    batchDeleteRollback: "批次刪除失敗，已回滾。",
    supabaseMissing: "Supabase 未連線。",
    invalidLogin: "請輸入有效使用者名稱與密碼。",
    loginFailed: "登入失敗，請檢查使用者名稱或密碼。",
    invalidUsername: "使用者名稱需為 3-32 位英數與底線。",
    shortPassword: "密碼至少 6 碼。",
    passwordMismatch: "兩次密碼不一致。",
    usernameTaken: "使用者名稱已存在。",
    registerFailed: "註冊失敗",
    registerSuccess: "註冊成功。",
    registerNeedEmailCfg: "註冊成功，請檢查 Supabase 郵件確認設定。",
    loggedInAs: "已登入使用者",
    editPrompt: "編輯任務",
    titlePlaceholder: "任務標題",
    estHours: "預估小時",
    dueAt: "截止時間",
    label: "標籤",
    priority: "優先級",
    remark: "備註",
    weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  },
  en: {
    appTitle: "TaskEase",
    settings: "Settings",
    language: "Language",
    clockFormat: "Clock Format",
    h12: "12-hour",
    h24: "24-hour",
    logout: "Logout",
    login: "Login",
    account: "Account",
    register: "Register",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    close: "Close",
    addTask: "Add Task",
    batchSelect: "Batch Select",
    save: "Save",
    all: "All",
    active: "Active",
    done: "Completed",
    markDone: "Mark Done",
    deleteSelected: "Delete Selected",
    exitBatch: "Exit Batch",
    noTask: "No tasks",
    allDone: "🎉🎉🎉 All tasks are completed! Take a good break! 🎉🎉🎉",
    edit: "Edit",
    remove: "Delete",
    pendingSummary: "You still have",
    pendingSuffix: "tasks pending, estimated",
    hourUnit: "hours",
    localOnly: "Supabase unavailable. Local mode only.",
    notLoginLocal: "Not logged in, using local mode.",
    syncFallback: "Cloud sync failed. Falling back to local.",
    addFallback: "Cloud add failed. Saved locally.",
    updateRollback: "Update failed and rolled back.",
    deleteRollback: "Delete failed and rolled back.",
    batchUpdateRollback: "Batch update failed and rolled back.",
    batchDeleteRollback: "Batch delete failed and rolled back.",
    supabaseMissing: "Supabase unavailable.",
    invalidLogin: "Please enter a valid username and password.",
    loginFailed: "Login failed. Check username/password.",
    invalidUsername: "Username must be 3-32 chars: a-z, 0-9, _.",
    shortPassword: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    usernameTaken: "Username already exists.",
    registerFailed: "Registration failed",
    registerSuccess: "Registration successful.",
    registerNeedEmailCfg: "Registered. Check Supabase email confirmation settings.",
    loggedInAs: "Logged in as",
    editPrompt: "Edit task",
    titlePlaceholder: "Task title",
    estHours: "Estimated hours",
    dueAt: "Due time",
    label: "Label",
    priority: "Priority",
    remark: "Remark",
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
};

const supabase = buildSupabaseClient();

function buildSupabaseClient() {
  const valid = /^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL.trim()) && SUPABASE_KEY.trim();
  if (!valid) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch {
    return null;
  }
}

function normalizeUsername(name) {
  return String(name || "").trim().toLowerCase();
}

function isValidUsername(name) {
  return /^[a-z0-9_]{3,32}$/.test(name);
}

function usernameToEmail(name) {
  return `${name}@${USERNAME_DOMAIN}`;
}

function readLocalTodos(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalTodos(key, todos) {
  localStorage.setItem(key, JSON.stringify(todos));
}

function mapTodo(row) {
  const status = row.status ?? (row.completed ? STATUS_DONE : STATUS_PENDING);
  return {
    id: row.id,
    title: row.title || "",
    status,
    estimated_hours: Number(row.estimated_hours ?? 0),
    ddl: row.ddl ?? null,
    remark: row.remark ?? "",
    priority: Number(row.priority ?? 0),
    label: row.label ?? "",
    user_id: row.user_id,
    created_at: row.created_at,
  };
}

function getClockParts(now, lang, hourFormat) {
  const locale = lang === "en" ? "en-US" : lang;
  const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const weekday = TEXT[lang].weekdays[now.getDay()];
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: hourFormat === "12h",
  }).format(now);
  return { date, weekday, time };
}

export default function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "zh-CN" || saved === "zh-TW" || saved === "en") return saved;
    return "zh-CN";
  });
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });
  const [clockFormat, setClockFormat] = useState(() => {
    const saved = localStorage.getItem(CLOCK_KEY);
    return saved === "12h" || saved === "24h" ? saved : "24h";
  });

  const [resolvedTheme, setResolvedTheme] = useState("light");
  const [now, setNow] = useState(() => new Date());

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState("login");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  const [notice, setNotice] = useState({ text: "", warning: false });

  const [batchMode, setBatchMode] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [draft, setDraft] = useState({
    title: "",
    estimated_hours: "0.5",
    ddl: "",
    label: "",
    priority: "0",
    remark: "",
  });

  const [todos, setTodos] = useState([]);

  const t = TEXT[lang];
  const storageKey = user ? `taskease_todos_${user.id}` : GUEST_KEY;

  const pageBg = resolvedTheme === "dark" ? "#1e2636" : "#efe3cb";
  const panelBg = resolvedTheme === "dark" ? "#2a3447" : "#f8eede";
  const listBg = resolvedTheme === "dark" ? "#334159" : "#faefdf";
  const logoColor = resolvedTheme === "dark" ? "#f8e7c4" : "#6b4f2f";

  function notify(text, warning = true) {
    setNotice({ text, warning });
    window.setTimeout(() => {
      setNotice((prev) => (prev.text === text ? { text: "", warning: false } : prev));
    }, 4500);
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function resolve(mode) {
      if (mode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return mode;
    }

    const next = resolve(themeMode);
    setResolvedTheme(next);
    document.documentElement.setAttribute("data-bs-theme", next);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(CLOCK_KEY, clockFormat);
  }, [clockFormat]);

  useEffect(() => {
    if (themeMode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = media.matches ? "dark" : "light";
      setResolvedTheme(next);
      document.documentElement.setAttribute("data-bs-theme", next);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [themeMode]);

  useEffect(() => {
    const onDown = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!supabase) {
      notify(t.localOnly, true);
      setTodos(readLocalTodos(storageKey));
      return;
    }

    let mounted = true;

    async function initSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      const current = session?.user ?? null;
      setUser(current);
      if (!current) {
        setUsername("");
        notify(t.notLoginLocal, true);
        setTodos(readLocalTodos(GUEST_KEY));
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const current = session?.user ?? null;
      setUser(current);
      setSelectedIds(new Set());
      setBatchMode(false);

      if (!current) {
        setUsername("");
        setTodos(readLocalTodos(GUEST_KEY));
        notify(t.notLoginLocal, true);
        return;
      }

      const foundName = await loadOrCreateUsername(current);
      setUsername(foundName);
      await loadPreferences(current.id);
      const nextTodos = await loadTodosForUser(current.id);
      setTodos(nextTodos);
      writeLocalTodos(`taskease_todos_${current.id}`, nextTodos);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [t.localOnly, t.notLoginLocal]);

  useEffect(() => {
    if (!user) return;
    loadTodosForUser(user.id).then((data) => {
      setTodos(data);
      writeLocalTodos(storageKey, data);
    });
  }, [user]);

  useEffect(() => {
    if (!supabase || !user) return;
    savePreferences(user.id, {
      language: lang,
      clock_format: clockFormat,
      theme_mode: themeMode,
    });
  }, [user, lang, clockFormat, themeMode]);

  const visibleTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filter === "active") return todo.status !== STATUS_DONE;
      if (filter === "done") return todo.status === STATUS_DONE;
      return true;
    });
  }, [todos, filter]);

  const pendingTodos = useMemo(() => todos.filter((item) => item.status !== STATUS_DONE), [todos]);

  const estimateHours = useMemo(() => {
    const sum = pendingTodos.reduce((acc, item) => acc + Number(item.estimated_hours || 0), 0);
    return Number.isFinite(sum) ? sum.toFixed(1) : "0.0";
  }, [pendingTodos]);

  const clock = getClockParts(now, lang, clockFormat);

  function yellowButtonStyle(active) {
    return {
      backgroundColor: active ? "#e0ae1c" : "#f2c84b",
      color: "#2b2b2b",
      borderColor: active ? "#d39d0c" : "#e9bd34",
    };
  }

  async function loadTodosForUser(userId) {
    if (!supabase || !userId) return readLocalTodos(GUEST_KEY);

    const { data, error } = await supabase
      .from(TODO_TABLE)
      .select("id,title,status,completed,estimated_hours,ddl,remark,priority,label,created_at,user_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      notify(`${t.syncFallback} ${error.message || ""}`.trim(), true);
      return readLocalTodos(`taskease_todos_${userId}`);
    }

    return (Array.isArray(data) ? data : []).map(mapTodo);
  }

  async function loadPreferences(userId) {
    const { data } = await supabase
      .from(PREFERENCES_TABLE)
      .select("language,clock_format,theme_mode")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return;
    if (data.language && (data.language === "zh-CN" || data.language === "zh-TW" || data.language === "en")) setLang(data.language);
    if (data.clock_format && (data.clock_format === "12h" || data.clock_format === "24h")) setClockFormat(data.clock_format);
    if (data.theme_mode && (data.theme_mode === "light" || data.theme_mode === "dark" || data.theme_mode === "system")) setThemeMode(data.theme_mode);
  }

  async function savePreferences(userId, prefs) {
    await supabase.from(PREFERENCES_TABLE).upsert(
      {
        user_id: userId,
        ...prefs,
      },
      { onConflict: "user_id" },
    );
  }

  async function loadOrCreateUsername(currentUser) {
    const { data } = await supabase
      .from(PROFILE_TABLE)
      .select("username")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (data?.username) return data.username;

    const fallback = normalizeUsername(String(currentUser.email || "").split("@")[0]) || "user";
    await ensureProfile(currentUser.id, fallback);
    return fallback;
  }

  async function ensureProfile(userId, name) {
    await supabase.from(PROFILE_TABLE).upsert(
      {
        user_id: userId,
        username: name,
      },
      { onConflict: "user_id" },
    );
  }

  async function isUsernameTaken(name) {
    const { data, error } = await supabase.from(PROFILE_TABLE).select("id").eq("username", name).limit(1);
    if (error) return false;
    return Array.isArray(data) && data.length > 0;
  }

  function syncLocal(nextTodos) {
    writeLocalTodos(storageKey, nextTodos);
  }

  function resetDraft() {
    setDraft({
      title: "",
      estimated_hours: "0.5",
      ddl: "",
      label: "",
      priority: "0",
      remark: "",
    });
  }

  async function handleAddTask(event) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      notify(t.emptyTitle, true);
      return;
    }

    const payload = {
      id: crypto.randomUUID(),
      title,
      status: STATUS_PENDING,
      estimated_hours: Number(draft.estimated_hours || 0),
      ddl: draft.ddl ? new Date(draft.ddl).toISOString() : null,
      remark: draft.remark || null,
      priority: Math.max(0, Math.min(10, Number(draft.priority || 0))),
      label: draft.label || null,
      created_at: new Date().toISOString(),
    };

    if (supabase && user) {
      const { data, error } = await supabase
        .from(TODO_TABLE)
        .insert(payload)
        .select("id,title,status,estimated_hours,ddl,remark,priority,label,created_at,user_id")
        .single();

      if (!error && data) {
        const next = [mapTodo(data), ...todos];
        setTodos(next);
        syncLocal(next);
        resetDraft();
        setIsAddModalOpen(false);
        return;
      }

      notify(`${t.addFallback} ${error?.message || ""}`.trim(), true);
    }

    const next = [mapTodo(payload), ...todos];
    setTodos(next);
    syncLocal(next);
    resetDraft();
    setIsAddModalOpen(false);
  }

  async function updateTodo(id, patch) {
    const previous = todos;
    const next = todos.map((item) => (item.id === id ? { ...item, ...patch } : item));
    setTodos(next);

    if (supabase && user) {
      const { error } = await supabase.from(TODO_TABLE).update(patch).eq("id", id).eq("user_id", user.id);
      if (error) {
        setTodos(previous);
        notify(`${t.updateRollback} ${error.message || ""}`.trim(), true);
        return;
      }
    }

    syncLocal(next);
  }

  async function handleDelete(id) {
    const previous = todos;
    const next = todos.filter((item) => item.id !== id);
    setTodos(next);

    if (supabase && user) {
      const { error } = await supabase.from(TODO_TABLE).delete().eq("id", id).eq("user_id", user.id);
      if (error) {
        setTodos(previous);
        notify(`${t.deleteRollback} ${error.message || ""}`.trim(), true);
        return;
      }
    }

    syncLocal(next);
  }

  async function handleBatchDone() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      notify(t.batchUpdateRollback, true);
      return;
    }

    const previous = todos;
    const selected = new Set(ids);
    const next = todos.map((item) => (selected.has(item.id) ? { ...item, status: STATUS_DONE } : item));
    setTodos(next);

    if (supabase && user) {
      const { error } = await supabase.from(TODO_TABLE).update({ status: STATUS_DONE }).in("id", ids).eq("user_id", user.id);
      if (error) {
        setTodos(previous);
        notify(`${t.batchUpdateRollback} ${error.message || ""}`.trim(), true);
        return;
      }
    }

    setSelectedIds(new Set());
    syncLocal(next);
  }

  async function handleBatchDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      notify(t.batchDeleteRollback, true);
      return;
    }

    const previous = todos;
    const selected = new Set(ids);
    const next = todos.filter((item) => !selected.has(item.id));
    setTodos(next);

    if (supabase && user) {
      const { error } = await supabase.from(TODO_TABLE).delete().in("id", ids).eq("user_id", user.id);
      if (error) {
        setTodos(previous);
        notify(`${t.batchDeleteRollback} ${error.message || ""}`.trim(), true);
        return;
      }
    }

    setSelectedIds(new Set());
    syncLocal(next);
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!supabase) {
      notify(t.supabaseMissing, true);
      return;
    }

    const uname = normalizeUsername(loginUsername);
    if (!isValidUsername(uname) || loginPassword.length < 6) {
      notify(t.invalidLogin, true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(uname),
      password: loginPassword,
    });

    if (error) {
      notify(`${t.loginFailed}: ${error.message}`, true);
      return;
    }

    setIsAuthModalOpen(false);
    setLoginPassword("");
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (!supabase) {
      notify(t.supabaseMissing, true);
      return;
    }

    const uname = normalizeUsername(registerUsername);
    if (!isValidUsername(uname)) {
      notify(t.invalidUsername, true);
      return;
    }

    if (registerPassword.length < 6) {
      notify(t.shortPassword, true);
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      notify(t.passwordMismatch, true);
      return;
    }

    if (await isUsernameTaken(uname)) {
      notify(t.usernameTaken, true);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(uname),
      password: registerPassword,
    });

    if (error) {
      notify(`${t.registerFailed}: ${error.message}`, true);
      return;
    }

    if (data.user) {
      await ensureProfile(data.user.id, uname);
      notify(t.registerSuccess, false);
      setIsAuthModalOpen(false);
      return;
    }

    notify(t.registerNeedEmailCfg, true);
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsAuthModalOpen(false);
    setIsSettingsOpen(false);
  }

  return (
    <main className="container-fluid py-3" style={{ backgroundColor: pageBg, minHeight: "100vh" }}>
      <div className="mx-auto" style={{ maxWidth: "1120px" }}>
        {notice.text ? (
          <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 1080, minWidth: "360px", maxWidth: "88vw" }}>
            <div className={`alert ${notice.warning ? "alert-danger" : "alert-success"} shadow-sm py-2 mb-0 d-flex justify-content-between align-items-center`}>
              <span>{notice.text}</span>
              <button className="btn-close ms-2" type="button" onClick={() => setNotice({ text: "", warning: false })} aria-label="close" />
            </div>
          </div>
        ) : null}

        <header className="d-flex justify-content-between align-items-center mb-3">
          <div className="fw-semibold fs-4" style={{ fontFamily: "Manrope, Noto Sans SC, sans-serif", color: logoColor }}>
            TaskEase
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="btn-group" role="group" aria-label="Theme">
              <button className={`btn btn-outline-secondary ${themeMode === "light" ? "active" : ""}`} type="button" onClick={() => setThemeMode("light")} title={t.h24}>
                <i className="bi bi-sun-fill" />
              </button>
              <button className={`btn btn-outline-secondary ${themeMode === "dark" ? "active" : ""}`} type="button" onClick={() => setThemeMode("dark")} title={t.h12}>
                <i className="bi bi-moon-stars-fill" />
              </button>
              <button className={`btn btn-outline-secondary ${themeMode === "system" ? "active" : ""}`} type="button" onClick={() => setThemeMode("system")} title="System">
                <i className="bi bi-circle-half" />
              </button>
            </div>

            <div className="position-relative" ref={settingsRef}>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setIsSettingsOpen((v) => !v)} title={t.settings}>
                <i className="bi bi-gear-fill" />
              </button>
              {isSettingsOpen ? (
                <div className="dropdown-menu show mt-2 p-3 shadow" style={{ width: "280px", right: 0, left: "auto" }}>
                  <div className="d-grid gap-3">
                    <div>
                      <div className="small text-body-secondary mb-1">{t.language}</div>
                      <select className="form-select form-select-sm" value={lang} onChange={(e) => setLang(e.target.value)}>
                        <option value="zh-CN">简体中文</option>
                        <option value="zh-TW">繁體中文</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <div className="small text-body-secondary mb-1">{t.clockFormat}</div>
                      <select className="form-select form-select-sm" value={clockFormat} onChange={(e) => setClockFormat(e.target.value)}>
                        <option value="24h">{t.h24}</option>
                        <option value="12h">{t.h12}</option>
                      </select>
                    </div>

                    {user ? (
                      <button className="btn btn-outline-danger btn-sm" type="button" onClick={handleLogout}>
                        {t.logout}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              className="btn btn-warning text-dark"
              type="button"
              onClick={() => {
                setIsAuthModalOpen(true);
                setActiveAuthTab(user ? "account" : "login");
              }}
            >
              {user ? username : t.login}
            </button>
          </div>
        </header>

        <section className="card border-0 shadow-sm" style={{ backgroundColor: panelBg }}>
          <div className="card-body p-4 d-grid gap-3">
            <div className="text-center">
              <div className="display-6 fw-semibold">{clock.date} {clock.weekday}</div>
              <div className="display-4 fw-bold mt-1">{clock.time}</div>
              <div className="small text-body-secondary mt-2">
                {t.pendingSummary} {pendingTodos.length} {t.pendingSuffix} {estimateHours} {t.hourUnit}
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="btn-group" role="tablist" aria-label="filters">
                <button className="btn btn-sm" style={yellowButtonStyle(filter === "all")} type="button" onClick={() => setFilter("all")}>{t.all}</button>
                <button className="btn btn-sm" style={yellowButtonStyle(filter === "active")} type="button" onClick={() => setFilter("active")}>{t.active}</button>
                <button className="btn btn-sm" style={yellowButtonStyle(filter === "done")} type="button" onClick={() => setFilter("done")}>{t.done}</button>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-success" type="button" onClick={() => setIsAddModalOpen(true)}>
                  <i className="bi bi-plus-lg me-1" /> {t.addTask}
                </button>
                <button className="btn btn-primary" type="button" onClick={() => {
                  setBatchMode((v) => !v);
                  setSelectedIds(new Set());
                }}>
                  <i className="bi bi-check2-square me-1" /> {t.batchSelect}
                </button>
              </div>
            </div>

            {batchMode ? (
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-warning text-dark" type="button" onClick={handleBatchDone}>{t.markDone}</button>
                <button className="btn btn-danger" type="button" onClick={handleBatchDelete}>{t.deleteSelected}</button>
                <button className="btn btn-outline-secondary" type="button" onClick={() => {
                  setBatchMode(false);
                  setSelectedIds(new Set());
                }}>{t.exitBatch}</button>
              </div>
            ) : null}

            <div className="p-2 rounded-3" style={{ backgroundColor: listBg }}>
              <ul className="list-group">
                {visibleTodos.length === 0 ? (
                  <li className="list-group-item text-center" style={{ backgroundColor: listBg }}>
                    {pendingTodos.length === 0 ? t.allDone : t.noTask}
                  </li>
                ) : null}

                {visibleTodos.map((todo) => (
                  <li key={todo.id} className="list-group-item d-flex flex-wrap align-items-start gap-2" style={{ backgroundColor: listBg }}>
                    <input
                      className="form-check-input mt-1"
                      type="checkbox"
                      checked={todo.status === STATUS_DONE}
                      onChange={(e) => updateTodo(todo.id, { status: e.target.checked ? STATUS_DONE : STATUS_PENDING })}
                    />

                    {batchMode ? (
                      <input
                        className="form-check-input mt-1"
                        type="checkbox"
                        checked={selectedIds.has(todo.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          if (e.target.checked) next.add(todo.id);
                          else next.delete(todo.id);
                          setSelectedIds(next);
                        }}
                      />
                    ) : null}

                    <div className="flex-grow-1">
                      <div className={`${todo.status === STATUS_DONE ? "text-decoration-line-through text-body-secondary" : ""}`}>{todo.title}</div>
                      <div className="small text-body-secondary mt-1 d-flex flex-wrap gap-2">
                        <span>{t.estHours}: {Number(todo.estimated_hours || 0).toFixed(1)}</span>
                        {todo.ddl ? <span>{t.dueAt}: {new Date(todo.ddl).toLocaleString()}</span> : null}
                        {todo.priority > 0 ? <span>{t.priority}: {todo.priority}</span> : null}
                        {todo.label ? <span className="badge text-bg-secondary">{todo.label}</span> : null}
                      </div>
                      {todo.remark ? <div className="small mt-1">{todo.remark}</div> : null}
                    </div>

                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-warning text-dark" type="button" onClick={async () => {
                        const title = window.prompt(t.editPrompt, todo.title)?.trim();
                        if (!title || title === todo.title) return;
                        await updateTodo(todo.id, { title });
                      }}>{t.edit}</button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(todo.id)}>{t.remove}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {isAuthModalOpen ? (
        <div className="modal d-block" tabIndex="-1" onClick={(e) => {
          if (e.target.classList.contains("modal")) setIsAuthModalOpen(false);
        }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ backgroundColor: pageBg }}>
              <div className="modal-header">
                <h2 className="modal-title fs-6">{t.account}</h2>
                <button type="button" className="btn-close" aria-label={t.close} onClick={() => setIsAuthModalOpen(false)} />
              </div>
              <div className="modal-body">
                {user ? (
                  <div className="text-body-secondary">{t.loggedInAs}: {username}</div>
                ) : (
                  <>
                    <div className="btn-group w-100 mb-3">
                      <button className={`btn ${activeAuthTab === "login" ? "btn-primary" : "btn-outline-primary"}`} type="button" onClick={() => setActiveAuthTab("login")}>{t.login}</button>
                      <button className={`btn ${activeAuthTab === "register" ? "btn-primary" : "btn-outline-primary"}`} type="button" onClick={() => setActiveAuthTab("register")}>{t.register}</button>
                    </div>

                    {activeAuthTab === "login" ? (
                      <form className="d-grid gap-2" onSubmit={handleLogin}>
                        <input className="form-control" type="text" maxLength={32} placeholder={t.username} value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
                        <input className="form-control" type="password" minLength={6} placeholder={t.password} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                        <button className="btn btn-warning text-dark" type="submit">{t.login}</button>
                      </form>
                    ) : (
                      <form className="d-grid gap-2" onSubmit={handleRegister}>
                        <input className="form-control" type="text" maxLength={32} placeholder={t.username} value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required />
                        <input className="form-control" type="password" minLength={6} placeholder={t.password} value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required />
                        <input className="form-control" type="password" minLength={6} placeholder={t.confirmPassword} value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} required />
                        <button className="btn btn-warning text-dark" type="submit">{t.register}</button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div className="modal d-block" tabIndex="-1" onClick={(e) => {
          if (e.target.classList.contains("modal")) setIsAddModalOpen(false);
        }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ backgroundColor: pageBg }}>
              <div className="modal-header">
                <h2 className="modal-title fs-6">{t.addTask}</h2>
                <button type="button" className="btn-close" aria-label={t.close} onClick={() => setIsAddModalOpen(false)} />
              </div>
              <div className="modal-body">
                <form className="row g-2" onSubmit={handleAddTask}>
                  <div className="col-12 col-lg-4">
                    <input className="form-control" type="text" placeholder={t.titlePlaceholder} value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="col-6 col-lg-2">
                    <input className="form-control" type="number" step="0.1" min="0" placeholder={t.estHours} value={draft.estimated_hours} onChange={(e) => setDraft((p) => ({ ...p, estimated_hours: e.target.value }))} />
                  </div>
                  <div className="col-6 col-lg-3">
                    <input className="form-control" type="datetime-local" value={draft.ddl} onChange={(e) => setDraft((p) => ({ ...p, ddl: e.target.value }))} />
                  </div>
                  <div className="col-6 col-lg-1">
                    <input className="form-control" type="number" min="0" max="10" placeholder={t.priority} value={draft.priority} onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))} />
                  </div>
                  <div className="col-6 col-lg-2">
                    <input className="form-control" type="text" placeholder={t.label} value={draft.label} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <textarea className="form-control" rows="2" placeholder={t.remark} value={draft.remark} onChange={(e) => setDraft((p) => ({ ...p, remark: e.target.value }))} />
                  </div>
                  <div className="col-12 d-flex gap-2 justify-content-end">
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setIsAddModalOpen(false)}>{t.close}</button>
                    <button className="btn btn-warning text-dark" type="submit">{t.save}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
