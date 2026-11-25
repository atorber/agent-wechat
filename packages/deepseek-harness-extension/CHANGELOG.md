# @agent-wechat/deepseek-harness-extension

## 3.0.0-beta.6

### Minor Changes

- [`d623abf`](https://github.com/thisnick/agent-wechat/commit/d623abfbb5c93db71bd5b5499f3806323346aa00) Thanks [@atorber](https://github.com/atorber)! - Add the DeepSeek Harness WeChat channel plugin: native daemon bridge with committed-live-only consumption, durable session routing and replies, admission policies (DM/group/mention, default closed), seventeen scoped WeChat tools (current-chat, owner, opt-in archive, opt-in calls) with per-step model-side visibility, media pipeline annotations, voice calls with OpenAI speech (fail-closed, opt-in, call summaries in a dedicated storage domain), and fail-soft activation.

- [`5ca6fa1`](https://github.com/thisnick/agent-wechat/commit/5ca6fa17c86cea01422d8a4c6d8d108d97fa0265) Thanks [@atorber](https://github.com/atorber)! - Add the `wechat_push` message-push tool: when `push.enabled` is true with at
  least one `push.targets` entry, every DSH session (including non-WeChat
  agents) can send one-way notification messages to the configured WeChat ids
  or group ids. Targets outside the whitelist are rejected; delivery rides the
  durable outbox with canonical readback and `needs_review` semantics. Also
  adds push fields to the visual settings page, and gives every wxid / group-id
  field a directory search picker backed by a new host-side, read-only
  `/plugins/wechat-channel/search` route.

- [`d623abf`](https://github.com/thisnick/agent-wechat/commit/d623abfbb5c93db71bd5b5499f3806323346aa00) Thanks [@atorber](https://github.com/atorber)! - Add a visual settings page for the WeChat channel plugin: a client half
  registers the bundle in the Settings panel (微信通道 nav page) and on its
  Plugins page, with an editable form for hub address, run mode, DM/group
  admission, owner allowlist, tool grants, and the calls block. Edits are
  validated against the plugin Config schema and written to the profile patch;
  overridden fields get a reset control and secrets are never displayed. Both
  surfaces also show a live connection status (polled from a read-only
  `/plugins/wechat-channel/status` route on the host web server).

### Patch Changes

- Create WeChat chat sessions inside a workspace-owned working directory so they appear in the host conversation list. New `sessionCwd` config (defaults to the first registered workspace path); changing it rebinds existing chats once — the next message in each chat starts a fresh, visible session.

- Auto-unarchive the bound session on resume. When the host workspace has archived the session a WeChat route is bound to, every model step was rejected by the archived-session gate, so turns ended `blocked` and no reply was ever produced while the channel still looked connected. The session router now checks the host archive set before resuming and lifts the session out of the archive first.

- Harden the WeChat channel against the zombie-channel failure mode: the
  consumer loop could exit after an aborted watch, and an effect dispose that
  hung on a host-side cleanup step (projection or storage domain dispose) left
  the plugin fiber stuck mid-unload — the status route kept reporting
  `running: true` while no messages were consumed. Cleanup steps are now
  individually bounded (8s default) and fault-tolerant, the stop path is
  traced, and a 30s watchdog revives the channel automatically if the runtime
  dies without a dispose.
