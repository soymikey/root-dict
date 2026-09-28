import { LibraryIcon, SettingsIcon, TranslateIcon } from "./icons";

export type TabId = "translate" | "vocab" | "settings";

const tabs: { id: TabId; label: string; Icon: typeof TranslateIcon }[] = [
  { id: "translate", label: "翻译", Icon: TranslateIcon },
  { id: "vocab", label: "生词库", Icon: LibraryIcon },
  { id: "settings", label: "设置", Icon: SettingsIcon },
];

type TabBarProps = {
  tab: TabId;
  onChange: (tab: TabId) => void;
};

export function TabBar({ tab, onChange }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="主导航">
      <div className="tabbar-list" role="tablist" aria-label="页面">
        {tabs.map(({ id, label, Icon }) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              className="tabbar-button"
              aria-selected={selected}
              aria-controls={`panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
