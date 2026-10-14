# UniRead · 时文阅读 Reading Comprehension

把《Current Insights 时文阅读｜提分训练3+X》练习册（扫描 PDF）变成可交互的阅读理解 Web App（PC + iPad），数据格式可直接接入 UniRead。

- **Playlist** = 一本书；**Item** = 一篇文章 + 题目
- 左栏文章、右栏交互题目；提交后显示结果、答案与解析

## 快速开始
```bash
npm install
npm run dev          # http://localhost:5173
npm run validate     # 校验 content/ 全部数据
npm run build:index  # 生成 content/catalog.json
npm test             # 判分单元测试
```
内容生产需要 macOS（`swift` 脚本基于 PDFKit）：
```bash
swift scripts/render.swift "articles/<book>.pdf" .work/pages/<playlistId> 1800
```

## 目录
| 路径 | 说明 |
|---|---|
| `docs/` | 计划与设计文档（从 [00-overview](docs/00-overview.md) 开始） |
| `schema/` | 数据结构唯一来源（zod），`npm run schema:export` 导出 JSON Schema |
| `content/` | playlists、items、keys（答案）、assets（图片） |
| `scripts/` | 渲染、裁图、校验、建索引 |
| `src/` | Web App |
| `screenshots/` | UniRead 页面参考截图 |
| `articles/` | 原始 PDF（不入库） |
