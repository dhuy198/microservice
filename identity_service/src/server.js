require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routers = require("./routes/identity_service");
const errorHandler = require("./middleware/error_handle");

const app = express();
const PORT = process.env.PORT || 3001;
//connect db
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("connect db success"))
  .catch((e) => logger.error("connect db failed", e));

//connect redis
const redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} on ${req.url}`);
  logger.info(`${req.body} `);
  next();
});

//DDos protect and rate limit
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch((e) => {
      logger.warn("rate limit", req.id);
      res.status(429).json({
        message: "rate limit exceed - DDos",
      });
    });
});

//ip based rate limiting for sentitive endpoint
const sentitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("rate limit exceed", req.ip),
      res.status(429).json({
        message: "rate limit exceed - spam",
      });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

//apply for sentitive endpoint
app.use("/api/auth/register", sentitiveEndpointsLimiter);
//routers
app.use("/api/auth", routers);

//error
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`identity service run on port ${PORT}`);
});

//global error
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled rejection at: ${promise}`, { reason });
});
