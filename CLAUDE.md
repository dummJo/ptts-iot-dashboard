<!-- dv-harness:boot:start v0.1.0 -->
## Boot: load the hub first

This repo is part of the DummVinci ecosystem. The private hub repo `dummJo/dummvinci-md` is the single source for workstream status, working rules, the model roster, the MCP and plugin registry, and the repo registry.

Before the first task in a session:

1. Run skill `dv-boot` (plugin `dummvinci-harness@dummvinci`). Without the plugin, locate the hub (`$DUMMVINCI_MD`, `../dummvinci-md`, `~/dummvinci-md`; in a cloud session, attach `dummJo/dummvinci-md`) and read, in order: `CLAUDE.md`, `_harness/INIT.md`, `_harness/STATUS.yaml`, `_harness/REPOS.yaml`, `_harness/MODELS.md`, `_Global-Memory/PREFERENCES.md`, `_Global-Memory/FEEDBACK.md`, `_MCP/INDEX.md`.
2. Do not read the hub's `_Personal/` or pricing files from this repo, and never copy hub content into this repo's files, commits, PRs, or issues.
3. Multi-agent work: skill `dv-orchestrate`. Model choice: hub `_harness/MODELS.md`, never a model ID written in this repo. Status updates go to the hub's `_harness/STATUS.yaml`.

If the hub cannot be loaded, say so in the first reply and continue with local context only.
<!-- dv-harness:boot:end -->

@AGENTS.md
