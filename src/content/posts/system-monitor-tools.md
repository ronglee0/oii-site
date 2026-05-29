---
title: "htop / btop / glances：Linux 系统监控工具对比指南"
published: 2026-05-29
description: "全面对比三款主流 Linux 系统监控工具：htop、btop、glances，从界面、功能、性能到适用场景，帮你选择最合适的监控方案。"
tags: [htop, btop, glances, Linux, 系统监控, 运维]
category: "工具指南"
author: "Oii"
---

## 为什么不用 top

Linux 自带的 `top` 能用，但体验粗糙：界面密集、操作不便、不支持鼠标、颜色单调。以下三款工具在功能和体验上全面超越 top。

## htop — 经典之选

htop 是 top 的增强版，是最广泛使用的终端系统监控工具。

### 安装

```bash
# Ubuntu / Debian
sudo apt install htop

# CentOS / RHEL
sudo yum install htop

# macOS
brew install htop

# Arch Linux
sudo pacman -S htop
```

### 基本使用

```bash
# 启动
htop

# 只显示某用户的进程
htop -u username

# 只显示某 PID 的进程树
htop -p 1234

# 启动时按 CPU 排序
htop --sort-key=PERCENT_CPU

# 启动时显示树形视图
htop -t
```

### 界面布局

htop 界面分为三个区域：

**上部 — 系统概览**：
- CPU 使用率（每个核心单独显示）
- 内存和 Swap 使用
- 任务数量、运行中数量
- 系统负载和运行时间

**中部 — 进程列表**：
- PID、用户、优先级
- 内存和 CPU 占用
- 进程状态和命令

**底部 — 快捷键栏**：
- F1 帮助、F2 设置、F3 搜索
- F4 过滤、F5 树形、F6 排序
- F9 发信号、F10 退出

### 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `F3` / `/` | 搜索进程 |
| `F4` / `\` | 过滤（只显示匹配的进程） |
| `F5` / `t` | 树形视图 |
| `F6` / `>` | 选择排序字段 |
| `F9` / `k` | 发送信号（kill） |
| `Space` | 标记进程（可多选后批量操作） |
| `u` | 按用户过滤 |
| `H` | 隐藏/显示用户线程 |
| `K` | 隐藏/显示内核线程 |
| `F2` | 进入设置（自定义布局、颜色等） |
| `c` | 标记/取消显示完整命令行 |
| `M` | 按内存排序 |
| `P` | 按 CPU 排序 |
| `T` | 按运行时间排序 |
| `I` | 倒序排列 |

### 特色功能

- **鼠标支持**：可以直接点击排序列、选择进程
- **多选操作**：Space 标记多个进程，统一发送信号
- **树形视图**：查看进程的父子关系
- **自定义布局**：F2 设置中可以调整显示哪些列、如何排序

## btop — 颜值担当

btop 是新一代终端系统监控工具，界面美观、信息密度高，是 htop 的现代替代品。

### 安装

```bash
# Ubuntu / Debian (22.04+)
sudo apt install btop

# 较旧的系统需要手动编译或用 snap
sudo snap install btop

# macOS
brew install btop

# Arch Linux
sudo pacman -S btop
```

### 基本使用

```bash
# 启动
btop

# 启动时指定配色方案
btop --color monokai

# 用 GPU 监控
btop --tty_on
```

### 界面布局

btop 的界面分为四个独立区域：

- **左上 — CPU**：每个核心的使用率图表（实时折线图）
- **右上 — 内存**：RAM 和 Swap 的使用条和图表
- **左下 — 网络**：网络接口的上传/下载速率和图表
- **右下 — 进程**：进程列表（支持树形视图）

### 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `1-4` | 显示/隐藏 CPU/内存/网络/进程面板 |
| `↑` `↓` | 选择进程 |
| `Enter` | 展开/折叠进程树 |
| `f` | 过滤进程 |
| `t` | 树形视图切换 |
| `s` | 搜索进程 |
| `k` | 终止选中的进程 |
| `e` | 展开进程的命令行参数 |
| `M` | 按内存排序 |
| `P` / `C` | 按 CPU 排序 |
| `T` | 按运行时间排序 |
| `m` | 切换内存显示模式（百分比/实际值） |
| `q` | 退出 |
| `Esc` | 关闭菜单/退出 |

### 特色功能

- **实时图表**：CPU、内存、网络都有折线图显示历史趋势
- **GPU 监控**：支持 NVIDIA GPU 使用率监控
- **主题系统**：内置多套配色方案，可自定义
- **纯鼠标操作**：所有区域都可以鼠标点击操作
- **低资源占用**：即使界面丰富，CPU 占用依然很低

## glances — 全能监控

glances 用 Python 编写，功能最全面，除了 CPU/内存/进程外，还监控磁盘、网络、传感器、Docker 容器等。

### 安装

```bash
# pip 安装（推荐，版本最新）
pip3 install glances
pip3 install 'glances[web]'    # 安装 Web UI 支持
pip3 install 'glances[docker]' # 安装 Docker 监控支持

# Ubuntu / Debian
sudo apt install glances

# macOS
brew install glances
```

### 基本使用

```bash
# 启动
glances

# Web 模式（浏览器访问 http://localhost:61208）
glances -w

# 服务器模式（远程监控）
glances -s

# 客户端连接
glances -c server_ip

# 导出到 CSV
glances --export csv --export-csv-file /tmp/stats.csv

# 导出到 InfluxDB
glances --export influxdb2

# 只显示警告
glances --disable-process
```

### 界面模块

glances 的界面信息最丰富：

| 模块 | 内容 |
|------|------|
| CPU | 总体和每核心使用率、系统/用户/IO 时间 |
| 内存 | RAM、Swap、Buffer/Cache |
| 网络 | 每个接口的吞吐量、错误率 |
| 磁盘 I/O | 每个磁盘/分区的读写速率 |
| 文件系统 | 各挂载点的使用率 |
| 传感器 | CPU 温度、风扇转速 |
| 进程 | 进程列表（支持排序、过滤） |
| Docker | 容器列表和资源使用 |
| 系统信息 | 主机名、内核版本、运行时间 |
| IP | 公网 IP 地址 |

### 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `1` | 切换每 CPU 核心 / 总体视图 |
| `a` | 自动排序 |
| `c` | 按 CPU 排序 |
| `m` | 按内存排序 |
| `i` | 按 I/O 排序 |
| `p` | 按进程名排序 |
| `d` | 显示/隐藏磁盘 I/O |
| `n` | 显示/隐藏网络 |
| `f` | 显示/隐藏文件系统 |
| `s` | 显示/隐藏传感器 |
| `e` | 显示/隐藏进程扩展信息 |
| `2` | 显示/隐藏左侧栏 |
| `T` | 网络累积/速率切换 |
| `h` | 帮助 |
| `q` | 退出 |

### 特色功能

- **Web UI**：`glances -w` 启动后可在浏览器中查看，适合远程监控
- **客户端/服务器模式**：一台机器运行服务端，其他机器远程连接
- **数据导出**：支持导出到 CSV、InfluxDB、Prometheus、Elasticsearch 等
- **Docker 监控**：直接显示容器的 CPU/内存使用
- **告警系统**：内置阈值告警（CPU > 70%、内存 > 80% 等），不同级别用不同颜色
- **REST API**：Web 模式下提供 JSON API，可接入自定义监控

## 三款工具对比

| 特性 | htop | btop | glances |
|------|------|------|---------|
| 语言 | C | C++ | Python |
| 界面风格 | 传统列表 | 图表为主 | 信息面板 |
| 学习曲线 | 低 | 低 | 中 |
| CPU 占用 | 极低 | 低 | 中等 |
| GPU 监控 | 不支持 | 支持 | 支持（需插件） |
| Docker 监控 | 不支持 | 不支持 | 支持 |
| 网络监控 | 基本 | 图表 | 详细 |
| 磁盘 I/O | 基本 | 基本 | 详细 |
| 温度监控 | 不支持 | 不支持 | 支持 |
| Web UI | 不支持 | 不支持 | 支持 |
| 远程监控 | 不支持 | 不支持 | 支持 |
| 数据导出 | 不支持 | 不支持 | 多种格式 |
| 主题/配色 | 可自定义 | 多套内置 | 基本配色 |
| 内存占用 | ~5MB | ~15MB | ~50MB |
| 预装情况 | 广泛 | 较少 | 需安装 |

## 选择建议

- **日常使用、快速查看**：htop — 无处不在，零学习成本
- **好看 + 实时图表**：btop — 界面最漂亮，信息直观
- **全面监控、长期运行**：glances — 功能最全，支持 Web/远程/导出
- **服务器监控**：glances -w — Web 模式适合远程查看
- **轻量环境 / SSH**：htop — 资源占用最低

三个工具可以共存，按场景选择即可。

## 快速安装脚本

```bash
# 一键安装全部
sudo apt install htop btop -y && pip3 install glances

# 验证
htop --version
btop --version
glances --version
```

> [!TIP]
> 如果只能选一个，推荐 **btop**——它在美观和功能之间取得了最好的平衡，CPU/内存/网络都有实时图表，操作直观，资源占用也不高。如果需要 Docker 监控或远程查看，再加一个 glances。
