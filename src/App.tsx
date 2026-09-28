import { useState } from "react";
import { TabBar, type TabId } from "./components/TabBar";
import { SettingsPage } from "./pages/SettingsPage";
import { TranslatePage } from "./pages/TranslatePage";
import { VocabPage } from "./pages/VocabPage";

export function App() {
  const [tab, setTab] = useState<TabId>("translate");

  return (
    <div className="app">
      <main className="app-main">
        {tab === "translate" ? <TranslatePage onOpenSettings={() => setTab("settings")} /> : null}
        {tab === "vocab" ? <VocabPage /> : null}
        {tab === "settings" ? <SettingsPage /> : null}
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
}
