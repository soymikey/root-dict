import { PageHeader } from "../components/PageHeader";

export function VocabPage() {
  return (
    <section className="page" id="panel-vocab" role="tabpanel" aria-labelledby="tab-vocab">
      <PageHeader title="生词库" />
      <p className="empty">还没有保存的单词。在单词故事卡上保存后，会出现在这里。</p>
    </section>
  );
}
