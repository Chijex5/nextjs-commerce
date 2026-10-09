"use client";

import { useState } from "react";
import { toast } from "sonner";
import LoadingDots from "./loading-dots";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source: "newsletter" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Successfully subscribed!");
        setEmail("");
        setName("");
      } else {
        toast.error(data.error || "Failed to subscribe");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="First name (optional)"
        autoComplete="given-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-12 w-full border-b border-line bg-transparent text-base text-fg outline-none transition-colors placeholder:text-fg-3 focus:border-fg"
      />
      <div className="flex items-end gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 min-w-0 flex-1 border-b border-line bg-transparent text-base text-fg outline-none transition-colors placeholder:text-fg-3 focus:border-fg"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-12 shrink-0 bg-fg px-6 text-sm font-semibold uppercase tracking-wide text-canvas transition-[opacity,transform] hover:opacity-85 active:scale-[0.97] disabled:opacity-50"
        >
          {loading ? <LoadingDots className="bg-canvas" /> : "Join"}
        </button>
      </div>
    </form>
  );
}
