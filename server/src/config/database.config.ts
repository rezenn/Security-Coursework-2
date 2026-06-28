import mongoose from "mongoose";
import config from "./env.config";
import logger from "../utils/logger.utils";

const connectDB = async (): Promise<void> => {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection error", { err });
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () =>
  logger.warn("MongoDB disconnected"),
);
mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

export default connectDB;
