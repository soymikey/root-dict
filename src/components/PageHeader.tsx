import type { ReactNode } from "react";
import { BackIcon } from "./icons";

type PageHeaderProps = {
  title: string;
  trailing?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
};

export function PageHeader({ title, trailing, onBack, backLabel = "返回" }: PageHeaderProps) {
  return (
    <header className="page-header">
      {onBack ? (
        <button type="button" className="icon-button" onClick={onBack} aria-label={backLabel}>
          <BackIcon />
        </button>
      ) : null}
      <h1>{title}</h1>
      {trailing ? <div className="page-header-trailing">{trailing}</div> : null}
    </header>
  );
}
