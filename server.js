// src/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

app.post("/api/referrals", async (req, res) => {
  const { yourName, yourEmail, friendName, friendEmail, message } = req.body;

  if (!yourName || !yourEmail || !friendName || !friendEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newReferral = await prisma.referral.create({
      data: {
        yourName,
        yourEmail,
        friendName,
        friendEmail,
        message,
      },
    });

    // Send referral email
    const user = process.env.USER;
    const pass = process.env.PASS;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass,
      },
    });

    const mailOptions = {
      from: "your-email@gmail.com",
      to: friendEmail,
      subject: "Referral from your friend",
      text: `Hi ${friendName},\n\nYour friend ${yourName} has referred you to a course.\n\nMessage: ${message}\n\nBest regards,\nRefer & Earn Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to send email" });
      }
      console.log("Email sent: " + info.response);
    });

    res.status(201).json(newReferral);
  } catch (error) {
    console.error("Error creating referral:", error);
    res.status(500).json({ error: "Failed to create referral" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
