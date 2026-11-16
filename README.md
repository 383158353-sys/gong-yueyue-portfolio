# 龚玥月个人网站

纯黑底的七页个人站，放在 `gong-yueyue-portfolio` 的新分支上。`main` 仍是原来的单页作品集，素材没有删。

## 本地

```bash
npm install
npm test
npm run dev
```

开发地址一般是 `http://127.0.0.1:5173/`。生产构建：

```bash
npm run build
npm run preview
```

预览默认在 `http://127.0.0.1:4173/`。七个路由都可以直接打开：`/`、`/about`、`/projects`、`/films`、`/scenes`、`/characters`、`/articles`。

## 页面

顶部只有一排导航：首页、关于、项目、影片、场景、人物、文章。页面底部不再放同一排链接。

视觉是纯黑和少量红色下划线。标题用 Sora，正文用 Inter，中文落到系统无衬线字体（苹方、冬青黑体、思源黑体、微软雅黑）。

作品图用仓库里已有的静帧和 Canva 拆图。附图里的红布和楼梯只作版式参考，没有进站点。没有剧照的项目不放占位图。

## 影片

影片页最上方有一个 16:9 的 YouTube iframe，用来看嵌入位置和排版。视频是 YouTube IFrame Player API 文档里的公开示例 `M7lc1UVf-VE`，页面标题写明「测试视频，非本人作品；待替换」。它不放进任何作品条目。换成自己的片子时，只改 `src/content/layoutExample.json` 里的 `videoId`。页面没有在线编辑后自动发布。

iframe 使用 `https://www.youtube-nocookie.com/embed/`，参数含 `autoplay=0`，不会自动播放。作品静帧仍在播放器下面。这些片子还没有作者自己的 YouTube 地址，页面继续标成待补。大视频和 40 页作品集 PDF 是 Git LFS 指针，不能当作成片播放。

本机仍可以粘贴 `watch`、`youtu.be`、`shorts`、`embed` 链接做预览。脚本只抽出 11 位视频 ID，不把用户输入当成 HTML。链接写在当前浏览器的 `localStorage`（键名 `gong-yueyue-local-youtube-v1`），不会上传，其他访客看不到，也不是公开发布。测试片不能写进这份本机列表。远程播放若没有收到 YouTube 的播放或错误状态，页面保持「尚未确认」。

## 复用

- YouTube ID 解析移植自 [lingoclub-web](https://github.com/383158353-sys/lingoclub-web) 的 `src/lib/youtubeTranscriptClient.js`（`extractYouTubeId` / `normalizeYouTubeUrl`）。没有改 LingoClub，也没有接它的字幕或后端。
- 嵌入参数和 100 / 101 / 150 / 153 错误说明参考同仓库 `src/lib/youtubePlayerConfig.js` 与 `src/components/study/players/YouTubePlayer.jsx`。
- Sora 标题、Inter 正文的搭配来自 LingoClub 的 `src/index.css`。本站把强调色改成红色，并加上中文系统字体。字体文件来自 [@fontsource/sora](https://github.com/fontsource/font-files) 与 [@fontsource/inter](https://github.com/fontsource/font-files)，字体本身是 SIL Open Font License。
- 没有使用 `get-youtube-id` 的 fuzzy 匹配。那个包是 MIT，但模糊抽取会把任意 11 位字符串当成视频。

## 大文件

```bash
git lfs install
git lfs pull
```

未执行 `git lfs pull` 时，mp4 和 PDF 只是指针文本。
