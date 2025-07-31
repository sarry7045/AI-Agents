import nodemailer from "nodemailer";

export const sendMail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: process.env.MAILTRAP_SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: '"Inngest TMS',
      // Doubt
      to,
      subject,
      text,
    });
    console.log("Node Mailer Info", info.messageId);
    return info;
  } catch (error) {
    console.log("Error While Nodemailer", error.message);
  }
};
