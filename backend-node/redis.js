const Redis = require("ioredis");

const redis = new Redis("redis://127.0.0.1:6379");

redis.on("connect", () => {
  console.log("Node.js connected to Redis");
});

module.exports = redis;
