import { useState } from "react";
import { TabBar, type TabId } from "./components/TabBar";
import { SettingsPage } from "./pages/SettingsPage";
import { StoryPage } from "./pages/StoryPage";
import { TranslatePage } from "./pages/TranslatePage";
import { VocabPage } from "./pages/VocabPage";

export function App() {
  const [tab, setTab] = useState<TabId>("translate");
  const [storyWord, setStoryWord] = useState<string | null>(null);

  return (
    <div className="app">
      <main className="app-main" hidden={storyWord !== null}>
        <div hidden={tab !== "translate"}>
          <TranslatePage onOpenSettings={() => setTab("settings")} onOpenWord={setStoryWord} />
        </div>
        {tab === "vocab" ? <VocabPage onOpenWord={setStoryWord} /> : null}
        {tab === "settings" ? <SettingsPage /> : null}
      </main>
      {storyWord ? <StoryPage word={storyWord} onBack={() => setStoryWord(null)} /> : <TabBar tab={tab} onChange={setTab} />}
    </div>
  );
}
