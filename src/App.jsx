import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Cloud,
  FileArchive,
  FileText,
  Folder,
  Home,
  Inbox,
  LayoutGrid,
  ListChecks,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Tag,
  Trash2,
  UserRound,
  X
} from "lucide-react";

const STORAGE_KEY = "gtd-workbench-state-v1";

const contexts = [
  "Computer",
  "Calls",
  "Errands",
  "Home",
  "Office",
  "Anywhere",
  "Agendas",
  "Read/Review"
];

const reviewTemplate = [
  "Collect loose papers and quick captures",
  "Process notes and inboxes",
  "Review past calendar",
  "Review upcoming calendar",
  "Empty your head",
  "Review Projects",
  "Review Next Actions",
  "Review Waiting For",
  "Review Someday/Maybe",
  "Review support material",
  "Add creative or courageous ideas"
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const initialState = {
  inbox: [
    {
      id: "in-1",
      title: "Set up my GTD system from the book",
      source: "Mind sweep",
      createdAt: "8:31 AM",
      note: "I want one trusted place for capture, processing, projects, actions, waiting-for items, and reviews."
    },
    {
      id: "in-2",
      title: "Renew passport",
      source: "Personal",
      createdAt: "9:02 AM",
      note: "Need to check requirements and appointment options."
    },
    {
      id: "in-3",
      title: "Read saved article about focus",
      source: "Web clipping",
      createdAt: "9:24 AM",
      note: "Might be useful, but not sure whether I need to act."
    },
    {
      id: "in-4",
      title: "Ask Ali for the invoice PDF",
      source: "Message",
      createdAt: "10:15 AM",
      note: "Need this before I can complete the payment records."
    }
  ],
  projects: [
    {
      id: "p-1",
      title: "GTD system set up and trusted",
      outcome: "Capture, processing, action lists, project review, and weekly review are running for one full week.",
      status: "active",
      support: ["Source pages: setup, processing, organizing, review."]
    }
  ],
  actions: [
    {
      id: "a-1",
      text: "Computer - Create first complete mind sweep",
      context: "Computer",
      projectId: "p-1",
      minutes: 25,
      energy: "Fresh",
      status: "open",
      createdAt: todayIso()
    },
    {
      id: "a-2",
      text: "Office - Put loose papers into physical inbox tray",
      context: "Office",
      projectId: "p-1",
      minutes: 15,
      energy: "Low",
      status: "open",
      createdAt: todayIso()
    }
  ],
  waiting: [
    {
      id: "w-1",
      text: "Waiting for Ali to send invoice PDF",
      person: "Ali",
      date: todayIso(),
      projectId: null,
      status: "open"
    }
  ],
  calendar: [
    { id: "c-1", title: "Weekly Review", date: todayIso(), time: "16:00", kind: "time-specific" },
    { id: "c-2", title: "Check tomorrow's hard landscape", date: todayIso(), time: "", kind: "day-specific" }
  ],
  someday: [
    { id: "s-1", title: "Build a deeper life-purpose review later", note: "Delay until runway and projects are current." }
  ],
  reference: [
    { id: "r-1", title: "GTD source anchors", note: "Workflow, processing, organizing, review, and doing chapters." }
  ],
  trash: [],
  review: Object.fromEntries(reviewTemplate.map((item, index) => [index, index < 3]))
};

function useStoredState() {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return [state, setState];
}

function App() {
  const [state, setState] = useStoredState();
  const [view, setView] = useState("process");
  const [query, setQuery] = useState("");
  const [capture, setCapture] = useState("");
  const [selectedId, setSelectedId] = useState(state.inbox[0]?.id || null);
  const [activeContext, setActiveContext] = useState("Computer");

  useEffect(() => {
    if (!selectedId && state.inbox[0]) setSelectedId(state.inbox[0].id);
    if (selectedId && !state.inbox.some((item) => item.id === selectedId)) {
      setSelectedId(state.inbox[0]?.id || null);
    }
  }, [selectedId, state.inbox]);

  const counts = {
    inbox: state.inbox.length,
    projects: state.projects.filter((p) => p.status === "active").length,
    actions: state.actions.filter((a) => a.status === "open").length,
    waiting: state.waiting.filter((w) => w.status === "open").length,
    someday: state.someday.length,
    review: Object.values(state.review).filter(Boolean).length
  };

  const addCapture = () => {
    const text = capture.trim();
    if (!text) return;
    const item = {
      id: uid(),
      title: text,
      source: "Quick capture",
      createdAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      note: ""
    };
    setState((current) => ({ ...current, inbox: [item, ...current.inbox] }));
    setSelectedId(item.id);
    setView("process");
    setCapture("");
  };

  const resetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    setSelectedId(initialState.inbox[0].id);
    setView("process");
  };

  return (
    <div className="appShell">
      <TopBar
        query={query}
        setQuery={setQuery}
        capture={capture}
        setCapture={setCapture}
        addCapture={addCapture}
        reviewDone={counts.review}
        resetDemo={resetDemo}
      />
      <SideNav view={view} setView={setView} counts={counts} />
      <main className="workspace">
        {view === "process" && (
          <ProcessView
            state={state}
            setState={setState}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            query={query}
          />
        )}
        {view === "inbox" && <InboxView state={state} setView={setView} setSelectedId={setSelectedId} query={query} />}
        {view === "projects" && <ProjectsView state={state} setState={setState} query={query} />}
        {view === "actions" && (
          <ActionsView
            state={state}
            setState={setState}
            query={query}
            activeContext={activeContext}
            setActiveContext={setActiveContext}
          />
        )}
        {view === "calendar" && <CalendarView state={state} setState={setState} />}
        {view === "waiting" && <WaitingView state={state} setState={setState} />}
        {view === "someday" && <SomedayView state={state} setState={setState} />}
        {view === "review" && <ReviewView state={state} setState={setState} />}
        {view === "reference" && <ReferenceView state={state} />}
        {view === "trash" && <TrashView state={state} />}
      </main>
      <RightRail state={state} setView={setView} setActiveContext={setActiveContext} />
    </div>
  );
}

function TopBar({ query, setQuery, capture, setCapture, addCapture, reviewDone, resetDemo }) {
  return (
    <header className="topbar">
      <div className="brandCluster">
        <button className="iconButton" aria-label="Menu">
          <Menu size={20} />
        </button>
        <div className="brandMark">GTD Workbench</div>
      </div>
      <label className="searchBox">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search everything..." />
        <kbd>Ctrl K</kbd>
      </label>
      <form
        className="captureBox"
        onSubmit={(event) => {
          event.preventDefault();
          addCapture();
        }}
      >
        <input
          value={capture}
          onChange={(event) => setCapture(event.target.value)}
          placeholder="Quick capture... e.g., Call supplier tomorrow 10am"
        />
        <button className="primaryIconButton" aria-label="Capture item">
          <Plus size={20} />
        </button>
      </form>
      <div className="topActions">
        <button className="miniStatus" type="button">
          <ClipboardCheck size={19} />
          <span>{reviewDone}/11</span>
        </button>
        <button className="iconButton" aria-label="Notifications">
          <Bell size={19} />
        </button>
        <button className="iconButton" aria-label="Settings">
          <Settings size={19} />
        </button>
        <button className="iconButton" aria-label="Reset demo data" onClick={resetDemo}>
          <RotateCcw size={18} />
        </button>
      </div>
    </header>
  );
}

function SideNav({ view, setView, counts }) {
  const items = [
    ["inbox", "Inbox", Inbox, counts.inbox],
    ["process", "Process", RotateCcw, counts.inbox],
    ["projects", "Projects", Folder, counts.projects],
    ["actions", "Next Actions", Play, counts.actions],
    ["calendar", "Calendar", CalendarDays, null],
    ["waiting", "Waiting For", Clock3, counts.waiting],
    ["someday", "Someday/Maybe", Cloud, counts.someday],
    ["review", "Review", ClipboardCheck, `${counts.review}/11`]
  ];
  const lower = [
    ["reference", "Reference", FileArchive],
    ["trash", "Trash", Trash2]
  ];

  return (
    <aside className="sidebar">
      <nav className="navList">
        {items.map(([id, label, Icon, count]) => (
          <button className={`navItem ${view === id ? "active" : ""}`} key={id} onClick={() => setView(id)}>
            <Icon size={19} />
            <span>{label}</span>
            {count !== null && <b>{count}</b>}
          </button>
        ))}
      </nav>
      <div className="navDivider" />
      <nav className="navList secondary">
        <button className="navItem">
          <LayoutGrid size={19} />
          <span>Contexts</span>
        </button>
        <button className="navItem">
          <Tag size={19} />
          <span>Tags</span>
        </button>
        {lower.map(([id, label, Icon]) => (
          <button className={`navItem ${view === id ? "active" : ""}`} key={id} onClick={() => setView(id)}>
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sideFooter">
        <span>Local autosave</span>
        <CheckCircle2 size={16} />
      </div>
    </aside>
  );
}

function ProcessView({ state, setState, selectedId, setSelectedId, query }) {
  const filtered = filterItems(state.inbox, query);
  const selected = state.inbox.find((item) => item.id === selectedId) || filtered[0] || state.inbox[0];

  return (
    <section className="processGrid">
      <div className="queuePanel">
        <div className="sectionHeader">
          <div>
            <p className="crumb">Process <ChevronRight size={14} /> Processing Queue</p>
            <h1>Inbox to Empty</h1>
          </div>
          <span className="countPill">{state.inbox.length}</span>
        </div>
        <div className="queueTools">
          <span>Select:</span>
          <button>All</button>
          <button>None</button>
          <span className="spacer" />
          <span>Sort:</span>
          <button>Added</button>
        </div>
        <div className="queueList">
          {filtered.length === 0 && <EmptyState title="No captured items match your search." />}
          {filtered.map((item) => (
            <button
              className={`queueRow ${selected?.id === item.id ? "selected" : ""}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
            >
              <span className="checkbox" />
              <span>
                <strong>{item.title}</strong>
                <small>
                  {item.source} <span>•</span> {item.createdAt}
                </small>
              </span>
            </button>
          ))}
        </div>
      </div>
      <DecisionPanel item={selected} state={state} setState={setState} />
    </section>
  );
}

function DecisionPanel({ item, state, setState }) {
  const [draft, setDraft] = useState(createDraft(item));

  useEffect(() => {
    setDraft(createDraft(item));
  }, [item?.id]);

  if (!item) {
    return (
      <div className="decisionPanel">
        <EmptyState title="Your inbox is empty." text="Capture something new or review your projects." />
      </div>
    );
  }

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const send = () => {
    const route = draft.route;
    const projectId = draft.trackProject && draft.outcome.trim() ? upsertProject(state, setState, draft) : null;
    setState((current) => {
      const next = { ...current, inbox: current.inbox.filter((entry) => entry.id !== item.id) };
      const base = {
        sourceId: item.id,
        sourceTitle: item.title,
        note: draft.note || item.note
      };

      if (draft.actionable === "no") {
        if (route === "Trash") next.trash = [{ id: uid(), title: item.title, note: draft.what }, ...current.trash];
        if (route === "Reference") next.reference = [{ id: uid(), title: item.title, note: draft.what }, ...current.reference];
        if (route === "Someday/Maybe") next.someday = [{ id: uid(), title: item.title, note: draft.what }, ...current.someday];
        if (route === "Calendar") {
          next.calendar = [
            {
              id: uid(),
              title: item.title,
              date: draft.calendarDate || todayIso(),
              time: draft.calendarTime,
              kind: draft.calendarTime ? "time-specific" : "day-specific",
              ...base
            },
            ...current.calendar
          ];
        }
        return next;
      }

      if (draft.twoMinuteDone) {
        next.actions = [
          {
            id: uid(),
            text: draft.nextAction || `Completed: ${item.title}`,
            context: draft.context,
            projectId,
            minutes: 2,
            energy: "Any",
            status: "done",
            createdAt: todayIso(),
            ...base
          },
          ...current.actions
        ];
        return next;
      }

      if (route === "Waiting For") {
        next.waiting = [
          {
            id: uid(),
            text: draft.waitingFor || draft.nextAction || item.title,
            person: draft.person || "Someone",
            date: todayIso(),
            projectId,
            status: "open",
            ...base
          },
          ...current.waiting
        ];
      } else if (route === "Calendar") {
        next.calendar = [
          {
            id: uid(),
            title: draft.nextAction || item.title,
            date: draft.calendarDate || todayIso(),
            time: draft.calendarTime,
            kind: draft.calendarTime ? "time-specific" : "day-specific",
            projectId,
            ...base
          },
          ...current.calendar
        ];
      } else if (route === "Someday/Maybe") {
        next.someday = [{ id: uid(), title: draft.outcome || item.title, note: draft.what }, ...current.someday];
      } else if (route === "Reference") {
        next.reference = [{ id: uid(), title: item.title, note: draft.what }, ...current.reference];
      } else if (route === "Trash") {
        next.trash = [{ id: uid(), title: item.title, note: draft.what }, ...current.trash];
      } else {
        next.actions = [
          {
            id: uid(),
            text: draft.nextAction || item.title,
            context: draft.context,
            projectId,
            minutes: Number(draft.minutes) || 15,
            energy: draft.energy,
            status: "open",
            createdAt: todayIso(),
            ...base
          },
          ...current.actions
        ];
      }
      return next;
    });
  };

  return (
    <div className="decisionPanel">
      <div className="decisionHead">
        <div>
          <h2>{item.title}</h2>
          <p>{item.source} • {item.createdAt}</p>
        </div>
        <button className="iconButton" aria-label="More">
          <MoreHorizontal size={19} />
        </button>
      </div>

      <DecisionStep number="1" title="What is it?">
        <textarea value={draft.what} onChange={(event) => update("what", event.target.value)} />
      </DecisionStep>

      <DecisionStep number="2" title="Is action needed?">
        <div className="segmented">
          <button
            className={draft.actionable === "yes" ? "selected" : ""}
            onClick={() => setDraft((current) => ({ ...current, actionable: "yes", route: "Next Actions" }))}
          >
            Yes, action is needed
          </button>
          <button
            className={draft.actionable === "no" ? "selected" : ""}
            onClick={() => setDraft((current) => ({ ...current, actionable: "no", route: "Reference" }))}
          >
            No action needed
          </button>
        </div>
      </DecisionStep>

      {draft.actionable === "yes" ? (
        <>
          <DecisionStep number="3" title="What is the desired outcome?">
            <textarea value={draft.outcome} onChange={(event) => update("outcome", event.target.value)} />
            <label className="checkLine">
              <input type="checkbox" checked={draft.trackProject} onChange={(event) => update("trackProject", event.target.checked)} />
              Track this outcome on the Projects list if it needs more than one action.
            </label>
          </DecisionStep>

          <DecisionStep number="4" title="What is the next physical action?">
            <input value={draft.nextAction} onChange={(event) => update("nextAction", event.target.value)} />
            <div className="inlineFields">
              <label>
                Context
                <select value={draft.context} onChange={(event) => update("context", event.target.value)}>
                  {contexts.map((context) => (
                    <option key={context}>{context}</option>
                  ))}
                </select>
              </label>
              <label>
                Minutes
                <input type="number" min="1" value={draft.minutes} onChange={(event) => update("minutes", event.target.value)} />
              </label>
              <label>
                Energy
                <select value={draft.energy} onChange={(event) => update("energy", event.target.value)}>
                  <option>Fresh</option>
                  <option>Medium</option>
                  <option>Low</option>
                  <option>Any</option>
                </select>
              </label>
            </div>
            <label className="checkLine">
              <input type="checkbox" checked={draft.twoMinuteDone} onChange={(event) => update("twoMinuteDone", event.target.checked)} />
              I did this now because it takes less than two minutes.
            </label>
          </DecisionStep>
        </>
      ) : (
        <DecisionStep number="3" title="If no action, where should it go?">
          <p className="helper">Choose Trash, Reference, Someday/Maybe, or a future calendar/tickler reminder.</p>
        </DecisionStep>
      )}

      <DecisionStep number={draft.actionable === "yes" ? "5" : "4"} title="Where does it belong?">
        <BucketGrid route={draft.route} setRoute={(route) => update("route", route)} actionable={draft.actionable} />
        {draft.route === "Waiting For" && (
          <div className="inlineFields">
            <label>
              Person/source
              <input value={draft.person} onChange={(event) => update("person", event.target.value)} />
            </label>
            <label>
              Waiting for
              <input value={draft.waitingFor} onChange={(event) => update("waitingFor", event.target.value)} />
            </label>
          </div>
        )}
        {draft.route === "Calendar" && (
          <div className="inlineFields">
            <label>
              Date
              <input type="date" value={draft.calendarDate} onChange={(event) => update("calendarDate", event.target.value)} />
            </label>
            <label>
              Time
              <input type="time" value={draft.calendarTime} onChange={(event) => update("calendarTime", event.target.value)} />
            </label>
          </div>
        )}
      </DecisionStep>

      <div className="decisionFooter">
        <button className="ghostButton" onClick={() => setDraft(createDraft(item))}>Clear decisions</button>
        <button className="primaryButton" onClick={send}>Send to {draft.twoMinuteDone ? "Done" : draft.route}</button>
      </div>
    </div>
  );
}

function createDraft(item) {
  return {
    what: item?.note || item?.title || "",
    actionable: "yes",
    outcome: item ? `${item.title} completed` : "",
    trackProject: true,
    nextAction: "",
    context: "Computer",
    minutes: 15,
    energy: "Medium",
    route: "Next Actions",
    person: "",
    waitingFor: "",
    calendarDate: todayIso(),
    calendarTime: "",
    note: "",
    twoMinuteDone: false
  };
}

function upsertProject(state, setState, draft) {
  const existing = state.projects.find((project) => project.outcome.toLowerCase() === draft.outcome.trim().toLowerCase());
  if (existing) return existing.id;
  const id = uid();
  setState((current) => ({
    ...current,
    projects: [
      {
        id,
        title: draft.outcome.trim(),
        outcome: draft.outcome.trim(),
        status: "active",
        support: draft.what ? [draft.what] : []
      },
      ...current.projects
    ]
  }));
  return id;
}

function DecisionStep({ number, title, children }) {
  return (
    <div className="decisionStep">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function BucketGrid({ route, setRoute, actionable }) {
  const buckets = actionable === "yes"
    ? [
        ["Trash", Trash2],
        ["Reference", FileText],
        ["Someday/Maybe", Cloud],
        ["Calendar", CalendarDays],
        ["Projects", Folder],
        ["Next Actions", Play],
        ["Waiting For", Clock3]
      ]
    : [
        ["Trash", Trash2],
        ["Reference", FileText],
        ["Someday/Maybe", Cloud],
        ["Calendar", CalendarDays]
      ];
  return (
    <div className="bucketGrid">
      {buckets.map(([name, Icon]) => (
        <button key={name} className={route === name ? "active" : ""} onClick={() => setRoute(name)}>
          <Icon size={19} />
          <span>{name}</span>
        </button>
      ))}
    </div>
  );
}

function RightRail({ state, setView, setActiveContext }) {
  const openActions = state.actions.filter((action) => action.status === "open");
  const byContext = contexts
    .map((context) => [context, openActions.filter((action) => action.context === context).length])
    .filter(([, count]) => count > 0)
    .slice(0, 6);
  const reviewDone = Object.values(state.review).filter(Boolean).length;
  const todaysItems = state.calendar.filter((item) => item.date === todayIso()).slice(0, 6);

  return (
    <aside className="rightRail">
      <section className="railPanel todayPanel">
        <div className="railHeader">
          <h2>Today</h2>
          <span>{new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="timeline">
          {todaysItems.map((item) => (
            <div className="timeRow" key={item.id}>
              <span>{item.time || "Day"}</span>
              <b>{item.title}</b>
              <small>{item.kind}</small>
            </div>
          ))}
          {todaysItems.length === 0 && <p className="helper">No hard landscape items today.</p>}
        </div>
        <button className="linkButton" onClick={() => setView("calendar")}>
          See full calendar <ChevronRight size={16} />
        </button>
      </section>

      <section className="railPanel">
        <div className="railHeader">
          <h2>Contexts</h2>
          <span>Next Actions</span>
        </div>
        <div className="contextStack">
          {byContext.map(([context, count]) => (
            <button
              key={context}
              onClick={() => {
                setActiveContext(context);
                setView("actions");
              }}
            >
              <span>@{context}</span>
              <b>{count}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="railPanel">
        <div className="railHeader">
          <h2>Weekly Review</h2>
          <span>{reviewDone}/11</span>
        </div>
        <div className="reviewMini">
          {reviewTemplate.slice(0, 5).map((item, index) => (
            <div key={item}>
              <span>{item}</span>
              {state.review[index] ? <CheckCircle2 size={16} /> : <span className="openDot" />}
            </div>
          ))}
        </div>
        <button className="linkButton" onClick={() => setView("review")}>
          Start Weekly Review <ChevronRight size={16} />
        </button>
      </section>
    </aside>
  );
}

function InboxView({ state, setView, setSelectedId, query }) {
  const items = filterItems(state.inbox, query);
  return (
    <ContentPanel title="Captured Inbox" subtitle="Temporary holding place. Nothing should live here forever.">
      <div className="dataList">
        {items.map((item) => (
          <button
            className="dataRow"
            key={item.id}
            onClick={() => {
              setSelectedId(item.id);
              setView("process");
            }}
          >
            <Inbox size={18} />
            <span>
              <b>{item.title}</b>
              <small>{item.source} • {item.createdAt}</small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </ContentPanel>
  );
}

function ProjectsView({ state, setState, query }) {
  const projects = filterItems(state.projects, query);
  return (
    <ContentPanel title="Projects" subtitle="Every active outcome that needs more than one action.">
      <div className="projectGrid">
        {projects.map((project) => {
          const actions = state.actions.filter((action) => action.projectId === project.id && action.status === "open");
          return (
            <article className="projectItem" key={project.id}>
              <div className="itemTitle">
                <Folder size={19} />
                <h3>{project.title}</h3>
              </div>
              <p>{project.outcome}</p>
              <div className="metaLine">
                <span>{actions.length} next actions</span>
                <span>{project.support.length} support notes</span>
              </div>
              <div className="supportList">
                {project.support.slice(0, 3).map((note) => (
                  <small key={note}>{note}</small>
                ))}
              </div>
              <button
                className="ghostButton"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    projects: current.projects.map((entry) =>
                      entry.id === project.id ? { ...entry, status: entry.status === "active" ? "done" : "active" } : entry
                    )
                  }))
                }
              >
                {project.status === "active" ? "Mark complete" : "Reopen"}
              </button>
            </article>
          );
        })}
      </div>
    </ContentPanel>
  );
}

function ActionsView({ state, setState, query, activeContext, setActiveContext }) {
  const actions = filterItems(
    state.actions.filter((action) => action.status === "open" && action.context === activeContext),
    query,
    "text"
  );
  return (
    <ContentPanel title="Next Actions" subtitle="Physical, visible actions grouped by context.">
      <div className="contextTabs">
        {contexts.map((context) => (
          <button className={activeContext === context ? "active" : ""} key={context} onClick={() => setActiveContext(context)}>
            @{context}
          </button>
        ))}
      </div>
      <div className="dataList">
        {actions.map((action) => (
          <div className="dataRow" key={action.id}>
            <button
              className="completeButton"
              aria-label="Complete action"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  actions: current.actions.map((entry) =>
                    entry.id === action.id ? { ...entry, status: "done" } : entry
                  )
                }))
              }
            >
              <Check size={17} />
            </button>
            <span>
              <b>{action.text}</b>
              <small>{action.minutes} min • {action.energy} energy</small>
            </span>
            <span className="contextBadge">@{action.context}</span>
          </div>
        ))}
        {actions.length === 0 && <EmptyState title={`No open actions in @${activeContext}.`} />}
      </div>
    </ContentPanel>
  );
}

function CalendarView({ state, setState }) {
  return (
    <ContentPanel title="Calendar" subtitle="Only hard landscape: time-specific, day-specific, and day-specific information.">
      <div className="dataList">
        {state.calendar.map((item) => (
          <div className="dataRow" key={item.id}>
            <CalendarDays size={18} />
            <span>
              <b>{item.title}</b>
              <small>{item.date} {item.time ? `• ${item.time}` : ""} • {item.kind}</small>
            </span>
            <button
              className="iconButton"
              aria-label="Remove calendar item"
              onClick={() => setState((current) => ({ ...current, calendar: current.calendar.filter((entry) => entry.id !== item.id) }))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ContentPanel>
  );
}

function WaitingView({ state, setState }) {
  return (
    <ContentPanel title="Waiting For" subtitle="Delegated or external next moves, always dated.">
      <div className="dataList">
        {state.waiting.filter((item) => item.status === "open").map((item) => (
          <div className="dataRow" key={item.id}>
            <Clock3 size={18} />
            <span>
              <b>{item.text}</b>
              <small>{item.person} • since {item.date}</small>
            </span>
            <button
              className="ghostButton"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  waiting: current.waiting.map((entry) => entry.id === item.id ? { ...entry, status: "done" } : entry)
                }))
              }
            >
              Received
            </button>
          </div>
        ))}
      </div>
    </ContentPanel>
  );
}

function SomedayView({ state, setState }) {
  return (
    <ContentPanel title="Someday/Maybe" subtitle="Back-burner outcomes and ideas that are not active now.">
      <div className="dataList">
        {state.someday.map((item) => (
          <div className="dataRow" key={item.id}>
            <Cloud size={18} />
            <span>
              <b>{item.title}</b>
              <small>{item.note || "Review weekly or monthly."}</small>
            </span>
            <button
              className="ghostButton"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  someday: current.someday.filter((entry) => entry.id !== item.id),
                  projects: [
                    { id: uid(), title: item.title, outcome: item.title, status: "active", support: [item.note || "Activated from Someday/Maybe"] },
                    ...current.projects
                  ]
                }))
              }
            >
              Activate
            </button>
          </div>
        ))}
      </div>
    </ContentPanel>
  );
}

function ReviewView({ state, setState }) {
  const done = Object.values(state.review).filter(Boolean).length;
  return (
    <ContentPanel title="Weekly Review" subtitle="Get clear, get current, and get creative.">
      <div className="reviewHeader">
        <div className="progressTrack">
          <span style={{ width: `${(done / reviewTemplate.length) * 100}%` }} />
        </div>
        <b>{done} of {reviewTemplate.length} complete</b>
      </div>
      <div className="reviewList">
        {reviewTemplate.map((item, index) => (
          <label className="reviewRow" key={item}>
            <input
              type="checkbox"
              checked={Boolean(state.review[index])}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  review: { ...current.review, [index]: event.target.checked }
                }))
              }
            />
            <span>
              <b>{item}</b>
              <small>{reviewHint(index)}</small>
            </span>
          </label>
        ))}
      </div>
    </ContentPanel>
  );
}

function ReferenceView({ state }) {
  return (
    <ContentPanel title="Reference" subtitle="Useful information with no action attached.">
      <div className="dataList">
        {state.reference.map((item) => (
          <div className="dataRow" key={item.id}>
            <Archive size={18} />
            <span>
              <b>{item.title}</b>
              <small>{item.note}</small>
            </span>
          </div>
        ))}
      </div>
    </ContentPanel>
  );
}

function TrashView({ state }) {
  return (
    <ContentPanel title="Trash" subtitle="Items consciously removed from the system.">
      <div className="dataList">
        {state.trash.map((item) => (
          <div className="dataRow" key={item.id}>
            <Trash2 size={18} />
            <span>
              <b>{item.title}</b>
              <small>{item.note}</small>
            </span>
          </div>
        ))}
        {state.trash.length === 0 && <EmptyState title="Trash is empty." />}
      </div>
    </ContentPanel>
  );
}

function ContentPanel({ title, subtitle, children }) {
  return (
    <section className="contentPanel">
      <div className="contentHeader">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="emptyState">
      <ListChecks size={28} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}

function filterItems(items, query, field = "title") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => String(item[field] || item.title || "").toLowerCase().includes(normalized));
}

function reviewHint(index) {
  const hints = [
    "Put loose paper, receipts, quick notes, tabs, and captures into inbox.",
    "Turn notes into actions, projects, waiting-for items, calendar items, reference, or trash.",
    "Look backward for missed actions, promises, and useful information.",
    "Look forward for preparation, deadlines, and day-specific reminders.",
    "Write down anything still pulling your attention.",
    "Check every project for a current next physical action.",
    "Remove completed actions and choose what still belongs.",
    "Add follow-ups for anything that is stuck with someone else.",
    "Activate useful items or remove what no longer matters.",
    "Open project notes and files to find hidden next actions.",
    "Capture new, useful, risky, or creative ideas."
  ];
  return hints[index];
}

export default App;
