---
title: "Git 使用指南：从日常操作到进阶技巧"
published: 2026-05-26
description: "Git 日常工作流全覆盖，包括基础操作、分支管理、撤销修改、rebase 与 merge、stash、cherry-pick 等进阶用法。"
tags: [Git, 版本控制, 开发工具]
category: "工具指南"
author: "Oii"
---

## 基础配置

```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# 设置默认编辑器
git config --global editor vim

# 设置默认分支名
git config --global init.defaultBranch main

# 查看所有配置
git config --list
```

配置文件位置：`~/.gitconfig`（全局）、`.git/config`（仓库级）。

## 仓库初始化与克隆

```bash
# 初始化新仓库
git init

# 克隆远程仓库
git clone https://github.com/user/repo.git

# 克隆到指定目录
git clone https://github.com/user/repo.git my-project

# 克隆指定分支
git clone -b develop https://github.com/user/repo.git

# 浅克隆（只拉最近一次提交，适合 CI）
git clone --depth 1 https://github.com/user/repo.git
```

## 日常工作流

### 查看状态

```bash
# 工作区状态
git status

# 简洁模式
git status -s
# M  file.txt    — 已暂存的修改
#  M file.txt    — 未暂存的修改
# ?? file.txt    — 未跟踪的新文件
# A  file.txt    — 新添加到暂存区

# 查看改动内容
git diff                 # 工作区 vs 暂存区
git diff --staged        # 暂存区 vs 上次提交
git diff HEAD            # 工作区 vs 上次提交
```

### 提交

```bash
# 添加文件到暂存区
git add file.txt
git add src/              # 添加整个目录
git add .                 # 添加所有改动（慎用）
git add -p                # 交互式选择要暂存的代码块

# 提交
git commit -m "fix: 修复登录页面样式问题"

# 添加并提交所有已跟踪文件的修改
git commit -am "fix: 修复样式问题"

# 修改上一次提交（未推送时）
git commit --amend -m "新的提交信息"

# 修改上一次提交，追加文件
git add forgotten-file.txt
git commit --amend --no-edit
```

### 推送与拉取

```bash
# 推送到远程
git push origin main

# 首次推送并设置上游分支
git push -u origin main

# 拉取远程更新（fetch + merge）
git pull origin main

# 拉取并 rebase（保持线性历史）
git pull --rebase origin main

# 只获取远程信息，不合并
git fetch origin
git fetch --all             # 获取所有远程
git fetch --prune           # 获取并清理已删除的远程分支
```

## 分支管理

### 基本操作

```bash
# 查看本地分支
git branch

# 查看所有分支（含远程）
git branch -a

# 创建分支
git branch feature-login

# 切换分支
git checkout feature-login

# 创建并切换（新写法）
git switch -c feature-login

# 删除分支
git branch -d feature-login         # 已合并的分支
git branch -D feature-login         # 强制删除

# 重命名分支
git branch -m old-name new-name
```

### 分支策略

```bash
# 查看分支关系
git log --oneline --graph --all

# 查看某分支是否已合并到 main
git branch --merged main
git branch --no-merged main

# 查看远程分支
git branch -r
```

常见分支模型：

```
main          — 生产环境代码
  └── develop — 开发主线
       ├── feature/xxx  — 功能分支
       ├── fix/xxx      — 修复分支
       └── release/x.x  — 发布分支
```

## 撤销与回退

### 工作区改动

```bash
# 撤销单个文件的修改（恢复到暂存区状态）
git checkout -- file.txt

# 新写法
git restore file.txt

# 撤销所有工作区改动
git checkout -- .
git restore .
```

### 暂存区改动

```bash
# 取消暂存（保留工作区改动）
git reset HEAD file.txt
git restore --staged file.txt

# 取消所有暂存
git restore --staged .
```

### 提交回退

```bash
# 回退到上一次提交，保留改动在工作区
git reset --soft HEAD~1

# 回退到上一次提交，保留改动在暂存区
git reset --mixed HEAD~1     # 默认行为

# 回退到上一次提交，丢弃所有改动
git reset --hard HEAD~1

# 回退到指定提交
git reset --hard abc1234
```

| 模式 | 工作区 | 暂存区 | 提交历史 |
|------|--------|--------|---------|
| `--soft` | 保留 | 保留 | 回退 |
| `--mixed` | 保留 | 清除 | 回退 |
| `--hard` | 清除 | 清除 | 回退 |

> [!CAUTION]
> `git reset --hard` 会丢失未提交的改动，无法恢复。操作前确认没有未保存的工作。

### 安全回退（生成新提交）

```bash
# 撤销某次提交的改动，生成一个新的"反向提交"
git revert abc1234

# 撤销合并提交
git revert -m 1 <merge-commit-hash>
```

`revert` 不改历史，适合已经推送到远程的提交。

## 暂存工作现场（Stash）

```bash
# 暂存当前改动
git stash

# 暂存并添加描述
git stash push -m "login page WIP"

# 暂存包含未跟踪文件
git stash -u

# 查看 stash 列表
git stash list

# 恢复最近一次 stash
git stash pop

# 恢复但不删除 stash 记录
git stash apply

# 恢复指定 stash
git stash apply stash@{2}

# 删除指定 stash
git stash drop stash@{0}

# 清空所有 stash
git stash clear

# 查看 stash 内容
git stash show -p stash@{0}
```

## 历史查看

```bash
# 基本日志
git log

# 单行简洁模式
git log --oneline

# 图形化显示分支
git log --oneline --graph --all

# 查看最近 N 次提交
git log -5

# 查看某文件的历史
git log --follow file.txt

# 查看某次提交的详细改动
git show abc1234

# 查看某次提交改了哪些文件
git show --stat abc1234

# 搜索提交信息
git log --grep="fix"

# 搜索代码改动
git log -S "functionName"

# 查看某行代码的修改历史
git blame file.txt
git blame -L 10,20 file.txt    # 只看 10-20 行

# 统计每个作者的提交数
git shortlog -sn
```

## Rebase 与 Merge

### Merge

```bash
# 合并 feature 分支到当前分支
git merge feature-login

# 合并但不快进（保留分支历史）
git merge --no-ff feature-login

# 取消合并（解决不了冲突时）
git merge --abort
```

### Rebase

```bash
# 将当前分支变基到 main 上
git rebase main

# 交互式 rebase（修改最近 3 次提交）
git rebase -i HEAD~3
```

交互式 rebase 的常用操作：

```
pick abc1234 feat: 添加登录功能        # 保留
pick def5678 fix: 修复样式问题         # 保留
pick ghi9012 fixup: 样式小调整         # 合并到上一个提交

# 可用命令：
# pick   — 保留该提交
# reword — 修改提交信息
# edit   — 暂停，允许修改提交内容
# squash — 合并到上一个提交，保留提交信息
# fixup  — 合并到上一个提交，丢弃提交信息
# drop   — 删除该提交
```

### Merge vs Rebase

| 维度 | Merge | Rebase |
|------|-------|--------|
| 历史 | 保留分支结构，有合并节点 | 线性历史，更整洁 |
| 安全性 | 不改已有提交 | 改写提交历史 |
| 适用场景 | 合并公共分支（main → feature） | 整理本地未推送的提交 |
| 冲突 | 一次性解决 | 逐个提交解决 |

> [!NOTE]
> **黄金法则：不要 rebase 已经推送到远程的公共分支。** 只对本地提交做 rebase。

## Cherry-pick

将某个提交应用到当前分支：

```bash
# 应用单个提交
git cherry-pick abc1234

# 应用多个提交
git cherry-pick abc123 def456

# 应用提交范围（不包含起始提交）
git cherry-pick abc123..ghi789

# 应用但不自动提交（可以修改后再提交）
git cherry-pick --no-commit abc1234

# 取消 cherry-pick
git cherry-pick --abort
```

使用场景：
- 紧急修复需要同时应用到多个分支
- 从其他分支挑选特定提交

## 标签管理

```bash
# 创建轻量标签
git tag v1.0.0

# 创建附注标签（推荐）
git tag -a v1.0.0 -m "Release version 1.0.0"

# 给指定提交打标签
git tag -a v1.0.0 abc1234 -m "Release 1.0.0"

# 查看标签
git tag
git tag -l "v1.*"

# 查看标签详情
git show v1.0.0

# 推送标签到远程
git push origin v1.0.0
git push origin --tags       # 推送所有标签

# 删除标签
git tag -d v1.0.0
git push origin --delete v1.0.0
```

## 远程仓库管理

```bash
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add upstream https://github.com/original/repo.git

# 修改远程地址
git remote set-url origin git@github.com:user/repo.git

# 删除远程仓库
git remote remove upstream

# 获取远程分支信息
git fetch origin

# 跟踪远程分支
git checkout -b feature origin/feature
git switch -c feature origin/feature

# 设置已有的本地分支跟踪远程
git branch -u origin/feature
```

## .gitignore

```bash
# 基本语法
*.log              # 忽略所有 .log 文件
node_modules/      # 忽略目录
/dist              # 忽略根目录下的 dist
!important.log     # 不忽略（取反）

# 实用示例
# .gitignore
*.log
*.tmp
.DS_Store
node_modules/
__pycache__/
.env
.env.local
*.pyc
.idea/
.vscode/
dist/
build/
```

> [!TIP]
> 已经被 Git 跟踪的文件，加入 `.gitignore` 后不会自动忽略。需要先取消跟踪：
> ```bash
> git rm --cached file.txt
> git rm -r --cached node_modules/
> ```

## 常见问题

### 提交到了错误的分支

```bash
# 撤销提交但保留改动
git reset --soft HEAD~1

# 切换到正确的分支
git checkout correct-branch

# 暂存并提交
git commit -m "正确的提交信息"
```

### 合并冲突

```bash
# 查看冲突文件
git status

# 冲突标记
<<<<<<< HEAD
当前分支的内容
=======
要合并的分支的内容
>>>>>>> feature-branch

# 解决冲突后
git add resolved-file.txt
git commit
```

### 误删文件恢复

```bash
# 从最近一次提交恢复
git checkout HEAD -- deleted-file.txt
git restore deleted-file.txt

# 查看某次提交时的文件内容
git show abc1234:path/to/file.txt
```

### 清理未跟踪文件

```bash
# 预览要删除的文件
git clean -fd --dry-run

# 删除未跟踪的文件和目录
git clean -fd

# 包含忽略的文件
git clean -fXd
```

## 速查表

```bash
# === 日常流程 ===
git status                    # 查看状态
git add .                     # 暂存所有改动
git commit -m "msg"           # 提交
git push origin main          # 推送
git pull --rebase             # 拉取并 rebase

# === 分支 ===
git switch -c feature         # 创建并切换分支
git merge feature             # 合并分支
git branch -d feature         # 删除分支

# === 撤销 ===
git restore file.txt          # 撤销工作区改动
git restore --staged file.txt # 取消暂存
git reset --soft HEAD~1       # 回退提交，保留改动
git revert abc1234            # 安全撤销（生成反向提交）

# === 暂存 ===
git stash                     # 暂存改动
git stash pop                 # 恢复最近暂存

# === 历史 ===
git log --oneline --graph     # 图形化日志
git show abc1234              # 查看提交详情
git blame file.txt            # 逐行追溯

# === 远程 ===
git remote -v                 # 查看远程
git fetch --prune             # 同步远程分支
git push -u origin main       # 首次推送
```
