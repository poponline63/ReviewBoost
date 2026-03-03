import { Resend } from "resend";

const APP_NAME = "ReviewBoost";
const FROM_EMAIL = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendReviewRequestEmail(opts: {
  toEmail: string;
  customerName: string;
  businessName: string;
  reviewLink: string;
  subject: string;
  body: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#7c3aed);padding:10px 20px;border-radius:8px;">
              <span style="color:#fff;font-size:18px;font-weight:700;">⭐ ${APP_NAME}</span>
            </div>
          </div>
          <div style="white-space:pre-wrap;color:#374151;line-height:1.6;font-size:15px;">${opts.body
            .replace('{name}', opts.customerName)
            .replace('{business}', opts.businessName)
            .replace('{link}', '')}</div>
          <div style="text-align:center;margin:28px 0;">
            <a href="${opts.reviewLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;font-weight:700;text-decoration:none;border-radius:8px;font-size:16px;">
              ⭐ Leave a Review
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
            If the button doesn't work: <a href="${opts.reviewLink}" style="color:#6b7280;">${opts.reviewLink}</a>
          </p>
        </div>
      </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.toEmail,
    subject: opts.subject
      .replace('{name}', opts.customerName)
      .replace('{business}', opts.businessName),
    html,
  });
}
