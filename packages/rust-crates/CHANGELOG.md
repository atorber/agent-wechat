# @agent-wechat/rust-crates

## 2.4.0

### Minor Changes

- [#477](https://github.com/thisnick/agent-wechat/pull/477) [`28290b3`](https://github.com/thisnick/agent-wechat/commit/28290b31140fd9bf027bb3237d995fc98be8220b) Thanks [@thisnick](https://github.com/thisnick)! - Images can now be sent at full resolution. Pass `--image-quality original` to `wx messages send --image`, or `"imageQuality": "original"` to `POST /sends`. A JPEG within the supported source limits is then sent unchanged as the image's original copy, and other formats are converted to JPEG once at full resolution. The CLI and HTTP API default to `standard`, offering only compressed standard and thumbnail copies without an Original download option. Existing saved upload receipts retain their previous original availability. OpenClaw image sends automatically request original quality and allow large image transfers and delayed local receipts to finish without resubmitting the send.

  JPEG images up to 8,192 pixels per edge and 64 million pixels can now also be downloaded and read back; previously images wider or taller than 4,096 pixels were rejected.

  Rust image sends now use one `NativeClient::send_image` method for both qualities, matching video sends. `UploadedImage.original` is now `Option<UploadedMedia>`: use `None` for standard and thumbnail only, or `Some(original)` to include an original. This is a breaking Rust API change included in this minor release; callers constructing the struct must wrap their original in `Some(...)` and handle its possible absence when reading it. The account-scoped method, request builder and local metadata helper use the same optional-original model.

### Patch Changes

- [#469](https://github.com/thisnick/agent-wechat/pull/469) [`f74dd46`](https://github.com/thisnick/agent-wechat/commit/f74dd4668b359340f8eb374d18790626883aaf51) Thanks [@thisnick](https://github.com/thisnick)! - The Rust libraries now share one version with the CLI, OpenClaw extension and desktop app. Every release publishes all five crates under the release version, so `wechat-protocol` X.Y.Z comes from the same source as `wx` X.Y.Z. Library versions jump from 2.2.0 to the next application version; no API changes.

## 2.2.0

### Minor Changes

- [#464](https://github.com/thisnick/agent-wechat/pull/464) [`7d3190b`](https://github.com/thisnick/agent-wechat/commit/7d3190b5c8b04e5b2a0a73912646ca2a05c6fc54) Thanks [@thisnick](https://github.com/thisnick)! - `wechat-protocol` now reports why a request failed as a type, so embedders no longer match error text. A non-zero service code carries `ServiceRejected { service, code }`; `is_session_rejected` tells you the account needs a new login or renewal. A stop, transfer or renewal that ends a request or a notification wait carries `AccountInterrupted`, so a push loop can end quietly on `Stopped` and reconnect on `CredentialsSuperseded`. Error messages are unchanged.

  Logout and shutdown no longer need a Tokio runtime: `PendingLogout::submit_blocking`, `PendingLogout::submit_guarded_blocking`, `NativeClient::logout_blocking` and `NativeClient::shutdown_blocking` run on the caller's own blocking worker, with the same at-most-once logout as the async methods.

### Patch Changes

- [#462](https://github.com/thisnick/agent-wechat/pull/462) [`e52cb77`](https://github.com/thisnick/agent-wechat/commit/e52cb7704fc82e072358e41fdc9c004e97cc0098) Thanks [@thisnick](https://github.com/thisnick)! - Fix large file downloads when the CDN omits redundant source-size metadata, while retaining transfer length, decrypted size, and checksum validation.

## 2.1.0

### Minor Changes

- [#441](https://github.com/thisnick/agent-wechat/pull/441) [`1b4c215`](https://github.com/thisnick/agent-wechat/commit/1b4c2152d4fcfa302c6bebc48a473eab97064f0f) Thanks [@Lazily01](https://github.com/Lazily01)! - Add a native OpenIM avatar lookup path and optional group context to avatar refresh. Keep server-returned OpenIM failure codes available in operation results. A controlled macOS ARM64 account accepted two group-member avatar downloads; broader account and platform acceptance remains separate.

## 2.0.0

### Patch Changes

- [#414](https://github.com/thisnick/agent-wechat/pull/414) [`147ccb2`](https://github.com/thisnick/agent-wechat/commit/147ccb2d9be71d556e2379d026deaa6120b1ef6e) Thanks [@thisnick](https://github.com/thisnick)! - Version the five published Rust libraries together through a private Changesets
  package, independently of application and npm releases. Library releases retain
  exact dependency versions and source verification, and use separate `crates-v`
  tags and library changelogs.
