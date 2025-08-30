import { Screens } from "../library/flow.mjs";
import logger from "../utils/logger.mjs";
import dbCRUD from "../common/db/dbCRUD.mjs";
import { locations } from "../library/dropdowns.mjs";

class BookingService {
  // constructor() {}

  async processRequest(decryptedBody) {
    const { screen, data, action, flow_token, version } = decryptedBody;
    switch (action) {
      // case "INIT":
      //   return {
      //     data: {
      //       phone_number:"919839747533",
      //       location: locations,            
      //     },
      //     ...Screens.user_details,
      //   };
      case "ping":
        return this.getHealthCheckResponse(version);
      case "data_exchange":
        return this.handleDataExchange(screen, data, version);
      default:
        logger.error("Invalid action received: " + action);
        return this.getErrorResponse(
          "Invalid Action",
          "The action is not supported.",
          data
        );
    }
  }

  getErrorResponse(errorHead, errorText, data) {
    return {
      data: { error_head: errorHead, error_text: errorText, ...data },
      ...Screens.Error,
    };
  }

  getHealthCheckResponse(version) {
    return {
      version,
      data: { status: "active" },
    };
  }
}

export const getNextScreen = async (decryptedBody) => {
  const bookingService = new BookingService();
  return bookingService.processRequest(decryptedBody);
};
