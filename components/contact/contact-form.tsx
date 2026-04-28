"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";
import { getErrorMessage, parseApiError } from "lib/client-error";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: "name" | "email" | "message", value: string) => {
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
        toast.error(parseApiError(response, data));
        return;
      }

      toast.success(data.message || "Thanks for reaching out. We'll reply soon.");
      setFormValues({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`

        :root {
          --espresso:   #0A0704;
          --cream:      #F2E8D5;
          --sand:       #C9B99A;
          --muted:      #6A5A48;
          --terra:      #BF5A28;
          --gold:       #C0892A;
          --border:     rgba(242,232,213,0.09);
          --border-mid: rgba(242,232,213,0.18);
        }

        .cf-root {
          border: 1px solid var(--border);
          background: rgba(16,12,6,0.96);
          font-family: var(--font-dm-sans), sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* decorative circles */
        .cf-root::before {
          content: '';
          position: absolute;
          right: -50px; top: -50px;
          width: 220px; height: 220px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .cf-root::after {
          content: '';
          position: absolute;
          right: 36px; top: 36px;
          width: 100px; height: 100px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }

        /* ── HEADER ── */
        .cf-header {
          padding: 36px 40px 28px;
          border-bottom: 1px solid var(--border);
          position: relative;
          z-index: 1;
        }
        .cf-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--terra);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .cf-eyebrow::before {
          content: '';
          display: block;
          width: 24px; height: 1px;
          background: var(--terra);
        }
        .cf-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: clamp(26px, 3.5vw, 38px);
          font-weight: 300;
          line-height: 1.05;
          color: var(--cream);
          margin-bottom: 8px;
        }
        .cf-sub {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
        }

        /* ── FIELDS ── */
        .cf-fields {
          padding: 28px 40px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          position: relative;
          z-index: 1;
        }

        .cf-field {
          background: rgba(242,232,213,0.02);
          border: 1px solid var(--border);
          padding: 14px 18px 16px;
          transition: border-color 0.2s;
        }
        .cf-field:focus-within {
          border-color: rgba(191,90,40,0.45);
          background: rgba(191,90,40,0.03);
        }

        .cf-label {
          display: block;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 8px;
        }
        .cf-label-muted { color: var(--muted); }

        .cf-input,
        .cf-textarea {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 14px;
          line-height: 1.6;
          padding: 0;
          resize: none;
          box-sizing: border-box;
        }
        .cf-input::placeholder,
        .cf-textarea::placeholder { color: rgba(106,90,72,0.6); }

        /* ── FOOTER ── */
        .cf-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 20px 40px;
          border-top: 1px solid var(--border);
          background: rgba(242,232,213,0.015);
          position: relative;
          z-index: 1;
        }
        .cf-response-note {
          font-size: 11px;
          letter-spacing: 0.08em;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cf-response-note::before {
          content: '';
          display: block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--terra);
          flex-shrink: 0;
        }
        .cf-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 140px;
          background: var(--terra);
          border: none;
          color: var(--cream);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 13px 28px;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .cf-submit:hover:not(:disabled) { background: #a34d22; }
        .cf-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        @media (max-width: 560px) {
          .cf-header { padding: 28px 24px 22px; }
          .cf-fields { padding: 20px 24px; }
          .cf-footer { padding: 16px 24px; flex-direction: column; align-items: stretch; }
          .cf-submit { justify-content: center; }
        }
      `}</style>

      <form onSubmit={handleSubmit} className="cf-root">
        {/* Header */}
        <div className="cf-header">
          <div className="cf-eyebrow">Send a message</div>
          <h2 className="cf-title">Tell us what<br />you need</h2>
          <p className="cf-sub">
            Custom orders, sizing questions, delivery timelines. We can help.
          </p>
        </div>

        {/* Fields */}
        <fieldset disabled={isSubmitting} className="cf-fields" style={{ border: "none", padding: "28px 40px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {/* Name */}
          <div className="cf-field">
            <label className="cf-label cf-label-muted">
              Name <span style={{ opacity: 0.5 }}>(optional)</span>
            </label>
            <input
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={formValues.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="cf-input"
            />
          </div>

          {/* Email */}
          <div className="cf-field">
            <label className="cf-label">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={formValues.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="cf-input"
            />
          </div>

          {/* Message */}
          <div className="cf-field">
            <label className="cf-label">Message</label>
            <textarea
              required
              rows={6}
              placeholder="Share details about your request, sizes, references, or deadline."
              value={formValues.message}
              onChange={(e) => handleChange("message", e.target.value)}
              className="cf-textarea"
            />
          </div>
        </fieldset>

        {/* Footer */}
        <div className="cf-footer">
          <p className="cf-response-note">Response within 1 business day</p>
          <button type="submit" disabled={isSubmitting} className="cf-submit">
            {isSubmitting
              ? <LoadingDots className="bg-[#F2E8D5]" />
              : "Send message →"}
          </button>
        </div>
      </form>
    </>
  );
}