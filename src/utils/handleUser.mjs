import logger from "./logger.mjs";
import dbCRUD from "../common/db/dbCRUD.mjs";

export const getUser = async(business,phone) => {
    try{
        const dbcrud = new dbCRUD();    
        return await dbcrud.findInDB(`${business}_users`,{ phone_number: phone });
    }
    catch(error){
        logger.error(error)
    }
}
// Function to create user entry
const createUser = async () => {

};

const updateUser = async () => {

};