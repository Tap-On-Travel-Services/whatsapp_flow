import conn from "./conn.mjs";

class dbCRUD {
  db = null;

  constructor() {
    this.db = conn.getDatabase();
  }

  findInDB = async (_collection, data) => {
    try {
      const collection = this.db.collection(_collection);
      const result = await collection.findOne(data);
      
      // If no document is found, return undefined or a custom message
      if (!result) {
        return undefined; // Or return "Data not found" for a custom message
      }
      return result;
    } catch (error) {
      console.error(`Error while finding data in collection "${_collection}":`, error);
      throw new Error("An error occurred while querying the database.");
    }
  };

  insertDB = async (_collection, data) => {
    try {
      const collection = this.db.collection(_collection);
      const result = await collection.insertOne(data);
      return result;
    } catch (error) {
      console.error(`Error while inserting data into collection "${_collection}":`, error);
      throw new Error("An error occurred while inserting data.");
    }
  };

  updateDB = async (_collection, find, udata) => {
    try {
      const collection = this.db.collection(_collection);
      const result = await collection.updateOne(find, { $set: udata });
      return result;
    } catch (error) {
      console.error(`Error while updating data in collection "${_collection}":`, error);
      throw new Error("An error occurred while updating data.");
    }
  };
}

export default dbCRUD;
