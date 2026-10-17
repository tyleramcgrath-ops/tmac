"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { endCallAction } from "@/app/actions";
import { Avatar } from "@/components/avatar";

type Other = { id: string; name: string; flag: string; city: string; palette: [string, string]; photos: string[] };
type Status = "ringing" | "active" | "ended" | "declined" | "missed";
type Signal = { id: number; kind: "offer" | "answer" | "ice"; payload: unknown };

const POLL_MS = 700;

const ENDED_TEXT: Record<string, string> = {
  ended: "Call ended",
  declined: "Call declined",
  missed: "No answer",
};

export function CallRoom({
  callId,
  role,
  initialStatus,
  other,
  iceServers,
}: {
  callId: string;
  role: "caller" | "callee";
  initialStatus: Status;
  other: Other;
  iceServers: RTCIceServer[];
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (initialStatus !== "ringing" && initialStatus !== "active") return;
    let stopped = false;
    let lastSignal = 0;
    let timer: number | undefined;
    const pc = new RTCPeerConnection({ iceServers });
    const pendingIce: RTCIceCandidateInit[] = [];

    const send = (kind: Signal["kind"], payload: unknown) =>
      fetch(`/api/calls/${callId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, payload }),
      });

    pc.onicecandidate = (e) => {
      if (e.candidate) void send("ice", e.candidate.toJSON());
    };
    pc.ontrack = (e) => {
      if (remoteRef.current && remoteRef.current.srcObject !== e.streams[0]) {
        remoteRef.current.srcObject = e.streams[0];
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setConnected(true);
    };

    const handle = async (s: Signal) => {
      if (s.kind === "offer" && role === "callee") {
        await pc.setRemoteDescription(s.payload as RTCSessionDescriptionInit);
        for (const c of pendingIce.splice(0)) await pc.addIceCandidate(c);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await send("answer", answer);
      } else if (s.kind === "answer" && role === "caller" && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(s.payload as RTCSessionDescriptionInit);
        for (const c of pendingIce.splice(0)) await pc.addIceCandidate(c);
      } else if (s.kind === "ice") {
        const c = s.payload as RTCIceCandidateInit;
        if (pc.remoteDescription) await pc.addIceCandidate(c).catch(() => {});
        else pendingIce.push(c);
      }
    };

    const poll = async () => {
      if (stopped) return;
      try {
        const res = await fetch(`/api/calls/${callId}?after=${lastSignal}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { status: Status; signals: Signal[] };
          setStatus(data.status);
          for (const s of data.signals) {
            lastSignal = Math.max(lastSignal, s.id);
            await handle(s);
          }
          if (data.status !== "ringing" && data.status !== "active") stopped = true;
        }
      } catch {
        // Network blip: try again on the next tick.
      }
      if (!stopped) timer = window.setTimeout(poll, POLL_MS);
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        if (role === "caller") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await send("offer", offer);
        }
        void poll();
      } catch {
        setError("We couldn't reach your camera or microphone. Allow access in your browser and try again.");
        void endCallAction(callId);
      }
    })();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      pc.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [callId, role, iceServers, initialStatus]);

  // Call length, counted from when the video actually connects.
  useEffect(() => {
    if (!connected || status !== "active") return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [connected, status]);

  const live = status === "ringing" || status === "active";
  const hangUp = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus("ended");
    void endCallAction(callId);
  };
  const toggle = (kind: "audio" | "video") => {
    const tracks = kind === "audio" ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks();
    tracks?.forEach((t) => (t.enabled = !t.enabled));
    if (kind === "audio") setMuted((m) => !m);
    else setCameraOff((c) => !c);
  };
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-night">
      {/* Remote video fills the screen; the caller's card shows until they connect. */}
      <video ref={remoteRef} autoPlay playsInline className={`absolute inset-0 h-full w-full object-cover ${connected && live ? "" : "opacity-0"}`} data-testid="remote-video" />
      {!(connected && live) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="relative">
            {status === "ringing" && <span className="absolute -inset-3 animate-ping rounded-full border-2 border-accent/60" />}
            <Avatar profile={other} size="xl" className="!h-36 !w-36 ring-4 ring-accent/60" />
          </div>
          <div>
            <p className="font-display text-3xl font-bold">{other.name}</p>
            <p className="text-ink-dim">{other.flag} {other.city}</p>
          </div>
          <p className="text-gold" data-testid="call-status">
            {error ||
              (status === "ringing" ? (role === "caller" ? "Calling…" : "Connecting…") : status === "active" ? "Connecting video…" : ENDED_TEXT[status])}
          </p>
          {!live && (
            <div className="flex gap-3">
              <Link href={`/matches/${other.id}`} className="btn btn-primary">Back to chat</Link>
              <Link href="/swipe" className="btn btn-ghost">Keep swiping</Link>
            </div>
          )}
        </div>
      )}

      {connected && live && (
        <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm backdrop-blur">
          <span className="live-dot mr-2" aria-hidden="true" />
          {other.name} {other.flag} · <span className="font-mono tabular-nums">{clock}</span>
        </div>
      )}

      {/* Self view */}
      <video
        ref={localRef}
        autoPlay
        playsInline
        muted
        className={`absolute bottom-28 right-4 aspect-[3/4] w-28 rounded-2xl border border-white/20 object-cover shadow-2xl sm:w-40 ${cameraOff || !live ? "opacity-0" : ""}`}
        style={{ transform: "scaleX(-1)" }}
        data-testid="local-video"
      />

      {live && (
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4">
          <CallButton label={muted ? "Unmute" : "Mute"} onClick={() => toggle("audio")} active={muted}>{muted ? "🔇" : "🎙️"}</CallButton>
          <button
            type="button"
            onClick={hangUp}
            aria-label="Hang up"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-2xl text-white shadow-[0_10px_30px_-10px_rgb(225_29_72)] hover:bg-rose-500"
          >
            ✕
          </button>
          <CallButton label={cameraOff ? "Camera on" : "Camera off"} onClick={() => toggle("video")} active={cameraOff}>{cameraOff ? "🚫" : "📹"}</CallButton>
        </div>
      )}
    </div>
  );
}

function CallButton({ label, onClick, active, children }: { label: string; onClick: () => void; active: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-13 w-13 items-center justify-center rounded-full border text-xl backdrop-blur transition ${active ? "border-white bg-white text-night" : "border-white/20 bg-white/10"}`}
      style={{ height: 52, width: 52 }}
    >
      {children}
    </button>
  );
}
