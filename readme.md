# Douyin Mini Program Utilities

本项目为 **抖音小程序** 开发提供了一套常用工具封装，包括：

- **HTTP 请求封装**：基于 `tt.request`，支持 `GET / POST / PUT / DELETE`，自动处理基础 URL、请求头、401 错误等。
- **全局状态管理**：基于 `mini-stores` 思想二次封装，专门适配抖音小程序页面生命周期与数据绑定。
- **用户信息管理**：提供用户信息的本地存储、更新、获取等功能。

## 特性

- 🚀 **Promise 化 API**  
  将 `tt.request`、`tt.login` 等抖音小程序 API 封装为 `Promise`，更易于在 `async/await` 中使用。
- 📦 **全局状态管理**  
  支持组件与页面绑定，自动触发数据更新，并支持计算属性（`computed`）。
- 🔒 **请求异常处理**  
  对 401 错误进行自动处理（无效、过期、无权限），并支持跳转登录页。
- 👤 **用户信息持久化**  
  自动从本地缓存加载用户信息，并提供手机号脱敏等功能。

## 目录结构

```
.
├── store.js        # 全局状态管理核心
├── userStore.js    # 用户信息状态管理
├── http.js         # HTTP 请求封装
└── README.md
```

## 安装

将本项目文件复制到抖音小程序项目的 `utils/` 目录下：

```
utils/
├── http.js
├── store.js
└── userStore.js
```

## 使用方法

### 1. HTTP 请求

```js
import http from "@/utils/http";

// GET 请求
const res = await http.get("/api/user", { id: 123 });
console.log(res);

// POST 请求
await http.post("/api/login", { username: "test", password: "123456" });
```

### 2. 全局状态绑定

在页面中绑定全局 store：

```js
import { Store } from "@/utils/store";
import userStore from "@/utils/userStore";

Page({
  data: {},
  onLoad() {
    userStore.bind(this, "$store");
  },
  onUnload() {
    userStore.unbind(this);
  }
});
```

页面中即可通过 `this.data.$store.userInfo` 访问全局用户信息。

### 3. 更新与获取用户信息

```js
// 更新用户信息
userStore.updateUserInfo({
  nickName: "新的昵称"
});

// 获取用户信息
const info = userStore.getCurrentUserInfo();
console.log(info);
```

### 4. 获取脱敏手机号

```js
const maskedPhone = userStore.getMaskedPhone();
console.log(maskedPhone); // 例如 138****1234
```

---

如需更多用法和扩展，请参考各工具文件中
