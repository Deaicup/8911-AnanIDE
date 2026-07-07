# GitHub 上传说明

这份项目已经整理成适合上传 GitHub 的源码仓库。不要上传这些目录：

- `node_modules/`
- `release/`
- `packages/*/lib/`
- `packages/theia-app/src-gen/`
- `test-results/`
- `coverage/`

这些目录已经写进 `.gitignore`，正常使用 Git 不会上传。

## 方式 A：GitHub Desktop

1. 打开 GitHub Desktop。
2. 选择 `File -> Add Local Repository`。
3. 选择整理好的 `anan-ide-github-ready-*` 文件夹。
4. 如果提示不是 Git 仓库，选择 `create a repository`。
5. 填写仓库名，例如 `anan-ide`。
6. 点击 `Publish repository`。

## 方式 B：GitHub 网页上传

1. 打开 GitHub，新建一个空仓库。
2. 点击 `uploading an existing file`。
3. 把 `anan-ide-github-ready-*` 文件夹里的文件拖进去。
4. 不要拖 `node_modules`、`release`、`outputs`。
5. 填写提交说明，例如 `Initial AnanIDE source upload`。
6. 点击 `Commit changes`。

## 方式 C：命令行上传

把下面的 `你的仓库地址` 换成 GitHub 新仓库的地址。

```bash
git init
git add .
git commit -m "Initial AnanIDE source upload"
git branch -M main
git remote add origin 你的仓库地址
git push -u origin main
```

示例仓库地址长这样：

```text
https://github.com/你的用户名/anan-ide.git
```

## 上传后检查

GitHub 页面里应该能看到：

- `packages/`
- `assets/`
- `docs/`
- `scripts/`
- `tests/`
- `package.json`
- `package-lock.json`
- `README.md`

GitHub 页面里不应该看到：

- `node_modules`
- `release`
- `.exe`
- `packages/*/lib`
