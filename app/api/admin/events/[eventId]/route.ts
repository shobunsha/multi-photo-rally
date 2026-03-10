import { NextResponse } from "next/server";
import { deleteEvent } from "@/lib/event-service";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    await deleteEvent(eventId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "failed to delete event" },
      { status: 500 }
    );
  }
}