import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-black">管理画面</h1>

        <Link
          href="/admin/events"
          className="inline-flex rounded-2xl bg-cyan-500 px-6 py-4 font-bold"
        >
          イベント一覧へ
        </Link>
      </div>
    </main>
  );
}