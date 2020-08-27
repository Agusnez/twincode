const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SessionSchema = new Schema({
  environment: { type: String },
  name: { type: String, required: true },
  active: { type: Boolean },
  tokens: { type: Array },
  tokenPairing: { type: Boolean },
  testCounter: { type: Number },
  exerciseCounter: { type: Number },
  running: { type: Boolean },
});

module.exports = mongoose.model("Session", SessionSchema);
