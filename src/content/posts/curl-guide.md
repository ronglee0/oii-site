---
title: "curl 从入门到精通：HTTP 请求调试完全指南"
published: 2026-05-29
description: "curl 不只是下载工具，它是 API 调试、HTTP 分析、文件传输的利器。本文从基础用法到高级技巧，全面掌握 curl 的核心能力。"
tags: [curl, HTTP, API, Linux, 网络调试]
category: "工具指南"
author: "Oii"
---

## curl 不只是下载工具

大多数人对 curl 的印象停留在 `curl -O` 下载文件，但它实际上是功能最全面的 HTTP 客户端之一：

- API 接口调试（GET/POST/PUT/DELETE）
- HTTP 请求/响应分析
- 文件上传下载
- Cookie/Session 管理
- TLS/SSL 调试
- 性能计时

## 基本语法

```bash
curl [选项] URL
```

## GET 请求

```bash
# 最简单的 GET
curl https://api.example.com/users

# 美化 JSON 输出（配合 jq）
curl -s https://api.example.com/users | jq '.'

# 带查询参数
curl "https://api.example.com/users?page=2&limit=10"

# 只看响应头
curl -I https://example.com

# 包含响应头
curl -i https://api.example.com/users

# 静默模式（不显示进度条）
curl -s https://api.example.com/users

# 静默但显示错误
curl -sS https://api.example.com/users
```

## POST 请求

```bash
# 发送 JSON 数据
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# 从文件读取 JSON
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d @data.json

# 发送表单数据
curl -X POST https://example.com/login \
  -d "username=admin&password=123456"

# 发送多个表单字段（更清晰的写法）
curl -X POST https://example.com/login \
  -d username=admin \
  -d password=123456
```

## PUT / PATCH / DELETE

```bash
# PUT 更新资源
curl -X PUT https://api.example.com/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated"}'

# PATCH 部分更新
curl -X PATCH https://api.example.com/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Patched"}'

# DELETE 删除资源
curl -X DELETE https://api.example.com/users/1
```

## 请求头管理

```bash
# 自定义请求头
curl -H "Authorization: Bearer token123" https://api.example.com/me

# 多个请求头
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer token123" \
     -H "Accept: application/json" \
     https://api.example.com/users

# 设置 User-Agent
curl -A "Mozilla/5.0" https://example.com

# 设置 Referer
curl -e "https://google.com" https://example.com
```

## 认证方式

```bash
# Basic Auth
curl -u username:password https://api.example.com/admin

# Bearer Token
curl -H "Authorization: Bearer eyJhbGciOi..." https://api.example.com/me

# API Key（通过 Header）
curl -H "X-API-Key: your-key" https://api.example.com/data

# API Key（通过查询参数）
curl "https://api.example.com/data?api_key=your-key"
```

## Cookie 与 Session

```bash
# 发送 Cookie
curl -b "session=abc123; lang=zh" https://example.com/dashboard

# 从文件读取 Cookie
curl -b cookies.txt https://example.com/dashboard

# 保存响应的 Cookie 到文件
curl -c cookies.txt -d "user=admin&pass=123" https://example.com/login

# 登录后访问（先保存再发送）
curl -c cookies.txt -d "user=admin&pass=123" https://example.com/login
curl -b cookies.txt https://example.com/dashboard
```

## 文件上传与下载

```bash
# 下载文件
curl -O https://example.com/file.zip

# 下载并重命名
curl -o myfile.zip https://example.com/file.zip

# 断点续传
curl -C - -O https://example.com/large-file.zip

# 上传文件（multipart/form-data）
curl -F "file=@photo.jpg" https://api.example.com/upload

# 上传并指定文件名
curl -F "file=@photo.jpg;filename=avatar.jpg" https://api.example.com/upload

# 上传多个文件
curl -F "file1=@a.jpg" -F "file2=@b.jpg" https://api.example.com/upload

# 上传文件 + 表单字段
curl -F "file=@doc.pdf" -F "description=报告" https://api.example.com/upload
```

## 输出控制

```bash
# 只输出响应体（静默 + 不输出错误）
curl -sS https://api.example.com/data

# 输出到文件
curl -o output.txt https://example.com/page

# 追加到文件
curl -o - https://example.com/page >> log.txt

# 显示请求和响应的详细信息
curl -v https://api.example.com/users

# 更详细的调试信息
curl --trace trace.log https://api.example.com/users

# 显示时间统计
curl -w "\n时间: %{time_total}s\n" -o /dev/null -s https://example.com
```

## 重定向与连接控制

```bash
# 跟随重定向（-L）
curl -L https://example.com/old-page

# 限制重定向次数
curl -L --max-redirs 5 https://example.com

# 连接超时（秒）
curl --connect-timeout 5 https://example.com

# 总超时
curl -m 30 https://example.com

# 重试
curl --retry 3 --retry-delay 2 https://unreliable-api.com

# 限制传输速度（100KB/s）
curl --limit-rate 100K -O https://example.com/large.zip
```

## TLS / SSL

```bash
# 查看服务器证书信息
curl -vI https://example.com 2>&1 | grep -i "SSL\|certificate"

# 跳过证书验证（仅测试环境使用）
curl -k https://self-signed.example.com

# 指定客户端证书
curl --cert client.pem --key client-key.pem https://mtls.example.com

# 指定 CA 证书
curl --cacert /path/to/ca.crt https://example.com

# 强制 TLS 版本
curl --tlsv1.2 https://example.com
```

## 性能计时

curl 的 `-w` 选项可以输出详细的请求计时信息：

```bash
curl -o /dev/null -s -w "
DNS 解析:     %{time_namelookup}s
TCP 连接:     %{time_connect}s
TLS 握手:     %{time_appconnect}s
首字节时间:   %{time_starttransfer}s
总耗时:       %{time_total}s
下载大小:     %{size_download} bytes
HTTP 状态码:  %{http_code}
" https://example.com
```

可以保存为文件方便复用：

```bash
# 保存计时模板
cat > curl-timing.txt << 'EOF'
    DNS 解析:     %{time_namelookup}s
    TCP 连接:     %{time_connect}s
    TLS 握手:     %{time_appconnect}s
    首字节时间:   %{time_starttransfer}s
    总耗时:       %{time_total}s
    HTTP 状态码:  %{http_code}
EOF

# 使用模板
curl -o /dev/null -s -w "@curl-timing.txt" https://example.com
```

## 实战场景

```bash
# 测试 API 响应时间
curl -o /dev/null -s -w "%{time_total}\n" https://api.example.com/health

# 模拟浏览器请求
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
     -H "Accept: text/html" \
     https://example.com

# 检查网站是否在线
curl -sS -o /dev/null -w "%{http_code}" https://example.com

# 并发请求测试（配合 xargs）
seq 1 100 | xargs -P10 -I{} curl -s -o /dev/null -w "%{http_code}\n" https://api.example.com/health

# 发送 WebSocket 升级请求
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://ws.example.com

# 通过代理访问
curl -x http://proxy:8080 https://example.com

# 通过 SOCKS5 代理
curl --socks5 127.0.0.1:1080 https://example.com

# 下载 GitHub Release 文件
curl -sL https://api.github.com/repos/owner/repo/releases/latest \
  | jq -r '.assets[] | select(.name | endswith(".tar.gz")) | .browser_download_url' \
  | xargs curl -LO
```

## curl vs wget

| 特性 | curl | wget |
|------|------|------|
| HTTP 方法支持 | 全部（GET/POST/PUT/DELETE...） | 仅 GET/POST |
| 递归下载 | 不支持 | 支持 |
| 断点续传 | 支持（`-C -`） | 支持 |
| API 调试 | 非常强 | 一般 |
| 输出控制 | 灵活（`-w` 模板） | 基本 |
| Cookie 管理 | 支持 | 支持 |
| 后台下载 | 不支持 | 支持（`-b`） |
| 预装情况 | 几乎所有系统 | 部分系统未预装 |

> [!TIP]
> 调试 API 时，养成用 `curl -v` 的习惯——它会显示完整的请求头和响应头，很多问题（认证失败、CORS、重定向）一眼就能看出来。
