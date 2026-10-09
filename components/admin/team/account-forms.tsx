"use client";

import { Panel } from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { Field } from "components/ui/field";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AccountForms({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPw, setSavingPw] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSavingName(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "Couldn't save your name");
    toast.success("Saved");
    router.refresh();
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.newPassword.length < 8)
      return toast.error("Use at least 8 characters");
    if (pw.newPassword !== pw.confirmPassword)
      return toast.error("The new passwords don't match");
    setSavingPw(true);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pw),
    });
    setSavingPw(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      return toast.error(data.error || "Couldn't change your password");
    toast.success("Password changed");
    setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  return (
    <div className="space-y-6">
      <Panel title="Profile">
        <form onSubmit={saveName} className="space-y-5">
          <Field
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <Field
            label="Email"
            value={email}
            disabled
            hint="Ask an owner to change your sign-in email."
          />
          <button
            type="submit"
            disabled={savingName || name.trim() === initialName || !name.trim()}
            className={buttonClass("solid", "md")}
          >
            {savingName ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
            Save
          </button>
        </form>
      </Panel>

      <Panel
        title="Password"
        description="You'll stay signed in on this device."
      >
        <form onSubmit={savePassword} className="space-y-5">
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) =>
              setPw((p) => ({ ...p, currentPassword: e.target.value }))
            }
            required
          />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            value={pw.newPassword}
            onChange={(e) =>
              setPw((p) => ({ ...p, newPassword: e.target.value }))
            }
            hint="At least 8 characters."
            required
          />
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={pw.confirmPassword}
            onChange={(e) =>
              setPw((p) => ({ ...p, confirmPassword: e.target.value }))
            }
            error={
              !!pw.confirmPassword && pw.confirmPassword !== pw.newPassword
            }
            hint={
              pw.confirmPassword && pw.confirmPassword !== pw.newPassword
                ? "Doesn't match yet."
                : undefined
            }
            required
          />
          <button
            type="submit"
            disabled={savingPw || !pw.currentPassword || !pw.newPassword}
            className={buttonClass("solid", "md")}
          >
            {savingPw ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
            Change password
          </button>
        </form>
      </Panel>
    </div>
  );
}
