"use client";

import { useRouter } from "next/navigation";

export default function DeleteEventButton({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    const ok = window.confirm(`「${eventName}」を削除しますか？`);
    if (!ok) return;

    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (!json.ok) {
      alert("削除に失敗しました");
      return;
    }

    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-xl bg-red-500 px-4 py-2 font-bold text-white"
    >
      削除
    </button>
  );
}