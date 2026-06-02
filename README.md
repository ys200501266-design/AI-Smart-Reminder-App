# AI Smart Reminder App

一个面向 AI 产品经理作品集展示的手机端智能提醒 App。用户既可以手动填写提醒，也可以输入“明天早上九点提醒我交作业”这类自然语言，系统会尽量解析出事项、日期、时间和重复周期，并通过手机本地通知进行提醒。

## 产品亮点

- 自然语言创建提醒，降低用户填写成本。
- 支持通知、震动、通知 + 震动三种提醒方式。
- 支持不重复、每天、每周重复提醒。
- 使用本地通知和本地存储，不依赖付费后端服务。
- 内置“10 秒测试提醒”，适合录制 Demo 视频。
- 同时提供 PRD、用户故事、AI 设计和测试用例，适合放入 AI 产品经理作品集。

## 功能截图占位

> 上传 GitHub 后，可以把 App 首页、自然语言解析、通知弹窗和提醒列表截图放到这里。

| 首页 | 智能解析 | 通知提醒 | 提醒列表 |
| --- | --- | --- | --- |
| TODO | TODO | TODO | TODO |

## 技术栈

- React Native
- Expo
- TypeScript
- expo-notifications
- AsyncStorage

## 项目结构

```text
手机提醒app/
├── src/
│   ├── screens/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── types/
├── docs/
│   ├── PRD.md
│   ├── user_story.md
│   ├── feature_list.md
│   ├── product_analysis.md
│   ├── ai_design.md
│   └── test_cases.md
├── prompts/
│   └── llm_parse_reminder_prompt.md
├── App.tsx
├── README.md
├── portfolio_writeup.md
└── package.json
```

## 本地运行方式

先确认电脑已安装 Node.js 和 npm。Expo SDK 56 对 Node.js 的最低要求是 22.13.x，建议安装 Node.js 22 LTS 或更新版本。

```bash
cd D:\手机提醒app
npm install
npm start
```

启动后可以选择：

- 用手机安装 Expo Go，扫描终端二维码。
- Android 模拟器运行：`npm run android`。
- iOS 模拟器运行：`npm run ios`，需要 macOS 环境。

## 核心功能说明

### 1. 创建提醒

用户填写标题、内容、日期、时间、重复周期和提醒方式，点击“创建提醒”。App 会请求通知权限，并使用本地通知创建提醒。

### 2. 自然语言解析

轻量解析逻辑位于：

```text
src/utils/parseReminderText.ts
```

当前支持：

- 明天早上九点提醒我交作业
- 今晚八点提醒我背单词
- 每天下午三点提醒我喝水
- 15:30 提醒我开会

如果解析不完整，App 会提示用户手动确认或修改。

### 3. 提醒列表

提醒会保存在 AsyncStorage 中。用户可以删除提醒，也可以标记完成。删除或完成时会取消对应的本地通知。

### 4. 10 秒测试提醒

首页提供“10 秒测试提醒”按钮。点击后 10 秒触发本地通知，方便录制作品集 Demo。

## AI 能力设计

MVP 阶段没有接入付费 LLM API，而是通过本地规则解析验证产品链路：

- 输入层：用户输入自然语言。
- 理解层：解析事项、日期、时间和重复周期。
- 决策层：判断是否需要用户确认。
- 执行层：创建本地提醒。
- 反馈层：用户完成或删除提醒。

未来接入 LLM 时，可以使用 `prompts/llm_parse_reminder_prompt.md` 中的提示词，让模型输出结构化 JSON。

## Demo 展示说明

建议录制 40 到 60 秒短视频：

1. 展示首页和产品名称。
2. 输入“明天早上九点提醒我交作业”。
3. 点击“解析并填入表单”。
4. 创建提醒并展示列表。
5. 点击“10 秒测试提醒”。
6. 切到后台，等待系统通知出现。
7. 回到 App，标记完成或删除提醒。

## 权限与测试说明

- 本项目使用的是本地通知，不需要后端服务，也不需要 API Key。
- Android 13 及以上需要用户允许通知权限。
- Expo Go 适合测试本地通知，但远程 Push 通知能力受限制；本项目不使用远程 Push。
- 震动效果受设备、系统权限、静音模式和模拟器能力影响。真机测试更可靠。
- 如果 App 在前台，系统通知和震动表现可能与后台不同，这是移动系统的正常限制。

## 后续优化方向

- 接入 LLM API，提升复杂自然语言解析能力。
- 增加语音输入。
- 增加日历视图和提醒模板。
- 增加完成率统计和复盘。
- 支持云端同步和多设备登录。
- 支持 Agent 主动追问缺失信息。

## 适合 AI 产品经理作品集的原因

这个项目不仅有可运行的移动端 MVP，也包含完整产品文档。它展示了从用户痛点、MVP 范围、AI 交互设计、技术实现到测试验证的完整链路，适合在 AI 产品经理面试中说明“如何把 AI 能力落到真实用户流程中”。

## 参考

- [Expo Notifications 官方文档](https://docs.expo.dev/versions/v56.0.0/sdk/notifications/)
- [AsyncStorage 官方文档](https://react-native-async-storage.github.io/async-storage/)
