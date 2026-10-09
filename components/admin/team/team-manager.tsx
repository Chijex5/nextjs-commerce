"use client";

import { StatusPill } from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { Sheet } from "components/ui/sheet";
import { timeAgo } from "lib/admin/format";
import { Loader2, Pencil, Plus, Shuffle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export type TeamMember = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  confirmed30d: number;
  isYou: boolean;
};

const ROLES = [
  {
    value: "admin",
    label: "Staff",
    hint: "Orders, products, customers, marketing.",
  },
  {
    value: "super_admin",
    label: "Owner",
    hint: "Everything staff can do, plus managing the team.",
  },
];
const roleLabel = (r: string) =>
  ROLES.find((x) => x.value === r)?.label ?? r.replace(/_/g, " ");

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";

function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function TeamManager({
  members,
  canManage,
}: {
  members: TeamMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sheet, setSheet] = useState<TeamMember | "new" | null>(null);
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "admin",
    active: true,
  });
  const [busy, setBusy] = useState(false);

  const open = (m: TeamMember | "new") => {
    setSheet(m);
    setForm(
      m === "new"
        ? {
            email: "",
            name: "",
            password: tempPassword(),
            role: "admin",
            active: true,
          }
        : {
            email: m.email,
            name: m.name ?? "",
            password: "",
            role: m.role,
            active: m.active,
          },
    );
  };

  async function save() {
    const isNew = sheet === "new";
    if (isNew && (!form.email.trim() || form.password.length < 8))
      return toast.error(
        "Add an email and a password of at least 8 characters",
      );
    setBusy(true);
    const res = await fetch(
      isNew
        ? "/api/admin/admins"
        : `/api/admin/admins/${(sheet as TeamMember).id}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNew
            ? {
                email: form.email.trim(),
                name: form.name.trim(),
                password: form.password,
                role: form.role,
              }
            : {
                name: form.name.trim(),
                role: form.role,
                isActive: form.active,
              },
        ),
      },
    );
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "Couldn't save");
    if (isNew) {
      await navigator.clipboard
        .writeText(
          `Admin sign-in: ${window.location.origin}/admin/login\nEmail: ${form.email.trim()}\nTemporary password: ${form.password}`,
        )
        .catch(() => {});
      toast.success(
        "Added. Sign-in details copied, so send them over WhatsApp or email.",
      );
    } else toast.success("Saved");
    setSheet(null);
    startTransition(() => router.refresh());
  }

  async function remove(m: TeamMember) {
    if (
      !window.confirm(
        `Remove ${m.name || m.email} from the team? They won't be able to sign in. Deactivating keeps their history instead.`,
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/admin/admins/${m.id}`, { method: "DELETE" });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "Couldn't remove");
    toast.success("Removed");
    setSheet(null);
    startTransition(() => router.refresh());
  }

  return (
    <>
      {canManage ? (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => open("new")}
            className={buttonClass("solid", "md")}
          >
            <Plus className="size-4" /> Add team member
          </button>
        </div>
      ) : null}

      <ul className="divide-y divide-line border border-line">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center gap-4 px-4 py-4 sm:flex-nowrap"
          >
            <span className="grid size-10 shrink-0 place-items-center bg-fg font-mono text-xs uppercase text-canvas">
              {(m.name || m.email)
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">
                <Link
                  href={`/admin/admins/${m.id}`}
                  className="hover:underline"
                >
                  {m.name || m.email.split("@")[0]}
                </Link>
                {m.isYou ? (
                  <span className="ml-2 text-xs font-normal text-fg-3">
                    (you)
                  </span>
                ) : null}
              </p>
              <p className="truncate text-xs text-fg-3">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill tone={m.role === "super_admin" ? "info" : "neutral"}>
                {roleLabel(m.role)}
              </StatusPill>
              {!m.active ? (
                <StatusPill tone="critical">Deactivated</StatusPill>
              ) : null}
            </div>
            <div className="w-52 text-right text-xs text-fg-3">
              <p>
                {m.lastLoginAt
                  ? `Signed in ${timeAgo(new Date(m.lastLoginAt))}`
                  : "Never signed in"}
              </p>
              <p>
                {m.confirmed30d
                  ? `${m.confirmed30d} orders confirmed · 30d`
                  : "No orders confirmed · 30d"}
              </p>
            </div>
            {canManage ? (
              <button
                type="button"
                onClick={() => open(m)}
                aria-label={`Edit ${m.name || m.email}`}
                className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg"
              >
                <Pencil className="size-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <Sheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet === "new" ? "Add team member" : "Edit team member"}
        footer={
          <div className="flex gap-2">
            {sheet && sheet !== "new" && !sheet.isYou ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(sheet)}
                className={buttonClass(
                  "outline",
                  "md",
                  "hover:!border-red-600 hover:!bg-red-600 hover:!text-white",
                )}
              >
                Remove
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className={buttonClass("solid", "md", "flex-1")}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {sheet === "new" ? "Add and copy sign-in details" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {sheet === "new" ? (
            <label className="block">
              <span className="label mb-1.5 block text-fg-3">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className={input}
              />
            </label>
          ) : (
            <p className="text-sm text-fg-2">{form.email}</p>
          )}
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={input}
            />
          </label>
          {sheet === "new" ? (
            <label className="block">
              <span className="label mb-1.5 block text-fg-3">
                Temporary password
              </span>
              <div className="flex gap-2">
                <input
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={`${input} font-mono`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, password: tempPassword() }))
                  }
                  aria-label="Generate password"
                  className={buttonClass("outline", "md", "h-11 shrink-0")}
                >
                  <Shuffle className="size-4" />
                </button>
              </div>
              <span className="mt-1 block text-xs text-fg-3">
                Ask them to change it from Account after their first sign-in.
              </span>
            </label>
          ) : null}
          <fieldset>
            <legend className="label mb-2 text-fg-3">Role</legend>
            <div className="space-y-px">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-start gap-3 border p-3 ${form.role === r.value ? "border-fg" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={form.role === r.value}
                    onChange={() => setForm((f) => ({ ...f, role: r.value }))}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{r.label}</span>
                    <span className="block text-xs text-fg-3">{r.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {sheet && sheet !== "new" && !sheet.isYou ? (
            <label className="flex cursor-pointer items-start gap-3 border-t border-line pt-4">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
                className="mt-0.5 size-4"
              />
              <span>
                <span className="block text-sm">Can sign in</span>
                <span className="block text-xs text-fg-3">
                  Untick to lock them out without deleting their history.
                </span>
              </span>
            </label>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
