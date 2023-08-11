

import nodemailer from 'nodemailer';
import { SYSTEM_EMAIL_CONFIG, FROM, TO } from './config';

export function sendEmail(subject: string, html: string, reccivers: string[] = []) {
  const transporter = nodemailer.createTransport(SYSTEM_EMAIL_CONFIG);
  const to = [TO].concat(reccivers).join(',');
  console.info('mail to', to);

  return transporter.sendMail({
    from: FROM, // 发送方邮箱的账号
    to, // 邮箱接受者的账号
    subject,
    html, // html 内容, 如果设置了 html 内容, 将忽略text内容
    attachments: [],
  })
}

