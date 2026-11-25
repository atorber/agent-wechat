---
'@agent-wechat/deepseek-harness-extension': patch
---

Fix false `Native send was not accepted (no serverId)` errors from `wechat_push` and text sends.

The daemon accepts a send asynchronously: the POST returns a send intent whose `serverId` stays null until WeChat acknowledges the message. The outbox transport treated that pending state as a rejection, so the tool surfaced an error even though the message was delivered, and the journal entry stayed `pending`. The transport now treats the POST as accepted as long as the daemon returns a send id, and the outbox reconciles by idempotency key until the daemon reports the WeChat id (or holds the entry `needs_review` after the readback window). Send readbacks no longer require the daemon to echo the message text back — the canonical record is the daemon's own per-key entry, so entries can confirm without a text echo.
