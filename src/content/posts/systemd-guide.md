---
title: "systemd 实战指南：服务管理、日志与定时任务"
published: 2026-05-26
description: "掌握 systemd 的核心用法，包括服务管理、日志查看、自定义服务编写和定时任务，覆盖 Linux 运维日常场景。"
tags: [systemd, Linux, 运维, 服务管理]
category: "工具指南"
author: "Oii"
---

## 什么是 systemd

systemd 是目前主流 Linux 发行版的初始化系统和服务管理器，负责系统的启动流程和服务生命周期管理。几乎所有现代发行版都已采用 systemd：

- Ubuntu 16.04+
- Debian 8+
- CentOS 7+
- Fedora
- Arch Linux

## 服务管理（systemctl）

### 基本操作

```bash
# 启动服务
sudo systemctl start nginx

# 停止服务
sudo systemctl stop nginx

# 重启服务
sudo systemctl restart nginx

# 重新加载配置（不重启进程）
sudo systemctl reload nginx

# 查看服务状态
systemctl status nginx
```

### 开机自启

```bash
# 设置开机自启
sudo systemctl enable nginx

# 取消开机自启
sudo systemctl disable nginx

# 设置开机自启并立即启动
sudo systemctl enable --now nginx

# 查看是否已设置自启
systemctl is-enabled nginx
```

### 查看服务信息

```bash
# 查看服务是否正在运行
systemctl is-active nginx

# 列出所有已启动的服务
systemctl list-units --type=service --state=running

# 列出所有服务（包括未运行的）
systemctl list-unit-files --type=service

# 查看服务的依赖关系
systemctl list-dependencies nginx

# 查看服务的详细属性
systemctl show nginx
```

### 服务状态输出解读

```bash
$ systemctl status nginx

● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 2026-05-26 10:00:00 CST; 2h ago
       Docs: man:nginx(8)
    Process: 1234 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; (code=exited, status=0/SUCCESS)
   Main PID: 1235 (nginx)
      Tasks: 3 (limit: 4567)
     Memory: 12.5M
        CPU: 1.234s
     CGroup: /system.slice/nginx.service
             ├─1235 "nginx: master process /usr/sbin/nginx"
             ├─1236 "nginx: worker process"
             └─1237 "nginx: worker process"
```

关键信息：
- `Loaded` — 服务单元文件路径和是否自启
- `Active` — 当前状态（`active (running)` / `inactive` / `failed`）
- `Main PID` — 主进程 ID
- `Memory` / `CPU` — 资源占用

## 日志管理（journalctl）

systemd 自带日志系统 journald，用 `journalctl` 查看。

### 基本查询

```bash
# 查看所有日志（从旧到新）
journalctl

# 查看指定服务的日志
journalctl -u nginx

# 实时追踪日志（类似 tail -f）
journalctl -u nginx -f

# 查看最近 50 行
journalctl -u nginx -n 50
```

### 按时间过滤

```bash
# 查看今天的日志
journalctl --since today

# 查看指定时间段
journalctl --since "2026-05-26 10:00:00" --until "2026-05-26 12:00:00"

# 查看最近 1 小时
journalctl --since "1 hour ago"

# 查看上次启动的日志
journalctl -b -1

# 查看当前启动的日志
journalctl -b
```

### 按级别过滤

```bash
# 只看错误
journalctl -u nginx -p err

# 只看警告及以上
journalctl -u nginx -p warning

# 级别对照：emerg(0) > alert(1) > crit(2) > err(3) > warning(4) > notice(5) > info(6) > debug(7)
```

### 输出格式和过滤

```bash
# JSON 格式输出（方便程序处理）
journalctl -u nginx -o json

# 紧凑格式
journalctl -u nginx -o short-iso

# 只看内核日志
journalctl -k

# 磁盘使用情况
journalctl --disk-usage

# 清理旧日志（保留最近 7 天）
sudo journalctl --vacuum-time=7d

# 限制日志大小（保留最多 500M）
sudo journalctl --vacuum-size=500M
```

## 编写自定义 Service

### 基本结构

创建文件 `/etc/systemd/system/myapp.service`：

```ini
[Unit]
Description=My Application
Documentation=https://example.com/docs
After=network.target
Wants=postgresql.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/start
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Unit 段

| 指令 | 说明 |
|------|------|
| `Description` | 服务描述 |
| `Documentation` | 文档链接 |
| `After` | 在哪些服务之后启动（顺序依赖） |
| `Before` | 在哪些服务之前启动 |
| `Wants` | 弱依赖（依赖服务失败不影响本服务） |
| `Requires` | 强依赖（依赖服务停止则本服务也停止） |
| `Conflicts` | 冲突（不能与这些服务同时运行） |

### Service 段

| 指令 | 说明 |
|------|------|
| `Type` | 启动类型（`simple` / `forking` / `oneshot` / `notify`） |
| `User` / `Group` | 运行用户和组 |
| `WorkingDirectory` | 工作目录 |
| `ExecStart` | 启动命令 |
| `ExecStartPre` | 启动前执行的命令 |
| `ExecStartPost` | 启动后执行的命令 |
| `ExecStop` | 停止命令 |
| `ExecReload` | 重载命令 |
| `Restart` | 重启策略（`always` / `on-failure` / `on-abnormal` / `no`） |
| `RestartSec` | 重启间隔秒数 |
| `Environment` | 环境变量 |
| `EnvironmentFile` | 环境变量文件 |
| `StandardOutput` | 日志输出（`journal` / `inherit` / `null`） |
| `StandardError` | 错误输出 |

### 实际例子：Node.js 应用

```ini
[Unit]
Description=My Node.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/myapp
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target
```

### 实际例子：oneshot 任务

适用于执行一次就退出的任务，比如初始化脚本：

```ini
[Unit]
Description=Initialize application data
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/scripts/init-data.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

`RemainAfterExit=yes` 表示进程退出后服务仍被视为 active。

### 加载和使用

```bash
# 重新加载 systemd 配置（修改 service 文件后必须执行）
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start myapp

# 查看状态
systemctl status myapp

# 设置开机自启
sudo systemctl enable myapp

# 查看日志
journalctl -u myapp -f
```

## 定时任务（Timer）

systemd timer 是 cron 的现代替代方案，依赖 systemd 的日志和资源管理能力。

### 基本 Timer

创建 `/etc/systemd/system/backup.timer` 和对应的 `/etc/systemd/system/backup.service`：

**backup.service：**

```ini
[Unit]
Description=Daily backup

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
User=root
```

**backup.timer：**

```ini
[Unit]
Description=Run backup daily

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
# 启用定时器
sudo systemctl enable --now backup.timer

# 查看所有定时器
systemctl list-timers

# 查看定时器状态
systemctl status backup.timer
```

### 时间表达式

`OnCalendar` 的格式：`DayOfWeek Year-Month-Day Hour:Minute:Second`

```bash
# 每天凌晨 2 点
OnCalendar=*-*-* 02:00:00

# 每周一上午 9 点
OnCalendar=Mon *-*-* 09:00:00

# 每小时
OnCalendar=hourly
# 等同于
OnCalendar=*-*-* *:00:00

# 每 15 分钟
OnCalendar=*:0/15

# 每月 1 号
OnCalendar=*-*-01 00:00:00
```

### 相对时间触发

```bash
[Timer]
# 服务首次启动后 5 分钟执行
OnBootSec=5min

# 服务上次执行完成后 30 分钟再执行
OnUnitActiveSec=30min

# 系统启动后 1 分钟执行
OnStartupSec=1min
```

### 常用 Timer 选项

| 选项 | 说明 |
|------|------|
| `OnCalendar` | 绝对时间触发 |
| `OnBootSec` | 系统启动后多长时间触发 |
| `OnUnitActiveSec` | 上次触发后多长时间再次触发 |
| `Persistent=true` | 错过的执行在下次启动时补执行 |
| `RandomizedDelaySec` | 随机延迟，避免同时触发 |

## 系统资源控制

systemd 可以对服务进行资源限制：

```ini
[Service]
# 限制内存使用
MemoryMax=512M
MemoryHigh=256M

# 限制 CPU 使用率
CPUQuota=50%

# 限制进程数
TasksMax=100

# IO 权重（10-1000，默认 100）
IOWeight=50
```

## 实用场景

### 查看系统启动耗时

```bash
# 查看本次启动总耗时
systemd-analyze

# 查看各服务启动耗时（排序）
systemd-analyze blame

# 查看启动关键链
systemd-analyze critical-chain
```

### 服务失败排查

```bash
# 查看所有失败的服务
systemctl --failed

# 查看某个服务的详细状态
systemctl status myapp

# 查看服务日志
journalctl -u myapp -n 100 --no-pager

# 查看核心转储
coredumpctl list
```

### 临时修改服务运行参数

```bash
# 不修改文件，临时覆盖参数
sudo systemctl edit myapp

# 这会创建 /etc/systemd/system/myapp.service.d/override.conf
# 在其中添加：
[Service]
Environment=DEBUG=true
```

## 常用命令速查

```bash
# === 服务管理 ===
sudo systemctl start service       # 启动
sudo systemctl stop service        # 停止
sudo systemctl restart service     # 重启
sudo systemctl reload service      # 重载配置
systemctl status service           # 查看状态
sudo systemctl enable service      # 开机自启
sudo systemctl disable service     # 取消自启
systemctl is-active service        # 是否运行中
systemctl is-enabled service       # 是否已设置自启

# === 日志查询 ===
journalctl -u service              # 查看服务日志
journalctl -u service -f           # 实时追踪
journalctl -u service -n 50        # 最近 50 行
journalctl -u service -p err       # 只看错误
journalctl --since today           # 今天的日志
journalctl -b                      # 本次启动的日志

# === 维护操作 ===
sudo systemctl daemon-reload       # 重载配置文件
systemctl list-units --type=service # 列出所有服务
systemctl --failed                 # 列出失败的服务
systemctl list-timers              # 列出所有定时器
systemd-analyze blame              # 启动耗时分析
```
