---
'@agent-wechat/deepseek-harness-extension': patch
---

Auto-unarchive the bound session on resume. When the host workspace has archived the session a WeChat route is bound to, every model step was rejected by the archived-session gate, so turns ended `blocked` and no reply was ever produced while the channel still looked connected. The session router now checks the host archive set before resuming and lifts the session out of the archive first.
