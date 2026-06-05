import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import config from "./env.config";
import logger from "../utils/logger.utils";

const createMemoryServerUri = async (): Promise<string> => {
  const memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  logger.warn("Using in-memory MongoDB for development fallback:", { uri });
  return uri;
};

const createConnectionOptions = () => ({
  bufferCommands: false,
  ...(config.env === "production" && {
    tls: true,
    tlsAllowInvalidCertificates: false,
  }),
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
});

const connectDB = async (): Promise<void> => {
  let uri = config.mongodb.uri;

  if (!uri && config.env === "development") {
    uri = await createMemoryServerUri();
  }

  try {
    const connection = await mongoose.connect(uri, createConnectionOptions());

    logger.info(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    logger.error("MongoDB initial connection failed:", error);

    if (config.env === "development") {
      try {
        uri = await createMemoryServerUri();
        const connection = await mongoose.connect(
          uri,
          createConnectionOptions(),
        );
        logger.info(
          `MongoDB connected to in-memory fallback: ${connection.connection.host}`,
        );
        return;
      } catch (fallbackError) {
        logger.error("In-memory MongoDB fallback failed:", fallbackError);
      }
    }

    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected gracefully");
};

export default connectDB;
