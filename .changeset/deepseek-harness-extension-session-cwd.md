---
'@agent-wechat/deepseek-harness-extension': patch
---

Create WeChat chat sessions inside a workspace-owned working directory so they appear in the host conversation list. New `sessionCwd` config (defaults to the first registered workspace path); changing it rebinds existing chats once — the next message in each chat starts a fresh, visible session.
