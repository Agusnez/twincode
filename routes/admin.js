require("dotenv").config();
var express = require("express");
const router = express.Router();
const Test = require("../models/Test.js");
const Logger = require("../logger.js");
const User = require("../models/User.js");
const Room = require("../models/Room.js");
const Session = require("../models/Session.js");

router.get("/sessions", async (req, res) => {
  const adminSecret = req.headers.authorization;

  const limit = parseInt(req.query.limit) || 20;
  const skip = parseInt(req.query.skip) || 0;

  if (adminSecret === process.env.ADMIN_SECRET && limit <= 20) {
    const sessions = await Session.aggregate([
      {
        $lookup: {
          from: "users",
          let: { session_env: "$environment", session_name: "$name" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$environment", "$$session_env"] },
                    { $eq: ["$subject", "$$session_name"] },
                  ],
                },
              },
            },
            { $project: { firstName: -1, _id: 0 } },
          ],
          as: "users",
        },
      },
      {
        $project: {
          _id: 0,
          tokens: 0,
          testCounter: 0,
          exerciseCounter: 0,
        },
      },
    ])
      .limit(limit)
      .skip(skip);

    res.send(sessions);
  } else if (limit > 20) {
    res.status(400).send("Limit parameter cannot exceed 20!");
  } else {
    res.sendStatus(401);
  }
});

router.post("/resetSession", async (req, res) => {
  const adminSecret = req.headers.authorization;

  if (adminSecret === process.env.ADMIN_SECRET) {
    await Session.collection.updateOne(
      {
        name: req.body.session,
        environment: process.env.NODE_ENV,
      },
      { $set: { testCounter: 0, exerciseCounter: -1, running: false } },
      { multi: false, safe: true }
    );
    const users = await User.collection.updateMany(
      { subject: req.body.session, environment: process.env.NODE_ENV },
      { $unset: { token: true, socketId: true, room: true } },
      { multi: true, safe: true }
    );
    res.send(users);
  } else {
    res.sendStatus(401);
  }
});

module.exports = router;
