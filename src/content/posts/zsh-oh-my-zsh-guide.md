---
title: "Zsh + Oh My Zsh 打造高效终端体验"
published: 2026-05-26
description: "从 Bash 迁移到 Zsh，配置 Oh My Zsh 主题和插件，让终端变得更美观、更高效。"
tags: [Zsh, Oh My Zsh, Terminal, Linux, macOS]
category: "工具指南"
author: "Oii"
---

## 为什么用 Zsh

Zsh 是 Bash 的超集，兼容 Bash 语法的同时提供了更强的功能：

| 特性 | Bash | Zsh |
|------|------|-----|
| 自动补全 | 基础 | 递归补全、菜单选择 |
| 通配符 | `*` `?` | 扩展通配符（`**`、`~`、限定符） |
| 拼写纠正 | 无 | 命令和参数拼写纠正 |
| 主题/提示符 | 需手动配置 PS1 | 丰富的主题生态 |
| 插件系统 | 无 | Oh My Zsh / Prezto 等框架 |
| 历史共享 | 各终端独立 | 多终端实时共享历史 |

## 安装

### 安装 Zsh

```bash
# Ubuntu / Debian
sudo apt install zsh

# macOS（自带 zsh，无需安装）
zsh --version

# Arch Linux
sudo pacman -S zsh
```

### 安装 Oh My Zsh

```bash
# 官方安装脚本
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

安装完成后，`~/.zshrc` 会被自动创建，Zsh 成为默认 shell。

### 安装推荐插件

```bash
# zsh-autosuggestions — 输入时显示历史命令建议
git clone https://github.com/zsh-users/zsh-autosuggestions \
    ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# zsh-syntax-highlighting — 命令语法高亮
git clone https://github.com/zsh-users/zsh-syntax-highlighting \
    ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# zsh-completions — 额外的补全定义
git clone https://github.com/zsh-users/zsh-completions \
    ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-completions
```

## 配置 .zshrc

### 插件配置

在 `~/.zshrc` 中找到 `plugins` 行，添加已安装的插件：

```bash
plugins=(
    git
    docker
    kubectl
    zsh-autosuggestions
    zsh-syntax-highlighting
    zsh-completions
    sudo           # 按两下 Esc 自动在命令前加 sudo
    extract        # 万能解压命令
    z              # 智能目录跳转
)
```

### 常用内置插件说明

| 插件 | 功能 |
|------|------|
| `git` | git 命令缩写（`gst`=`git status`，`gco`=`git checkout`） |
| `docker` | docker 和 docker-compose 命令补全 |
| `kubectl` | k8s 命令补全和缩写 |
| `sudo` | 按两次 Esc 在命令前加 sudo |
| `extract` | 一个 `extract` 命令解压任意格式压缩包 |
| `z` | 根据历史记录智能跳转目录，替代 `cd` |
| `copypath` | `copypath` 复制当前路径到剪贴板 |
| `copyfile` | `copyfile` 复制文件内容到剪贴板 |

### 环境变量和别名

```bash
# 在 ~/.zshrc 中添加自定义配置

# 历史记录设置
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history
setopt SHARE_HISTORY          # 多终端共享历史
setopt HIST_IGNORE_DUPS       # 去除连续重复记录
setopt HIST_IGNORE_SPACE      # 空格开头的命令不记入历史

# 常用别名
alias ll='ls -alh'
alias ..='cd ..'
alias ...='cd ../..'
alias gs='git status'
alias gp='git push'
alias gpl='git pull'
alias dc='docker compose'
alias k='kubectl'
```

## 主题

### 默认主题 robbyrussell

Oh My Zsh 默认的 `robbyrussell` 主题简洁够用，无需更换。

### Powerlevel10k（推荐）

Powerlevel10k 是目前最流行的 Zsh 主题，速度快、信息丰富：

```bash
# 安装
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
    ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

在 `~/.zshrc` 中修改主题：

```bash
ZSH_THEME="powerlevel10k/powerlevel10k"
```

重新打开终端后会自动进入配置向导，按提示选择喜欢的样式。之后随时可以用 `p10k configure` 重新配置。

> [!TIP]
> Powerlevel10k 需要 Nerd Font 字体才能正确显示图标。推荐安装 [MesloLGS NF](https://github.com/romkatv/powerlevel10k#fonts) 字体，并在终端设置中选用。

### 其他热门主题

| 主题 | 特点 |
|------|------|
| `agnoster` | 经典 Powerline 风格 |
| `af-magic` | 简洁双行，信息充足 |
| `bira` | 显示用户名、路径、git 状态 |
| `ys` | 传统的多行提示符 |
| `spaceship` | 需要单独安装，功能极其丰富 |

查看所有内置主题：

```bash
ls ~/.oh-my-zsh/themes/
```

## 进阶用法

### 目录跳转

```bash
# z 插件 — 根据频率智能跳转
z doc          # 跳转到最常访问的包含 "doc" 的目录
z proj src     # 匹配 "proj" 和 "src"

# 自动跳转 — 输入目录名直接跳转
setopt AUTO_CD
myproject      # 等同于 cd myproject

# 目录栈
cd -           # 回到上一个目录
dirs -v        # 查看目录栈
pushd /tmp     # 压入目录栈
popd           # 弹出目录栈
```

### 通配符扩展

```bash
# 递归匹配
ls **/*.py              # 递归查找所有 .py 文件
ls **/node_modules      # 递归查找所有 node_modules 目录

# 限定符
ls *(.)                 # 只匹配文件
ls *(/)                 # 只匹配目录
ls *(om[1,5])           # 最近修改的 5 个文件
ls *.txt(L+100)         # 大于 100 字节的 txt 文件

# 排除匹配
ls ^*.log               # 除了 .log 文件以外的所有文件
```

### 命令补全增强

```bash
# 补全时使用方向键选择（在 ~/.zshrc 中添加）
zstyle ':completion:*' menu select

# 补全忽略大小写
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'

# 补全时显示描述
zstyle ':completion:*' verbose yes
```

## 从 Bash 迁移

### 兼容性

Zsh 几乎完全兼容 Bash 语法，大多数 Bash 脚本可以直接在 Zsh 中运行。少数差异：

```bash
# Bash 数组从 0 开始，Zsh 从 1 开始
arr=(a b c)
echo ${arr[1]}     # Zsh: a，Bash 中这会输出 b

# Zsh 的通配符默认不匹配隐藏文件
ls *               # Bash: 包含 .开头的文件，Zsh: 不包含

# Zsh 的 word 分割规则不同
var="a b c"
echo $var          # Bash: 会拆分，Zsh: 不拆分
```

### 迁移步骤

```bash
# 1. 安装 Zsh 和 Oh My Zsh
# 2. 将 .bashrc 中的自定义配置复制到 .zshrc
# 3. 测试常用命令和脚本
# 4. 设置 Zsh 为默认 shell
chsh -s $(which zsh)
```

> [!TIP]
> 不确定是否要完全迁移？可以先在终端中运行 `zsh` 试用，随时输入 `bash` 切回去。

## 速查

```bash
# === Oh My Zsh 管理 ===
omz update                           # 更新 Oh My Zsh
omz version                          # 查看版本
zsh -x ~/.zshrc                      # 调试 zshrc

# === 主题 ===
p10k configure                       # 重新配置 Powerlevel10k

# === 插件 ===
# 编辑 ~/.zshrc 中的 plugins=() 数组
source ~/.zshrc                      # 重新加载配置

# === 历史 ===
history                              # 查看历史
fc -l 1 20                           # 查看最近 20 条
Ctrl+R                               # 反向搜索历史
```
