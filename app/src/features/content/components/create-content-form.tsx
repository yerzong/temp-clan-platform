"use client";

import { useActionState, useRef, useEffect } from "react";
import { createContent, type ActionResult } from "../actions";
import type { Member } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const PLATFORMS = [
  { value: "twitch", label: "Twitch" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

export function CreateContentForm({ creators }: { creators: Member[] }) {
  const [state, formAction, pending] = useActionState(
    createContent,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content-title">Title</Label>
        <Input
          id="content-title"
          name="title"
          required
          placeholder="Clutch 1v3 on Gridlock"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content-platform">Platform</Label>
        <select
          id="content-platform"
          name="platform"
          defaultValue="twitch"
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content-creator">Creator (optional)</Label>
        <select
          id="content-creator"
          name="membershipId"
          defaultValue=""
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— Unassigned —</option>
          {creators.map((c) => (
            <option key={c.membershipId} value={c.membershipId}>
              {c.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content-url">Link (optional)</Label>
        <Input
          id="content-url"
          name="url"
          placeholder="https://…"
          autoComplete="off"
        />
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Adding..." : "Add content"}
      </Button>
    </form>
  );
}
