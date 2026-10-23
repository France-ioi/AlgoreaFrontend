# Left navigation

Reached from [ARCHITECTURE.md](ARCHITECTURE.md) when changing left-panel tabs, tree fetch, or narrow layout.

## Component hierarchy

```
alg-left-panel          → outer shell: header + tabbed-content
└── alg-left-tabbed-content  → tab bar + search mode + tree delegation
    ├── alg-left-tab-bar     (tabs driven by config.leftMenuTabs + per-user showTo)
    ├── alg-left-menu-search (inline header when search tab is active)
    └── alg-left-nav
```

- **`alg-left-panel`**: Outer shell — header and tabbed content area
- **`alg-left-tabbed-content`**: Orchestrator — owns active tab logic, search mode (`searchActive` / `searchQuery`), tab-to-tree index mapping, scroll-to-element
- **`alg-left-tab-bar`**: Presentational — renders tab buttons from `LeftMenuConfigService.visibleTabs$`, emits tab selection and search-open events
- **`alg-left-nav`**: Tree rendering — receives a `treeIndex` input, renders the corresponding nav tree

## Narrow layout

`LayoutService.isNarrowScreen$` and layout SCSS use `(max-width: 699.98px)` — constants live in `src/app/utils/layout-breakpoints.ts` and `src/assets/scss/breakpoints.scss` (must stay in sync). On narrow viewports the left menu overlays content, sign-in/profile controls sit at the bottom of the tab rail, and top-bar login is hidden.

## Nav fetch cache

`NavTreeService` caches l1 (siblings) and l2 (children) fetches per `(path, attempt)` — children keyed by the item's own attempt, siblings by its parent attempt — so switching attempt on the same item refetches only the children. When the route omits the relevant attempt key (legacy XOR of `a=` / `pa=`), matching falls back to path-only so child navigation still reuses l2. Group trees omit attempts and keep path-only reuse.

## Tab config and active tab

Tab visibility and order come from root config `leftMenuTabs` (each entry has a `type`, `showTo` user set, optional `caption: { default, …lang tags }` and optional `icon` Phosphor class string, and for `activities`/`skills` tabs a mandatory `content: { id, path }`). Several `activities` or `skills` tabs are allowed; tab identity is the index in the visible list (`LeftMenuTabView.id`). `LeftMenuConfigService` filters tabs per session, resolves caption/icon defaults, and cross-checks (`searchApiUrl`). The tab bar is shown when more than one tab is visible (`showTabBar$`). Exactly one tab is active at a time: for item content, the active tab is the visible activities/skills tab whose `content` is an ancestor of the current route with the longest matching `path`; otherwise the first tab matching the content category. Clicking an activities/skills tab navigates to that tab's `content` when it is already active, unless the user is viewing another section and their last selected activity/skill is the same or a descendant of that content — then that selection is restored. `tabToTreeIndex()` maps a `LeftMenuTabType` to the fixed `0/1/2` tree index expected by `alg-left-nav`, independent of which tabs are visible.
