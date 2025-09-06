import { Screens } from "../library/flow.mjs";
import logger from "../utils/logger.mjs";
import dbCRUD from "../common/db/dbCRUD.mjs";
import { callingTime, locations } from "../library/dropdowns.mjs";

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
        return this.handleDataExchange(screen, data, version, flow_token);
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

  getMinMaxDate() {
    const today = new Date();

    // Format function for YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split("T")[0];

    const min_date = formatDate(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const max_date = formatDate(tomorrow);

    return { min_date, max_date };
  }

  handleDataExchange(screen, data, version, flow_token) {
    switch (screen) {
      case "user_details":
        return this.getUserDetailResponse(data, flow_token);
      case "available_slots":
        return this.getAvailableSlotsResponse(data);
      case "user_details_communityTrip":
        return this.getUserDetailCommunityTripResponse(data, flow_token);
      default:
        logger.error("Screen does not exist: " + screen);
        return this.getErrorResponse(
          "Screen does not exist",
          "Please try again.",
          data
        );
    }
  }

  async getUserDetailResponse(data, flow_token) {
    const dbcrud = new dbCRUD();
    await dbcrud.updateDB(
      "leads",
      { token: flow_token },
      {
        status: "initiated_form",
        booking_data: { ...data },
      }
    );
    const { min_date, max_date } = await this.getMinMaxDate();
    return {
      data: {
        phone_number: data.ohone,
        time: callingTime,
        min_date: min_date,
        max_date: max_date,
      },
      ...Screens.available_slots,
    };
  }

  async getUserDetailCommunityTripResponse(data, flow_token) {
    const dbcrud = new dbCRUD();
    await dbcrud.updateDB(
      "leads",
      { token: flow_token },
      {
        status: "initiated_form",
        booking_data: { ...data },
      }
    );
    const { min_date, max_date } = await this.getMinMaxDate();
    return {
      data: {
        phone_number: data.ohone,
        time: callingTime,
        min_date: min_date,
        max_date: max_date,
      },
      ...Screens.available_slots,
    };
  }
}

export const getNextScreen = async (decryptedBody) => {
  const bookingService = new BookingService();
  return bookingService.processRequest(decryptedBody);
};
