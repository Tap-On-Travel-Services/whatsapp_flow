import { MongoClient } from "mongodb";

const connectionString = process.env.MONGO_URI;
const client = new MongoClient(connectionString);

const connectToDatabase = async () => {
  try {
    if (!client.isConnected) {
      await client.connect();
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error; // Rethrow the error for proper handling
  }
};

const getDatabase = () => {
  if (!client.isConnected) {
    connectToDatabase()
  }
  return client.db("waymiro");
};

export default { connectToDatabase, getDatabase };
