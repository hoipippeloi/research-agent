---
name: codegraph-insight
description: Generate comprehensive codebase analysis using codegraph CLI and output a timestamped markdown document with dependency graphs, impact analysis, architectural insights, code health metrics, and recommendations. Use when analyzing codebases, understanding project structure, preventing breaking changes, or documenting architecture for Svelte, TypeScript, PostgreSQL, Tailwind, or auth-related projects.
---

# Codegraph Insight Generator

Generate a comprehensive, timestamped analysis of your codebase using codegraph.

## What This Skill Does

Runs complete codegraph analysis and generates a single `CODEGRAPH-{timestamp}.md` file in your project root containing:

✅ Dependency graphs (file & function level)
✅ Impact analysis for changes
✅ Architectural insights & hotspots
✅ Code health metrics (complexity, maintainability)
✅ Dead code detection
✅ Circular dependencies
✅ Module boundaries & cohesion scores
✅ Recommendations for improvements
✅ Framework-specific analysis (Svelte, TypeScript, auth, database, API)

## Prerequisites

```bash
# Check if codegraph is installed
npm list -g @optave/codegraph

# If not installed
npm install -g @optave/codegraph
```

## When to Use This Skill

Use when:
- Starting work on a new codebase
- Planning a refactoring
- Documenting architecture
- Identifying technical debt
- Preparing for code review
- Onboarding new team members
- Auditing authentication/database layers

## Workflow

### 1. Build the graph if needed

```bash
# Check if graph exists
ls .codegraph/graph.db 2>/dev/null

# Build if missing
codegraph build
```

### 2. Collect analysis data

Run each command and capture output:

```bash
# Graph statistics
codegraph stats -j

# Most connected files
codegraph map -n 30 -j

# Directory structure
codegraph structure -j

# Hotspots at triage
codegraph triage --level file -T -j
codegraph triage --level directory -T -j

# Complexity metrics
codegraph complexity --health -T -j

# Dead code
codegraph roles --role dead -T -j

# Circular dependencies
codegraph cycles -j

# Natural boundaries
codegraph communities -j

# Role classification
codegraph roles -j
```

### 3. Analyze framework-specific areas

```bash
# Svelte components
codegraph query --kind component -j
codegraph deps src/lib/components -j

# TypeScript architecture
codegraph query --kind class -j
codegraph query --kind interface -j

# Auth-related code
codegraph search "auth; authentication; login; session" --mode hybrid -n 20 -j

# Database layer
codegraph search "database; postgres; pool; connection" --mode hybrid -n 20 -j

# API endpoints
codegraph deps src/routes -j
codegraph impact src/routes -j
```

### 4. Generate the markdown document

Create `CODEGRAPH-{timestamp}.md` with this structure:

```markdown
# Codegraph Analysis Report

**Generated:** {timestamp}
**Project:** {project name}

## Executive Summary
{Brief overview of codebase health and structure}

## Table of Contents
- Graph Statistics
- Module Map
- Architecture & Structure
- Code Health Metrics
- Dead Code & Unused Exports
- Circular Dependencies
- Community Detection
- Hotspots & Technical Debt
- Svelte Components Analysis
- TypeScript Architecture
- Authentication Flow
- Database Layer
- API Endpoints
- Recommendations

## [Sections]
{Insert output from each command in appropriate sections}

## Recommendations

### Immediate Actions
1. {Critical issues from hotspots}
2. {Circular dependencies to break}
3. {Dead code to remove}

### Refactoring Priorities
1. {High complexity functions}
2. {Low cohesion directories}
3. {Architectural improvements}

## Appendix: Usage Guide
{How to use this document for refactoring, debugging, and preventing breakage}
```

### 5. Save the document

```bash
# Write to project root
Write the complete markdown to CODEGRAPH-{timestamp}.md
```

## Example Usage

**Scenario 1:** "I need to understand this svelte + TypeScript codebase with postgres auth"

→ Run this skill to generate comprehensive documentation with all dependencies and architecture insights.

**Scenario 2:** "Let's refactoring the auth system, what will break?"

→ Run this skill and then check the Authentication Flow and API Endpoints sections for impact analysis.

**Scenario 3:** "What needs the most attention in this codebase?"

→ Run this skill and review the Hotspots & Technical Debt section.

## Key Benefits

✅ Single source of truth - All codegraph insights in one document
✅ Timestamped snapshots - Track codebase evolution
✅ Comprehensive coverage - From high-level architecture to function-level details
✅ Actionable recommendations - Specific items to address
✅ Reusable - Generate new reports as codebase evolves

## Related Commands

After generating the report:

```bash
# Deep dive into specific functions
codegraph context <name> -T

# Check change impact
codegraph diff-impact --staged

# Search semantically
codegraph search "your query" --mode hybrid

# Watch for changes
codegraph watch

# Validate changes
codegraph check --staged
```
