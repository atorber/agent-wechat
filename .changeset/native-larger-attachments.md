---
"@agent-wechat/cli": minor
"@agent-wechat/agent-wechat": minor
---

Raise the native media source cap from 25 MiB − 17 bytes to 100 MiB for uploads, the CLI, the SDK and OpenClaw outbound media. Files and videos keep using the standard ranged CDN upload and are read back in full before submission, now with streamed decryption and exact size, MD5 and SHA-256 checks so large sources are not duplicated in memory. Sends above 25 MiB have not been verified against a live account, and the official client's separate big-file branch is not implemented. CDN transfer progress is now recorded per MiB instead of per 64 KiB range, and OpenClaw waits longer for larger outbound media.
