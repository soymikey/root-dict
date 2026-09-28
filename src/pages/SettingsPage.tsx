import { PageHeader } from "../components/PageHeader";

export function SettingsPage() {
  return (
    <section className="page" id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
      <PageHeader title="设置" />
      <p className="lede">密钥、发音和隐私选项会放在这里。</p>
    </section>
  );
}
