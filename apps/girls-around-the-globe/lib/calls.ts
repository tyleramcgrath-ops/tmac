import "server-only";
import { one, query } from "./db";
import { isMatch, newId } from "./members";

// 1:1 video calls between matches. Audio and video go peer to peer over
// WebRTC; the server only relays the offer/answer/ICE messages between the
// two browsers, through the call_signals table.

const RING_SECONDS = 45;

export type CallStatus = "ringing" | "active" | "ended" | "declined" | "missed";

export type Call = {
  id: string;
  callerId: string;
  calleeId: string;
  status: CallStatus;
  createdAt: string;
};

type Row = {
  id: string;
  caller_id: string;
  callee_id: string;
  status: CallStatus;
  created_at: string | Date;
};

const toCall = (r: Row): Call => ({
  id: r.id,
  callerId: r.caller_id,
  calleeId: r.callee_id,
  status: r.status,
  createdAt: new Date(r.created_at).toISOString(),
});

async function expireRinging() {
  await query(
    `update calls set status = 'missed', ended_at = now()
     where status = 'ringing' and created_at < now() - make_interval(secs => $1)`,
    [RING_SECONDS],
  );
}

export async function getCallFor(meId: string, callId: string): Promise<Call | null> {
  await expireRinging();
  const r = await one<Row>("select * from calls where id = $1 and (caller_id = $2 or callee_id = $2)", [callId, meId]);
  return r ? toCall(r) : null;
}

export type StartResult = { ok: true; callId: string } | { ok: false; reason: string };

export async function startCall(callerId: string, calleeId: string): Promise<StartResult> {
  if (callerId === calleeId) return { ok: false, reason: "You can't call yourself." };
  if (!(await isMatch(callerId, calleeId))) return { ok: false, reason: "You can only video chat with your matches." };
  const callee = await one<{ is_seed: boolean }>("select is_seed from users where id = $1", [calleeId]);
  if (callee?.is_seed) return { ok: false, reason: "Sample members can't take video calls." };

  // One call at a time: hang up anything the caller left open.
  await query(
    `update calls set status = 'ended', ended_at = now()
     where status in ('ringing', 'active') and (caller_id = $1 or callee_id = $1)`,
    [callerId],
  );
  const id = newId();
  await query("insert into calls (id, caller_id, callee_id) values ($1, $2, $3)", [id, callerId, calleeId]);
  return { ok: true, callId: id };
}

export async function incomingCall(meId: string): Promise<Call | null> {
  await expireRinging();
  const r = await one<Row>(
    "select * from calls where callee_id = $1 and status = 'ringing' order by created_at desc limit 1",
    [meId],
  );
  return r ? toCall(r) : null;
}

export async function answerCall(meId: string, callId: string): Promise<{ ok: boolean; reason?: string }> {
  const call = await getCallFor(meId, callId);
  if (!call || call.calleeId !== meId) return { ok: false, reason: "Call not found." };
  if (call.status !== "ringing") return { ok: false, reason: "This call has ended." };
  if (!(await isMatch(call.callerId, call.calleeId))) return { ok: false, reason: "You're no longer matched." };
  await query("update calls set status = 'active', answered_at = now() where id = $1 and status = 'ringing'", [callId]);
  return { ok: true };
}

export async function endCall(meId: string, callId: string) {
  const call = await getCallFor(meId, callId);
  if (!call || (call.status !== "ringing" && call.status !== "active")) return;
  const status = call.status === "ringing" && call.calleeId === meId ? "declined" : "ended";
  await query("update calls set status = $2, ended_at = now() where id = $1", [callId, status]);
}

export type Signal = { id: number; kind: "offer" | "answer" | "ice"; payload: unknown };

export async function pushSignal(meId: string, callId: string, kind: Signal["kind"], payload: unknown) {
  const call = await getCallFor(meId, callId);
  if (!call || (call.status !== "ringing" && call.status !== "active")) return false;
  await query("insert into call_signals (call_id, from_id, kind, payload) values ($1, $2, $3, $4)", [
    callId,
    meId,
    kind,
    JSON.stringify(payload),
  ]);
  return true;
}

export async function signalsFor(meId: string, callId: string, afterId: number): Promise<Signal[]> {
  const rows = await query<{ id: string | number; kind: Signal["kind"]; payload: unknown }>(
    "select id, kind, payload from call_signals where call_id = $1 and from_id <> $2 and id > $3 order by id limit 200",
    [callId, meId, afterId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    kind: r.kind,
    payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
  }));
}

export function iceServers() {
  const servers: { urls: string | string[]; username?: string; credential?: string }[] = [
    { urls: "stun:stun.l.google.com:19302" },
  ];
  // A TURN relay is needed for people behind strict NATs (many mobile networks).
  if (process.env.TURN_URL) {
    servers.push({ urls: process.env.TURN_URL, username: process.env.TURN_USERNAME, credential: process.env.TURN_PASSWORD });
  }
  return servers;
}
