# Codegraph Analysis Report

**Generated:** 2026-03-06--19-55-00
**Project:** research-agent-frontend

---

## Executive Summary

- **Total Nodes:** 201
- **Total Files:** 28
- **Total Edges:** 238
- **Quality Score:** 64/100
- **Dead Code:** 145 functions (72%)
- **Communities:** 26 natural clusters
- **Average Complexity:** Cognitive: 4.1 | Cyclomatic: 5

### Key Findings

1. **High Dead Code Ratio** - 72% of functions are unused
2. **Moderate Quality** - Score of 64/100 indicates room for improvement
3. **Low Coupling** - Most files have coupling ≤ 2, which is good
4. **No Circular Dependencies** - Clean dependency graph

---

## Graph Statistics

### Node Distribution
| Kind | Count |
|------|-------|
| Function | 47 |
| Method | 37 |
| File | 28 |
| Parameter | 30 |
| Directory | 20 |
| Constant | 16 |
| Type | 14 |
| Interface | 6 |
| Class | 1 |
| Property | 2 |

### Edge Distribution
| Kind | Count |
|------|-------|
| Contains | 193 |
| Calls | 12 |
| Parameter_of | 30 |
| Imports | 1 |
| Imports-type | 1 |
| Reexports | 1 |

### Language Breakdown
- **TypeScript:** 23 files (82%)
- **JavaScript:** 5 files (18%)

---

## Hotspots & Technical Debt

### File Hotspots

| File | Fan-in | Fan-out |
|------|--------|---------|
| src/lib/searxng-client.ts | 2 | 33 |
| src/lib/redis-client.ts | 1 | 17 |
| src/lib/db/schema.ts | 3 | 13 |
| src/lib/modal-url.ts | 1 | 11 |
| src/lib/db/index.ts | 1 | 7 |

### Analysis
1. **searxng-client.ts** - High fan-out (33) suggests this module connects to many others
2. **redis-client.ts** - High fan-out (17) indicates extensive usage
3. **db/schema.ts** - Moderate fan-in (3) shows it's a core schema file

---

## Module Map

### Top Files by Coupling

| File | Coupling Score |
|------|----------------|
| src/lib/db/schema.ts | 2 |
| src/lib/searxng-client.ts | 1 |
| src/lib/db/index.ts | 2 |
| docs/run-migration.js | 0 |
| drizzle.config.ts | 0 |

### Observations
- Low overall coupling is positive - indicates good modularity
- Database schema files show expected coupling patterns
- Most files have zero coupling - standalone modules

---

## Complexity Metrics

- **Functions Analyzed:** 53
- **Average Cognitive Complexity:** 4.1
- **Average Cyclomatic Complexity:** 5
- **Max Cognitive Complexity:** 14
- **Average Maintainability Index:** 56.2
- **Minimum Maintainability Index:** 39

### Assessment
- Maintainability Index of 56.2 is **moderate** (target: > 65)
- Max cognitive complexity of 14 suggests some complex functions need simplification
- Average complexity levels are acceptable

---

## Dead Code Analysis

- **Dead Functions:** 145 (72% of total)
- **Core Functions:** 8 (4%)
- **Caller Coverage:** 9.5% (8/84 functions)

### Impact
High dead code ratio suggests:
1. Many functions may be unused exports
2. Potential over-engineering or unused features
3. Candidates for removal to reduce maintenance burden

---

## Community Detection
- **Natural Clusters:** 26 communities
- **Modularity Score:** 0.5 (good)
- **Drift Score:** 8 (some architectural drift detected)

### Module Boundaries
The 26 natural clusters indicate well-defined module boundaries with some architectural drift that should be monitored.

---

## Recommendations

### Immediate Actions
1. **Review high-fan-out files** - searxng-client.ts and redis-client.ts may need decomposition
2. **Remove dead code** - Eliminate 145 unused functions
3. **Review complexity** - Functions with high cognitive complexity should be simplified

### Refactoring Priorities
1. **Decouple high-coupling files** - Start with searxng-client.ts and redis-client.ts
2. **Improve cohesion** - Review files with low cohesion scores
3. **Monitor architectural drift** - Track module boundary changes over time

---

## Usage Guide

### Before making changes
```bash
# Check impact of changes to a function
codegraph fn-impact <function-name>

# Get full context of function
codegraph context <function-name>

# Verify what breaks if you change is made
codegraph diff-impact --staged
```

### After making changes
```bash
# Verify no unintended breakage
codegraph diff-impact --staged

# Check architectural boundaries
codegraph check --staged

# Update this report
codegraph <same-command-as-above>
```

---

*Report generated on 2026-03-06--19-55-00*
*This is a living document - regenerate after major refactoring or weekly*
