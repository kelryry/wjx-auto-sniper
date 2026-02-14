# 🚀 问卷星 AI 自动答题 / 抢单神器

## 📖 简介
这是一个基于 **Tampermonkey（油猴）** 的问卷星辅助脚本。

**🔥 v2.0：新增多 AI 接口支持！**

与传统的"随机乱填"脚本不同，本脚本接入了大模型 API。它能根据你设定的"人设"阅读题目并生成符合逻辑的答案。
现已支持 **OpenAI 兼容接口**（包括 OpenAI / DeepSeek / Moonshot / 通义千问 等）、**Google Gemini** 和 **Anthropic Claude** 三大类 API。

非常适合需要**抢占时间点**、**快速提交**且**要求答案看起来像真人**的场景（例如讲座报名、热门抢课、有时效性的调查）。

---

## ⚠️ 郑重声明 / 免责
> **本脚本由编程爱好者修改，作者水平十分有限，代码很可能存在 Bug、逻辑漏洞或不完善之处。**
> *   🧪 **请务必测试**：在正式抢单前，请找无关紧要的问卷进行多次测试，确保配置正确。
> *   🌐 **网络环境**：脚本依赖外部 AI API，请确保你的网络畅通（对于 Google/Anthropic 需要能访问外网）。
> *   🚫 **后果自负**：使用本脚本产生的任何后果（如提交失败、问卷无效、账号异常等）请自行承担。

---

## ✨ 核心功能 (Features)

1.  **🤖 AI 智能大脑 (多接口)**
    *   不再是无脑随机！支持 **OpenAI 兼容 / Gemini / Anthropic** 三大 API 接口。
    *   根据你配置的 `PERSONA`（人设）自动填写单选、多选和简答题，内容逻辑通顺，像真人一样回答。

2.  **📱 多端适配**
    *   支持 **PC 端 (`jq`)** 和 **移动端 (`vm`/`m`)** 布局。
    *   自动识别页面结构，无论是电脑网页还是手机分享链接，都能定位。

3.  **🔢 强力填充技术**
    *   针对问卷星移动端的格式校验（如手机号等），内置 `Native Value Setter` 原型链模拟技术。
    *   突破 React/Vue 等框架的输入限制，**完美填入手机号**。

4.  **🛡️ 协议秒签**
    *   针对移动端问卷提交前的"我已阅读并同意隐私协议"选择框，脚本会自动检测并**强制勾选**。
    *   即使有题目未填完，也会优先处理协议框，为你节省宝贵的 1 秒钟。

5.  **⏰ 定时狙击（抢答）**
    *   支持设置 `START_TIME`与`PRE_LOAD_OFFSET`，脚本会显示倒计时遮罩，并根据设置提前刷新，抵消网络延迟。
    *   时间一到，将自动刷新并开始答题，专为抢单设计。

6.  **🧭 智能导航与高亮**
    *   **混合模式**：简单题交给 AI，复杂题型（如文件上传）自动跳过。
    *   **漏题定位**：AI 填完后，脚本会自动滚动到**第一道未填写的题目**，并用🔴**红色高亮**框出，提醒你人工补全。
    *   **自动就位**：如果所有题目都填完了，页面会自动滚动到**提交按钮**处，等待你点击（或自动提交）。

---

## 🛠️ 安装指南

### 1. 环境准备
你需要安装 **Tampermonkey** 插件：
*   🧩 Chrome/Edge 用户请去扩展商店搜索 Tampermonkey。
*   🦊 Firefox 用户请去 Add-ons 搜索 Tampermonkey。

### 2. 安装脚本
新建脚本，将代码完整复制粘贴进去并保存。

### 3. 获取 API Key (必做步骤)

根据你选择的 API 提供商，从对应平台申请密钥：

| 提供商 (API_PROVIDER) | 值 | 申请地址 | 备注 |
|---|---|---|---|
| **OpenAI 兼容** | `1` (默认) | 取决于具体服务商 | OpenAI: [platform.openai.com](https://platform.openai.com/api-keys); DeepSeek: [platform.deepseek.com](https://platform.deepseek.com/api_keys) 等 |
| **Google Gemini** | `2` | [aistudio.google.com](https://aistudio.google.com/app/apikey) | 需能访问 Google |
| **Anthropic Claude** | `3` | [console.anthropic.com](https://console.anthropic.com/settings/keys) | 需能访问 Anthropic |

---

## ⚙️ 配置说明 (User Config)
脚本开头有一个 `USER_CONFIG` 区域，这是你必须修改的地方：

```javascript
const USER_CONFIG = {
    // 1. � API 提供商选择 (必填)
    // 1 = OpenAI 兼容 (OpenAI / DeepSeek / Moonshot 等, 默认)
    // 2 = Google Gemini API
    // 3 = Anthropic Claude API
    API_PROVIDER: 1,

    // 2. 🔑 API 密钥 (必填)
    API_KEY: "sk-xxxx...",

    // 3. 🌐 API 端点 (选填, 留空使用默认值)
    // Provider 1 默认: https://api.openai.com/v1/chat/completions
    // Provider 2 默认: Gemini 官方端点 (自动拼接)
    // Provider 3 默认: https://api.anthropic.com/v1/messages
    // 示例: 使用 DeepSeek 则填 "https://api.deepseek.com/v1/chat/completions"
    API_URL: "",

    // 4. ⚡ 模型名称 (选填, 留空使用默认值)
    // Provider 1 默认: gpt-5.2
    // Provider 2 默认: gemini-3-flash-preview
    // Provider 3 默认: claude-opus-4.6
    MODEL_NAME: "",

    // 5. 🧠 思考链预算 (选填, 仅 Gemini/Anthropic)
    // 0 = 关闭 (默认); 正整数 = 最大思考 token 数
    // OpenAI 兼容接口请用 CUSTOM_PARAMS 控制
    THINKING_BUDGET: 0,

    // 6. 🔧 自定义参数 (选填, 仅 OpenAI 兼容)
    // 会合并到请求体中, 如: { "temperature": 0.7 }
    CUSTOM_PARAMS: {},

    // 7. 🎭 定义你的人设 (必填)
    PERSONA: `
        姓名：张三
        电话：13800138000
        身份：22岁大四学生，计算机科学专业。
        性格：积极向上，对未来充满期待。
        情况：如果遇到未提及的问题，请进行合理的正面推断。
    `,

    // 8. ⏱️ 抢答开始时间 (格式：YYYY-MM-DD HH:mm:ss)
    START_TIME: "2025-12-01 10:00:00",

    // 9. 🚀 刷新提前量 (秒), 抵消网络延迟
    PRE_LOAD_OFFSET: 0.3,

    // 10. 🔄 API 请求失败重试次数 (0=不重试, 默认 1)
    RETRY_COUNT: 1,

    // 11. ⏳ 重试间隔 (毫秒, 默认 1000)
    RETRY_DELAY_MS: 1000,

    // 12. 👆 是否自动点击提交
    // false (推荐): 填完后滚动到提交按钮，由人工点击。
    // true: 填完倒计时 1 秒后自动提交。
    AUTO_SUBMIT: false
};
```

---

## 🎮 使用流程

1.  **配置**：选择 `API_PROVIDER`，填好 `API_KEY`、人设信息和 `START_TIME`。
2.  **等待**：打开问卷页面，如果没到时间，屏幕会显示灰色倒计时遮罩。
3.  **自动执行**：
    *   时间一到，页面自动刷新。
    *   AI 开始高速填写（每 15-20 题一组）。
    *   脚本同时会在后台自动勾选"隐私协议"。
4.  **人工介入 (关键)**：
    *   **如果有漏题**：脚本会自动滚动到**红色高亮**的题目处（通常是 AI 处理不了的复杂图表题），请手动补全。
    *   **如果全填完**：页面直接停在**提交按钮**正中央。
    *   你只需确认无误，点击提交即可。

---

## ❓ 常见问题 (Q&A)

*   **Q: 为什么没反应？**
    *   A: 请按 `F12` 打开控制台 (Console)，看是否有红色报错。常见原因：`API_KEY` 填错、网络无法连接到对应 API 端点、`API_PROVIDER` 设置与密钥不匹配。
*   **Q: 用 OpenAI 兼容的第三方服务（如 DeepSeek）怎么配？**
    *   A: 将 `API_PROVIDER` 设为 `1`，填好对应服务的 `API_KEY`，并将 `API_URL` 改为该服务的 Chat Completions 端点。
*   **Q: 填空题胡说八道怎么办？**
    *   A: 请修改配置里的 `PERSONA`，把人设写得更具体一点（比如指定具体的年级、专业、居住地），或者改为更强的模型。
*   **Q: 遇到滑块验证码怎么办？**
    *   A: 脚本无法破解验证码。建议将 `AUTO_SUBMIT` 设为 `false`，最后一步由你亲自点击提交，如果弹出滑块，手动划一下即可。
*   **Q: 思考链 (Thinking) 是什么？怎么用？**
    *   A: 部分模型支持思考链（也称 Extended Thinking），开启后模型会在回答前先进行内部推理，答案可能更准确但速度更慢。Gemini 和 Anthropic 可通过 `THINKING_BUDGET` 设置（如 `1024`）；OpenAI 兼容接口由于各家实现不同，请通过 `CUSTOM_PARAMS` 添加对应参数。

---

## 🤝 鸣谢与版权 (Acknowledgement)

本脚本基于 **ZainCheung** 的开源项目进行二次开发与 AI 适配。

*   **原作者**: ZainCheung
*   **原项目链接**: [https://github.com/ZainCheung/wenjuanxin](https://github.com/ZainCheung/wenjuanxin)
*   **开源协议**: 本衍生作品遵循 **GPL-3.0** 协议开源。

感谢 OpenAI、Google Gemini、Anthropic Claude 提供的强大 API 能力。

---

## 🌟 支持与鼓励
开发不易，用爱发电 🔋。
如果这个脚本为您节省了时间，或者帮您抢到了心仪的资格，**麻烦您动动小手，在右上角点亮一个 Star ⭐**。
您的支持是我持续更新和维护的最大动力！💖
