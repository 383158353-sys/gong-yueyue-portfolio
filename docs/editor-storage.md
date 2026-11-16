# 私人画布存储接入

这份说明给部署使用。站点访客不需要打开 Vercel，也不需要自己添加环境变量。凭证的值不能写入仓库、不能放进前端源码、不能发到聊天记录。

项目：`gong-yueyue-portfolio`（`prj_la9y3bRSwFW6mx5I3J0T6Fi4oWZn`，团队 `emeng`）

只接到预览分支 `cursor/private-canvas-editor-01b2`。不要把下面的变量加到 Production，不要改 PR2 分支，不要使用别的产品的 Supabase。

## 代码现在认的两种存储

| 适配器 | 何时启用 | 能用在线上预览 |
| --- | --- | --- |
| `vercel-blob` | 有 `EDITOR_ACCESS_TOKEN`，并且有 `BLOB_READ_WRITE_TOKEN` 或 `BLOB_STORE_ID` | 能。对象必须是私人 Blob，服务端读取 |
| `file` | 有 `EDITOR_ACCESS_TOKEN`，`EDITOR_STORE=file`，并且 `EDITOR_STORE_DIR` 指向本机目录 | 不能。`VERCEL=1` 时直接拒绝 |

两者缺任意一项时，`/api/editor` 对草稿读取和所有写入返回 503，`storage` 为 `none`。没有凭证或凭证错误返回 401。公开页面的 HTTP 200 不表示画布可以编辑。

## 需要接到这个预览分支的变量

全部是服务端变量。类型用 Sensitive。环境只选 Preview。Git 分支只填 `cursor/private-canvas-editor-01b2`。不要加 `VITE_` 前缀。

1. 私人 Blob 商店。访问级别必须是 `private`，不要建 public 商店。名称建议 `portfolio-editor-private`。区域可用默认 `iad1`。连接时只选 Preview，不要用会连上全部环境的 `--yes`。

   官方命令形状：

   ```bash
   vercel blob create-store portfolio-editor-private --access private --environment preview
   ```

   商店连上项目后，Vercel 会自己写入 `BLOB_READ_WRITE_TOKEN`，较新的连接还会写入 `BLOB_STORE_ID`。代码认这两个名字。不要把它们的值抄出来。

2. `EDITOR_ACCESS_TOKEN`。部署方生成一长串随机值，只放进上面的 Preview 分支变量。站点主人在 `/editor` 输入这一次，用来换取仅对 `/api/editor` 有效的 HttpOnly cookie。这个值由部署方私下交给主人，不经过仓库和聊天。

可选：`EDITOR_BLOB_PREFIX`。不填时使用 `editor/private-canvas`。它只是私人商店里的路径前缀。

不要设置 `EDITOR_STORE=file` 或 `EDITOR_STORE_DIR`。线上没有持久磁盘。

## 接通之后怎样才算能用

对预览域名检查：

- `GET /api/editor?action=status` 返回 `{"configured":true,"storage":"vercel-blob"}`。
- 不带凭证的 `GET /api/editor?action=draft` 返回 401。
- 主人在 `/editor` 输入凭证后，可以上传图片、拖动、保存草稿、刷新后再输入凭证恢复。
- 未点发布时，`/board` 仍是未发布，首页内容不变。
- 点发布后，只有 `/board` 渲染这份稿。宽屏按相对位置，窄屏按上下顺序排成单列。

如果 status 仍是 `configured:false`，画布还不能用。这时首页返回 200 只说明公开站还在。

## 发布到哪里

这个编辑器保存的是一张独立画布。点发布只把这张画布交给 `/board`。它不会改首页、关于、项目、影片、场景、人物、文章的现有版式、导航或视频。所以它现在还不是那七个页面的编辑器。以后若要把发布稿接进个人站，应只增加一个不改已有版式的展示位，而不是把自由坐标铺进现有栏目。
