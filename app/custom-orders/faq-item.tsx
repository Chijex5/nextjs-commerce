"use client";

function FaqItem({ q, a }: { q: string; a: string }) {
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const body = e.currentTarget.nextElementSibling as HTMLElement;
    body.classList.toggle("open");
    const icon = e.currentTarget.querySelector(".faq-icon") as HTMLElement;
    if (icon) {
      icon.style.transform = body.classList.contains("open") ? "rotate(45deg)" : "rotate(0deg)";
    }
  };

  return (
    <div className="faq-item">
      <button className="faq-btn" onClick={toggle}>
        <span
          style={{
            fontSize: ".82rem",
            fontFamily: "DM Sans, sans-serif",
            color: "var(--dp-cream)",
            fontWeight: 500,
            paddingRight: "1rem",
          }}
        >
          {q}
        </span>
        <span
          className="faq-icon"
          style={{
            flexShrink: 0,
            color: "var(--dp-ember)",
            fontSize: "1.3rem",
            lineHeight: 1,
            transition: "transform .3s",
          }}
        >
          +
        </span>
      </button>
      <div className="faq-body">
        <p style={{ fontSize: ".78rem", color: "var(--dp-muted)", fontFamily: "DM Sans, sans-serif", lineHeight: 1.65 }}>{a}</p>
      </div>
    </div>
  );
}

export default FaqItem;
