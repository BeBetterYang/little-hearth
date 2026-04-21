# Little Hearth

一个家庭菜单与用餐记录小应用。前端使用 React + Vite，后端使用最轻量的 Node/Express，数据写入本地 JSON 文件，用户上传图片按模块保存为文件。

## 功能

- 管理家庭菜品：新增、编辑、删除、分类、上传菜品图片
- 选择今日菜单：按分类/关键词挑选菜品
- 完成用餐记录：记录备注、上传用餐图片、沉淀历史足迹
- 本地持久化：刷新页面后菜品、菜单和历史记录不会丢失

## 本地运行

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

启动后访问：

- 前端：http://localhost:3000
- 后端：http://localhost:5174/api/health

## 数据与图片存储

- 业务数据：`server/data/db.json`
- 菜品图片：`uploads/dishes/`
- 用餐记录图片：`uploads/orders/`

`server/data/db.json` 会在首次启动后自动根据 `server/seedData.js` 创建。上传图片会按模块分类落盘，并通过 `/uploads/...` 静态访问。

## 常用命令

```bash
npm run client   # 只启动 Vite 前端
npm run server   # 只启动 Express 后端
npm run lint     # TypeScript 检查
npm run build    # 生产构建
```

## 环境变量

- `API_PORT`：后端端口，默认 `5174`
- `VITE_API_BASE_URL`：前端 API 地址。开发模式默认通过 Vite proxy 访问 `/api`，通常不用设置。
