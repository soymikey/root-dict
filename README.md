# 词根词典 (root-dict)

移动端优先的词根词典 PWA：通过词根、构词理解英文单词，支持中英双向翻译、语音输入、单词故事卡、美式发音、本地生词库，可安装到主屏幕并在离线时查看已保存单词。

## 开发

```bash
npm install
npm run dev
```

## 构建与测试

```bash
npm test
npm run build
npm run preview
```

## 使用说明

1. 在「设置」页填写 OpenAI API 密钥（保存在本机 localStorage，刷新后仍保留）。
2. 在「翻译」页输入中文或英文进行翻译；英文单词会打开词根故事卡。
3. 可将单词故事保存到「生词库」，支持搜索、学习状态和删除。
