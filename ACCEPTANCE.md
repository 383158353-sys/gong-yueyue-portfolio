# 验收

日期：2026-11-15。分支 `cursor/personal-site-foundation-01b2`。未合并，未改 `main`，未改 LingoClub，未新建仓库。

## 通过

- `npm test`：`src/lib/youtube.test.ts` 9 项通过。覆盖 watch、youtu.be、shorts、embed、nocookie、非法主机、HTML/脚本字符串、白名单嵌入域名、重复导入、功能测试片不能入库、损坏的 localStorage。
- `npm run build`：`tsc -b && vite build` 通过。
- 浏览器回归 `node scripts/verify-site.mjs`，对 `http://127.0.0.1:4173` 直接打开七个路由。桌面 1440 返回 200。同一浏览器接着以 390 打开时返回 304，标题、导航和图片仍然正确。没有横向溢出（scrollWidth 等于视口）。138 次图片检查、49 个地址，`naturalWidth` 都大于 0。
- 从首页点击「影片」进入 `/films`。
- 无效链接 `https://vimeo.com/123` 出现错误说明，且不生成 iframe。
- `https://youtu.be/abcdefghijk` 生成 `https://www.youtube-nocookie.com/embed/abcdefghijk?...`，刷新后仍在 localStorage。再导入同一 ID 会提示已存在。
- `M7lc1UVf-VE` 不能写入作品库。公开作品条目里没有这个测试片的 iframe。
- 手机宽度 390 下，已保存条目的播放器为 358×201.375，比例 16:9。
- 关于页写明当前是中国传媒大学影视美术创作硕一、2026 年 9 月入学；《我妈没把我养好》写的是参与影片美术与导演工作。电话、邮箱、生日、学号、成绩没有放出来。重庆大学美视电影学院写成已经结束的本科。
- 《我妈没把我养好》条目没有图片。`#mom img` 数量为 0。

截图在本机验收目录，不进 Git：

- `/opt/cursor/artifacts/personal-site/home-1440.png`
- `/opt/cursor/artifacts/personal-site/home-390.png`
- `/opt/cursor/artifacts/personal-site/about-1440.png`
- `/opt/cursor/artifacts/personal-site/films-1440.png`
- `/opt/cursor/artifacts/personal-site/articles-1440.png`
- 其余五页的 1440 与 390 全页图，以及影片回归图 `films-1440-youtube.png`、`films-390-player.png`
- 机器可读结果：`/opt/cursor/artifacts/personal-site/verify-report.json`

## 跳过

- 远程 YouTube 实际出画。测试片播放器 8 秒后状态是 `unverified`，文案是「尚未确认远程播放……不要把未确认的状态当成播放成功」。此环境没有把嵌入失败记成播放成功。
- Git LFS 上的 mp4 和 PDF。指针还在，没有执行 `git lfs pull`，也没有把它们放进播放器。
- 部署与线上预览。见下方阻碍。没有用 CLI、别的 token 或别的账号再试。

## 缺失资料

- 六部公开影片都没有作者自己的 YouTube 链接。
- 《我妈没把我养好》没有剧照和成片。
- 文章页没有正文。40 页作品集 PDF 仍是 LFS 指针。
- 《哈尔滨之恋》只留在人物页的服装化妆设计，没有套到爱奇艺这部片上。

## 部署阻碍

Vercel 连接 `list_projects(search=portfolio)` 返回 403。当前连接没有 `emeng/team_vFyuSSNncW4qMnQUQGGkcZkG` 的访问权。按实测结论，这次没有重试 emeng，没有调用 Vercel CLI，没有新建项目或付费资源，也没有读取凭据。

代码可以在本地构建和预览。线上还没有地址，需要恢复该团队授权之后才能做独立预览。本文件写完时还没有可访问的生产或预览 URL。
