"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  name: string;
  email: string;
  password: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  due: string;
  completed: boolean;
  updatedAt: string;
};

type SearchCacheEntry = {
  signature: string;
  results: Task[];
};

type TaskStore = Record<string, Task[]>;

type AuthMode = "login" | "signup" | "forgot";

type AuthFormState = {
  name: string;
  email: string;
  password: string;
};

type TaskFormState = {
  title: string;
  description: string;
  due: string;
};

const STORAGE_KEYS = {
  users: "pastel-todo-users",
  tasks: "pastel-todo-tasks",
  session: "pastel-todo-session",
};

const emptyAuthForm: AuthFormState = {
  name: "",
  email: "",
  password: "",
};

const emptyTaskForm: TaskFormState = {
  title: "",
  description: "",
  due: "",
};

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Failed to parse cached data", error);
    return fallback;
  }
};

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState<AuthFormState>(emptyAuthForm);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMessage, setAuthMessage] = useState<string>("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchCache, setSearchCache] = useState<Record<string, SearchCacheEntry>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUsers = safeParse<User[]>(
      localStorage.getItem(STORAGE_KEYS.users),
      []
    );
    const storedSession = safeParse<User | null>(
      localStorage.getItem(STORAGE_KEYS.session),
      null
    );
    setUsers(storedUsers);
    if (storedSession) {
      setCurrentUser(storedSession);
      setAuthMode("login");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!currentUser) return;
    const storedTasks = safeParse<TaskStore>(
      localStorage.getItem(STORAGE_KEYS.tasks),
      {}
    );
    setTasks(storedTasks[currentUser.email] ?? []);
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!currentUser) return;
    const storedTasks = safeParse<TaskStore>(
      localStorage.getItem(STORAGE_KEYS.tasks),
      {}
    );
    storedTasks[currentUser.email] = tasks;
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(storedTasks));
  }, [tasks, currentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
  }, [currentUser]);

  const tasksSignature = useMemo(
    () => tasks.map((task) => `${task.id}:${task.updatedAt}`).join("|"),
    [tasks]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const cacheKey = `${currentUser?.email ?? "guest"}:${normalizedQuery}`;
  const cachedEntry = searchCache[cacheKey];
  const cacheHit =
    normalizedQuery.length > 0 && cachedEntry?.signature === tasksSignature;

  const filteredTasks = useMemo(() => {
    if (normalizedQuery.length === 0) return tasks;
    if (cachedEntry && cachedEntry.signature === tasksSignature) {
      return cachedEntry.results;
    }
    return tasks.filter((task) => {
      const content = `${task.title} ${task.description}`.toLowerCase();
      return content.includes(normalizedQuery);
    });
  }, [cachedEntry, normalizedQuery, tasks, tasksSignature]);

  useEffect(() => {
    if (!normalizedQuery) return;
    setSearchCache((previous) => ({
      ...previous,
      [cacheKey]: {
        signature: tasksSignature,
        results: filteredTasks,
      },
    }));
  }, [cacheKey, filteredTasks, normalizedQuery, tasksSignature]);

  const handleAuthInputChange = (field: keyof AuthFormState, value: string) => {
    setAuthForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleTaskInputChange = (field: keyof TaskFormState, value: string) => {
    setTaskForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetAuthForm = () => {
    setAuthForm(emptyAuthForm);
  };

  const handleSignup = () => {
    const trimmedName = authForm.name.trim();
    const trimmedEmail = authForm.email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail || !authForm.password) {
      setAuthMessage("Please complete all fields to create your account.");
      return;
    }
    if (users.some((user) => user.email === trimmedEmail)) {
      setAuthMessage("An account with this email already exists.");
      return;
    }
    const newUser = {
      name: trimmedName,
      email: trimmedEmail,
      password: authForm.password,
    };
    setUsers((previous) => [...previous, newUser]);
    setCurrentUser(newUser);
    setAuthMessage("Welcome aboard! Your account is ready.");
    resetAuthForm();
  };

  const handleLogin = () => {
    const trimmedEmail = authForm.email.trim().toLowerCase();
    const matchingUser = users.find(
      (user) => user.email === trimmedEmail && user.password === authForm.password
    );
    if (!matchingUser) {
      setAuthMessage("We couldn't verify those credentials. Try again.");
      return;
    }
    setCurrentUser(matchingUser);
    setAuthMessage("You're signed in. Let's focus on your tasks.");
    resetAuthForm();
  };

  const handleForgotPassword = () => {
    const trimmedEmail = authForm.email.trim().toLowerCase();
    if (!trimmedEmail) {
      setAuthMessage("Enter your email so we can help you reset access.");
      return;
    }
    if (!users.some((user) => user.email === trimmedEmail)) {
      setAuthMessage("We don't have an account for that email yet.");
      return;
    }
    setAuthMessage(
      "Password recovery is queued. Check your inbox for next steps."
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTasks([]);
    setTaskForm(emptyTaskForm);
    setEditingTaskId(null);
    setSearchQuery("");
    setAuthMode("login");
  };

  const handleAddTask = () => {
    const trimmedTitle = taskForm.title.trim();
    if (!trimmedTitle) return;
    const now = new Date().toISOString();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      description: taskForm.description.trim(),
      due: taskForm.due,
      completed: false,
      updatedAt: now,
    };
    setTasks((previous) => [newTask, ...previous]);
    setTaskForm(emptyTaskForm);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              updatedAt: new Date().toISOString(),
            }
          : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((previous) => previous.filter((task) => task.id !== taskId));
  };

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description,
      due: task.due,
    });
  };

  const handleEditCancel = () => {
    setEditingTaskId(null);
    setTaskForm(emptyTaskForm);
  };

  const handleEditSave = () => {
    if (!editingTaskId) return;
    const trimmedTitle = taskForm.title.trim();
    if (!trimmedTitle) return;
    setTasks((previous) =>
      previous.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: trimmedTitle,
              description: taskForm.description.trim(),
              due: taskForm.due,
              updatedAt: new Date().toISOString(),
            }
          : task
      )
    );
    setEditingTaskId(null);
    setTaskForm(emptyTaskForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#efeaff] via-[#cfeee7] to-[#ffd9cc] text-[#2e2a3a]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:items-start">
        <section className="flex-1 rounded-[32px] border border-white/60 bg-white/65 p-8 shadow-[0_20px_60px_-35px_rgba(46,42,58,0.45)] backdrop-blur">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#2e2a3a]/60">
                Pastel todo studio
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight">
                Plan softly. Deliver beautifully.
              </h1>
              <p className="mt-3 text-base text-[#2e2a3a]/70">
                A calm, production-ready todo experience with secure sign-in,
                intelligent search caching, and delightful task management.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Auth-ready",
                  detail: "Login, sign up, and recover access in seconds.",
                },
                {
                  title: "Search cache",
                  detail: "Instant results stored locally for quick reuse.",
                },
                {
                  title: "Task flows",
                  detail: "Create, edit, complete, and delete with ease.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white/70 p-4 text-sm text-[#2e2a3a]/70"
                >
                  <p className="text-base font-semibold text-[#2e2a3a]">
                    {item.title}
                  </p>
                  <p className="mt-2">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/70 p-5">
              <h2 className="text-lg font-semibold">Why it feels effortless</h2>
              <ul className="mt-3 space-y-2 text-sm text-[#2e2a3a]/70">
                <li>• Lightweight local caching keeps search silky smooth.</li>
                <li>• All task changes are safely stored on your device.</li>
                <li>• Pastel palette keeps attention on what matters.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="flex w-full flex-1 flex-col gap-6">
          <div className="rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-[0_20px_60px_-35px_rgba(46,42,58,0.35)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  {currentUser
                    ? `Welcome back, ${currentUser.name.split(" ")[0]}!`
                    : "Sign in to your space"}
                </h2>
                <p className="mt-1 text-sm text-[#2e2a3a]/70">
                  {currentUser
                    ? "Track your tasks, stay focused, and keep momentum."
                    : "Create an account or log in to manage your tasks."}
                </p>
              </div>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-[#2e2a3a]/20 bg-white px-4 py-2 text-sm font-medium text-[#2e2a3a] transition hover:border-transparent hover:bg-[#2e2a3a]/10"
                  type="button"
                >
                  Log out
                </button>
              )}
            </div>

            {!currentUser && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {([
                    { label: "Login", mode: "login" },
                    { label: "Sign up", mode: "signup" },
                    { label: "Forgot password", mode: "forgot" },
                  ] as const).map((tab) => (
                    <button
                      key={tab.mode}
                      type="button"
                      onClick={() => {
                        setAuthMode(tab.mode);
                        setAuthMessage("");
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        authMode === tab.mode
                          ? "bg-[#2e2a3a] text-white"
                          : "bg-white text-[#2e2a3a] hover:bg-[#2e2a3a]/10"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-4">
                  {authMode === "signup" && (
                    <label className="text-sm font-medium">
                      Full name
                      <input
                        type="text"
                        value={authForm.name}
                        onChange={(event) =>
                          handleAuthInputChange("name", event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm outline-none ring-1 ring-[#2e2a3a]/10 focus:ring-2"
                        placeholder="Add your name"
                      />
                    </label>
                  )}
                  <label className="text-sm font-medium">
                    Email address
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) =>
                        handleAuthInputChange("email", event.target.value)
                      }
                      className="mt-2 w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm outline-none ring-1 ring-[#2e2a3a]/10 focus:ring-2"
                      placeholder="you@studio.com"
                    />
                  </label>
                  {authMode !== "forgot" && (
                    <label className="text-sm font-medium">
                      Password
                      <input
                        type="password"
                        value={authForm.password}
                        onChange={(event) =>
                          handleAuthInputChange("password", event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm outline-none ring-1 ring-[#2e2a3a]/10 focus:ring-2"
                        placeholder="Create a password"
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (authMode === "signup") handleSignup();
                      if (authMode === "login") handleLogin();
                      if (authMode === "forgot") handleForgotPassword();
                    }}
                    className="rounded-2xl bg-[#2e2a3a] px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
                  >
                    {authMode === "signup"
                      ? "Create account"
                      : authMode === "login"
                      ? "Sign in"
                      : "Send reset link"}
                  </button>

                  {authMessage && (
                    <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-[#2e2a3a]/80">
                      {authMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser && (
            <div className="rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-[0_20px_60px_-35px_rgba(46,42,58,0.35)] backdrop-blur">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Your tasks</h3>
                    <p className="text-sm text-[#2e2a3a]/70">
                      {tasks.length} total • {tasks.filter((t) => t.completed).length}
                      completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs text-[#2e2a3a]/70">
                    <span className="h-2 w-2 rounded-full bg-[#2e2a3a]/50" />
                    {cacheHit ? "Cached search" : "Live search"}
                  </div>
                </div>

                <div className="grid gap-3 rounded-3xl border border-white/70 bg-white/80 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium">
                      Task title
                      <input
                        type="text"
                        value={taskForm.title}
                        onChange={(event) =>
                          handleTaskInputChange("title", event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm outline-none ring-1 ring-[#2e2a3a]/10 focus:ring-2"
                        placeholder="e.g. Draft release notes"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Due date
                      <input
                        type="date"
                        value={taskForm.due}
                        onChange={(event) =>
                          handleTaskInputChange("due", event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm outline-none ring-1 ring-[#2e2a3a]/10 focus:ring-2"
                      />
                    </label>
                  </div>
                  <label className="text-sm font-medium">
                    Description
                    <textarea
                      value={taskForm.description}
                      onChange={(event) =>
                        handleTaskInputChange("description", event.target.value)
                      }
                      className="mt-2 min-h-[90px] w-full resize-none rounded-2xl border border-transparent bg-white px-4 py-3 text-sm outline-none ring-1 ring-[#2e2a3a]/10 focus:ring-2"
                      placeholder="Add more details (optional)"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    {editingTaskId ? (
                      <>
                        <button
                          type="button"
                          onClick={handleEditSave}
                          className="rounded-full bg-[#2e2a3a] px-5 py-2 text-sm font-semibold text-white"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={handleEditCancel}
                          className="rounded-full border border-[#2e2a3a]/20 bg-white px-5 py-2 text-sm font-semibold text-[#2e2a3a]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddTask}
                        className="rounded-full bg-[#2e2a3a] px-5 py-2 text-sm font-semibold text-white"
                      >
                        Add task
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium">
                    Search tasks
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-transparent bg-white/90 px-4 py-3 text-sm outline-none ring-1 ring-[#2e2a3a]/10 focus:ring-2"
                      placeholder="Search by title or description"
                    />
                  </label>

                  <div className="grid gap-3">
                    {filteredTasks.length === 0 ? (
                      <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-[#2e2a3a]/70">
                        No tasks match that search yet.
                      </p>
                    ) : (
                      filteredTasks.map((task) => (
                        <article
                          key={task.id}
                          className="rounded-3xl border border-white/70 bg-white/90 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`h-5 w-5 rounded-full border transition ${
                                    task.completed
                                      ? "border-[#2e2a3a] bg-[#2e2a3a]"
                                      : "border-[#2e2a3a]/30 bg-white"
                                  }`}
                                  aria-label={
                                    task.completed
                                      ? "Mark task incomplete"
                                      : "Mark task complete"
                                  }
                                />
                                <h4
                                  className={`text-base font-semibold ${
                                    task.completed
                                      ? "text-[#2e2a3a]/40 line-through"
                                      : "text-[#2e2a3a]"
                                  }`}
                                >
                                  {task.title}
                                </h4>
                              </div>
                              {task.description && (
                                <p className="mt-2 text-sm text-[#2e2a3a]/70">
                                  {task.description}
                                </p>
                              )}
                              <p className="mt-2 text-xs text-[#2e2a3a]/50">
                                {task.due
                                  ? `Due ${new Date(task.due).toLocaleDateString()}`
                                  : "No due date"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditStart(task)}
                                className="rounded-full border border-[#2e2a3a]/20 bg-white px-3 py-1 text-xs font-semibold text-[#2e2a3a]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="rounded-full border border-[#2e2a3a]/20 bg-white px-3 py-1 text-xs font-semibold text-[#2e2a3a]"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
