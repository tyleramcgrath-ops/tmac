import { describe, expect, it } from "vitest";
import { query } from "@/lib/db";
import { answerCall, endCall, getCallFor, incomingCall, pushSignal, signalsFor, startCall } from "@/lib/calls";
import { getMember, newId, recordSwipe, type Member } from "@/lib/members";

async function makeUser(gender: "woman" | "man", showMe: "women" | "men") {
  const id = newId();
  await query(
    `insert into users (id, email, password_hash, name, birthdate, gender, show_me, city)
     values ($1, $2, 'x', 'Caller', '1994-01-01', $3, $4, 'Lisbon')`,
    [id, `${id}@example.com`, gender, showMe],
  );
  return (await getMember(id)) as Member;
}

async function matchedPair() {
  const a = await makeUser("man", "women");
  const b = await makeUser("woman", "men");
  await recordSwipe(a, b.id, true, false);
  await recordSwipe(b, a.id, true, false);
  return [a, b] as const;
}

describe("video calls", () => {
  it("rings, connects, relays signals each way, and ends", async () => {
    const [a, b] = await matchedPair();
    const res = await startCall(a.id, b.id);
    expect(res.ok).toBe(true);
    const callId = res.ok ? res.callId : "";

    expect((await incomingCall(b.id))?.id).toBe(callId);
    expect(await incomingCall(a.id)).toBeNull();

    await pushSignal(a.id, callId, "offer", { type: "offer", sdp: "v=0 a" });
    expect(await answerCall(b.id, callId)).toEqual({ ok: true });
    expect((await getCallFor(a.id, callId))?.status).toBe("active");

    // Each side only receives the other side's messages, in order.
    const forB = await signalsFor(b.id, callId, 0);
    expect(forB.map((s) => s.kind)).toEqual(["offer"]);
    expect(forB[0].payload).toEqual({ type: "offer", sdp: "v=0 a" });
    await pushSignal(b.id, callId, "answer", { type: "answer", sdp: "v=0 b" });
    await pushSignal(b.id, callId, "ice", { candidate: "c1" });
    const forA = await signalsFor(a.id, callId, 0);
    expect(forA.map((s) => s.kind)).toEqual(["answer", "ice"]);
    expect(await signalsFor(a.id, callId, forA[0].id)).toHaveLength(1);

    await endCall(a.id, callId);
    expect((await getCallFor(b.id, callId))?.status).toBe("ended");
    expect(await pushSignal(a.id, callId, "ice", {})).toBe(false);
  });

  it("lets the callee decline", async () => {
    const [a, b] = await matchedPair();
    const res = await startCall(a.id, b.id);
    const callId = res.ok ? res.callId : "";
    await endCall(b.id, callId);
    expect((await getCallFor(a.id, callId))?.status).toBe("declined");
    expect(await answerCall(b.id, callId)).toMatchObject({ ok: false });
  });

  it("only connects matches, and keeps strangers out of the call", async () => {
    const a = await makeUser("man", "women");
    const b = await makeUser("woman", "men");
    expect(await startCall(a.id, b.id)).toMatchObject({ ok: false });

    const [c, d] = await matchedPair();
    const res = await startCall(c.id, d.id);
    const callId = res.ok ? res.callId : "";
    expect(await getCallFor(a.id, callId)).toBeNull();
    expect(await answerCall(c.id, callId)).toMatchObject({ ok: false }); // caller can't answer their own call
    expect(await pushSignal(a.id, callId, "offer", {})).toBe(false);
  });

  it("won't ring sample members, who can't pick up", async () => {
    const me = await makeUser("man", "women");
    await recordSwipe(me, "seed-valentina", true, false);
    expect(await startCall(me.id, "seed-valentina")).toEqual({ ok: false, reason: "Sample members can't take video calls." });
  });
});
