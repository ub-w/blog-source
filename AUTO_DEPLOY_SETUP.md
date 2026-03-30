# Hexo 自动部署配置说明

这个项目已经包含 GitHub Actions 自动部署文件：

- `.github/workflows/deploy.yml`

目标效果：

1. 你把博客源码推送到 GitHub 源码仓库
2. GitHub Actions 自动构建 Hexo
3. 自动把生成后的静态文件发布到 `ub-w/ub-w.github.io`

## 一、创建源码仓库

建议新建一个 GitHub 仓库专门存放博客源码，例如：

- `blog-source`
- `hexo-source`
- `ub-w-blog-source`

然后把本地项目连接到这个仓库：

```powershell
git remote add origin 你的源码仓库地址
git add .
git commit -m "Init Hexo blog source"
git push -u origin main
```

例如：

```powershell
git remote add origin git@github.com:ub-w/blog-source.git
git add .
git commit -m "Init Hexo blog source"
git push -u origin main
```

## 二、生成部署密钥

在本机执行：

```powershell
ssh-keygen -t ed25519 -C "blog-deploy" -f ~/.ssh/blog_deploy_key
```

生成后会得到两个文件：

- 私钥：`~/.ssh/blog_deploy_key`
- 公钥：`~/.ssh/blog_deploy_key.pub`

## 三、把公钥加到站点仓库

目标仓库是：

- `ub-w/ub-w.github.io`

操作：

1. 打开 GitHub 上的 `ub-w/ub-w.github.io`
2. 进入 `Settings`
3. 打开 `Deploy keys`
4. 点击 `Add deploy key`
5. Title 随便写，例如 `hexo-auto-deploy`
6. 把 `blog_deploy_key.pub` 的内容粘进去
7. 勾选 `Allow write access`
8. 保存

## 四、把私钥加到源码仓库 Secret

操作：

1. 打开你的博客源码仓库
2. 进入 `Settings`
3. 打开 `Secrets and variables -> Actions`
4. 点击 `New repository secret`
5. 名称填写：`DEPLOY_KEY`
6. 把 `blog_deploy_key` 私钥文件内容完整粘进去
7. 保存

## 五、首次触发自动部署

在本地执行：

```powershell
git add .
git commit -m "Configure auto deploy"
git push
```

推送后到源码仓库页面查看：

- `Actions -> Deploy Hexo Blog`

如果成功，站点仓库 `ub-w/ub-w.github.io` 会自动更新。

## 六、以后如何发文章

以后更新博客只需要：

1. 在 `source/_posts` 写文章
2. 本地预览：`npm run server`
3. 提交源码：

```powershell
git add .
git commit -m "Add new post"
git push
```

然后 GitHub 会自动发布，不需要再手动 `hexo deploy`。

## 七、补充说明

- 当前项目已经初始化为本地 Git 仓库，默认分支为 `main`
- 如果你仍想手动发布，也可以继续使用 `npm run deploy`
- 自动部署和手动部署可以并存，但长期建议固定用一种方式
