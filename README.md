# My Next.js 应用

这是一个使用现代前端技术栈构建的Next.js应用程序，具有聊天功能，支持MongoDB数据库存储。

## 技术栈

- **Next.js 15** - React框架，使用App Router
- **TypeScript** - 静态类型检查
- **Tailwind CSS** - 实用优先的CSS框架
- **shadcn/ui** - 可定制的UI组件库
- **MongoDB** - NoSQL数据库
- **Mongoose** - MongoDB对象模型工具
- **React Hook Form** - 表单处理
- **Zod** - 表单验证
- **Lucide React** - 图标库

## 项目结构

```
my-nextjs-app/
├── app/                     # Next.js应用目录（App Router）
│   ├── api/                 # API路由
│   ├── chat/                # 聊天功能页面
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局组件
│   └── page.tsx             # 首页组件
├── components/              # 组件目录
│   └── ui/                  # UI组件（shadcn）
│       ├── avatar.tsx       # 头像组件
│       ├── button.tsx       # 按钮组件
│       ├── card.tsx         # 卡片组件
│       ├── form.tsx         # 表单组件
│       ├── input.tsx        # 输入框组件
│       ├── label.tsx        # 标签组件
│       ├── skeleton.tsx     # 骨架屏组件
│       ├── textarea.tsx     # 文本域组件
│       └── tooltip.tsx      # 提示组件
├── lib/                     # 工具库
│   └── mongodb.ts           # MongoDB连接配置
├── models/                  # MongoDB模型
│   ├── Chat.ts              # 聊天模型
│   └── Message.ts           # 消息模型
├── public/                  # 静态资源
├── .env                     # 环境变量
├── .gitignore               # Git忽略文件
├── components.json          # shadcn组件配置
├── next.config.mjs          # Next.js配置
├── package.json             # 项目依赖管理
├── postcss.config.mjs       # PostCSS配置
└── tsconfig.json            # TypeScript配置
```

## 特点

- 现代UI设计，基于Tailwind CSS和shadcn/ui
- 类型安全的前端和后端代码
- 集成MongoDB数据库
- 聊天功能实现
- 响应式布局设计

## 安装与运行

### 前提条件

- Node.js 18+
- MongoDB数据库（或MongoDB Atlas账号）

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/your-username/my-nextjs-app.git
cd my-nextjs-app
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

创建`.env.local`文件并添加以下内容：

```
MONGO_PUBLIC_URL=your_mongodb_connection_string
INFINI_API_KEY=your_infini_api_key
```

4. 运行开发服务器

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行。

## 生产环境部署

构建生产版本：

```bash
npm run build
```

启动生产服务器：

```bash
npm start
```

## 数据库连接

项目使用`lib/mongodb.ts`中的`connectToDatabase`函数连接到MongoDB：

```typescript
import connectToDatabase from '@/lib/mongodb';

// 在API或服务器组件中使用
const mongoose = await connectToDatabase();
```

## 许可证

[MIT](LICENSE)
