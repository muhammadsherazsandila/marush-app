<!-- superplan-entry-instructions:start -->
# Superplan Operating Contract

Apply this contract for any request that may touch the repo: implementation, debugging, review, planning, repo-specific clarification, or broad exploration.

Before doing any of that work, load and follow `superplan-entry` from the first available path:
- `C:\Users\Anonymous\.config\superplan\skills\superplan-entry\SKILL.md`

Non-negotiable rules:
- No implementation before loading and following `superplan-entry`.
- No broad repo exploration before loading and following `superplan-entry`.
- No planning or repo-specific clarification before loading and following `superplan-entry`.
- Keep workflow control internal: do not narrate skill names, routing, or command logs to the user.
- Treat the Superplan CLI as the execution control plane for structured repo work, even when tracked changes and runtime live under a shared project state root such as `~/.config/superplan/project-<name>-<hash>/` and are surfaced as `.superplan/...` from the repo root.
- Prefer workspace harnesses, scripts, and custom workflows when `superplan-entry` routes you there.
- For repo work that will enter execution, create or claim a tracked Superplan task before editing files or mutating repo state — even lightweight work.
- Users cannot see active execution without a task; task creation is not ceremony, it is visibility.

Task creation rule:
- Read-only repo inspection, local reasoning, and user-facing planning may happen before task creation.
- Any work that edits files, mutates repo state, or enters tracked execution must be attached to a Superplan task first.
- Do not treat "this is small" or "this is obvious" as a reason to skip task creation once execution is about to begin.
- For tiny work, one `direct`-depth task is enough; for multi-step work, shape a full task graph.
- Task creation happens before the first file edit or stateful repo mutation, not after.
- Non-trivial edits require a concrete task contract, not just a vague intent to work on something.
- Multi-file refactors should happen only when the task graph already declares that work.

Session focus rule:
- Session-local routing depends on a stable per-chat `SUPERPLAN_SESSION_ID`.
- If the host or startup hook already exported `SUPERPLAN_SESSION_ID`, preserve it on every `superplan` command in this chat.
- If startup context gives you a Superplan session token but the host did not auto-export it, prefix every Superplan CLI command with `SUPERPLAN_SESSION_ID=<token>`.
- If the host has no startup hook or session export path, mint one stable chat-local token before the first Superplan CLI command and reuse it for the rest of the chat.
- Use `superplan run --fresh --json` when the user starts unrelated work in the same chat and you need to bypass the saved session focus without explicitly resuming old work.

Communication modes:
- `control-plane mode` is the default for `superplan-entry`, `superplan-route`, `superplan-shape`, `superplan-execute`, and normal lifecycle handling. Be terse, outcome-focused, and mostly silent about workflow mechanics. No phase narration.
- `planning mode` is for `superplan-plan`, `superplan-brainstorm`, or any point where the user needs help choosing an approach. Be detailed about approaches, recommendation, trade-offs, and execution path while keeping Superplan ceremony in the background.
- Do not blend the modes accidentally: control-plane work should stay quiet, and planning work should make the useful reasoning visible.

Canonical loop when Superplan is active:
1. If continuing known work, run `superplan run <task_ref> --json`; if the user starts unrelated work in this same chat, run `superplan run --fresh --json`; otherwise start with `superplan run --json`.
2. Treat the returned active-task context as the edit gate. Do not edit repo files until a run command has returned an active task for this turn.
3. If `run` did not return an active task for the current work, shape and scaffold the minimal honest task now, then claim it.
4. Use `superplan status --json` only when you need frontier orientation, human inspection, or recovery after ambiguity.
5. Continue through the owning Superplan phase instead of improvising a parallel workflow.
6. Use lifecycle commands such as `superplan task runtime block`, `superplan task runtime request-feedback`, and `superplan task review complete`, and use `superplan worktree ensure <change> --json` / `superplan worktree list --json` when execution-root routing needs repair; never hand-edit shared runtime files under `~/.config/superplan/project-<name>-<hash>/runtime/`.

Decision guardrails:
- If readiness is missing, give the concrete missing-layer guidance and stop.
- If work is already shaped, resume the owning execution or review phase instead of routing from scratch.
- If the request is large, ambiguous, or multi-workstream, route before implementing.
- If the agent is about to edit a file or mutate repo state without a tracked task, stop and create or claim the task first.
- If `superplan run`, `status`, or task activation returns an unexpected lifecycle or runtime error, the next action must be another Superplan command, not implementation.
- If `superplan run` or task activation returns `EXECUTION_ROOT_OCCUPIED` or `EXECUTION_ROOT_STALE`, inspect or repair execution roots with `superplan worktree list --json` or `superplan worktree ensure <change> --json` before editing in the wrong checkout.
- If `superplan run` fails, do not proceed until the task is blocked, reopened, repaired, or clarified through Superplan.
<!-- superplan-entry-instructions:end -->
