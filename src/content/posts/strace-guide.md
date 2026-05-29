---
title: "strace 排障实战：追踪系统调用定位问题"
published: 2026-05-29
description: "strace 是 Linux 下最强的排障工具之一，通过追踪程序的系统调用，可以定位文件权限、网络连接、性能瓶颈等疑难问题。"
tags: [strace, Linux, 排障, 系统调试, 运维]
category: "工具指南"
author: "Oii"
---

## 什么是 strace

strace 是一个系统调用追踪工具，它可以拦截并记录程序运行时发出的每一个系统调用（syscall）——打开文件、读写网络、分配内存、创建进程等。

当程序"莫名"出错、日志不给信息时，strace 通常能直接告诉你问题在哪。

## 基本用法

```bash
# 运行并追踪一个命令
strace ls /tmp

# 追踪已运行的进程（PID）
strace -p 12345

# 追踪并统计系统调用
strace -c ls /tmp
```

## 常用选项

| 选项 | 含义 |
|------|------|
| `-p PID` | 附加到正在运行的进程 |
| `-e trace=类别` | 只追踪指定类别的系统调用 |
| `-e expr` | 过滤表达式 |
| `-f` | 追踪子进程 |
| `-o file` | 输出到文件而非 stderr |
| `-c` | 统计系统调用次数和耗时 |
| `-t` / `-tt` / `-ttt` | 显示时间戳 |
| `-T` | 显示每个系统调用的耗时 |
| `-s len` | 字符串截断长度（默认 32） |
| `-y` | 将 fd 显示为文件路径 |
| `-yy` | 显示 fd 的完整 socket 信息 |

## 追踪类别过滤

`-e trace=` 支持按类别过滤，避免输出过多噪音：

```bash
# 只追踪文件相关调用
strace -e trace=file ls /tmp

# 只追踪网络相关调用
strace -e trace=network curl https://example.com

# 只追踪进程管理
strace -e trace=process bash -c "echo hello"

# 只追踪内存相关
strace -e trace=memory ls /

# 只追踪 I/O
strace -e trace=read,write cat /etc/hosts

# 排除某类调用
strace -e trace=!write ls /tmp
```

常用类别：`file`、`network`、`process`、`memory`、`signal`、`ipc`、`desc`（文件描述符）

## 输出解读

strace 的每一行输出格式：

```
系统调用名(参数...) = 返回值 (错误信息)
```

常见示例：

```bash
# 正常打开文件
open("/etc/hosts", O_RDONLY) = 3

# 文件不存在
open("/etc/nonexist", O_RDONLY) = -1 ENOENT (No such file or directory)

# 权限不足
open("/etc/shadow", O_RDONLY) = -1 EACCES (Permission denied)

# 网络连接
connect(3, {sa_family=AF_INET, sin_port=htons(443), sin_addr=inet_addr("93.184.216.34")}, 16) = 0

# 读取数据
read(3, "HTTP/1.1 200 OK\r\n...", 4096) = 1234
```

常见错误码：

| 错误码 | 含义 | 常见原因 |
|--------|------|---------|
| `ENOENT` | 文件不存在 | 路径错误、文件未创建 |
| `EACCES` | 权限不足 | 文件权限、SELinux |
| `ECONNREFUSED` | 连接被拒绝 | 服务未启动、端口不对 |
| `ETIMEDOUT` | 连接超时 | 网络不通、防火墙 |
| `EADDRINUSE` | 地址已被占用 | 端口冲突 |
| `ENOMEM` | 内存不足 | OOM |
| `EPERM` | 操作不允许 | 权限不足、需要 root |

## 实战场景

### 场景一：程序找不到配置文件

程序报错但没说在找哪个文件：

```bash
strace -e trace=open,openat -f your_program 2>&1 | grep -i "ENOENT"
```

输出会告诉你程序尝试打开哪些文件、哪些不存在。

### 场景二：服务启动失败排查

```bash
# 追踪 systemd 启动的服务
strace -f -o /tmp/strace.log systemctl start myservice

# 或者直接追踪进程
strace -f -e trace=file,network -o /tmp/strace.log your_daemon
```

然后在日志中搜索 `EACCES`、`ENOENT`、`ECONNREFUSED` 等错误。

### 场景三：程序卡住不动

```bash
# 附加到卡住的进程
strace -p $(pgrep your_program)

# 或者带时间戳
strace -p $(pgrep your_program) -t -T
```

看看它在哪个系统调用上阻塞——通常是 `read()`、`connect()`、`futex()` 等。

### 场景四：网络连接问题

```bash
# 追踪 curl 的网络调用
strace -e trace=network curl https://example.com 2>&1 | grep -E "connect|sendto|recvfrom"
```

### 场景五：性能分析

```bash
# 统计系统调用耗时
strace -c your_program

# 带排序的统计
strace -c -S time your_program
```

输出示例：

```
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 45.23    0.123456          12     10000           write
 30.15    0.082345           8     10000           read
 15.67    0.042789          42      1000       500 open
  8.95    0.024567          24      1000           close
```

### 场景六：程序打开了哪些文件

```bash
# 追踪文件操作
strace -e trace=open,openat,read,write -f your_program 2>&1 | head -50

# 更友好的方式（追踪 fd）
strace -e trace=desc -y your_program
```

### 场景七：DNS 解析问题

```bash
strace -e trace=network curl https://example.com 2>&1 | grep -i "connect\|sendto"
```

可以看到实际连接的 IP 地址，判断 DNS 是否解析正确。

## 高级用法

### 追踪多进程

```bash
# -f 追踪所有子进程
strace -f -o trace.log your_program

# 配合 filter 只看特定进程
strace -f -e trace=file your_program 2>&1 | grep "pid 1234"
```

### 时间相关

```bash
# 显示时间戳（微秒）
strace -tt your_program

# 显示每个调用的耗时
strace -T your_program

# 显示相对时间（从追踪开始经过的时间）
strace -r your_program
```

### 输出到文件

```bash
# 输出到文件（推荐，避免 stderr 和 stdout 混在一起）
strace -o trace.log your_program

# 每个进程单独输出
strace -ff -o trace your_program
# 生成 trace.1234、trace.1235 等文件
```

### 限制输出长度

```bash
# 默认字符串截断为 32 字符，可以加大
strace -s 1024 curl https://example.com

# 不截断（小心输出量）
strace -s 0 your_program
```

## strace 的开销

strace 会显著拖慢被追踪的程序（通常慢 10-100 倍），因为每个系统调用都要经过 ptrace 上下文切换。

注意事项：
- 不要在生产环境长时间运行 strace
- 使用 `-e trace=` 过滤可以减少开销
- 用完后记得 Ctrl+C 停止
- 对于高并发程序，考虑用 `perf` 或 `bpftrace` 替代

## 替代工具

| 工具 | 特点 |
|------|------|
| `ltrace` | 追踪库函数调用（而非系统调用） |
| `perf` | 内核级性能分析，开销极低 |
| `bpftrace` | 基于 eBPF 的现代追踪，更安全、更低开销 |
| `dtrace` | Solaris/macOS 的追踪工具 |
| `lsof` | 查看进程打开的文件和连接 |

> [!TIP]
> strace 输出量通常很大，建议始终用 `-o` 输出到文件，然后用 `grep` 过滤。直接在终端看容易被淹没。
