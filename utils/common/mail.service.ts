import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

import ejs from "ejs";
import { _config } from "../../config/config";

class MailService {
  async commonMailSend(
    templateName: string,
    toEmail: string,
    subjects: string,
    data: any
  ) {
    try {
        console.log(_config?.SmtpUserName, _config?.SmtpPassword,'password');

      const transporter = nodemailer.createTransport(
        new SMTPTransport({
          host: _config?.SmtpHost,
          port: _config?.SmtpPort ? Number(_config.SmtpPort) : undefined,
          secure: true,
          auth: {
            user: _config?.SmtpUserName,
            pass: _config?.SmtpPassword,
          },
          tls: {
            rejectUnauthorized: false,
          },
        })
      );
      const htmlContent = await ejs.renderFile(
        "./views/" + templateName + ".ejs",
        data
      );
      const mailOptions: any = {
        from: _config?.SmtpDisplayName,
        to: toEmail,
        subject: subjects,
        html: htmlContent,
      };
      const info = await transporter.sendMail(mailOptions);
      console.log({ info });
      return true;
    } catch (error) {
      console.error("Error sending email: ", error);
      return false;
    }
  }
}

const mailService = new MailService();
export default mailService;
