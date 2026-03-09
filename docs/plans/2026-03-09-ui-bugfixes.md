# UI/UX Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two UI overflow bugs: scrollable trending sidebar and dynamic hero font sizing on topic detail page.

**Architecture:** Pure CSS/Tailwind changes — no new components, no backend changes. Fix the sidebar by changing `overflow-y: hidden` to `auto` with hidden scrollbar utility. Fix the hero heading by replacing the static `text-display` class with a dynamic font size function based on label length.

**Tech Stack:** Tailwind CSS 4, Next.js App Router, React

---

### Task 1: Fix Right Sidebar Scrollable Trending Topics

**Files:**
- Modify: `app/globals.css:99-111` (`.right_sidebar` class)
- Modify: `components/RightSidebar.tsx:14-33` (content wrapper structure)

**Current problem:** `.right_sidebar` has `overflow-y: hidden` (line 106) which clips content. The user profile and TrendingTopics are siblings inside a flex column, but neither has `flex-1` or `overflow-y-auto`, so topics below the fold are invisible.

**Step 1: Update `.right_sidebar` in `app/globals.css`**

Change line 106 from `overflow-y: hidden` to `overflow-y: hidden` on the container (keep it), but we need to let the child scroll. Actually, the simplest fix: change the container to allow overflow and make the topics section scroll.

In `app/globals.css`, change `.right_sidebar`:
```css
.right_sidebar {
  position: sticky;
  right: 0;
  top: 0;
  display: flex;
  width: 320px;
  flex-direction: column;
  overflow-y: hidden;
  background: linear-gradient(180deg, var(--color-dark-gray) 0%, var(--color-charcoal) 100%);
  border-left: var(--border-thick) solid var(--color-orange);
  padding: 2rem 1.5rem;
  height: 100vh;
}
```

Only change needed: keep `overflow-y: hidden` on the outer container (prevents the sidebar itself from scrolling the page). The scroll happens on the inner child.

**Step 2: Add scrollbar-hide utility to `app/globals.css`**

Add after the `.right_sidebar` media query block:
```css
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**Step 3: Update `components/RightSidebar.tsx` content structure**

Wrap the user profile in `flex-shrink-0` and the TrendingTopics in `flex-1 overflow-y-auto scrollbar-hide`:

```tsx
const content = (
  <>
    <SignedIn>
      <Link
        href={`/profile/${user?.id}`}
        className="flex items-center gap-3 pb-8 flex-shrink-0"
      >
        <UserButton />
        <div className="flex items-center justify-between w-full">
          <h1 className="text-16 truncate font-semibold text-white-1">
            {user?.firstName} {user?.lastName}
          </h1>
          <ChevronRight size={20} className="text-white-4" />
        </div>
      </Link>
    </SignedIn>

    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <TrendingTopics />
    </div>
  </>
);
```

**Step 4: Verify**

Run: `npx next build`
Expected: Build passes. Open `npm run dev`, sidebar topics scroll when list exceeds viewport.

**Step 5: Commit**

```bash
git add app/globals.css components/RightSidebar.tsx
git commit -m "fix: make trending topics sidebar scrollable with hidden scrollbar"
```

---

### Task 2: Fix Long Topic Names Overflowing Hero Box

**Files:**
- Modify: `app/(root)/topics/[topicSlug]/page.tsx:87` (hero heading)

**Current problem:** Line 87 uses `text-display` class which sets `font-size: clamp(2.5rem, 5vw, 4rem)` — this is too large for long topic names like "CLIMATE & ENERGY TRANSITION" (28 chars uppercase), causing overflow.

**Step 1: Add dynamic font size helper and update the heading**

In `app/(root)/topics/[topicSlug]/page.tsx`, add the helper function before the component:

```tsx
function getHeroFontSize(label: string): string {
  const len = label.length;
  if (len <= 12) return "text-6xl md:text-7xl";
  if (len <= 20) return "text-4xl md:text-6xl";
  if (len <= 30) return "text-3xl md:text-5xl";
  return "text-2xl md:text-4xl";
}
```

Then change line 87 from:
```tsx
<h1 className="text-display text-white-1 mb-3">{theme.label}</h1>
```

To:
```tsx
<h1 className={`${getHeroFontSize(theme.label)} font-syne font-black uppercase leading-tight break-words text-white-1 mb-3`}>
  {theme.label}
</h1>
```

Also add `overflow-hidden` to the parent card as a safety net. Change line 84 from:
```tsx
<div className="card-brutal p-8">
```
To:
```tsx
<div className="card-brutal p-8 overflow-hidden">
```

**Step 2: Verify**

Run: `npx next build`
Expected: Build passes. Open `npm run dev`, navigate to `/topics/climate-energy-transition` — heading fits within the card without overflow.

**Step 3: Commit**

```bash
git add app/(root)/topics/[topicSlug]/page.tsx
git commit -m "fix: dynamic font sizing for long topic names on detail page"
```
