const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const Offer = require("../models/Offer");
const User = require("../models/User");

router.post(
  "/offer/publish",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      const picToUpload = convertToBase64(req.files.picture);
      const result = await cloudinary.uploader.upload(picToUpload);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // ici faire des conditions pour vérifier l'offre
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { brand },
          { size },
          { condition },
          { color },
          { city },
        ],
        product_image: result,
        owner: req.user,
      });
      await newOffer.save();
      res.status(201).json({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { brand: brand },
          { size: size },
          { condition: condition },
          { color: color },
          { city: city },
        ],
        product_image: { secure_url: result.secure_url },
        owner: { account: req.user.account, _id: req.user._id },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    let skip = 0;
    let limit = 2;
    let filters = {};
    let sortFilter = {};
    const regex = new RegExp(req.query.title, "i");
    if (req.query.title) {
      filters.product_name = regex;
    }
    if (req.query.sort) {
      req.query.sort = req.query.sort.replace("price-", "");
      sortFilter.product_price = req.query.sort;
    }
    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }
    if (req.query.priceMin) {
      filters.product_price = { $gte: parseInt(req.query.priceMin) };
    }
    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = parseInt(req.query.priceMax);
      } else {
        filters.product_price = { $lte: parseInt(req.query.priceMax) };
      }

      console.log(filters);
    }
    const offers = await Offer.find(filters)
      .sort(sortFilter)
      .limit(limit)
      .skip(skip)
      .populate({ path: "owner", select: "account" });
    res.status(200).json({ count: offers.length, offers: offers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.put(
  "/offer/modify/:id",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      //   const picToUpload = convertToBase64(req.files.picture);
      //   const result = await cloudinary.uploader.upload(picToUpload);
      const offerId = req.params.id;
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const offerToModify = await Offer.findById(offerId);
      if (!offerToModify) {
        res.status(400).json({ message: "wrong offer" });
      } else {
        if (title) offerToModify.product_name = title;
        if (description) offerToModify.product_description = description;
        if (price) offerToModify.product_price = price;
        if (condition) offerToModify.product_details[2] = condition;
        if (city) offerToModify.product_details[4] = city;
        if (brand) offerToModify.product_details[0] = brand;
        if (size) offerToModify.product_details[1] = size;
        if (color) offerToModify.product_details[3] = color;
        await offerToModify.save();
        res.status(200).json({
          product_name: title,
          product_description: description,
          product_price: price,
          product_details: [
            { brand: brand },
            { size: size },
            { condition: condition },
            { color: color },
            { city: city },
          ],
          //   product_image: { secure_url: result.secure_url },
          owner: { account: req.user.account, _id: req.user._id },
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    await Offer.findByIdAndDelete(params.body.id);
    res.status(200).json({ message: "offer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const result = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
