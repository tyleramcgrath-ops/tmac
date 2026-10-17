import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCallFor, iceServers } from "@/lib/calls";
import { getMember } from "@/lib/members";
import { requireUserId } from "@/lib/session";
import { CallRoom } from "./call-room";

export const metadata: Metadata = {
  title: "Video chat · Girls Around the Globe",
};

export default async function CallPage({ params }: PageProps<"/call/[id]">) {
  const { id } = await params;
  const me = await requireUserId(`/call/${id}`);
  const call = await getCallFor(me, id);
  if (!call) notFound();
  const role = call.callerId === me ? "caller" : "callee";
  const other = await getMember(role === "caller" ? call.calleeId : call.callerId);
  if (!other) notFound();

  return (
    <CallRoom
      callId={call.id}
      role={role}
      initialStatus={call.status}
      other={{ id: other.id, name: other.name, flag: other.flag, city: other.city, palette: other.palette, photos: other.photos }}
      iceServers={iceServers()}
    />
  );
}
