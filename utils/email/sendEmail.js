import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "fraz9838@gmail.com",
    pass: "wedp jtgu solt rrtf",
  },
});

let sendEmail;

try {
  sendEmail = async (options) => {
    const emailOptions = {
      from: "fraz9838@gmail.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    let res = await transporter.sendMail(emailOptions);
  };
} catch (error) {
  console.log(error);
}

export default sendEmail;
