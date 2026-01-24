# Roadmap

## Compare

Compare up to 3 logs side-by-side.

### Flow

1. Click "Compare" button on index page → enters selection mode
2. Checkboxes appear on each log card
3. Select 2-3 logs (max 3)
4. "Compare Selected" button appears → navigates to compare page with selected log IDs

### Compare Page

- Route: `GET /__viewer__/compare?logs=provider/file1,provider/file2,provider/file3`
- Layout: Each log in its own column, horizontal scroll if needed
- Sections (same as detail view): headers, request body, response body
- Vertical alignment: all section headers start at same height across columns (use CSS grid rows or flexbox with align-items)

### Features

- **Diff highlighting**: Use a diff library (e.g., diff, jsdiff) to highlight differences between logs. Color-code added/removed/changed content.
- **Auto-collapse identical sections**: Sections that are identical across all logs are collapsed by default. Click to expand.
- **Timeline header**: Small visualization showing when each request happened and relative durations.
- **Export as markdown**: Copy comparison summary (with diffs) to clipboard.

### Screenshot Task

- Script: `npm run screenshot_compare`
- Takes last 3 logs by timestamp
- Throws exception if fewer than 3 logs exist (so we can create test data)
- Saves to screenshots directory

---

## Backlog (DO NOT IMPLEMENT)

### Pinned reference column

Pin one log as the "baseline" (left-most, fixed position) while scrolling through others horizontally. Useful for comparing variations against a known-good request.
