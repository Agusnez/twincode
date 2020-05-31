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

module.exports = router;
