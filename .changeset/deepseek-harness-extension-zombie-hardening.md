---
'@agent-wechat/deepseek-harness-extension': patch
---

Harden the WeChat channel against the zombie-channel failure mode: the
consumer loop could exit after an aborted watch, and an effect dispose that
hung on a host-side cleanup step (projection or storage domain dispose) left
the plugin fiber stuck mid-unload — the status route kept reporting
`running: true` while no messages were consumed. Cleanup steps are now
individually bounded (8s default) and fault-tolerant, the stop path is
traced, and a 30s watchdog revives the channel automatically if the runtime
dies without a dispose.
