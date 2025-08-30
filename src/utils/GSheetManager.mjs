/**
 * Google Sheets Integration Module
 * Provides functionality to interact with Google Sheets API
 */

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { readFile } from "fs/promises";
import { google } from "googleapis";
import logger from "./logger.mjs";
import path from 'path';
import { fileURLToPath } from "url";

/**
 * Resolve the path to the service account key file
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../../service-account-key.json");

/**
 * Singleton class to manage Google Sheets authentication.
 */
class SheetAuthManager {
  static instance = null;
  credentials = null;
  serviceAuth = null;

  /**
   * Returns the singleton instance of SheetAuthManager.
   * Initializes the instance if not already created.
   * @returns {Promise<SheetAuthManager>} The authentication manager instance.
   */
  static async getInstance() {
    if (!SheetAuthManager.instance) {
      SheetAuthManager.instance = new SheetAuthManager();
      await SheetAuthManager.instance.initialize();
    }
    return SheetAuthManager.instance;
  }

  /**
   * Loads authentication credentials from the service account key file.
   * Initializes the JWT authentication client.
   */
  async initialize() {
    try {
      this.credentials = JSON.parse(await readFile(SERVICE_ACCOUNT_PATH, "utf-8"));
      this.serviceAuth = new JWT({
        email: this.credentials.client_email,
        key: this.credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      logger.info("Google Sheets Authentication initialized.");
    } catch (error) {
      logger.error("Failed to load Google Sheets credentials:", error);
      throw new Error("Google Sheets Authentication failed. Check service account key.");
    }
  }

  /**
   * Returns the authenticated JWT client.
   * @returns {JWT} Authenticated client.
   */
  getAuth() {
    return this.serviceAuth;
  }
}

/**
 * Class to manage Google Sheet operations.
 */
class SheetManager {
  constructor(googleSheetID, sheetName) {
    this.googleSheetID = googleSheetID;
    this.sheetName = sheetName;
    this.doc = null;
    this.sheet = null;
    this.headers = null;
  }

  /**
   * Initializes the connection to the Google Sheet.
   */
  async initialize() {
    try {
      const authManager = await SheetAuthManager.getInstance();
      this.doc = new GoogleSpreadsheet(this.googleSheetID, authManager.getAuth());
      await this.doc.loadInfo();
      this.sheet = this.doc.sheetsByTitle[this.sheetName] || this.doc.sheetsByIndex[0];
    } catch (error) {
      logger.error(`Error initializing Google Sheet (${this.sheetName}):`, error);
      throw new Error("Google Sheets Initialization failed.");
    }
  }

  /**
   * Ensures the sheet has the required headers.
   * @param {string[]} dataHeaders - Array of expected column headers.
   */
  async ensureHeaders(dataHeaders) {
    try {
      const rows = await this.sheet.getRows({ limit: 1 });
      this.headers = rows[0]?._worksheet._headerValues;

      if (!this.headers || this.headers.length !== dataHeaders.length) {
        await this.sheet.setHeaderRow(dataHeaders);
        this.headers = dataHeaders;
      }
    } catch (error) {
      // If no header row exists, create one
      await this.sheet.setHeaderRow(dataHeaders);
      this.headers = dataHeaders;
    }
  }

  /**
   * Inserts a new row of data into the sheet.
   * @param {Object} rowData - The data object to be inserted.
   */
  async insertRow(rowData) {
    try {
      await this.sheet.addRows([rowData]);
    } catch (error) {
      logger.error("Error inserting row:", error);
      throw new Error("Failed to insert data into Google Sheets.");
    }
  }
}

/**
 * Appends a row of data to a Google Sheet tab.
 * @param {string} googleSheetID - Google Sheet ID.
 * @param {string} sheetName - Sheet name (tab).
 * @param {string[]} dataHeaders - Column headers.
 * @param {Object} rowData - Data object to insert.
 */
export async function appendToSheet(googleSheetID, sheetName, dataHeaders, rowData) {
  try {
    const sheetManager = new SheetManager(googleSheetID, sheetName);
    await sheetManager.initialize();
    await sheetManager.ensureHeaders(dataHeaders);
    await sheetManager.insertRow(rowData);
    logger.info(`Data successfully appended to ${sheetName}.`);
  } catch (error) {
    logger.error("Error appending to sheet:", error);
    throw error;
  }
}
