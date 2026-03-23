export async function processEmailJob(data: {
  to: string;
  subject: string;
  body: string;
}) {
  // Replace with provider integration (Resend/SES/Postmark/etc.)
  console.log("Email job", {
    to: data.to,
    subject: data.subject,
    bodyPreview: data.body.slice(0, 80),
  });
}
