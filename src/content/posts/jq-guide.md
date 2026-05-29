---
title: "jq 命令行处理 JSON：从基础过滤到复杂转换"
published: 2026-05-29
description: "jq 是命令行下处理 JSON 数据的瑞士军刀，本文涵盖基础语法、过滤、转换、条件判断等用法，适用于 API 调试和数据处理。"
tags: [jq, JSON, Linux, 命令行, 数据处理]
category: "工具指南"
author: "Oii"
---

## 为什么需要 jq

在 API 调试、日志分析、配置文件处理中，JSON 无处不在。直接用 grep/awk 处理 JSON 既脆弱又痛苦——一个嵌套结构就能让正则失效。

jq 是一个轻量级的命令行 JSON 处理器，支持过滤、转换、格式化，语法简洁且专为 JSON 设计。

## 安装

```bash
# Ubuntu / Debian
sudo apt install jq

# macOS
brew install jq

# Arch Linux
sudo pacman -S jq

# 验证安装
jq --version
```

## 基本语法

```bash
jq '过滤器' 输入
```

jq 从 stdin 或文件读取 JSON，应用过滤器后输出结果。

```bash
# 格式化 JSON（最常用）
echo '{"name":"Alice","age":25}' | jq '.'

# 从文件读取
jq '.' data.json

# 从 API 读取
curl -s https://api.github.com/users/octocat | jq '.'
```

## 基础过滤

### 字段访问

```bash
# 获取某个字段
echo '{"name":"Alice","age":25}' | jq '.name'
# 输出: "Alice"

# 嵌套字段
echo '{"user":{"name":"Alice"}}' | jq '.user.name'
# 输出: "Alice"

# 多个字段
echo '{"name":"Alice","age":25,"city":"Beijing"}' | jq '{name, city}'
# 输出: {"name":"Alice","city":"Beijing"}

# 重命名字段
echo '{"name":"Alice","age":25}' | jq '{姓名: .name, 年龄: .age}'
```

### 数组操作

```bash
# 数组第一个元素
echo '[1,2,3]' | jq '.[0]'

# 数组切片（第 2 到第 4 个）
echo '[1,2,3,4,5]' | jq '.[1:4]'

# 数组长度
echo '[1,2,3]' | jq 'length'

# 数组最后一个元素
echo '[1,2,3]' | jq '.[-1]'

# 遍历数组元素
echo '["a","b","c"]' | jq '.[]'

# 将数组每个元素转为对象
echo '[1,2,3]' | jq '.[] | {value: .}'
```

### 对象遍历

```bash
# 获取所有值
echo '{"a":1,"b":2,"c":3}' | jq '.[]'

# 获取所有键
echo '{"a":1,"b":2,"c":3}' | jq 'keys[]'

# 键值对遍历
echo '{"a":1,"b":2}' | jq 'to_entries[]'
# 输出: {"key":"a","value":1}  {"key":"b","value":2}
```

## 管道与函数

jq 有自己的管道语法，可以链式处理：

```bash
# 长度大于 2 的元素
echo '["a","bb","ccc"]' | jq '.[] | select(length > 2)'

# 映射：对数组每个元素应用操作
echo '[1,2,3]' | jq 'map(. * 2)'
# 输出: [2,4,6]

# 过滤：保留满足条件的元素
echo '[1,2,3,4,5]' | jq '[.[] | select(. > 3)]'
# 输出: [4,5]

# 排序
echo '[3,1,4,1,5]' | jq 'sort'

# 去重（需先排序）
echo '[1,2,2,3,3,3]' | jq 'unique'

# 反转
echo '[1,2,3]' | jq 'reverse'

# 展平嵌套数组
echo '[[1,2],[3,[4,5]]]' | jq 'flatten'

# 合并两个对象
echo '{"a":1}' | jq '. + {"b":2}'
# 输出: {"a":1,"b":2}
```

## 字符串操作

```bash
# 字符串拼接
echo '{"first":"Hello","second":"World"}' | jq '.first + " " + .second'

# 字符串长度
echo '"hello"' | jq 'length'

# 转大写 / 小写
echo '"Hello"' | jq 'ascii_upcase'
echo '"Hello"' | jq 'ascii_downcase'

# 截取子串
echo '"Hello World"' | jq '.[0:5]'

# 分割字符串
echo '"a,b,c"' | jq 'split(",")'

# 连接数组为字符串
echo '["a","b","c"]' | jq 'join("-")'

# 替换
echo '"Hello World"' | jq 'gsub("World"; "jq")'

# 正则匹配
echo '"test123"' | jq 'test("[0-9]+")'
# 输出: true

# 格式化字符串（插值）
echo '{"name":"Alice","age":25}' | jq '"姓名: \(.name), 年龄: \(.age)"'
```

## 条件与比较

```bash
# if-then-else
echo '{"score":85}' | jq 'if .score >= 90 then "A" elif .score >= 80 then "B" else "C" end'

# try-catch（处理可能缺失的字段）
echo '{"name":"Alice"}' | jq 'try .age catch "字段不存在"'

# 空值处理
echo '{"name":"Alice"}' | jq '.age // "未知"'
# 输出: "未知"（age 不存在时使用默认值）

# 类型判断
echo '"hello"' | jq 'type'
# 输出: "string"
echo '42' | jq 'type'
# 输出: "number"

# 判断字段是否存在
echo '{"name":"Alice"}' | jq 'has("age")'
# 输出: false
```

## 复杂数据处理

### 处理 API 响应

```bash
# GitHub API：提取仓库名和星标数
curl -s https://api.github.com/users/octocat/repos | jq '.[] | {name, stargazers_count}'

# 只取前 5 个
curl -s https://api.github.com/users/octocat/repos | jq '.[0:5] | .[] | {name, stars: .stargazers_count}'

# 按星标数降序排列
curl -s https://api.github.com/users/octocat/repos | jq 'sort_by(-.stargazers_count) | .[0:5] | .[] | {name, stars: .stargazers_count}'
```

### 处理 JSON Lines（每行一个 JSON）

```bash
# --slurp 将多行 JSON 合并为数组
cat events.jsonl | jq -s '.'

# 统计每种事件类型的数量
cat events.jsonl | jq -s 'group_by(.type) | map({type: .[0].type, count: length})'

# 过滤并输出
cat events.jsonl | jq -c 'select(.level == "error")'
```

### 构建新 JSON

```bash
# 从 CSV 构建 JSON 数组
echo 'Alice,25
Bob,30' | awk -F, '{printf "{\"name\":\"%s\",\"age\":%s}\n", $1, $2}' | jq -s '.'

# 重组对象结构
echo '{"firstName":"Alice","lastName":"Smith","age":25}' | jq '{
  fullName: (.firstName + " " + .lastName),
  info: {age: .age}
}'
```

## 输出控制

```bash
# 紧凑输出（单行）
echo '{"a":1,"b":2}' | jq -c '.'

# 原始输出（去掉 JSON 引号）
echo '"hello"' | jq -r '.'
echo '["a","b","c"]' | jq -r '.[]'

# 输出为 Tab 分隔（配合 -r）
echo '[{"name":"Alice","age":25}]' | jq -r '.[] | [.name, .age] | @tsv'

# 输出为 CSV
echo '[{"name":"Alice","age":25},{"name":"Bob","age":30}]' | jq -r '.[] | [.name, .age] | @csv'

# 色彩控制
echo '{}' | jq -C '.'   # 强制彩色
echo '{}' | jq -M '.'   # 强制无色

# 输出 null 而不是空
echo '{}' | jq '.missing // empty'
```

## 实战场景速查

```bash
# 获取 Docker 容器的 IP 地址
docker inspect container_name | jq '.[0].NetworkSettings.IPAddress'

# 查看 Kubernetes Pod 状态
kubectl get pods -o json | jq '.items[] | {name: .metadata.name, status: .status.phase}'

# 处理 package.json 中的依赖
cat package.json | jq '.dependencies | to_entries[] | "\(.key)@\(.value)"'

# 比较两个 JSON 文件的差异
diff <(jq -S . a.json) <(jq -S . b.json)

# 提取 .env 格式
echo '{"DB_HOST":"localhost","DB_PORT":5432}' | jq -r 'to_entries[] | "\(.key)=\(.value)"'

# 嵌套数组展平并排序
echo '{"data":[[3,1],[4,1],[5,9]]}' | jq '.data | flatten | sort'

# 合并多个 JSON 文件
jq -s 'add' file1.json file2.json file3.json

# 删除对象中的某些字段
echo '{"name":"Alice","password":"secret","age":25}' | jq 'del(.password)'
```

> [!TIP]
> jq 的过滤器语法一开始可能不太直观，建议在 [jqplay.org](https://jqplay.org) 上在线练习，左侧输入 JSON、右侧写过滤器，实时看到结果。
