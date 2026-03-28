import { env } from "../config/env";
import { getTransporter } from "../config/nodemailer";

export class Mailer {
  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private formatMultilineText(value: string) {
    return this.escapeHtml(value).replace(/\n/g, "<br />");
  }

  sendOtp = async (email: string, otp: number) => {
    await getTransporter().sendMail({
      from: `"Developer" <${env.GMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h3>Password Reset</h3>
        <p>Your OTP code is: <b>${otp}</b></p>
        <p>This code will expire in 5 minutes.</p>
      `,
    });
  };
  sendPassword=async(email:string,password:string)=>{
    await getTransporter().sendMail({
      from: `"Developer" <${env.GMAIL_USER}>`,
      to: email,
      subject: "Password for the dashboard login",
      html: `
        <h3>Password Reset</h3>
        <p>Your password is: <b>${password}</b></p>
        <p>Use this password to log into the dashboard</p>
      `,
    });
  }
  sendNotification = async (email: string, title: string, message: string) => {
    await getTransporter().sendMail({
      from: `"Developer" <${env.GMAIL_USER}>`,
      to: email,
      subject: title,
      html: `
        <h3>${title}</h3>
        <p>${message}</p>
      `,
    });
  };

  sendSupportResolution = async (
    email: string,
    reportTitle: string,
    resolutionNote: string,
    attachments: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
      path?: string;
    }> = []
  ) => {
    const attachmentList =
      attachments.length > 0
        ? `
        <p><b>Attachments:</b></p>
        <ul>
          ${attachments
            .map((attachment) => {
              const safeName = this.escapeHtml(attachment.filename);
              const safePath = attachment.path ? this.escapeHtml(attachment.path) : "";

              return safePath
                ? `<li><a href="${safePath}">${safeName}</a></li>`
                : `<li>${safeName}</li>`;
            })
            .join("")}
        </ul>
      `
        : "";

    await getTransporter().sendMail({
      from: `"Developer" <${env.GMAIL_USER}>`,
      to: email,
      subject: `Resolution for your report: ${reportTitle}`,
      html: `
        <h3>Support Report Resolved</h3>
        <p>Your support report titled <b>${this.escapeHtml(reportTitle)}</b> has been resolved and closed.</p>
        <p><b>Resolution note:</b></p>
        <p>${this.formatMultilineText(resolutionNote)}</p>
        ${attachmentList}
      `,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };
}
