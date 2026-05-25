---
title: "Linux 端口查看工具对比指南：从 netstat 到现代替代方案"
published: 2026-05-25
description: "全面对比 Linux 下查看端口和网络连接的传统与现代工具，包括 netstat、ss、lsof、fuser 等，助你选择最适合的方案。"
tags: [Linux, 网络, 运维, 端口排查]
category: "工具指南"
author: "Oii"
---

## 为什么需要端口查看

在 Linux 日常运维和开发中，排查端口占用是高频需求：

- 服务启动报错 "Address already in use"
- 排查某个端口被哪个进程占用
- 检查服务器开放了哪些端口
- 分析网络连接状态

## 传统工具 vs 现代工具

:::tip
net-tools 包（包含 netstat）在许多发行版中已被标记为废弃，推荐优先使用 iproute2 包中的现代工具。
:::

| 维度 | 传统工具 | 现代工具 |
|------|---------|---------|
| 代表 | `netstat`、`ifconfig` | `ss`、`ip` |
| 所属包 | net-tools | iproute2 |
| 性能 | 较慢，解析 `/proc` 文件 | 快，直接读取 netlink socket |
| 维护状态 | 基本停止维护 | 活跃维护 |
| 是否预装 | 新发行版可能不预装 | 几乎所有主流发行版预装 |

## netstat — 经典但逐渐退出

### 基本用法

```bash
# 查看所有监听端口
netstat -tlnp

# 查看所有 TCP 连接
netstat -tnp

# 查看所有 UDP 端口
netstat -ulnp

# 查看所有连接（TCP + UDP）
netstat -anp
```

常用参数：

| 参数 | 含义 |
|------|------|
| `-t` | 仅显示 TCP |
| `-u` | 仅显示 UDP |
| `-l` | 仅显示监听状态 |
| `-n` | 以数字形式显示地址和端口（不解析域名） |
| `-p` | 显示关联的进程信息（需要 root） |
| `-a` | 显示所有连接（监听 + 非监听） |

### 输出示例

```
Proto Recv-Q Send-Q Local Address    Foreign Address  State    PID/Program
tcp        0      0 0.0.0.0:22       0.0.0.0:*        LISTEN   1234/sshd
tcp        0      0 127.0.0.1:3306   0.0.0.0:*        LISTEN   5678/mysqld
tcp        0      0 10.0.0.1:45678   93.184.216.34:443 ESTABLISHED 9012/curl
```

### 拓展用法

```bash
# 统计各状态的连接数量
netstat -an | awk '/^tcp/ {print $6}' | sort | uniq -c | sort -rn

# 持续监控端口变化（每秒刷新）
watch -n 1 "netstat -tlnp"

# 查找特定端口
netstat -tlnp | grep :8080

# 查找特定进程的所有连接
netstat -anp | grep nginx
```

## ss — 推荐的现代替代

### 基本用法

```bash
# 查看所有监听的 TCP 端口
ss -tlnp

# 查看所有 TCP 连接
ss -tnp

# 查看所有 UDP 端口
ss -ulnp

# 查看所有连接
ss -anp
```

参数与 netstat 高度相似，迁移成本很低。

### ss 独有的优势

**1. 强大的过滤能力**

```bash
# 只看 ESTABLISHED 状态的连接
ss -t state established

# 只看 TIME_WAIT 状态
ss -t state time-wait

# 查看源端口为 80 的连接
ss -tn sport = :80

# 查看目标端口为 443 的连接
ss -tn dport = :443

# 组合条件：目标端口 443 且状态为 established
ss -tn state established dport = :443
```

**2. 查看 socket 统计信息**

```bash
# 查看 TCP socket 的详细统计
ss -s

# 输出示例：
# Total: 156
# TCP:   89 (estab 45, closed 12, orphaned 0, timewait 8)
```

**3. 查看进程的完整信息**

```bash
# 显示进程名和 PID
ss -tlnp

# 输出中会包含 users:(("nginx",pid=1234,fd=6))
```

**4. 使用表达式进行复杂过滤**

```bash
# 端口范围过滤
ss -tn 'sport >= :1024 and sport <= :65535'

# 排除本地回环
ss -tn not dst 127.0.0.1

# 查看指定 IP 的连接
ss -tn dst 192.168.1.100
```

> [!TIP]
> ss 的过滤语法非常灵活，等同于对 `ss` 命令的输出做程序化查询，比 `netstat | grep` 更高效准确。

### 性能对比

```bash
# 在大量连接的服务器上，ss 的速度优势明显
time ss -tlnp        # 通常 < 0.1s
time netstat -tlnp   # 可能需要几秒甚至更久
```

> [!NOTE]
> 在拥有数万连接的服务器上，ss 可以比 netstat 快 10 倍以上。这是因为 ss 直接从内核的 netlink 接口读取数据，而 netstat 需要遍历 `/proc/net/` 下的文件。

## lsof — 从进程角度查端口

### 基本用法

```bash
# 查看某个端口被谁占用
lsof -i :8080

# 查看某个进程打开了哪些网络连接
lsof -i -p 1234

# 查看某个用户的所有网络连接
lsof -i -u www-data
```

### 拓展用法

```bash
# 查看所有监听端口
lsof -iTCP -sTCP:LISTEN

# 查看指定协议的连接
lsof -iTCP
lsof -iUDP

# 查看到某台主机的连接
lsof -i@192.168.1.100

# 查看端口范围
lsof -i :80-443

# 查看某个程序打开的所有文件和网络
lsof -c nginx

# 实时监控（每秒刷新，类似 watch）
lsof -i :3306 -r 1
```

### lsof 的独特价值

lsof 不仅能看网络端口，还能查看进程打开的所有文件、Unix socket、管道等。当你需要回答"这个进程到底在干什么"时，lsof 是最佳选择。

```bash
# 查看进程打开的所有资源（文件 + 网络 + 管道）
lsof -p 1234

# 查看某个文件被哪些进程使用
lsof /var/log/syslog

# 查看 Unix domain socket
lsof -U
```

## fuser — 快速定位占用端口的进程

### 基本用法

```bash
# 查看占用 80 端口的进程
fuser 80/tcp

# 带进程名显示
fuser -v 80/tcp
```

输出示例：

```
                     USER        PID ACCESS COMMAND
80/tcp:              www-data    1234 F.... nginx
                     root        5678 f.... nginx
```

### 拓展用法

```bash
# 杀掉占用某端口的进程（谨慎使用）
fuser -k 80/tcp

# 向占用端口的进程发送指定信号
fuser -k -HUP 80/tcp

# 查看使用某文件系统的进程
fuser -m /mnt/data
```

:::caution
`fuser -k` 会直接杀死进程，生产环境慎用。建议先用 `-v` 确认进程信息。
:::

## nmap — 从外部扫描端口

前面的工具都是查看本机端口，nmap 可以从外部扫描目标主机的端口状态。

### 基本用法

```bash
# 扫描目标主机的常用端口
nmap 192.168.1.100

# 扫描指定端口
nmap -p 80,443,8080 192.168.1.100

# 扫描端口范围
nmap -p 1-1024 192.168.1.100

# 扫描所有端口
nmap -p- 192.168.1.100

# 服务版本探测
nmap -sV 192.168.1.100
```

### 拓展用法

```bash
# 快速扫描（跳过主机发现，适合已知在线的主机）
nmap -Pn -F 192.168.1.100

# 扫描整个子网
nmap 192.168.1.0/24

# 检测操作系统
nmap -O 192.168.1.100

# 输出到文件
nmap -oN scan_result.txt 192.168.1.100

# TCP SYN 扫描（半开扫描，需要 root 权限）
nmap -sS 192.168.1.100
```

## 如何选择

**快速决策：**

- 扫描远程主机端口 → `nmap`
- 查看本机监听端口 → `ss -tlnp`
- 哪个进程占用了端口 → `lsof -i :端口`
- 快速杀掉占用端口的进程 → `fuser -k 端口/tcp`
- 查看完整网络状态 → `ss -anp`
- 需要 socket 统计 → `ss -s`
- 老系统兼容 → `netstat -tlnp`

### 推荐优先级

| 场景 | 首选 | 次选 |
|------|------|------|
| 查看本机监听端口 | `ss -tlnp` | `netstat -tlnp` |
| 查找端口占用进程 | `lsof -i :PORT` | `ss -tlnp` |
| 批量查看连接状态 | `ss -anp` | `netstat -anp` |
| 快速杀掉占用进程 | `fuser -k PORT/tcp` | `kill $(lsof -t -i :PORT)` |
| 扫描远程主机端口 | `nmap` | `nc -zv host port` |
| 分析 TCP 连接统计 | `ss -s` | `netstat -an \| awk ...` |

## 速查表

```bash
# === 最常用的几条 ===

# 查看本机所有监听端口
ss -tlnp

# 查看某个端口被谁占用
lsof -i :8080

# 查看某个进程的网络连接
ss -tnp | grep nginx

# 统计各状态连接数
ss -s

# 快速杀掉占用端口的进程
fuser -k 80/tcp

# 扫描远程主机端口
nmap -p 1-1024 192.168.1.100

# 实时监控连接变化
watch -n 1 "ss -s"
```

## 常见问题

### Address already in use 怎么办

```bash
# 第一步：找到占用端口的进程
ss -tlnp | grep :8080

# 或者
lsof -i :8080

# 第二步：根据情况处理
# 方案 A：杀掉进程
kill <PID>

# 方案 B：等 TIME_WAIT 过期（默认 60s）
ss -t state time-wait sport = :8080

# 方案 C：允许端口复用（需在程序启动前设置）
sysctl -w net.ipv4.tcp_tw_reuse=1
```

### 权限不足怎么办

```bash
# 查看进程信息需要权限，加 sudo
sudo ss -tlnp
sudo lsof -i :80

# 或者切换到 root
sudo -i
```

### 如何持续监控端口变化

```bash
# 方法一：watch 命令
watch -n 2 "ss -tlnp"

# 方法二：lsof 的 -r 参数
lsof -i :3306 -r 2

# 方法三：配合 diff 查看变化
while true; do ss -tnp > /tmp/ss_now.txt; diff /tmp/ss_prev.txt /tmp/ss_now.txt; mv /tmp/ss_now.txt /tmp/ss_prev.txt; sleep 2; done
```
