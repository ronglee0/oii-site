---
title: "mtr + dig + whois：网络诊断三件套"
published: 2026-05-29
description: "网络问题排查不能只靠 ping，本文介绍 mtr、dig、whois 三个工具，覆盖路由追踪、DNS 诊断、域名信息查询，帮你快速定位网络故障。"
tags: [网络, Linux, mtr, dig, whois, 运维]
category: "工具指南"
author: "Oii"
---

## 不止是 ping

网络出问题时，很多人的第一反应是 `ping`。但 ping 只能告诉你"通不通"，无法回答：

- 在哪一跳出了问题？
- DNS 有没有解析正确？
- 域名归谁管、什么时候到期？

mtr、dig、whois 分别解决这三个问题，是网络排障的三件核心工具。

## mtr：路由追踪 + 实时监控

mtr（My Traceroute）结合了 `traceroute` 和 `ping` 的功能，能逐跳显示到目标的路径，并持续监控每一跳的延迟和丢包率。

### 安装

```bash
# Ubuntu / Debian
sudo apt install mtr

# CentOS / RHEL
sudo yum install mtr

# macOS
brew install mtr
```

### 基本用法

```bash
# 追踪到目标的路由
mtr example.com

# 不做 DNS 反解析（更快）
mtr -n example.com

# 只显示一次结果（不循环）
mtr -r -c 10 example.com

# 指定发送次数
mtr -c 20 example.com
```

### 输出解读

```
HOST                         Loss%   Snt   Last   Avg  Best  Wrst StDev
1. gateway                    0.0%   100    0.5   0.6   0.3   1.2   0.2
2. isp-router                 0.0%   100    3.2   3.5   2.8   8.1   0.8
3. ???                       100.0   100    0.0   0.0   0.0   0.0   0.0
4. backbone-router            0.0%   100   15.3  15.8  14.9  22.1   1.5
5. target-server              0.0%   100   20.1  20.5  19.8  25.3   1.1
```

各列含义：

| 列 | 含义 |
|-----|------|
| `Loss%` | 丢包率 |
| `Snt` | 已发送的包数 |
| `Last` | 最近一次延迟（ms） |
| `Avg` | 平均延迟 |
| `Best` | 最低延迟 |
| `Wrst` | 最高延迟 |
| `StDev` | 标准差（越小越稳定） |

关键判断：
- **Loss% 100%** + **???**：该跳路由器不响应 ICMP，但不代表有问题（很多骨干路由器会屏蔽 ICMP）
- **Loss% 突然升高**：从某一跳开始丢包，问题可能在那一跳或之前
- **延迟突然增大**：找到延迟跳变的位置，通常就是瓶颈所在

### 高级用法

```bash
# TCP 模式（绕过 ICMP 屏蔽）
mtr -T -P 443 example.com

# UDP 模式
mtr -u example.com

# 指定源 IP（多网卡时）
mtr -a 192.168.1.100 example.com

# JSON 输出
mtr -j example.com

# XML 输出
mtr -x example.com

# 设置包大小
mtr -s 1400 example.com
```

### 实战：判断丢包位置

```bash
mtr -r -c 50 target-server.com
```

分析方法：
1. 如果第 3 跳 100% 丢包但后续跳正常 → 第 3 跳屏蔽了 ICMP，无影响
2. 如果第 5 跳开始出现 10% 丢包且后续一直丢 → 问题在第 5 跳或之前
3. 如果只有最后一跳丢包 → 目标服务器本身的问题

## dig：DNS 诊断利器

dig（Domain Information Groper）是 DNS 查询工具，能精确查看域名的解析过程和各种 DNS 记录。

### 基本查询

```bash
# 查询 A 记录
dig example.com

# 查询指定类型的记录
dig example.com AAAA     # IPv6
dig example.com MX       # 邮件服务器
dig example.com NS       # 域名服务器
dig example.com TXT      # TXT 记录（SPF、DKIM 等）
dig example.com CNAME    # 别名记录
dig example.com SOA      # 权威记录
dig example.com ANY      # 所有记录
```

### 输出解读

dig 的输出分为几个部分：

```
;; ANSWER SECTION:
example.com.     300     IN      A       93.184.216.34
```

| 字段 | 含义 |
|------|------|
| `example.com.` | 查询的域名 |
| `300` | TTL（缓存时间，秒） |
| `IN` | 类别（Internet） |
| `A` | 记录类型 |
| `93.184.216.34` | 解析结果 |

### 精简输出

```bash
# 只看结果（+short）
dig +short example.com
# 输出: 93.184.216.34

# 查询 AAAA 记录（简短）
dig +short example.com AAAA

# 查询 MX 记录（简短）
dig +short example.com MX
```

### 指定 DNS 服务器

```bash
# 使用 Google DNS 查询
dig @8.8.8.8 example.com

# 使用 Cloudflare DNS
dig @1.1.1.1 example.com

# 使用域名自己的权威服务器
dig @ns1.example.com example.com
```

这在排查 DNS 问题时非常有用——对比不同 DNS 服务器的结果是否一致。

### 追踪解析过程

```bash
# 追踪完整的 DNS 解析链
dig +trace example.com
```

输出从根域名服务器开始，逐级向下查询：

```
.                       518400  IN  NS  a.root-servers.net.
com.                    172800  IN  NS  a.gtld-servers.net.
example.com.            86400   IN  NS  a.iana-servers.net.
example.com.            300     IN  A   93.184.216.34
```

### 反向查询

```bash
# 通过 IP 查域名（PTR 记录）
dig -x 93.184.216.34

# 简短输出
dig +short -x 93.184.216.34
```

### DNSSEC 验证

```bash
# 检查 DNSSEC 签名
dig +dnssec example.com

# 检查 DNSKEY
dig example.com DNSKEY
```

### 实战场景

```bash
# 检查域名是否正确解析
dig +short example.com

# 检查所有权威服务器
dig +short example.com NS

# 检查邮件服务器配置
dig +short example.com MX

# 检查 SPF 记录
dig +short example.com TXT | grep "v=spf1"

# 检查域名的 CAA 记录（允许哪些 CA 签发证书）
dig +short example.com CAA

# 对比不同 DNS 的解析结果
diff <(dig +short @8.8.8.8 example.com) <(dig +short @1.1.1.1 example.com)

# 查看 DNS 缓存剩余时间
dig example.com | grep -E "^[^;]" | awk '{print $1, $2, $3, $4, $5}'

# 批量查询多个域名
for domain in google.com github.com cloudflare.com; do
    echo -n "$domain -> "; dig +short $domain
done
```

## whois：域名信息查询

whois 用于查询域名的注册信息，包括注册商、注册日期、过期时间、DNS 服务器等。

### 安装

```bash
# Ubuntu / Debian
sudo apt install whois

# macOS 通常已预装
```

### 基本用法

```bash
# 查询域名信息
whois example.com
```

### 常用查询

```bash
# 查看过期时间
whois example.com | grep -i "expir"

# 查看注册商
whois example.com | grep -i "registrar"

# 查看 DNS 服务器
whois example.com | grep -i "name server"

# 查看注册日期
whois example.com | grep -i "creat"

# 查询 IP 归属
whois 8.8.8.8

# 查询 ASN
whois -h whois.radb.net AS15169
```

### 输出关键字段

```bash
whois example.com | grep -iE "registrar|creation|expir|name server|status"
```

常见字段：

| 字段 | 含义 |
|------|------|
| `Domain Name` | 域名 |
| `Registrar` | 注册商 |
| `Creation Date` | 注册日期 |
| `Registry Expiry Date` | 到期日期 |
| `Name Server` | DNS 服务器 |
| `Domain Status` | 域名状态（clientTransferProhibited 等） |

### 实战场景

```bash
# 检查域名是否即将过期
whois example.com | grep -i "expir" | head -1

# 查看域名状态（是否被锁定）
whois example.com | grep -i "status"

# 批量检查域名是否可注册
for domain in myidea.com myidea.io myidea.dev; do
    result=$(whois $domain 2>/dev/null | grep -i "no match\|not found\|no data")
    if [ -n "$result" ]; then
        echo "$domain: 可能可注册"
    else
        echo "$domain: 已被注册"
    fi
done

# 查询 IP 段归属
whois 1.1.1.1 | grep -iE "org|country|netname"
```

## 三件套联合排障

一个完整的网络排障流程：

```bash
# Step 1: dig 确认 DNS 解析是否正确
dig +short example.com
dig @8.8.8.8 example.com  # 对比公共 DNS

# Step 2: mtr 检查路由路径和丢包
mtr -r -c 20 example.com

# Step 3: whois 确认域名/IP 归属
whois example.com
whois $(dig +short example.com | head -1)
```

### 常见问题定位

| 症状 | 检查步骤 | 可能原因 |
|------|---------|---------|
| 网站打不开 | dig 看解析 | DNS 未配置或过期 |
| 解析到错误 IP | dig @不同DNS 对比 | DNS 劫持或缓存污染 |
| 间歇性超时 | mtr 看丢包位置 | 中间链路质量问题 |
| 延迟很高 | mtr 找延迟跳变 | 跨运营商或路由绕行 |
| 域名突然失效 | whois 看过期时间 | 域名过期未续费 |
| 邮件收不到 | dig MX 记录 | MX 记录未配置或错误 |

> [!TIP]
> `dig +trace` 是排查 DNS 问题最强大的命令——它会显示从根服务器开始的完整解析链路，DNS 在哪一级出问题一目了然。
