# Release Process

> **Package renamed (2026-08-31):** the OpenClaw extension moved from `@agent-wechat/wechat` to `@agent-wechat/agent-wechat` so the unscoped package basename matches the plugin id `agent-wechat` (OpenClaw validates plugin ids against the npm basename and hard-fails updates on mismatch; the official catalog also reserves the `wechat` id). The first version (0.11.15) was published manually with a one-off granular token — OIDC trusted publishing only covers packages that already exist — and the token was revoked afterward. The trusted publisher for the new package is configured at https://www.npmjs.com/package/@agent-wechat/agent-wechat/access (GitHub Actions: thisnick/agent-wechat, workflow release.yml), so CI publishes via OIDC as before. Once rollout is done, deprecate the old `@agent-wechat/wechat`: `npm deprecate @agent-wechat/wechat "Renamed to @agent-wechat/agent-wechat (plugin id agent-wechat); openclaw >=2026.8 reserves the wechat id for the official Tencent plugin."`


The native/npm release process publishes three artifacts:

1. npm CLI package: `@agent-wechat/cli`
2. npm OpenClaw extension: `@agent-wechat/agent-wechat`
3. Native executables and a checksum manifest on the matching GitHub release

## Prepare A Release

1. Add changelog entries:

```bash
pnpm changeset
```

2. Commit the generated changeset file with your code.

3. Merge to main. The changesets GitHub Action opens a "Version Packages" PR with bumped versions and changelogs.

4. Merge the Version Packages PR. The Release workflow checks the npm channel and
   reports **Waiting for native release assets** if the matching artifacts have
   not been published. This is an expected waiting state, not a failed build.

5. That merge automatically starts **Prepare native release assets**
   (`native-release.yml`) for the exact version commit. Only merged PRs from this
   repository's `changeset-release/main` branch qualify; ordinary pushes do not
   publish native assets. It builds and tests the configured targets, verifies
   source and checksums, and publishes the GitHub release assets. Existing
   `native-release` environment reviewer requirements still apply. For recovery,
   run the workflow manually on main with the version and `confirm_publish=true`.

6. Successful native asset publication calls **Publish native runtime image** for
   the same commit/version. It tests and pushes Linux x64/ARM64 images and combines
   them into the versioned multi-architecture tag. Stable versions also update
   `latest`. npm waits until image manifest publication succeeds.

7. Successful completion automatically retries the original Release push run for
   the same source commit. That run verifies the native assets, embeds their
   manifest in the CLI package, and publishes both npm packages with provenance.
   Prereleases use their Changesets channel (such as `beta`); stable releases use
   `latest`.

## Upgrade compatibility

Every release must accept the consumer state an earlier release left on disk.
The baseline is 1.0.0-beta.13: a release may not stop loading or dispatching a
consumer file written by it. Two tests hold this contract:

- `packages/native-client-rust/crates/wechat-core/src/native_compat_tests.rs`
  pins the daemon's message JSON in
  `crates/wechat-core/tests/fixtures/native-compat/messages.json`. Consumers save
  this JSON when a message arrives and compare it with a fresh read before
  dispatching, so any change to it (including an added field) is an upgrade risk.
- `packages/openclaw-extension/src/native-consumer-compat.test.ts` loads the
  frozen `test/fixtures/native-compat/consumer-state-1.0.0-beta.13.json` and
  dispatches its buffered group messages against the pinned daemon JSON.

To change the message JSON on purpose, regenerate the pinned file with
`UPDATE_NATIVE_COMPAT_FIXTURES=1 cargo +1.93.1 test -p wechat-core native_compat`
and make the extension test pass without touching the frozen consumer file.
Never regenerate a frozen consumer file. If a later release needs a newer
baseline as well, add another frozen file beside it.

## What CI/CD Does

The npm workflow waits until every configured native target, checksum manifest,
and third-party notice is uploaded and the same source commit has a successfully
published runtime image. Registry/API errors, mismatched source
commits and invalid checksums remain failures. A published CLI version permits
extension-only recovery without requiring another native artifact set.

The native completion handler only retries the original main-branch push run
from this repository. It does not publish npm directly from a `workflow_run`
event: that event's default-branch SHA may have advanced since the artifacts
were built. Retrying the original run preserves both its source SHA and its npm
OIDC/provenance context.

If automatic recovery fails, rerun the original Release push run for the native
manifest's exact source commit. Do not push an unrelated commit to retry
publication or replace existing release assets. If main advanced before native
assets were prepared, reconcile the version/source tag before starting another
native release; the preflight refuses conflicting tags or published npm versions.

Docker image publication and deployment remain separate from these workflows.

## Trusted Publishing (OIDC)

npm trusted publishing lets GitHub Actions publish without a long-lived token. Setup:

1. Go to https://www.npmjs.com/package/@agent-wechat/cli/access
2. Under "Trusted publishers", add GitHub Actions:
   - **Owner**: `thisnick`
   - **Repository**: `agent-wechat`
   - **Workflow**: `release.yml`
   - **Environment**: (leave blank)
3. Repeat for https://www.npmjs.com/package/@agent-wechat/agent-wechat/access

Once configured, delete the `NPM_TOKEN` secret from GitHub repo settings. The workflow uses OIDC automatically (requires npm >= 11.5.1, installed in CI).

**Note**: Trusted publishing can only be configured for packages that already exist on npm. For brand-new packages, the first publish must use a token.

## Windows signing with Azure OIDC

`.github/workflows/windows-signing.yml` is a reusable signing job for EXE, DLL,
and MSI artifacts. A release workflow must call it after building the unsigned
files. Adding this workflow does not enable signing in the native release matrix
or create Azure resources.

1. Create an [Azure Artifact Signing account](https://learn.microsoft.com/azure/artifact-signing/quickstart),
   complete publisher identity validation, and create a **Public Trust** certificate
   profile. Public Trust Test and Private Trust profiles do not provide public
   Windows distribution signing.
2. Create a single-tenant Microsoft Entra app registration and its service principal.
   Assign **Artifact Signing Certificate Profile Signer** to that service principal,
   scoped to the certificate profile. The signing identity does not need Contributor
   or Owner. Do not create an app client secret.
3. Add a federated credential to the app registration with these exact values:

   | Field | Value |
   | --- | --- |
   | Issuer | `https://token.actions.githubusercontent.com` |
   | Subject | `repo:thisnick/agent-wechat:environment:windows-signing` |
   | Audience | `api://AzureADTokenExchange` |

4. Create the GitHub environment **windows-signing**, allowing only the `main`
   branch and `v*` release tags. Set these environment variables (the identifiers
   are configuration, not private keys):

   | Variable | Value |
   | --- | --- |
   | `AZURE_CLIENT_ID` | App registration's application/client ID |
   | `AZURE_TENANT_ID` | Microsoft Entra directory ID |
   | `AZURE_SUBSCRIPTION_ID` | Subscription containing the signing account |
   | `AZURE_SIGNING_ENDPOINT` | Signing endpoint for the account's Azure region |
   | `AZURE_SIGNING_ACCOUNT` | Artifact Signing account name |
   | `AZURE_SIGNING_PROFILE` | Approved Public Trust certificate profile name |

5. Upload only the application files intended for signing as an artifact in the
   build job, then call the reusable workflow from the same run:

   ```yaml
   sign-windows:
     needs: build-windows
     permissions:
       contents: read
       id-token: write
     uses: ./.github/workflows/windows-signing.yml
     with:
       unsigned-artifact: windows-unsigned
       signed-artifact: windows-signed
   ```

The signing job uses a Windows x64 runner, including for ARM64 target binaries.
It rejects pull request runs, imports no local signing key, and verifies each
signature and timestamp before uploading the result. Azure retains the signing
key; GitHub obtains a short-lived Azure token through OIDC.

Sign application binaries before building their installer, then sign the final
installer in a second call. Package and publish the signed outputs, and regenerate
release checksums after signing. A signature changes the file's bytes, so existing
unsigned checksum manifests cannot be reused.

See Microsoft's [OIDC integration guide](https://github.com/Azure/artifact-signing-action/blob/main/docs/OIDC.md)
and [profile-scoped role assignment](https://learn.microsoft.com/azure/artifact-signing/tutorial-assign-roles).
