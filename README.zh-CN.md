# agent-wechat

[English](README.md) | [简体中文](README.zh-CN.md)

独立的微信原生 Daemon 服务、CLI 命令行工具及 OpenClaw 接入通道。

原生 `wx` 可执行程序直接与微信协议通信，并使用官方格式的本地 Profile 数据。运行时无需安装或运行微信官方客户端或图形桌面。支持的 Profile 范围及限制说明参见[已实现功能与验证说明](packages/native-client-rust/README.md)。

| 软件包 | 职责 |
| --- | --- |
| [`@agent-wechat/cli`](packages/cli) | 原生 `wx` 工具及校验安装器 |
| [`@agent-wechat/shared`](packages/shared) | 原生私有 HTTP/SSE SDK；内置于 OpenClaw 中 |
| [`@agent-wechat/agent-wechat`](packages/openclaw-extension) | OpenClaw 托管或外部原生 Daemon 集成插件 |

## 原生客户端 (Native client)

发布目标平台矩阵包含 Linux x64/ARM64（glibc 2.36+）、macOS ARM64 与 Windows x64/ARM64。macOS 与 Windows 为候选发布版本（Release Candidate），尚待原生设备真机验收；官方客户端数据目录接管目前仅支持 Linux。可使用 Rust 1.93.1 从源码编译，或在发布后安装对应的原生版本：

```bash
npm install -g @agent-wechat/cli@VERSION
wx --json version
wx config show
wx serve
```

针对原生 beta 版本系列，请显式指定已发布的 `1.0.0-beta.N` 版本号或安装 `@agent-wechat/cli@beta`。稳定的 `latest` 渠道在正式晋升前仍保留旧版容器 CLI。Beta 准备使用 CI 生成的版本 PR 并单独审核发布；源码变动并不意味着自动发布原生测试版。

`serve` 在前台启动经过认证的 Daemon 服务。它会在配置的持久化根目录下生成私有 API 访问令牌与存储密钥文件。它不会启动 Docker，也不会自动展示登录二维码。其他客户端通过具备版本控制的 HTTP/SSE API 进行连接。

在另一个终端中：

```bash
# 接管文件前请先退出 Linux 官方微信客户端。
wx auth login --official
wx accounts list
wx threads
wx messages list filehelper
```

`--official` 会自动选中 Daemon 宿主机上的现有数据文件并配置身份与密钥。使用 `--official=/absolute/path/to/profile` 可指定特定 Profile 目录。当可用时会优先尝试已保存的设备免扫码登录；需要手机确认时可提供白底二维码。数据为就地读写，无需执行数据导入。多账号环境下，使用 `--account` 显式选择操作账号。

初始支持范围为接管现有官方 Profile，并在原地进行支持的数据库与媒体文件写入。原生聊天记录、文本/媒体发送、联系人/群聊查询、群成员名单、头像及下载均基于该 Profile 运行。不受支持的同步控制保持暂存。全新 Profile 创建、副本导出以及将 Profile 归还给官方客户端属于该范围之外的实验性扩展。不支持全文检索（FTS）与搜索索引的维护。详细测试范围参见[功能清单](packages/native-client-rust/FEATURES.md)。

使用 `wx messages recall MESSAGE_ID --server-id SERVER_ID` 可通过已存储的消息身份撤回自己发送的消息。OpenClaw 暴露了限定权限范围的 `wechat_recall` 工具。收到的撤回通知将转换为持久化的占位记录并封禁对应附件的读取；状态未决的外发结果将保留其操作任务，绝不自动盲目重复提交。参考[撤回行为与存储机制](https://thisnick.github.io/agent-wechat/zh-cn/how-it-works/message-types/#消息撤回-recalls)。

普通文件发送限制、图片/视频/语音限制、当前验证状态以及更长的 CLI/API 超时等待设置，请参见[发送附件与媒体](https://thisnick.github.io/agent-wechat/zh-cn/use/media/)。

在 Windows 上，配置文件默认位于 `%APPDATA%/agent-wechat`，持久化数据位于 `%LOCALAPPDATA%/agent-wechat`；`USERPROFILE` 作为家目录的兜底。显式配置及 XDG 环境变量覆盖具有更高优先级。在 Unix 上，服务端配置默认位于 `~/.config/agent-wechat/server/config.toml`；Daemon 数据默认位于 `~/.local/share/agent-wechat`。支持 XDG 路径及显式覆盖。客户端端点、令牌引用和当前选定账号保存在独立的 `~/.config/agent-wechat/client.toml` 中。运行中的官方 Profile 保持在原路径；Daemon 状态保存在 Sidecar 侧边数据中。

关于配置、Profile 所有权、故障恢复、API 命令及当前限制的详细说明，请参见[原生开发指南](packages/native-client-rust/README.md)。[部署模板](deploy/native/README.md)包含用户服务单元（systemd）及无官方二进制依赖的容器镜像。构建这些资源并不意味着直接执行部署。

## 发布与迁移 (Distribution and migration)

Linux x64/ARM64 基于 glibc 2.36+ 进行了完整验证。macOS ARM64 与 Windows x64/ARM64 具备候选的构建/安装/生命周期工作流；详见[平台验收清单](PLATFORM-ACCEPTANCE.md)。纯原生容器镜像仅限 Linux。npm CLI 会安装匹配的二进制可执行程序；OpenClaw 为独立的 npm 插件。Rust Crate 与 TypeScript SDK 为内部源码库，非公共注册表独立发布的包。参见[分发矩阵与发布流程](deploy/native/README.md)。

本次大版本发布彻底退役了旧版 UI 服务/镜像、`wx-legacy` 以及 Wechaty puppet/gateway 集成。原有的安装与数据卷不会被删除。请停止旧容器，留存备份，并使用原生登录命令选择其完整的官方 Profile。使用旧版 `/api` 的客户端以及内联令牌的 OpenClaw 配置需要迁移至原生 `/v1`；参见[从旧容器迁移指南](https://thisnick.github.io/agent-wechat/zh-cn/setup/migrate/)。

## 本地开发 (Development)

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm native:test
pnpm native:build
python3 packages/native-client-rust/scripts/smoke.py packages/native-client-rust/target/debug/wx
```

原生冒烟测试使用虚拟合成 Profile 及本地环回 HTTP。原生协议与媒体测试使用合成 Fixture；真实账号测试彼此独立，且必须使用隔离的专用测试账号。代码贡献规范参见 [AGENTS.md](AGENTS.md)，具体测试/构建命令参见[原生开发指南](packages/native-client-rust/README.md)。CI 对两种原生架构均执行构建与测试，不包含发布或部署操作。

通过 `pnpm native:dev` 启动本地上游模拟器及真实的 Hub API，或运行 `pnpm native:simulator:smoke` 执行 SDK 回归测试旅程。两者均使用虚拟合成账号，不与微信线上服务器建立任何连接。状态控制、隔离机制及当前实现范围请参见[模拟器指南](packages/native-client-rust/crates/wechat-simulator/README.md)。

通过 `pnpm client:dev` 启动连接好的 Web 浏览器端预览。它会启动独立的模拟器与 Hub，并在终端打印浏览器访问 URL。登录流程、场景控制及当前限制说明请参见[客户端预览指南](packages/client-ui/README.md)。
