const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(64);
    const existingEmail = await User.findOne({ email: req.body.email });

    if (existingEmail !== null) {
      return res.status(400).json({ message: "Email already existing" });
    } else if (
      req.body.username === "" ||
      req.body.email === "" ||
      req.body.password === ""
    ) {
      return res.status(400).json({ message: "Enter valid infos please" });
    } else {
      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
          avatar: Object,
        },
        newsletter: req.body.newsletter,
        token: token,
        hash: hash,
        salt: salt,
      });
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        token: newUser.token,
        account: newUser.account,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (!existingUser) {
      return res.status(400).json({ message: "User not existing" });
    } else {
      const hashToCompare = SHA256(
        req.body.password + existingUser.salt
      ).toString(encBase64);
      if (existingUser.hash === hashToCompare) {
        res.status(200).json({
          _id: existingUser._id,
          token: existingUser.token,
          account: existingUser.account,
        });
      } else return res.status(400).json({ message: "Wrong password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
