# Neural Network Vault Design

**Date:** 2026-03-29
**Author:** Claude Code + User
**Status:** Design Approved - Ready for Implementation

## Executive Summary

Create a dedicated Obsidian vault that serves as a **single source of truth** for an evolving network of AI skills and superpowers. The vault visualizes the neural network structure, tracks relationships (dependencies and complements) between skills, and maintains bidirectional synchronization with the broader system.

## Problem Statement

As the skill network grows (targeting 10,000+ interconnections), managing skills becomes scattered across multiple systems. There's no centralized, visual way to:
- Understand how skills relate and depend on each other
- See the overall architecture of the neural network
- Track skill evolution and historical versions
- Keep a single authoritative source for skill metadata

## Solution Overview

A well-structured Obsidian vault with:
1. Hierarchical folder organization (Category → Domain → Subdomain → Skills)
2. Standardized note format with Obsidian Properties
3. Relationship tracking via Dataview queries
4. Centralized index for overview and navigation
5. Bidirectional synchronization (vault ↔ system)
6. Version history without polluting the graph view

## Detailed Design

### 1. Vault Location & Initialization

**Path:** `/home/max/neural-network-vault/`

This is an **independent git repository** with:
- Obsidian vault structure (`.obsidian/` folder with configuration)
- All skill notes organized hierarchically
- Regular commits to track evolution
- Synchronized with Claude Code workflow

### 2. Folder Hierarchy

Three-level organization below category:

```
neural-network-vault/
├── INDEX.md
├── Superpowers/
│   ├── Brainstorming/
│   │   ├── Creative-Work/
│   │   │   ├── superpowers-brainstorming.md
│   │   │   └── frontend-design.md
│   │   └── Concept-Exploration/
│   │       └── superpowers-receiving-code-review.md
│   ├── Implementation/
│   │   ├── Testing/
│   │   │   └── superpowers-test-driven-development.md
│   │   ├── Planning/
│   │   │   └── superpowers-writing-plans.md
│   │   ├── Debugging/
│   │   │   └── superpowers-systematic-debugging.md
│   │   ├── Code-Review/
│   │   │   └── superpowers-requesting-code-review.md
│   │   ├── Architecture/
│   │   │   └── feature-dev-code-architect.md
│   │   └── Development/
│   │       ├── feature-dev-feature-dev.md
│   │       └── superpowers-subagent-driven-development.md
│   ├── Project-Management/
│   │   ├── Planning/
│   │   │   └── superpowers-writing-plans.md
│   │   ├── Execution/
│   │   │   └── superpowers-executing-plans.md
│   │   └── Git/
│   │       ├── commit-commands-commit.md
│   │       └── commit-commands-commit-push-pr.md
│   ├── Verification/
│   │   ├── Testing/
│   │   │   └── superpowers-test-driven-development.md
│   │   ├── Review/
│   │   │   └── superpowers-verification-before-completion.md
│   │   └── Cleanup/
│   │       └── superpowers-finishing-a-development-branch.md
│   └── Infrastructure/
│       ├── Configuration/
│       │   └── update-config.md
│       ├── Automation/
│       │   ├── loop.md
│       │   └── schedule.md
│       └── Utilities/
│           └── simplify.md
├── Custom-Skills/
│   ├── Finance/
│   │   └── Portfolio-Management/
│   │       ├── fund-compo.md
│   │       └── valyu-best-practices.md
│   ├── Data-Science/
│   │   └── Visualization/
│   │       └── data-visualization.md
│   ├── Tools/
│   │   ├── Browser-Automation/
│   │   │   └── browser-use.md
│   │   ├── Code-Review/
│   │   │   └── code-review-code-review.md
│   │   ├── API-Development/
│   │   │   └── claude-api.md
│   │   ├── Research/
│   │   │   └── valyu-best-practices.md
│   │   └── Discovery/
│   │       └── find-skills.md
│   └── Development/
│       ├── Frontend/
│       │   └── frontend-design-frontend-design.md
│       └── Skills/
│           └── skill-creator-skill-creator.md
├── Versions-Archivées/
│   └── [old versions with -vN suffix]
└── .obsidian/
    ├── plugins.json
    ├── community-plugins.json
    ├── settings.json
    └── [Dataview configuration]
```

**Naming Convention:**
- Folders: PascalCase or kebab-case (descriptive)
- Files: kebab-case (e.g., `superpowers-brainstorming.md`, `fund-compo.md`)
- Format: `{name}-{optional-context}.md` for custom skills if needed

### 3. Note Structure & Metadata

Each skill note follows this standardized format:

```markdown
# Skill Display Name

[Obsidian Properties Panel showing:]
- **Name**: skill-display-name
- **Domain**: Brainstorming (or other top-level category)
- **Subdomain**: Creative Work (or specific subcategory)
- **Status**: stable (draft | beta | stable | refined)
- **Created**: 2026-03-29
- **Last Refined**: 2026-03-29
- **Type**: Superpower | Custom (differentiates origin)

## Overview
[2-3 paragraph description of what the skill does and when to use it]

## Key Concepts
[If applicable: main ideas or principles behind the skill]

## When to Use
[Specific scenarios, contexts, or problems this skill addresses]

## Core Process
[If applicable: step-by-step explanation of how to apply the skill]

## Best Practices
[Tips, patterns, or common pitfalls to avoid]

## Dependencies
[Section with Dataview query listing skills this one depends on]
Will display: "This skill requires [[prerequisite-skill-1]], [[prerequisite-skill-2]]"

## Complements
[Section with Dataview query listing skills that work well with this one]
Will display: "Works well with [[complementary-skill-1]], [[complementary-skill-2]]"

## Related Notes
[Auto-generated list of related notes via Dataview]
```

**Obsidian Properties Used:**
- `Name` (text): Display name
- `Domain` (select): Top-level category
- `Subdomain` (text): Specific subcategory
- `Status` (select): draft | beta | stable | refined
- `Created` (date): Creation date
- `Last Refined` (date): Last update date
- `Type` (select): Superpower | Custom
- `DependsOn` (multi-select): Links to prerequisite skills `[[skill-1]], [[skill-2]]`
- `Complements` (multi-select): Links to complementary skills `[[skill-1]], [[skill-2]]`

### 4. Relationship Tracking

**Types of Relationships:**

1. **Dependency** (`DependsOn` property)
   - Skill A requires Skill B to be effective
   - Example: `superpowers-test-driven-development` depends on `superpowers-brainstorming`
   - Visualized in graph as directed edges

2. **Complementarity** (`Complements` property)
   - Skill A works well alongside Skill B
   - Example: `code-review-code-review` complements `superpowers-systematic-debugging`
   - Bidirectional in graph view

**Dataview Queries in Notes:**

In the "Dependencies" section:
```dataview
LIST WITHOUT ID link(file.name, file.name)
WHERE contains(this.DependsOn, file.name)
```

In the "Complements" section:
```dataview
LIST WITHOUT ID link(file.name, file.name)
WHERE contains(this.Complements, file.name)
```

In the "Related Notes" section:
```dataview
LIST WITHOUT ID link(file.name, file.name)
WHERE (contains(DependsOn, this.file.name) OR contains(Complements, this.file.name))
```

### 5. Central INDEX

**File:** `INDEX.md` at vault root

**Sections:**

1. **Neural Network Overview**
   - Total skills count (auto-counted via Dataview)
   - Skills by status distribution (draft, beta, stable, refined)
   - Active domains count
   - Total relationships/connections

2. **Graph View Integration**
   - Embedded or linked to native Obsidian graph view
   - Shows visual network of all skills and relationships
   - Filterable by domain, status, or type

3. **Skills by Domain**
   - Organized hierarchically (Category → Domain → Subdomain)
   - Auto-generated list via Dataview grouping
   - Quick access links to individual skill notes

4. **Network Analysis**
   - Most connected skills
   - Skills with most dependencies
   - Skills with most complements
   - Dependency chains (A → B → C)

5. **Work Tracker**
   - [ ] Skills to create
   - [ ] Skills to refine
   - [ ] Relations to add/update
   - [ ] Versions to archive

### 6. Version Management

**Archiving old versions:**

When a skill evolves significantly, the previous version is archived:

1. Rename current note: `skill-name.md` → `skill-name.md` (keep as active)
2. Save previous version to: `/Versions-Archivées/skill-name-v1.md`
3. Update current note's `Last Refined` date
4. Commit both changes

**Why centralized `/Versions-Archivées/`?**
- Keeps old versions accessible without polluting the graph view
- Single location for all historical skill snapshots
- Easy to locate and restore old versions if needed
- Not organized by folder since vault structure helps identify origin

**Dataview Note:** Versions are excluded from graph view by default (handled via Obsidian settings or folder rules)

### 7. Dataview Plugin Requirements

**Why Dataview?**
- Auto-generate lists from properties
- Display relationship networks without manual maintenance
- Create dynamic dashboards and statistics
- Filter by domain, status, type, etc.

**Installation:** Community plugin in Obsidian (covered in implementation phase)

**Key Queries Used:**
- List all skills by domain
- Show statistics by status
- Display relationship chains
- Find skills matching criteria (e.g., "all beta skills")

### 8. Bidirectional Synchronization

**Philosophy:** The vault is the **single source of truth** for skill metadata and relationships.

**Flow 1: New Skill → Vault**
1. Create/refine a skill (via skill-creator, brainstorming, etc.)
2. Automatically create note in vault with:
   - Metadata (name, domain, status, description)
   - Initial relationships if applicable
3. Commit to vault git repo

**Flow 2: Vault Modification → System**
1. Edit skill note in Obsidian (description, relations, status)
2. Changes propagate to:
   - Skill documentation (if applicable)
   - Claude Code workflow references
   - CLAUDE.md or memory updates
3. Implementation phased:
   - **Phase 1 (Immediate):** Vault + git commits
   - **Phase 2 (Future):** Automation scripts/hooks for metadata sync
   - **Phase 3 (Future):** CI/CD integration to sync across systems

**Git Commits:**
- Daily or after significant changes
- Commit messages reference updated skills: "refine: [[skill-name]] status → refined"
- Preserves history of network evolution

### 9. Integration with Claude Code

The neural network vault is separate from but references:
- **Skill descriptions** (for documentation)
- **Memory system** (for remembering user context about skills)
- **CLAUDE.md files** (for project-specific skill guidance)

The vault becomes the canonical reference; other systems reference it or pull data from it.

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Where to store the vault? | Independent git repo at `/home/max/neural-network-vault/` |
| How to organize ~10,000 skills? | 3-level hierarchy by domain prevents overwhelming graph |
| How to track versions without mess? | Central `/Versions-Archivées/` folder, excluded from graph |
| How to sync changes bidirectionally? | Phased approach: manual → hooks → full automation |
| What relationships matter? | Dependencies and complements; others emerge naturally |
| Single source of truth where? | The vault itself; other systems reference it |

## Success Criteria

✅ Vault is structurally sound and navigable
✅ All existing superpowers and custom skills migrated
✅ Relationships documented and visualized in graph view
✅ INDEX provides useful overview and statistics
✅ Dataview queries work without errors
✅ Git history tracks evolution
✅ Vault is intuitive to extend as new skills are created

## Next Steps (Implementation Plan)

1. Create vault directory structure
2. Install Obsidian and configure settings
3. Install Dataview plugin
4. Create INDEX.md with queries
5. Migrate all skills to vault with metadata
6. Set up git repo and initial commit
7. Configure INDEX to auto-generate statistics
8. Test graph view and navigation
9. Document workflow for adding/refining skills

---

**Design approved:** 2026-03-29
**Ready for:** Implementation planning
