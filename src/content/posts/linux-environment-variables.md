---
title: "Linux 环境变量配置全解析：从临时设置到永久生效"
published: 2026-05-26
description: "系统梳理 Linux 环境变量的配置方式，覆盖终端临时设置、Shell 配置文件、systemd 服务、PAM 等多种场景，理清优先级和适用范围。"
tags: [Linux, 环境变量, Shell, 运维, systemd]
category: "工具指南"
author: "Oii"
---

## 为什么环境变量重要

环境变量是 Linux 系统中程序获取配置信息的基础机制。`PATH` 决定了命令去哪找，`LANG` 决定了语言编码，`DATABASE_URL` 告诉应用数据库在哪。配置不当会导致命令找不到、程序启动失败、编码乱码等问题。

## 临时设置（当前终端有效）

### export（当前终端及其子进程）

```bash
# 设置变量
export APP_ENV=development
export PORT=3000

# 查看变量
echo $APP_ENV
# development

# 查看所有环境变量
env
printenv
```

`export` 设置的变量在当前终端和从该终端启动的所有子进程中生效。关闭终端或新开一个终端就没了。

### 普通变量（仅当前 Shell）

```bash
# 不用 export，只是 Shell 本地变量
LOCAL_VAR="hello"

# 子进程中不可见
bash -c 'echo $LOCAL_VAR'
# （空）

# export 后子进程才可见
export LOCAL_VAR
bash -c 'echo $LOCAL_VAR'
# hello
```

| 类型 | 作用范围 | 语法 |
|------|---------|------|
| 普通变量 | 仅当前 Shell | `VAR=value` |
| export 变量 | 当前 Shell + 子进程 | `export VAR=value` |

### 单次命令生效

```bash
# 只在这条命令中生效
APP_DEBUG=true node server.js

# 临时修改语言
LANG=en_US.UTF-8 ls -la
```

这种写法不改变当前 Shell 的变量，只对那一条命令的子进程生效。

## Shell 配置文件（永久生效）

### Bash 的加载顺序

```bash
# 登录 Shell（SSH 登录、tty 登录）加载顺序：
/etc/profile
~/.bash_profile    # 如果存在
~/.bash_login      # 如果 .bash_profile 不存在
~/.profile         # 如果前两个都不存在

# 非登录 Shell（新开终端窗口）加载顺序：
/etc/bash.bashrc
~/.bashrc
```

> [!TIP]
> 大多数 `.bash_profile` 中会有 `source ~/.bashrc`，这样登录 Shell 也能加载 `.bashrc` 的配置。

### Zsh 的加载顺序

```bash
# 登录 Shell 加载顺序：
/etc/zsh/zshenv
~/.zshenv
/etc/zsh/zprofile
~/.zprofile
/etc/zsh/zshrc
~/.zshrc
/etc/zsh/zlogin
~/.zlogin

# 非登录 Shell 加载顺序：
/etc/zsh/zshenv
~/.zshenv
~/.zshrc
```

### 应该写在哪里

| 需求 | 推荐文件 | 原因 |
|------|---------|------|
| 环境变量 | `~/.profile` 或 `~/.zshenv` | 登录时加载一次 |
| 别名、函数 | `~/.bashrc` / `~/.zshrc` | 每次开终端都加载 |
| PATH 补充 | `~/.profile` 或 `~/.zshenv` | 只需加载一次 |

```bash
# ~/.profile 示例
export EDITOR=vim
export LANG=en_US.UTF-8
export GOPATH="$HOME/go"
export PATH="$HOME/.local/bin:$GOPATH/bin:$PATH"

# ~/.bashrc 示例
alias ll='ls -alh'
alias gs='git status'
export HISTSIZE=10000
```

## .bashrc 和 .zshrc 需要定义两次吗

**不需要。** 关键是理解哪些变量应该放在 Shell 专属文件中，哪些应该放在通用文件中。

### 方案一：使用 ~/.profile（推荐）

`~/.profile` 是 POSIX 标准的配置文件，Bash 和 Zsh 的登录 Shell 都会读取它：

```bash
# ~/.profile — 适用于所有 Shell 的环境变量
export EDITOR=vim
export LANG=en_US.UTF-8
export NODE_ENV=production
export DATABASE_URL="postgres://localhost/mydb"
export PATH="$HOME/.local/bin:$PATH"
```

然后 `.bashrc` 只放 Bash 专属的配置（别名、函数、提示符），`.zshrc` 只放 Zsh 专属的配置。环境变量不用重复写。

> [!NOTE]
> Zsh 默认不读 `~/.profile`，需要在 `~/.zshenv` 中加上 `source ~/.profile`，或者直接把环境变量写在 `~/.zshenv` 中。

### 方案二：使用 ~/.zshenv

`~/.zshenv` 在 Zsh 的所有模式下都会最先加载，是放置环境变量的最佳位置：

```bash
# ~/.zshenv — Zsh 环境变量
export EDITOR=vim
export LANG=en_US.UTF-8
export PATH="$HOME/.local/bin:$PATH"
```

如果你主要用 Zsh，这个方案最简洁。

### 方案三：使用 /etc/environment

```bash
# /etc/environment — 系统级环境变量，对所有用户生效
EDITOR=vim
LANG=en_US.UTF-8
NODE_ENV=production
```

这个文件不需要 `export`，格式是简单的 `KEY=VALUE`。适合放系统级的全局配置。

### 三种方案对比

| 文件 | 作用范围 | 加载时机 | 适合放 |
|------|---------|---------|--------|
| `~/.profile` | 当前用户，所有 Shell | 登录时 | 用户级环境变量 |
| `~/.zshenv` | 当前用户，仅 Zsh | Zsh 启动时（任何模式） | Zsh 用户的环境变量 |
| `~/.bashrc` | 当前用户，仅 Bash | 非登录 Shell | Bash 别名、函数 |
| `~/.zshrc` | 当前用户，仅 Zsh | 非登录 Shell | Zsh 别名、插件配置 |
| `/etc/environment` | 所有用户 | 系统级 | 全局环境变量 |

### 推荐做法

```bash
# 环境变量 → 写一次，放在 ~/.profile
# ~/.profile
export EDITOR=vim
export PATH="$HOME/.local/bin:$PATH"

# Bash 别名和函数 → ~/.bashrc
# ~/.bashrc
source ~/.profile
alias ll='ls -alh'

# Zsh 别名和插件 → ~/.zshrc
# ~/.zshrc
source ~/.profile
plugins=(git docker)
```

> [!TIP]
> 用 `source ~/.profile` 把通用配置统一加载，避免在 `.bashrc` 和 `.zshrc` 中重复定义相同的变量。

## systemd 服务的环境变量

systemd 服务不会读取 `.bashrc` 或 `.profile`，它有自己的一套机制。

### 方式一：在 Service 文件中直接定义

```ini
# /etc/systemd/system/myapp.service
[Service]
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_URL=postgres://localhost/mydb
```

### 方式二：使用 EnvironmentFile

```bash
# /etc/myapp/env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://localhost/mydb
LOG_LEVEL=info
```

```ini
# /etc/systemd/system/myapp.service
[Service]
EnvironmentFile=/etc/myapp/env
ExecStart=/usr/bin/node /opt/myapp/server.js
```

`EnvironmentFile` 的格式是每行一个 `KEY=VALUE`，不需要 `export`。值中的空格和特殊字符需要加引号。

### 方式三：使用 systemd 的 DefaultEnvironment

```bash
# /etc/systemd/system.conf 或 /etc/systemd/user.conf
[Manager]
DefaultEnvironment=LANG=en_US.UTF-8
```

这对所有 systemd 管理的服务生效，适合设置系统级默认值。

### systemd 环境变量的优先级

```
Service 文件中的 Environment=        （最高）
Service 文件中的 EnvironmentFile=
systemd.conf 的 DefaultEnvironment=   （最低）
```

> [!NOTE]
> systemd 服务是独立的进程，不经过 Shell 启动链。`~/.bashrc`、`~/.profile`、`/etc/profile` 中的变量对 systemd 服务完全无效。

### 验证服务的环境变量

```bash
# 查看某个服务的完整环境变量
sudo systemctl show myapp -p Environment

# 或者在服务中临时打印
sudo systemctl edit myapp
# 添加：
[Service]
ExecStartPost=/usr/bin/env
# 然后重启服务查看日志
journalctl -u myapp -n 20
```

## PATH 变量详解

`PATH` 是最重要的环境变量，它决定了 Shell 去哪些目录中查找命令。

### 查看当前 PATH

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin:/home/user/.local/bin
```

目录之间用冒号 `:` 分隔，Shell 从左到右依次查找。

### 添加路径

```bash
# 在前面添加（优先级更高）
export PATH="/new/path:$PATH"

# 在后面添加
export PATH="$PATH:/new/path"

# 实际例子：添加 Go 和本地 bin
export PATH="$HOME/go/bin:$HOME/.local/bin:$PATH"
```

### 常见问题

```bash
# 命令在哪个目录？
which node
# /usr/local/bin/node

# 命令是否存在？
command -v node

# 查看命令的所有可能路径
type -a node
```

如果 `which` 找不到命令，检查 PATH 中是否包含了该命令所在的目录。

## 配置文件加载顺序总览

```text
登录 Shell 启动：
  /etc/profile
    → ~/.bash_profile  或  ~/.zprofile
      → ~/.bashrc  或  ~/.zshrc

非登录 Shell 启动：
  /etc/bash.bashrc  或  /etc/zsh/zshenv
    → ~/.bashrc  或  ~/.zshrc

systemd 服务启动：
  /etc/systemd/system.conf (DefaultEnvironment)
    → Service 文件的 Environment= / EnvironmentFile=

PAM 登录（SSH、login 等）：
  /etc/environment
    → /etc/default/locale
      → Shell 登录链
```

## 调试技巧

```bash
# 查看某个变量的来源
# Bash
set | grep NODE_ENV
env | grep NODE_ENV

# 查看 Shell 加载了哪些文件
# 在 .bashrc 开头加一行调试
echo "Loading .bashrc" >&2

# 查看登录 Shell 的完整加载过程
bash -l -x 2>&1 | head -50

# 查看当前 Shell 类型
echo $SHELL        # 默认 Shell
echo $0            # 当前运行的 Shell

# 查看环境变量的继承链
env -i HOME=$HOME PATH=$PATH bash -c 'env'
```

## 常见场景速查

```bash
# === 临时设置 ===
export VAR=value                        # 当前终端 + 子进程
VAR=value command                       # 仅对这条命令生效

# === 永久设置 ===
# 写入 ~/.profile（所有 Shell 通用）
echo 'export VAR=value' >> ~/.profile
source ~/.profile

# 写入 ~/.zshrc（仅 Zsh）
echo 'export VAR=value' >> ~/.zshrc
source ~/.zshrc

# === 系统级设置 ===
echo 'VAR=value' | sudo tee -a /etc/environment

# === systemd 服务设置 ===
# 方式 1：直接写在 service 文件
sudo systemctl edit myapp
# Environment=VAR=value

# 方式 2：使用环境文件
sudo vim /etc/myapp/env
# VAR=value
```
