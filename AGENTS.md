# Repository Guidelines

## Project Structure & Module Organization
- Current repo is documentation-first. `requirements/` holds product briefs, user stories, and experience notes; keep any new discovery docs here. `doc/` is reserved for design artifacts (diagrams, flows) to keep the root clean. When code is added, group it under `src/` with feature-focused subfolders and colocate tests alongside implementation.

## Build, Test, and Development Commands
- No build pipeline exists yet; if you introduce one, add stack-specific setup to `README.md` and keep reproducible commands in npm scripts (e.g., `npm run dev`, `npm run build`, `npm test`). Document any toolchain prerequisites (Node version, package manager) and prefer lockfiles.

## Coding Style & Naming Conventions
- Markdown: concise paragraphs, sentence-case headings, and bullet lists for user journeys. Favor ASCII; include Unicode only when needed for clarity already used in source material. Filenames should be kebab-case for docs (`user-stories.md`) and PascalCase for future UI components (`BookingCard.tsx`). For future TypeScript/React work, prefer functional components, hooks, and strongly typed props; keep functions small and single-purpose.

## Testing Guidelines
- Add tests with any new executable code. For TypeScript/Node stacks, default to Vitest or Jest with colocated `*.spec.ts` files and fast unit coverage; add integration tests for API edges. Provide a short test plan in PRs describing what was run. If you introduce new commands, expose them as `npm test` and ensure they pass in CI before merging.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) to make history searchable. Keep commits scoped and reviewable. PRs should state intent, link issues or tickets, and include screenshots or clips for UX changes. Note breaking changes explicitly and list any configuration or migration steps.

## Security & Configuration Tips
- This domain handles guest data and payments; never commit secrets, API keys, or real PII. Store environment values in `.env` and share only `.env.example` with placeholder keys. Anonymize sample data in docs. When adding integrations (PMS, payments), gate them behind feature flags and document required environment variables.
