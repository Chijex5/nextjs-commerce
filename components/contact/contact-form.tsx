"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    field: "name" | "email" | "message",
    value: string,
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = formValues.email.trim();
    const trimmedMessage = formValues.message.trim();

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!trimmedMessage) {
      toast.error("Please add a short message so we can help.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formValues.name.trim() || undefined,
          email: trimmedEmail,
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Unable to send your message right now.");
        return;
      }

      toast.success(
        data.message || "Thanks for reaching out. We'll reply soon.",
      );
      setFormValues({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-xl shadow-neutral-200/60 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-neutral-950/60"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Send a message
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
          Tell us what you need
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Custom orders, sizing questions, delivery timelines. We can help.
        </p>
      </div>

      <fieldset disabled={isSubmitting} className="grid gap-4">
        <label className="grid gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Name (optional)
          </span>
          <input
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={formValues.name}
            onChange={(event) => handleChange("name", event.target.value)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>

        <label className="grid gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={formValues.email}
            onChange={(event) => handleChange("email", event.target.value)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>

        <label className="grid gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Message
          </span>
          <textarea
            required
            rows={6}
            placeholder="Share details about your request, sizes, references, or deadline."
            value={formValues.message}
            onChange={(event) => handleChange("message", event.target.value)}
            className="resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>
      </fieldset>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Response time: within 1 business day.
        </p>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {isSubmitting ? (
            <LoadingDots className="bg-white dark:bg-black" />
          ) : (
            "Send message"
          )}
        </button>
      </div>
    </form>
  );
}
