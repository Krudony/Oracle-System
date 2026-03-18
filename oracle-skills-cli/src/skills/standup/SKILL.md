---
name: standup
description: Daily standup check - pending tasks, appointments, recent progress. Use when user says "standup", "morning check", "what's pending".
---

# /standup - Daily Standup

Quick check: pending tasks, appointments, recent progress.

## Step 0: Timestamp
```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"
```

---

## Usage

```
/standup          # Full standup check
```

---

## Action

Gather info from multiple sources:

### 0. Physical Location (auto)
```bash
gh api repos/laris-co/nat-location-data/contents/current.csv --jq '.content' | base64 -d | grep iPhone | head -1 | cut -d',' -f9
```
Show: "📍 Currently at: [place]"

### 1. Open Issues (งานค้าง)
```bash
gh issue list --state open --limit 10 --json number,title,updatedAt --jq '.[] | "#\(.number) \(.title)"'
```

### 2. Resolve Vault Path
```bash
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
```

### 3. Current Focus
```bash
cat "$PSI/inbox/focus-agent-main.md" 2>/dev/null | head -20
```

### 4. Schedule/Appointments
```bash
grep "^|" "$PSI/inbox/schedule.md" 2>/dev/null | grep -v "Date\|---" | head -5
```

### 5. Recent Progress (24h)
```bash
git log --since="24 hours ago" --format="%h %s" | head -10
```

### 6. Latest Retrospective
```bash
ls -t "$PSI/memory/retrospectives"/**/*.md 2>/dev/null | head -1
```

### 7. LINE Appointment Scan (optional)

Scan recent LINE messages for potential appointments:

1. Read contacts from vault: `$PSI/memory/resonance/contacts.md`
   - If file doesn't exist, skip this section silently
   - Look for LINE group names/aliases listed there
2. Call `line_groups` (date: "today") to see active groups
3. For each active group, call `line_digest` (group: name, date: "today")
   - Also check yesterday: `line_digest` (group: name, date: yesterday's YYYY-MM-DD)
4. Extract messages containing date/time patterns:
   - Thai: `วันที่`, `พรุ่งนี้`, `มะรืน`, `นัด`, `ประชุม`, `เจอกัน`
   - English: dates, "meeting", "appointment", "schedule"
   - Times: `HH:MM`, `X โมง`, `บ่าย`, `เช้า`
5. Cross-reference with existing schedule (step 4) to skip duplicates
6. Present found appointments:
   ```
   ### LINE Appointments Found
   - [date] [event] (from: [group]) — Add? Y/N
   ```
7. On user approval → call `oracle_schedule_add` for each confirmed appointment

---

## Output Format

```markdown
## Standup @ [TIME]

### Done (24h)
- [commit 1]
- [commit 2]

### In Progress
- [from focus.md]

### Pending Issues
| # | Task | Updated |
|---|------|---------|
| #N | title | date |

### Appointments Today
- [from schedule.md or "ไม่มีนัด"]

### Next Action
- [suggest based on priorities]

---
💡 `/schedule` to see full calendar
```

---

## Related

- `/schedule` - Full calendar view
- `/recap` - Full context summary

---

ARGUMENTS: $ARGUMENTS
