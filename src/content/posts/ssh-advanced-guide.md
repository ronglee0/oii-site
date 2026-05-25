---
title: "SSH 进阶用法：隧道、跳板机与实用技巧"
published: 2026-05-26
description: "SSH 不只是远程登录工具，本文介绍 SSH 隧道转发、跳板机配置、Agent Forwarding 等进阶用法，助你高效管理远程开发环境。"
tags: [SSH, Linux, 远程开发, 网络]
category: "工具指南"
author: "Oii"
---

## 不只是远程登录

大多数人对 SSH 的印象停留在 `ssh user@host`，但它实际上是一个强大的网络工具，能做端口转发、代理、跳板穿透等操作。

## SSH 配置文件

在 `~/.ssh/config` 中可以为每个主机预设连接参数，省去每次输入长命令的麻烦：

```
# 个人服务器
Host myserver
    HostName 192.168.1.100
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_personal

# 公司开发机
Host work-dev
    HostName dev.company.com
    User zhangsan
    ProxyJump jump.company.com

# GitHub
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_github
```

配置完成后直接用别名连接：

```bash
ssh myserver          # 等同于 ssh -p 2222 deploy@192.168.1.100
ssh work-dev          # 自动通过跳板机连接
git clone git@github.com:user/repo.git   # 自动使用指定密钥
```

> [!TIP]
> 配置文件的匹配是从上到下的，第一个匹配到的 Host 块生效。把最常用的放前面。

## 隧道转发

SSH 隧道可以在不安全的网络上建立加密的数据通道，是最实用的进阶功能之一。

### 本地端口转发（-L）

把远程服务映射到本地端口，最常见的场景：

```bash
# 将远程的 MySQL 3306 端口映射到本地 13306
ssh -L 13306:localhost:3306 myserver

# 之后用本地工具连接
mysql -h 127.0.0.1 -P 13306 -u root -p
```

```bash
# 映射远程内网服务到本地
# 将本地 8080 转发到内网 10.0.0.5 的 80 端口
ssh -L 8080:10.0.0.5:80 myserver
```

使用场景：
- 安全地访问远程数据库
- 本地调试远程服务
- 访问内网 Web 管理面板

### 远程端口转发（-R）

把本地服务暴露到远程服务器，适合从外部访问内网服务：

```bash
# 将本地 3000 端口暴露到远程服务器的 8080 端口
ssh -R 8080:localhost:3000 myserver
```

之后其他人通过 `myserver:8080` 就能访问你本地运行在 3000 端口的服务。

使用场景：
- 本地开发环境临时对外展示
- 把内网的 Webhook 接口暴露给外部服务
- 从外网访问家中/公司的内网服务

> [!NOTE]
> 远程端口转发需要在远程服务器的 sshd 配置中开启 `GatewayPorts yes`，否则默认只绑定 127.0.0.1。

### 动态端口转发 / SOCKS 代理（-D）

将 SSH 变成一个 SOCKS5 代理服务器：

```bash
# 在本地 1080 端口开启 SOCKS5 代理
ssh -D 1080 myserver
```

然后在浏览器或系统中设置 SOCKS5 代理为 `127.0.0.1:1080`，所有流量都会通过远程服务器转发。

```bash
# 用 curl 测试代理
curl --socks5 127.0.0.1:1080 https://httpbin.org/ip

# 或者配合 proxychains 使用
proxychains curl https://httpbin.org/ip
```

使用场景：
- 安全地使用公共 Wi-Fi
- 访问受限的网络资源
- 简单的网络调试

### 后台运行隧道

隧道默认会在前台运行，断开终端就会中断。加 `-N` 和 `-f` 参数让它后台运行：

```bash
# -N 不执行远程命令，-f 后台运行
ssh -N -f -L 13306:localhost:3306 myserver

# 查看隧道进程
ps aux | grep "ssh -N"
```

也可以在 config 文件中持久化：

```
Host my-tunnel
    HostName 192.168.1.100
    User deploy
    LocalForward 13306 localhost:3306
    LocalForward 8080 localhost:80
    RequestTTY no
    RemoteCommand none
```

## 跳板机（ProxyJump）

通过一台中间服务器（跳板机）访问无法直接连接的内网主机：

```bash
# 传统写法：先登录跳板机，再从跳板机登录目标
ssh jump-server
ssh internal-server

# ProxyJump 一条命令搞定
ssh -J jump-server internal-server

# 多级跳板
ssh -J jump1,jump2,jump3 final-server
```

在 config 文件中配置：

```
Host jump
    HostName jump.company.com
    User admin

Host internal-db
    HostName 10.0.0.50
    User dbadmin
    ProxyJump jump

Host internal-app
    HostName 10.0.0.60
    User developer
    ProxyJump jump
```

之后直接 `ssh internal-db` 就能穿透跳板机访问内网。

> [!TIP]
> `ProxyJump` 是 OpenSSH 7.3 引入的，比旧的 `ProxyCommand` 写法更简洁。如果系统较老，可以用 `ProxyCommand ssh jump-server -W %h:%p` 替代。

## Agent Forwarding

Agent Forwarding 让你在跳板机上使用本地的 SSH 密钥，而不需要把私钥复制到跳板机上：

```bash
# 启用 Agent Forwarding
ssh -A jump-server

# 在跳板机上可以直接使用本地密钥
ssh internal-server        # 自动使用你本地的密钥
git clone git@github.com:user/repo.git  # 在跳板机上也能用 GitHub
```

在 config 文件中永久启用：

```
Host jump
    HostName jump.company.com
    ForwardAgent yes
```

> [!CAUTION]
> 只在你信任的服务器上启用 Agent Forwarding。root 用户可以通过 agent socket 冒用你的密钥进行认证。生产环境建议用 `ProxyJump` 替代。

## 实用技巧

### 保持连接不掉线

服务器空闲一段时间后 SSH 连接会断开，在 config 中设置心跳：

```
Host *
    ServerAliveInterval 30
    ServerAliveCountMax 3
```

这会每 30 秒发送一次心跳包，连续 3 次无响应才断开。

### 复用连接加速

首次连接后，后续连接可以复用已有的 SSH 进程，省去重新握手和认证的时间：

```
Host *
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h-%p
    ControlPersist 600
```

```bash
# 创建 socket 目录
mkdir -p ~/.ssh/sockets
```

效果：第二次 `ssh myserver` 几乎瞬间连接，SCP/SFTP 也会复用。

### 文件传输

```bash
# SCP 基本用法
scp local_file.txt myserver:/remote/path/
scp myserver:/remote/file.txt ./local_path/

# SCP 递归传输目录
scp -r ./local_dir myserver:/remote/path/

# rsync 更适合大文件同步
rsync -avz --progress ./local_dir myserver:/remote/path/

# rsync 通过跳板机
rsync -avz -e "ssh -J jump-server" ./local_dir internal-server:/path/
```

### 远程执行命令

```bash
# 不进入交互式 shell，直接执行命令
ssh myserver "df -h && free -m"

# 多台服务器批量执行
for host in server1 server2 server3; do
    ssh $host "uptime"
done

# 通过跳板机执行
ssh -J jump internal-db "mysql -e 'SHOW DATABASES;'"
```

### 端口转发的替代写法

在 config 文件中声明端口转发，比每次敲命令更方便：

```
Host db-tunnel
    HostName myserver
    LocalForward 13306 localhost:3306
    LocalForward 6379 localhost:6379
    RequestTTY no
    RemoteCommand none
```

启动隧道只需 `ssh db-tunnel`。

## SSH 安全加固

在 `/etc/ssh/sshd_config` 中的推荐设置：

```
# 禁用密码登录（确认密钥可用后再开启）
PasswordAuthentication no

# 禁用 root 直接登录
PermitRootLogin no

# 修改默认端口
Port 2222

# 限制登录用户
AllowUsers deploy admin
```

修改后重启 sshd：

```bash
sudo systemctl restart sshd
```

> [!CAUTION]
> 修改 sshd 配置前，确保你有其他方式（如控制台）能访问服务器，避免配置错误导致锁死。

## 速查表

```bash
# === 连接 ===
ssh myserver                           # 使用 config 别名连接
ssh -p 2222 user@host                  # 指定端口
ssh -J jump user@internal              # 通过跳板机

# === 隧道 ===
ssh -L 13306:localhost:3306 host       # 本地转发
ssh -R 8080:localhost:3000 host        # 远程转发
ssh -D 1080 host                       # SOCKS5 代理

# === 文件传输 ===
scp file.txt host:/path/               # 复制文件到远程
scp host:/path/file.txt ./             # 从远程复制文件
rsync -avz ./dir host:/path/           # 目录同步

# === 实用参数 ===
ssh -N -f -L ...                       # 后台运行隧道
ssh -A host                            # 启用 Agent Forwarding
ssh -o StrictHostKeyChecking=no host   # 跳过主机确认（脚本用）
```
