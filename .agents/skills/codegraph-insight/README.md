# Codegraph Insight Skill

Generate comprehensive, timestamped codebase analysis reports using codegraph CLI.

## Installation

This skill is already installed in your `.agents/skills/codegraph-insight/` directory.

To install in a different project:

```bash
cp -r .agents/skills/codegraph-insight /path/to/project/.agents/skills/
```

## What This Skill Does

Generates a single markdown file (`CODEGRAPH-{timestamp}.md`) in your project root containing:

✅ Graph statistics (nodes, edges, files, quality scores)  
✅ Hotspots analysis (high fan-in/fan-out files)  
✅ Module map (file coupling and dependencies)  
✅ Complexity metrics (cognitive, cyclomatic, maintainability index)  
✅ Dead code detection (unused functions and exports)  
✅ Circular dependencies  
✅ Community detection (natural module boundaries)  
✅ Framework-specific analysis:
  - Svelte components
  - TypeScript architecture
  - Authentication flow
  - Database layer
  - API endpoints
✅ Actionable recommendations (prioritized by severity)

## Prerequisites

**Required:**
- Node.js 18+
- codegraph CLI installed globally (`npm install -g @optave/codegraph`)

**Check installation:**
```bash
npm list -g @optave/codegraph
```

## Usage

### Basic Usage

Simply invoke the skill when analyzing any codebase:

```
"generate a codegraph report"
"analyze codebase with codegraph"
"create architecture documentation"
```

### What Gets Generated

1. **Timestamped Report File:** `CODEGRAPH-{timestamp}.md` in the project root
2. **Comprehensive Analysis:** 8 sections covering all major codebase metrics
3. **Recommendations:** Prioritized list of actions to improve code quality

### Sample Output Structure

```markdown
# Codegraph Analysis Report

**Generated:** 2026-03-06-19-55-00
**Project:** frontend

## Executive Summary
- Total Nodes: 201
- Total Files: 28
- Quality Score: 64/100
- Dead Code: 145 functions (72%)

## Graph Statistics
- Node distribution by kind
- Edge distribution by kind
- Language breakdown

## Hotspots & Technical Debt
- High fan-out files (searxng-client.ts, redis-client.ts)
- High coupling files

## Module Map
- File coupling scores
- Dependency analysis

## Complexity Metrics
- Average cognitive complexity: 4.1
- Average cyclomatic complexity: 5
- Average maintainability index: 56.2

## Dead Code Analysis
- 145 dead functions broken down by category
- Infrastructure code (planned)
- Development code (testing/planning)
- Test infrastructure

## Circular Dependencies
- No circular dependencies detected

## Community Detection
- 26 natural clusters
- Modularity score: 0.5

## Recommendations
### Immediate Actions
1. Review high-fan-out files
2. Remove dead code
3. Review complexity

### Refactoring Priorities
1. Decouple high-coupling files
2. Improve cohesion
3. Monitor architectural drift

## Usage Guide
Commands for ongoing monitoring with codegraph
```

## When to Use This Skill

Use this skill when you need to:
- 📊 **Understand a codebase quickly** (new project, onboarding, review)
- 🔍 **Identify technical debt** (hotspots, dead code, complexity)
- 🏗️ **Plan refactoring** (understand dependencies before making changes)
- 📝 **Document architecture** (create comprehensive reports)
- 🛡️ **Prevent breaking changes** (impact analysis)
- 🎯 **Improve code quality** (actionable recommendations)

## Supported Languages

Codegraph supports 11 languages:
- JavaScript/TypeScript
- Python
- Go
- Rust
- Java
- C#
- PHP
- Ruby
- HCL (Terraform)
- And more...

## Understanding "Dead Code"

The skill categorizes dead code into three types:

1. **Infrastructure Code** (planned) - Built for future features
   - Database utilities (connection pooling, management)
   - Type definitions (interfaces for type safety)
   - Configuration files (env variables, parsing)

2. **Development Code** - Testing and planning utilities
   - Configuration files (vite, sveltekit)
   - Test infrastructure (setup, utilities)
   - Placeholder implementations (routes not yet implemented)
   - API scaffolding (route structure for future features)

3. **Test Infrastructure** - Essential for quality
   - Test configuration (playwright, vitest)
   - Test utilities (mock helpers, fixtures)
   - Test data (fixtures, mocks)

**Not all "dead code" should be removed!** Some represents:
- Planned infrastructure for upcoming features
- Type safety and compile-time checks
- Testing and development workflows
- Configuration and build setup

## Workflow

1. **Check/Build Graph** - Ensures codegraph database exists
2. **Collect Data** - Runs 8+ codegraph commands
3. **Analyze** - Framework-specific deep dives (Svelte, TypeScript, auth, database, API)
4. **Generate Report** - Creates timestamped markdown file
5. **Provide Recommendations** - Prioritized, actionable items

## Related Codegraph Commands

After generating the report, use these commands for ongoing monitoring:

```bash
# Check impact of changes to a function
codegraph fn-impact <function-name>

# Get full context of a function
codegraph context <function-name>

# Check what breaks if you change staged files
codegraph diff-impact --staged

# Search for code semantically
codegraph search "authentication flow"

# Watch for changes
codegraph watch

# Validate changes
codegraph check --staged
```

## Benefits

✅ **Single source of truth** - All codegraph insights in one document  
✅ **Timestamped snapshots** - Track codebase evolution over time  
✅ **Comprehensive coverage** - From high-level architecture to function-level details  
✅ **Actionable recommendations** - Specific items to address based on analysis  
✅ **Reusable** - Generate new reports as codebase evolves  
✅ **Framework-aware** - Specialized analysis for Svelte, TypeScript, auth, database, API layers

## License

MIT

## Maintainer

Created by the skill-creator skill for research-agent project.

## Version

1.0.0

## See Also

- [Codegraph Documentation](https://github.com/optave/codegraph)
- [Codegraph CLI Reference](https://github.com/optave/codegraph#commands)
