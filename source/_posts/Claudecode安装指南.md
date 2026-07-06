---
title: Claudecode安装指南
date: 2026-5-30
categories: 大模型
tags: 工具
---

# Claudecode安装指南

**第一步：设置国内镜像源（非常重要）**

```
npm config set registry https://registry.npmmirror.com
```

**第二步：安装 Claude Code**

```
npm install -g @anthropic-ai/claude-code
```

> 安装过程可能需要1-2分钟，请耐心等待。

**第三步：验证安装**

```
claude --version
```

如果能看到版本号，就说明安装成功了。

**第四步：创建 settings.json 文件（接入国内大模型）**

你可以把之前用环境变量配置的内容写成文件，这样就不用每次启动都手动设置了。

```
# 1. 创建 .claude 文件夹（如果不存在）
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"

# 2. 用记事本打开配置文件（文件不存在会提示新建，点是即可）
notepad "%USERPROFILE%\.claude\settings.json"
```

将以下内容**替换成你的真实信息**后粘贴进去，保存文件：

```
{
    "env": {
        "ANTHROPIC_AUTH_TOKEN": "你的API Key",
        "ANTHROPIC_BASE_URL": "你的API地址",
        "ANTHROPIC_MODEL": "你想用的模型名称"
    }
}
```

> **保存后，必须关闭当前终端，重新打开一个新的终端窗口**，配置才会生效。

**第五步： 配置 .claude.json 文件（跳过官方登录）**

这个文件是为了避免 Claude Code 启动时强制要求你登录 Anthropic 官网。

```
# 用记事本打开 .claude.json 文件
notepad "%USERPROFILE%\.claude.json"
```

将以下内容粘贴进去并保存：

```
{
    "hasCompletedOnboarding": true
}
```

> 如果你之前运行 `claude` 时已经完成过登录验证，这个文件可能已经自动存在了，检查一下里面的内容即可。