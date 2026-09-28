import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { clearApiKey, hasApiKey, setApiKey } from "../lib/apiKey";

export function SettingsPage() {
  const [draft, setDraft] = useState("");
  const [filled, setFilled] = useState(hasApiKey());
  const [message, setMessage] = useState("");

  function saveKey() {
    const next = draft.trim();
    if (!next) {
      setMessage("请输入 API 密钥。");
      return;
    }
    setApiKey(next);
    setDraft("");
    setFilled(true);
    setMessage("密钥已留在本次打开的内存中。");
  }

  function clearKey() {
    clearApiKey();
    setDraft("");
    setFilled(false);
    setMessage("密钥已清除。");
  }

  return (
    <section className="page" id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
      <PageHeader title="设置" />
      <section className="group">
        <h2>OpenAI API 密钥</h2>
        <p className="hint">只保存在当前页面的运行内存中。刷新或关闭后会清除。</p>
        <label className="field">
          <span>API 密钥</span>
          <input
            type="password"
            name="session-openai-key"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <p className="status-line" role="status">
          {filled ? "已填写，仅本次打开有效" : "尚未填写"}
          {message ? `。${message}` : ""}
        </p>
        <div className="button-row">
          <button type="button" className="button primary" onClick={saveKey}>
            保存密钥
          </button>
          <button type="button" className="button secondary" onClick={clearKey}>
            清除密钥
          </button>
        </div>
      </section>
      <section className="group">
        <h2>数据与隐私</h2>
        <p>
          翻译请求由浏览器直接发往 OpenAI。密钥可能被本机调试工具或浏览器扩展看到，请不要在公用设备上使用。
        </p>
        <p>应用不会写入本地数据库、日志或离线缓存。Service Worker 也不会缓存 OpenAI 请求和认证信息。</p>
        <p>语音识别使用浏览器的 Web Speech API。部分浏览器会把音频发送到在线识别服务，因此不能离线使用。</p>
        <p>已保存的单词只留在这台设备上，没有账号，也不会云同步。</p>
      </section>
    </section>
  );
}
