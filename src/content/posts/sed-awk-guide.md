---
title: "sed & awk 实战手册：Linux 文本处理双雄"
published: 2026-05-29
description: "系统讲解 sed 和 awk 两大文本处理工具，从基础语法到实战场景，掌握日志分析、批量替换、数据提取的核心技能。"
tags: [sed, awk, Linux, Shell, 文本处理]
category: "工具指南"
author: "Oii"
---

## 为什么需要 sed 和 awk

在 Linux 命令行中，管道符 `|` 串联起各种工具，而 sed 和 awk 是文本处理管道中最核心的两环：

- **sed**：流编辑器，擅长文本替换、删除、插入
- **awk**：字段处理器，擅长按列提取、统计、格式化输出

两者互补，掌握它们可以解决 90% 的命令行文本处理需求。

## sed：流编辑器

### 基本语法

```bash
sed [选项] '命令' 文件
```

sed 逐行读入文本，对每一行执行命令，然后输出结果。默认不修改原文件，输出到 stdout。

### 常用选项

| 选项 | 含义 |
|------|------|
| `-n` | 静默模式，仅输出被处理的行 |
| `-i` | 直接修改原文件（慎用） |
| `-i.bak` | 修改原文件前创建备份 |
| `-e` | 执行多条命令 |
| `-r` / `-E` | 使用扩展正则表达式 |

### 替换：s 命令

替换是 sed 最常用的操作：

```bash
# 基本替换：将每行第一个 foo 替换为 bar
sed 's/foo/bar/' file.txt

# 全局替换：替换每行所有匹配项
sed 's/foo/bar/g' file.txt

# 忽略大小写
sed 's/foo/bar/gi' file.txt

# 只替换第 2 次出现的匹配
sed 's/foo/bar/2' file.txt

# 直接修改原文件
sed -i 's/foo/bar/g' file.txt

# 修改前创建 .bak 备份
sed -i.bak 's/foo/bar/g' file.txt
```

### 删除：d 命令

```bash
# 删除第 3 行
sed '3d' file.txt

# 删除最后一行
sed '$d' file.txt

# 删除空行
sed '/^$/d' file.txt

# 删除包含 "debug" 的行
sed '/debug/d' file.txt

# 删除第 5 到第 10 行
sed '5,10d' file.txt
```

### 打印：p 命令

```bash
# 打印第 5 行
sed -n '5p' file.txt

# 打印第 5 到第 10 行
sed -n '5,10p' file.txt

# 打印包含 "error" 的行
sed -n '/error/p' file.txt

# 打印从 "START" 到 "END" 之间的内容
sed -n '/START/,/END/p' file.txt
```

### 插入与追加

```bash
# 在第 3 行前插入一行
sed '3i\新增的行' file.txt

# 在第 3 行后追加一行
sed '3a\新增的行' file.txt

# 在匹配行后追加
sed '/pattern/a\新增的行' file.txt
```

### 实战场景

```bash
# 批量注释配置文件中的某项
sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config

# 去掉行首空白
sed 's/^[[:space:]]*//' file.txt

# 删除 HTML 标签
sed 's/<[^>]*>//g' page.html

# 提取两个标记之间的内容
sed -n '/BEGIN/,/END/p' data.txt

# 在每行开头添加行号（配合 cat -n 更简单，但 sed 也能做）
sed = file.txt | sed 'N; s/\n/\t/'

# 替换换行符为空格（将多行合并为一行）
sed ':a; N; $!ba; s/\n/ /g' file.txt
```

## awk：字段处理器

### 基本语法

```bash
awk '模式 {动作}' 文件
```

awk 将每一行按分隔符拆分成字段（`$1`、`$2`...），然后对匹配模式的行执行动作。`$0` 代表整行，`$NF` 代表最后一个字段。

### 基础用法

```bash
# 打印每行的第 1 和第 3 个字段
awk '{print $1, $3}' file.txt

# 指定分隔符（默认是空白）
awk -F: '{print $1, $7}' /etc/passwd

# 多分隔符
awk -F'[,;]' '{print $2}' file.txt

# 打印行号和内容
awk '{print NR, $0}' file.txt
```

### 内置变量

| 变量 | 含义 |
|------|------|
| `NR` | 当前行号 |
| `NF` | 当前行的字段数 |
| `$0` | 整行内容 |
| `$1` ~ `$n` | 第 1 到第 n 个字段 |
| `$NF` | 最后一个字段 |
| `FS` | 输入字段分隔符 |
| `OFS` | 输出字段分隔符 |
| `RS` | 输入记录分隔符（默认换行） |
| `FILENAME` | 当前文件名 |

### 条件过滤

```bash
# 打印第 3 列大于 100 的行
awk '$3 > 100 {print $0}' data.txt

# 打印包含 "error" 的行
awk '/error/ {print}' log.txt

# 打印第 1 列等于 "admin" 的行
awk '$1 == "admin" {print $0}' users.txt

# 多条件组合（AND）
awk '$1 == "GET" && $9 >= 400 {print $0}' access.log

# 多条件组合（OR）
awk '/error/ || /warning/ {print}' log.txt
```

### BEGIN 与 END 块

```bash
# 在处理前打印表头，处理后打印统计
awk 'BEGIN {print "Name\tScore"} {print $1, "\t", $2} END {print "---\tTotal:", NR}' data.txt

# 计算第 2 列的总和
awk 'BEGIN {sum=0} {sum+=$2} END {print "Total:", sum}' data.txt

# 计算平均值
awk 'BEGIN {s=0; n=0} {s+=$2; n++} END {print "Avg:", s/n}' data.txt
```

### 字符串函数

```bash
# 转大写
awk '{print toupper($1)}' file.txt

# 转小写
awk '{print tolower($0)}' file.txt

# 字符串长度
awk '{print length($0)}' file.txt

# 子字符串截取（从位置 2 开始取 3 个字符）
awk '{print substr($1, 2, 3)}' file.txt

# 字符串替换
awk '{gsub(/old/, "new"); print}' file.txt

# 按分隔符拆分字段到数组
awk '{split($0, arr, ":"); print arr[1]}' file.txt
```

### 格式化输出

```bash
# printf 格式化
awk '{printf "%-20s %10s %5d\n", $1, $2, $3}' data.txt

# 输出为 CSV
awk 'BEGIN {OFS=","} {print $1, $2, $3}' data.txt
```

### 实战场景

```bash
# 统计日志中各 HTTP 状态码的数量
awk '{print $9}' access.log | sort | uniq -c | sort -rn

# 统计每个 IP 的请求数量
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20

# 找出响应时间超过 3 秒的请求
awk '$NF > 3 {print $0}' access.log

# 按第 2 列数值降序排序
awk '{print $0}' data.txt | sort -k2 -rn

# 提取 /etc/passwd 中的用户名和 shell
awk -F: '{printf "%-15s %s\n", $1, $7}' /etc/passwd

# 统计每个用户的进程数
ps aux | awk 'NR>1 {count[$1]++} END {for (u in count) printf "%-10s %d\n", u, count[u]}'

# 计算文件大小总和（ls -l 输出的第 5 列）
ls -l | awk 'NR>1 {sum+=$5} END {print sum/1024/1024, "MB"}'

# 合并多行：每 3 行合并为一行
awk 'ORS=NR%3?"\n":"\n"' file.txt
```

## sed 与 awk 的选择

| 场景 | 推荐工具 |
|------|---------|
| 简单文本替换 | sed |
| 按行删除/插入 | sed |
| 按列提取字段 | awk |
| 条件过滤输出 | awk |
| 数值计算与统计 | awk |
| 流水线中的文本清洗 | sed |
| 复杂格式化输出 | awk |

两者经常配合使用：

```bash
# 先用 sed 清洗，再用 awk 提取
cat access.log | sed 's/"//g' | awk '{print $1, $9}'

# 先用 awk 提取字段，再用 sed 格式化
awk -F: '{print $1, $7}' /etc/passwd | sed 's/ /\t→\t/'
```

## 一行实用命令速查

```bash
# 删除文件中的重复行（不排序）
awk '!seen[$0]++' file.txt

# 打印文件的倒数第 3 行
awk 'END{print}' file.txt | tail -3 | head -1

# 将空行替换为分隔线
sed '/^$/c\----------' file.txt

# 在匹配行的下一行插入内容
sed '/\[section\]/a\key=value' config.txt

# 打印两个匹配之间的行（含匹配行）
awk '/START/,/END/' file.txt

# 提取 URL 中的域名
echo "https://example.com/path?q=1" | awk -F/ '{print $3}'

# 统计单词频率
cat file.txt | tr -s ' ' '\n' | sort | uniq -c | sort -rn

# 批量重命名（去掉文件名中的空空格）
ls | while read f; do mv "$f" "$(echo $f | sed 's/ /_/g')"; done
```

> [!TIP]
> sed 和 awk 的正则表达式语法略有差异。sed 使用基本正则（BRE），加 `-r` 或 `-E` 后使用扩展正则（ERE）。awk 默认使用扩展正则。遇到正则不生效时，检查一下是否需要转义或开启扩展模式。
