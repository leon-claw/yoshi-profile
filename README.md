# Yoshi Profile

纯前端 React 角色展示应用。内容集中在 `src/content/dolls.md`，界面由 Renderer 和主题层独立渲染。
默认 Renderer 是幻灯片式角色页：每个玩偶独占一屏，默认使用轻柔馆主题，hash 路由同步当前页。桌面可用键盘或按钮翻页，移动端可通过一次滑动切换一页，相册缩略图可展开预览。

## Commands

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run test
npm.cmd run build
```

## Content

每个角色使用 `## 角色名` 开始，下面的字段表提供基础信息、颜色、标签和素材位置。

- `小名` 会作为角色副标题展示。
- `描述`、`个性` 和 `出生地` 会进入基础信息区。
- `pageColor` 控制当前角色页的大面积马卡龙主色。
- `accentColor` 控制高亮色。
- `heroImage` 和 `gallery` 填写 `src/assets/dolls` 下的图片文件名，例如 `mochi.png`。
- 图片可以是横图、竖图或方图，Renderer 会使用固定容器和等比缩放展示。
- `### 性格`、`### 小故事` 等正文会作为 Markdown 分区渲染。

## Renderer And Theme

- Renderer 注册在 `src/renderers/registry.ts`。
- 主题注册在 `src/themes/registry.ts`。
- 默认样式在 `src/styles/app.css`，主题通过 CSS 变量切换。
