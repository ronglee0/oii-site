---
title: "crontab 定时任务详解：经典方案的正确使用姿势"
published: 2026-05-29
description: "crontab 是 Linux 最经典的定时任务工具，虽然 systemd timer 是现代替代，但 crontab 依然广泛使用。本文详解语法、实战场景和避坑指南。"
tags: [crontab, Linux, 定时任务, 运维, Shell]
category: "工具指南"
author: "Oii"
---

## crontab 是什么

crontab（cron table）是 Linux 的定时任务调度器，可以在指定时间自动执行命令或脚本。从系统备份到日志清理，从定时提醒到数据同步，cron 无处不在。

## 基本操作

```bash
# 编辑当前用户的定时任务
crontab -e

# 查看当前用户的定时任务
crontab -l

# 删除所有定时任务（慎用）
crontab -r

# 查看指定用户的定时任务（需要 root）
sudo crontab -u username -l
```

## cron 表达式语法

cron 表达式由 5 个时间字段 + 1 个命令组成：

```
┌───────────── 分钟 (0-59)
│ ┌───────────── 小时 (0-23)
│ │ ┌───────────── 日期 (1-31)
│ │ │ ┌───────────── 月份 (1-12)
│ │ │ │ ┌───────────── 星期 (0-7, 0 和 7 都是周日)
│ │ │ │ │
* * * * * command
```

### 特殊字符

| 字符 | 含义 | 示例 |
|------|------|------|
| `*` | 任意值 | `* * * * *` 每分钟 |
| `,` | 列举多个值 | `1,3,5` 第 1、3、5 分钟 |
| `-` | 范围 | `1-5` 第 1 到第 5 分钟 |
| `/` | 步长/间隔 | `*/5` 每隔 5 分钟 |

### 常用时间表达式

```bash
# 每分钟
* * * * * /path/to/script.sh

# 每小时的第 0 分钟
0 * * * * /path/to/script.sh

# 每天凌晨 3 点
0 3 * * * /path/to/script.sh

# 每天凌晨 3 点 30 分
30 3 * * * /path/to/script.sh

# 每周一上午 9 点
0 9 * * 1 /path/to/script.sh

# 每月 1 号凌晨 0 点
0 0 1 * * /path/to/script.sh

# 每 5 分钟
*/5 * * * * /path/to/script.sh

# 每小时的第 0 和第 30 分钟
0,30 * * * * /path/to/script.sh

# 工作日（周一到周五）上午 9 点
0 9 * * 1-5 /path/to/script.sh

# 每天 8 点到 18 点每小时执行
0 8-18 * * * /path/to/script.sh

# 每 15 分钟（工作日）
*/15 * * * 1-5 /path/to/script.sh
```

### 特殊字符串

某些 cron 实现支持便捷的特殊字符串：

```bash
@reboot     系统启动时执行
@yearly     每年（0 0 1 1 *）
@monthly    每月（0 0 1 * *）
@weekly     每周（0 0 * * 0）
@daily      每天（0 0 * * *）
@hourly     每小时（0 * * * *）
```

使用示例：

```bash
@reboot /home/user/startup.sh
@daily /home/user/backup.sh
```

## 输出与日志

cron 默认会将输出通过邮件发送给任务所属用户。但大多数系统没有配置邮件服务，输出会丢失。

### 重定向输出

```bash
# 将标准输出和错误输出都追加到日志文件
0 3 * * * /home/user/backup.sh >> /var/log/backup.log 2>&1

# 只记录错误，丢弃正常输出
0 3 * * * /home/user/backup.sh > /dev/null 2>&1

# 标准输出和错误输出分开记录
0 3 * * * /home/user/backup.sh >> /var/log/backup.log 2>> /var/log/backup-error.log
```

### 系统日志查看

```bash
# Ubuntu / Debian
grep CRON /var/log/syslog

# CentOS / RHEL
grep CRON /var/log/cron

# 使用 journalctl
journalctl -u cron
```

## 环境变量问题

cron 执行时的环境变量非常有限，这是最常见的坑之一。cron 的 PATH 通常只有 `/usr/bin:/bin`。

### 解决方案

```bash
# 方案一：在 crontab 开头设置环境变量
PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin
SHELL=/bin/bash
HOME=/home/user

0 3 * * * backup.sh >> /var/log/backup.log 2>&1

# 方案二：在命令中使用绝对路径
0 3 * * * /usr/local/bin/python3 /home/user/script.py >> /var/log/cron.log 2>&1

# 方案三：先 source 环境
0 3 * * * source /home/user/.bashrc && /home/user/script.sh >> /var/log/cron.log 2>&1

# 方案四：通过 bash 执行（确保脚本中的命令可用）
0 3 * * * /bin/bash -l -c '/home/user/script.sh' >> /var/log/cron.log 2>&1
```

> [!TIP]
> 在脚本开头加上 `set -euo pipefail` 可以让脚本在出错时立即停止，避免错误被静默忽略。

## 多用户管理

```bash
# 系统级 crontab
/etc/crontab              # 系统全局任务
/etc/cron.d/              # 额外的系统任务目录
/etc/cron.daily/          # 每天执行的脚本
/etc/cron.hourly/         # 每小时执行的脚本
/etc/cron.weekly/         # 每周执行的脚本
/etc/cron.monthly/        # 每月执行的脚本

# 用户级 crontab
/var/spool/cron/crontabs/ # 各用户的定时任务（不要直接编辑）
```

`/etc/crontab` 和用户 crontab 的区别：系统 crontab 多了一个用户字段：

```bash
# /etc/crontab 格式（有用户字段）
0 3 * * * root /home/user/backup.sh

# 用户 crontab 格式（无用户字段）
0 3 * * * /home/user/backup.sh
```

### 限制 cron 访问

```bash
# /etc/cron.allow — 只允许这些用户使用 cron
# /etc/cron.deny  — 禁止这些用户使用 cron
# 如果两个文件都不存在，取决于发行版的默认策略
```

## 实战场景

### 系统备份

```bash
# 每天凌晨 2 点备份数据库
0 2 * * * /usr/bin/mysqldump -u root mydb | gzip > /backup/db_$(date +\%Y\%m\%d).sql.gz

# 每周日备份整个网站目录
0 3 * * 0 tar -czf /backup/site_$(date +\%Y\%m\%d).tar.gz /var/www/html/

# 保留最近 7 天的备份，删除旧的
0 4 * * * find /backup/ -name "*.gz" -mtime +7 -delete
```

> [!TIP]
> cron 中的 `%` 需要转义为 `\%`，因为 cron 会将 `%` 解释为命令输入的换行符。

### 日志清理

```bash
# 每天清理 30 天前的日志
0 1 * * * find /var/log/myapp/ -name "*.log" -mtime +30 -delete

# 每周压缩上周的日志
0 2 * * 0 find /var/log/myapp/ -name "*.log" -mtime +7 -exec gzip {} \;
```

### 健康检查

```bash
# 每 5 分钟检查服务是否运行
*/5 * * * * systemctl is-active myapp || systemctl restart myapp >> /var/log/watchdog.log 2>&1

# 每小时检查磁盘空间，超过 90% 报警
0 * * * * df / | awk 'NR==2 && int($5)>90 {print "磁盘空间不足: "$5}' | mail -s "磁盘告警" admin@example.com

# 每天检查 SSL 证书是否即将过期
0 9 * * * echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -enddate
```

### 数据同步

```bash
# 每 10 分钟同步文件
*/10 * * * * rsync -az /data/source/ user@remote:/data/dest/ >> /var/log/sync.log 2>&1

# 每天凌晨拉取远程数据
0 1 * * * wget -q -O /data/latest.csv https://api.example.com/export
```

### 定时报告

```bash
# 每周一上午 9 点发送周报（磁盘使用 + 进程状态）
0 9 * * 1 (echo "=== 磁盘使用 ==="; df -h; echo; echo "=== 内存使用 ==="; free -h) | mail -s "周报" admin@example.com
```

## cron vs systemd timer

| 特性 | crontab | systemd timer |
|------|---------|---------------|
| 语法 | 5 段时间表达式 | OnCalendar / OnBootSec 等 |
| 日志 | 需手动重定向 | 自动记录到 journal |
| 依赖管理 | 不支持 | 支持 After/Wants |
| 错误处理 | 需自己实现 | 支持 OnFailure |
| 错过执行 | 直接跳过 | 支持 Persistent 补执行 |
| 资源限制 | 不支持 | 支持 MemoryMax/CPUQuota |
| 生态 | 通用、简单 | 仅 systemd 系统 |
| 适用场景 | 简单定时任务 | 复杂服务编排 |

简单任务用 cron，需要日志、依赖、重试等功能时用 systemd timer。两者不互斥，可以共存。

## 避坑清单

1. **绝对路径**：cron 的 PATH 很有限，命令和脚本都用绝对路径
2. **重定向输出**：始终用 `>> file 2>&1` 记录日志，否则输出丢失
3. **转义 %**：命令中的 `%` 要写成 `\%`
4. **时区问题**：cron 使用系统时区，确认 `timedatectl` 的设置
5. **权限问题**：脚本要有执行权限（`chmod +x`）
6. **环境变量**：脚本依赖的环境变量要在 crontab 或脚本中显式设置
7. **并发问题**：同一任务可能重叠执行，用 flock 或 PID 文件防止

```bash
# 用 flock 防止任务重叠
0 * * * * flock -n /tmp/backup.lock /home/user/backup.sh
```

> [!TIP]
> 新建定时任务后，建议先手动执行一次命令确认无误，再等待 cron 自动触发。很多问题（路径错误、权限不足、环境缺失）在手动执行时就能发现。
