# Documentation Checklist System - Proposed Implementation

**Status:** AWAITING APPROVAL
**Last Updated:** 2025-10-25

---

## Overview

Create dedicated documentation checklists for different work items (Phase, Epic, Story, Task, Bug) to ensure consistency across all documentation when completing work. Checklists are grouped by shared sections to reduce duplication.

---

## Proposed Checklist Structure

### 1. **PHASE COMPLETION CHECKLIST**
*Used when completing an entire phase (e.g., Phase 1, Phase 2, Phase 2 Extension)*

**Sections to Update:**
- [ ] Update PRD status: Change to "✅ COMPLETE (100%)"
- [ ] Update CLAUDE.md "Current Phase" line (Line 11)
- [ ] Update phase-specific README status at top
- [ ] Update NEXT-STEPS.md phase summary section
- [ ] Archive/move phase tickets to appropriate directory
- [ ] Add "Recently Completed" section noting completion date
- [ ] Update project health score if applicable
- [ ] Create session summary if multi-session work

**Affected Files:** 4-6 files
**Time to Check:** ~10 minutes

---

### 2. **EPIC COMPLETION CHECKLIST**
*Used when completing an Epic (e.g., EPIC-1, EPIC-2, EPIC-4)*

**Sections to Update:**
- [ ] Update EPIC file status to "✅ COMPLETE"
- [ ] Update epic README or parent document listing
- [ ] Update story count in summary (e.g., "4/4 stories complete")
- [ ] Update task count in summary (e.g., "16/16 tasks complete")
- [ ] Add to "Recently Completed" in relevant roadmap file
- [ ] Update success criteria checklist (mark all complete)
- [ ] Link to final PR or commit that completed it

**Affected Files:** 2-3 files
**Time to Check:** ~5 minutes

---

### 3. **STORY COMPLETION CHECKLIST**
*Used when completing a Story (e.g., STORY-2.1, STORY-2.2)*

**Sections to Update:**
- [ ] Update STORY file status to "✅ COMPLETE"
- [ ] Update parent EPIC task count progress
- [ ] Update parent roadmap (NEXT-STEPS) if visible
- [ ] Verify all 3-5 tasks in story are marked complete
- [ ] Add completion date to STORY file
- [ ] Reference associated PR/commit

**Affected Files:** 2 files
**Time to Check:** ~3 minutes

---

### 4. **TASK COMPLETION CHECKLIST**
*Used when completing an individual Task (e.g., TASK-2.1.1)*

**Sections to Update:**
- [ ] Update TASK file status to "✅ COMPLETE"
- [ ] Add "Completed Date" field
- [ ] Reference commit hash that completed it
- [ ] Update parent STORY task count (e.g., "3/5 tasks complete")
- [ ] Verify test pass rate maintained

**Affected Files:** 2 files (TASK + STORY)
**Time to Check:** ~2 minutes

---

### 5. **BUG FIX COMPLETION CHECKLIST**
*Used when fixing a bug (e.g., BUG-027, BUG-030)*

**Sections to Update:**
- [ ] Update BUG ticket status to "✅ FIXED"
- [ ] Add "Fixed Date" and "Commit Hash"
- [ ] Move BUG from "OPEN" to "FIXED" section in NEXT-STEPS.md
- [ ] Update open bug count in summary
- [ ] Add test count if new tests were added
- [ ] Reference before/after PR or commit message

**Affected Files:** 2 files (BUG + NEXT-STEPS)
**Time to Check:** ~2 minutes

---

### 6. **DOCUMENTATION UPDATE CHECKLIST**
*Used when updating documentation (status changes, metric updates, etc.)*

**Sections to Update:**
- [ ] Update date/timestamp on modified file(s)
- [ ] If changing phase status, check all 3 phase locations
- [ ] If changing test counts, verify in CLAUDE.md, phase READMEs, NEXT-STEPS
- [ ] If moving/renaming tickets, check all cross-references
- [ ] Update "Last Updated" field in document header if present
- [ ] Add entry to "Recently Updated" log if major change

**Affected Files:** Variable (1-6 files)
**Time to Check:** ~5-10 minutes

---

## Checklist Grouping (Reduce Duplication)

### **SHARED SECTION: Status Updates**
Used by: Phase, Epic, Story, Task, Bug checklists
```
- [ ] Update [ITEM] status to "✅ COMPLETE"
- [ ] Update parent [PARENT] progress count
- [ ] Add completion date
```

### **SHARED SECTION: Cross-References**
Used by: Phase, Epic, Story, Bug checklists
```
- [ ] Link to associated PR/commit
- [ ] Update roadmap reference if applicable
- [ ] Add to "Recently Completed" section
```

### **SHARED SECTION: Test Verification**
Used by: Task, Story, Bug checklists
```
- [ ] Verify test pass rate (should be 100%)
- [ ] Document new test count if tests added
- [ ] Reference test file/ticket if applicable
```

---

## Implementation Recommendations

### **Option A: Master Checklist Document (Recommended)**
Create a single file: `docs/DOCUMENTATION-CHECKLISTS.md`
- Contains all 6 checklists plus shared sections
- Easy to reference during work
- Can be printed or copy-pasted
- Updatable in one place

**Pros:** Centralized, easy to maintain, one source of truth
**Cons:** Need to remember to check it

### **Option B: Per-Document Checklists**
Embed checklist at top of each ticket type
- TASK-TEMPLATE.md includes "Complete this TASK checklist"
- STORY-TEMPLATE.md includes "Complete this STORY checklist"
- Bug report template includes "Complete this BUG checklist"

**Pros:** Visible when editing the document
**Cons:** More files to maintain, easier to miss

### **Option C: Hybrid Approach**
Master checklist document + checklist links in frequently-used documents (NEXT-STEPS.md, CLAUDE.md)

**Pros:** Best of both worlds
**Cons:** Slightly more overhead

---

## Where Checklists Should Live

**Primary:** `/home/claude/manager/docs/DOCUMENTATION-CHECKLISTS.md` (Master reference)

**Secondary Links/References:**
- `/home/claude/manager/docs/tickets/NEXT-STEPS.md` - Link to bug/epic checklists
- `/home/claude/manager/CLAUDE.md` - Link to phase completion checklist
- `/home/claude/manager/docs/tickets/phase-X/README.md` - Link to relevant checklists

---

## When to Use Each Checklist

| Event | Checklist(s) | When | Who |
|-------|--------------|------|-----|
| Complete a TASK | Task → Story | After task PR merges | Developer + Project Manager |
| Complete a STORY | Story → Epic | After all tasks done | Developer + Project Manager |
| Complete an EPIC | Epic → Phase | After all stories done | Project Manager |
| Complete a PHASE | Phase | After all epics done | Project Manager |
| Fix a BUG | Bug | After bug PR merges | Developer + Project Manager |
| Update docs | Documentation | After status changes | Whoever makes change |

---

## Estimated Effort

**To Create:** 30-45 minutes
- Write master checklist document
- Add cross-reference links
- Test with one real example (e.g., recent BUG fix)

**To Maintain:** ~2 minutes per item completion
- Follow the appropriate checklist
- Check off items as you update docs
- Takes less time than finding/fixing inconsistencies

---

## Expected Benefits

✅ **Consistency:** All documentation stays aligned across files
✅ **Traceability:** Clear record of when work was completed
✅ **Speed:** Faster than manually searching for all places to update
✅ **Confidence:** Know you haven't missed a doc update
✅ **Scalability:** Easy to add more checklist types for future work items

---

## Rollout Plan

### Phase 1: Create (30 min)
- [ ] Write master checklist document
- [ ] Add links to key reference files
- [ ] Example walkthrough with one completed item

### Phase 2: Validate (15 min)
- [ ] Test checklists with Phase 2 Extension completion
- [ ] Adjust based on real usage feedback
- [ ] Share with team

### Phase 3: Iterate (Ongoing)
- [ ] Collect feedback after 1-2 phases
- [ ] Refine checklist structure if needed
- [ ] Document any new checklist types needed

---

## Approval Needed

This plan proposes:

1. ✅ Create master `DOCUMENTATION-CHECKLISTS.md` file (Master reference for all checklist types)
2. ✅ 6 checklist types (Phase, Epic, Story, Task, Bug, Documentation)
3. ✅ Grouped shared sections to reduce duplication
4. ✅ Links from NEXT-STEPS.md, CLAUDE.md to master checklist
5. ✅ Usage instructions for each checklist type

**Ready to proceed?** → Confirm approval and I will:
- Create `/home/claude/manager/docs/DOCUMENTATION-CHECKLISTS.md`
- Add reference links to key documents
- Commit and push changes
- Provide usage instructions

---

## Questions for Approval

Before I proceed, please confirm:

1. **Scope:** Does the proposed 6 checklist types cover your workflow?
2. **Location:** Is `docs/DOCUMENTATION-CHECKLISTS.md` the right place?
3. **Detail Level:** Is the level of detail appropriate (not too vague, not too granular)?
4. **Frequency:** Are you willing to spend 2 minutes per item following the checklist?
5. **References:** Should links also be added to epic/story/task templates?

Awaiting your approval and any adjustments before implementation.
