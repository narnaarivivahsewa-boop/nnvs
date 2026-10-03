/* eslint-disable */
/**
 * =========================================================================================
 * RISHTECLUB MATRIMONY – GOOGLE FORM & RESPONSE SHEET INTEGRATION SCRIPT
 * =========================================================================================
 * 
 * Setup Instructions:
 * 1. Open your Google Response Spreadsheet in Google Sheets.
 * 2. Click on "Extensions" -> "Apps Script".
 * 3. Delete any existing code and paste this entire script.
 * 4. Go to "Project Settings" (gear icon) -> "Script Properties".
 * 5. Add the required Script Properties:
 *      INTEGRATION_URL  : https://rishteclub.com/api/integrations/google-form
 *      INTEGRATION_KEY  : <YOUR_SECRET_KEY> (Must match GOOGLE_FORM_INTEGRATION_KEY on server)
 *      SHEET_NAME       : Form Responses 1 (Optional: name of the responses tab)
 *      BATCH_SIZE       : 25 (Optional: defaults to 25)
 * 6. Save properties.
 * 7. Run `testConnection()` to verify connectivity.
 * 8. Run `runDryRunSync()` to simulate without writing database changes.
 * 9. Set up the trigger for `onFormSubmit` (Triggers -> Add Trigger -> onFormSubmit).
 * =========================================================================================
 */

function getScriptConfig() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty('INTEGRATION_URL') || 'https://rishteclub.com/api/integrations/google-form';
  const integrationKey = props.getProperty('INTEGRATION_KEY');
  const sheetName = props.getProperty('SHEET_NAME');
  const sheetId = props.getProperty('SHEET_ID');
  const batchSize = parseInt(props.getProperty('BATCH_SIZE') || '25', 10);

  if (!integrationKey || integrationKey.trim() === '') {
    const errorMsg = 'INTEGRATION_KEY is not set in Script Properties. Please configure it under Project Settings > Script Properties.';
    if (SpreadsheetApp.getActiveSpreadsheet()) {
      try {
        SpreadsheetApp.getUi().alert('Configuration Error', errorMsg, SpreadsheetApp.getUi().ButtonSet.OK);
      } catch (e) {}
    }
    throw new Error(errorMsg);
  }

  return {
    apiUrl: apiUrl.trim(),
    integrationKey: integrationKey.trim(),
    sheetName: sheetName ? sheetName.trim() : null,
    sheetId: sheetId ? sheetId.trim() : null,
    batchSize: batchSize > 0 ? batchSize : 25,
  };
}

/**
 * Gets the designated responses sheet safely without relying blindly on active tab
 */
function getTargetSheet(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No active spreadsheet found.');

  if (config.sheetName) {
    const sheet = ss.getSheetByName(config.sheetName);
    if (sheet) return sheet;
  }

  if (config.sheetId) {
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId().toString() === config.sheetId) {
        return sheets[i];
      }
    }
  }

  // Check common default names
  const defaultSheet = ss.getSheetByName('Form Responses 1') || 
                       ss.getSheetByName('Form responses 1') || 
                       ss.getSheets()[0];
  return defaultSheet;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('RishteClub Sync')
    .addItem('1. Test Connection', 'testConnection')
    .addItem('2. Run Dry Run (Simulate 10 Rows)', 'runDryRunSync')
    .addSeparator()
    .addItem('3. Run Full Existing Data Sync', 'runFullExistingSync')
    .addToUi();
}

/**
 * Diagnostic function to test connectivity and authentication
 */
function testConnection() {
  const config = getScriptConfig();
  Logger.log('Testing connection to: ' + config.apiUrl);

  const options = {
    method: 'GET',
    headers: {
      'x-integration-key': config.integrationKey,
      'Authorization': 'Bearer ' + config.integrationKey,
    },
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(config.apiUrl, options);
    const code = response.getResponseCode();
    const text = response.getContentText();
    Logger.log('Response Code: ' + code);
    Logger.log('Response Body: ' + text);

    if (code === 200) {
      SpreadsheetApp.getUi().alert('✅ Success: Connected and authenticated successfully!\n\n' + text);
    } else {
      SpreadsheetApp.getUi().alert('❌ Connection failed (HTTP ' + code + '):\n\n' + text);
    }
  } catch (e) {
    Logger.log('Connection error: ' + e.toString());
    SpreadsheetApp.getUi().alert('❌ Connection Error: ' + e.toString());
  }
}

/**
 * Runs dry-run simulation on first 10 rows
 */
function runDryRunSync() {
  syncExistingResponses(true, 10);
}

/**
 * Runs full synchronization across all sheet rows
 */
function runFullExistingSync() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Confirm Full Sync',
    'Are you sure you want to synchronize all existing Google Sheet rows to RishteClub?',
    ui.ButtonSet.YES_NO
  );
  if (confirm === ui.Button.YES) {
    syncExistingResponses(false, null);
  }
}

/**
 * Synchronizes existing responses in batches
 * @param {boolean} isDryRun - If true, validates and previews without modifying database
 * @param {number|null} maxRows - Maximum rows to process (null for all)
 */
function syncExistingResponses(isDryRun, maxRows) {
  const config = getScriptConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getTargetSheet(config);
  const spreadsheetId = ss.getId();
  const sheetId = sheet.getSheetId().toString();

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('No data rows found in sheet: ' + sheet.getName());
    return;
  }

  // Add/verify Sync Status column header (Column AI / index 34 -> column 35)
  const statusColIndex = 35;
  sheet.getRange(1, statusColIndex).setValue('RishteClub Sync Status');

  const rowsToProcess = [];
  const limit = maxRows ? Math.min(data.length, maxRows + 1) : data.length;

  for (let i = 1; i < limit; i++) {
    const rowValues = data[i];
    const rowNumber = i + 1;
    const mapped = mapRowToPayload(rowValues, spreadsheetId, sheetId, rowNumber);
    if (mapped) {
      rowsToProcess.push(mapped);
    }
  }

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let b = 0; b < rowsToProcess.length; b += config.batchSize) {
    const chunk = rowsToProcess.slice(b, b + config.batchSize);
    const payload = {
      dryRun: Boolean(isDryRun),
      batch: chunk,
    };

    const options = {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'x-integration-key': config.integrationKey,
        'Authorization': 'Bearer ' + config.integrationKey,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    try {
      const res = UrlFetchApp.fetch(config.apiUrl, options);
      const json = JSON.parse(res.getContentText());

      if (json.summary) {
        totalCreated += json.summary.created || 0;
        totalUpdated += json.summary.updated || 0;
        totalSkipped += json.summary.skipped || 0;
      }

      if (json.results && Array.isArray(json.results)) {
        for (let k = 0; k < json.results.length; k++) {
          const item = json.results[k];
          const targetRow = item.row;
          let statusText = item.status;
          if (item.profileId) statusText += ' (' + item.profileId + ')';
          if (item.reason) statusText += ' - ' + item.reason;
          if (item.error) statusText += ' - ' + item.error;
          sheet.getRange(targetRow, statusColIndex).setValue(statusText);
        }
      }
    } catch (err) {
      Logger.log('Batch error: ' + err.toString());
      totalErrors++;
    }

    Utilities.sleep(1000); // 1-second pacing between batches
  }

  const mode = isDryRun ? 'DRY-RUN (No DB changes)' : 'LIVE SYNC';
  const msg = `${mode} Complete!\n\nCreated: ${totalCreated}\nUpdated: ${totalUpdated}\nSkipped: ${totalSkipped}\nErrors: ${totalErrors}`;
  SpreadsheetApp.getUi().alert(msg);
}

/**
 * Installable Trigger for real-time future form submissions
 */
function onFormSubmit(e) {
  const config = getScriptConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = e && e.range ? e.range.getSheet() : getTargetSheet(config);
  const spreadsheetId = ss.getId();
  const sheetId = sheet.getSheetId().toString();

  let rowNumber = e && e.range ? e.range.getRow() : sheet.getLastRow();
  let rowValues = sheet.getRange(rowNumber, 1, 1, 34).getValues()[0];

  const mapped = mapRowToPayload(rowValues, spreadsheetId, sheetId, rowNumber);
  if (!mapped) return;

  const payload = {
    dryRun: false,
    batch: [mapped],
  };

  const statusColIndex = 35;

  try {
    const response = UrlFetchApp.fetch(config.apiUrl, {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'x-integration-key': config.integrationKey,
        'Authorization': 'Bearer ' + config.integrationKey,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const json = JSON.parse(response.getContentText());
    if (json.results && json.results.length > 0) {
      const res = json.results[0];
      let statusText = res.status;
      if (res.profileId) statusText += ' (' + res.profileId + ')';
      sheet.getRange(rowNumber, statusColIndex).setValue(statusText);
    }
  } catch (err) {
    Logger.log('onFormSubmit Error: ' + err.toString());
    sheet.getRange(rowNumber, statusColIndex).setValue('ERROR: ' + err.toString());
  }
}

/**
 * Extracts Google Drive File ID from various URL patterns
 */
function extractDriveFileId(urlOrText) {
  if (!urlOrText || typeof urlOrText !== 'string') return null;
  const match = urlOrText.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Converts a Google Drive file into base64 Data URI
 */
function getDriveFileBase64(urlOrText) {
  try {
    const fileId = extractDriveFileId(urlOrText);
    if (!fileId) return null;
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const contentType = blob.getContentType() || 'image/jpeg';
    const base64 = Utilities.base64Encode(blob.getBytes());
    return 'data:' + contentType + ';base64,' + base64;
  } catch (err) {
    Logger.log('Error reading Drive file (' + urlOrText + '): ' + err.toString());
    return null;
  }
}

/**
 * Splits comma/semicolon/newline separated string into clean array
 */
function splitPhotoUrls(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  return rawText.split(/[\n,;]+/).map(function(item) {
    return item.trim();
  }).filter(function(item) {
    return Boolean(item) && extractDriveFileId(item) !== null;
  });
}

/**
 * EXACT GOOGLE SHEET COLUMN MAPPING:
 * 
 * A  -> 0  : Profile ID (legacyProfileId)
 * B  -> 1  : Timestamp
 * C  -> 2  : Email address
 * D  -> 3  : Name
 * E  -> 4  : Gender
 * F  -> 5  : Marital Status
 * G  -> 6  : Date of Birth
 * H  -> 7  : Birth Place
 * I  -> 8  : Birth Time
 * J  -> 9  : Height
 * K  -> 10 : Qualification
 * L  -> 11 : Occupation
 * M  -> 12 : Income (self)
 * N  -> 13 : Address
 * O  -> 14 : Diet
 * P  -> 15 : Manglik
 * Q  -> 16 : Father's Name
 * R  -> 17 : Fathers occupation
 * S  -> 18 : Mother's Name
 * T  -> 19 : Mother's Occupation
 * U  -> 20 : Siblings Details
 * V  -> 21 : House Status
 * W  -> 22 : Family Type
 * X  -> 23 : Family's Property Details
 * Y  -> 24 : Contact Person Name & Relationship
 * Z  -> 25 : Contact No. (Registered Mobile)
 * AA -> 26 : Partner Preferences
 * AB -> 27 : Is it ok to post your Profile on Social Media
 * AC -> 28 : Profile Photo (SOLE photo column: 1st photo = primary, remaining = additional)
 * AD -> 29 : Consent
 * AE -> 30 : Other Matrimony Platform information (Text field, NOT photos)
 * AF -> 31 : Column 30 (Notes / Remarks)
 * AG -> 32 : Payment (Payment Remark - NOT paymentCompleted)
 * AH -> 33 : Additional Remarks
 */
function mapRowToPayload(row, spreadsheetId, sheetId, rowNumber) {
  const getCol = function(idx) {
    return (row[idx] !== undefined && row[idx] !== null) ? String(row[idx]).trim() : '';
  };

  const name = getCol(3);       // Col D
  const mobile = getCol(25);    // Col Z (Primary registered mobile)
  
  // Skip completely empty spacer rows
  if (!name && !mobile) {
    return null;
  }

  // Column AC is the SOLE photo column
  const photoColRaw = getCol(28); // Col AC
  const allPhotoUrls = splitPhotoUrls(photoColRaw);

  let primaryPhotoBase64 = null;
  let additionalPhotosBase64 = [];

  if (allPhotoUrls.length > 0) {
    // 1st photo is primary
    primaryPhotoBase64 = getDriveFileBase64(allPhotoUrls[0]);
    
    // Remaining photos (if any) are additional
    if (allPhotoUrls.length > 1) {
      for (let p = 1; p < allPhotoUrls.length; p++) {
        const addBase64 = getDriveFileBase64(allPhotoUrls[p]);
        if (addBase64) {
          additionalPhotosBase64.push(addBase64);
        }
      }
    }
  }

  return {
    sourceId: spreadsheetId + '_' + sheetId + '_row_' + rowNumber,
    rowNumber: rowNumber,
    legacyProfileId: getCol(0) || null,     // Col A: Profile ID
    timestamp: getCol(1),                   // Col B: Timestamp
    email: getCol(2),                       // Col C: Email address
    name: name,                             // Col D: Name
    gender: getCol(4),                      // Col E: Gender
    maritalStatus: getCol(5),               // Col F: Marital Status
    dob: getCol(6),                         // Col G: Date of Birth
    birthPlace: getCol(7),                  // Col H: Birth Place
    birthTime: getCol(8),                   // Col I: Birth Time
    height: getCol(9),                      // Col J: Height
    qualification: getCol(10),              // Col K: Qualification
    occupation: getCol(11),                 // Col L: Occupation
    income: getCol(12),                     // Col M: Income (self)
    address: getCol(13),                    // Col N: Address
    diet: getCol(14),                       // Col O: Diet
    manglik: getCol(15),                    // Col P: Manglik
    fatherName: getCol(16),                 // Col Q: Father's Name
    fatherOccupation: getCol(17),           // Col R: Fathers occupation
    motherName: getCol(18),                 // Col S: Mother's Name
    motherOccupation: getCol(19),           // Col T: Mother's Occupation
    siblingsDetails: getCol(20),            // Col U: Siblings Details
    familyStatus: getCol(21),               // Col V: House Status
    familyType: getCol(22),                 // Col W: Family Type
    propertyDetails: getCol(23),            // Col X: Family's Property Details
    contactPerson: getCol(24),              // Col Y: Contact Person Name & Relationship
    mobile: mobile,                         // Col Z: Contact No.
    partnerPreferences: getCol(26),         // Col AA: Partner Preferences
    consentSocialMedia: getCol(27),         // Col AB: Post Profile on Social Media
    primaryPhotoBase64: primaryPhotoBase64, // Primary Photo (1st from Col AC)
    consentGeneral: getCol(29),             // Col AD: Consent
    additionalPhotosBase64: additionalPhotosBase64, // Additional Photos (Remaining from Col AC)
    otherMatrimonyInfo: getCol(30),         // Col AE: Other Matrimony Platform information (Text)
    notes: getCol(31),                      // Col AF: Column 30 / Notes
    paymentRemark: getCol(32) || getCol(33) // Col AG / Col AH: Payment (Remark only)
  };
}
