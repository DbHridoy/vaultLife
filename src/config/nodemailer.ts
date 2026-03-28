import nodemailer from "nodemailer";
import { env } from "./env";

export const getTransporter = () => {
  const user = env.GMAIL_USER?.trim();
  const pass = env.GMAIL_PASS?.replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER and GMAIL_PASS must be set before sending email."
    );
  }

  if (pass.length !== 16) {
    throw new Error(
      "GMAIL_PASS must be a 16-character Google App Password. Remove any spaces and do not use your normal Gmail password."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
};
