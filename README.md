# Little Hearth

今天吃什么呢老婆？
不知道，自己去点菜吧！

一个家庭菜单与用餐记录小应用。前端使用 React + Vite，后端使用最轻量的 Node/Express，数据写入本地 JSON 文件，用户上传图片按模块保存为文件。

## 功能

- 管理家庭菜品：新增、编辑、删除、分类、上传菜品图片
- 选择今日菜单：按分类/关键词挑选菜品
- 完成用餐记录：记录备注、上传用餐图片、沉淀历史足迹

## 软件截图
<img width="1179" height="2556" alt="IMG_7301" src="https://github.com/user-attachments/assets/ea163512-f268-4955-9e99-fc91c813174b" />
<img width="1179" height="2556" alt="IMG_7302" src="https://github.com/user-attachments/assets/32e50d0f-ec17-406e-99bf-1d180fe2120e" />
<img width="1179" height="2556" alt="IMG_7303" src="https://github.com/user-attachments/assets/8f4cb2b5-e507-42d4-bf42-e6e884d3ed64" />
<img width="1179" height="2556" alt="IMG_7304" src="https://github.com/user-attachments/assets/2b068842-b0f8-4542-b7e0-6f2a4ee07626" />
<img width="1179" height="2556" alt="IMG_7305" src="https://github.com/user-attachments/assets/b4358753-1186-4347-985a-cfc0a5684ce9" />
<img width="1179" height="2556" alt="IMG_7306" src="https://github.com/user-attachments/assets/c5e9e01c-f713-4e95-90ee-6a2231852068" />


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
