import { PageHeader } from "../components/PageHeader";

export function TranslatePage() {
  return (
    <section className="page" id="panel-translate" role="tabpanel" aria-labelledby="tab-translate">
      <PageHeader title="翻译" />
      <p className="lede">输入中文或英文，查看翻译和单词怎么来的。</p>
    </section>
  );
}
