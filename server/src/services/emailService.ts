import nodemailer from "nodemailer";

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendReminderEmail(opts: {
  ventureName: string;
  founderName: string;
  founderEmail: string;
  followUpDate: Date;
  status: string;
}) {
  const transporter = getTransporter();
  const subject = `Founder Follow-up Reminder — ${opts.ventureName}`;
  const text = `Hi team,

Reminder: Follow-up for venture "${opts.ventureName}" (founder: ${opts.founderName} <${opts.founderEmail}>) is due on ${opts.followUpDate.toISOString().slice(0,10)}.

Current status: ${opts.status}

Please reach out to the founder soon.

— Founder Follow-Up System`;

  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.6">
  <h2 style="margin:0 0 8px">Founder Follow-up Reminder — ${opts.ventureName}</h2>
  <p><b>Venture:</b> ${opts.ventureName}<br/>
  <b>Founder:</b> ${opts.founderName} &lt;${opts.founderEmail}&gt;<br/>
  <b>Follow-up date:</b> ${opts.followUpDate.toISOString().slice(0,10)}<br/>
  <b>Status:</b> ${opts.status}</p>
  <p>Please reach out to the founder soon.</p>
  <p style="color:#888;font-size:12px">— Founder Follow-Up System</p></div>`;

  if (!transporter) {
    console.log(`[DEV EMAIL] ${subject}\n${text}\n--- (SMTP not configured, logged only)`);
    return { sent: false, devLogged: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: opts.founderEmail,
      subject,
      text,
      html,
    });
    console.log(`[EMAIL SENT] ${subject} -> ${opts.founderEmail}`);
    return { sent: true, devLogged: false };
  } catch (e) {
    console.error("[EMAIL FAILED]", e);
    return { sent: false, devLogged: false, error: String(e) };
  }
}
