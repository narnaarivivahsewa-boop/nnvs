/* eslint-disable */
/**
 * =========================================================================================
 * RISHTECLUB MATRIMONY – RESUMABLE GOOGLE FORM & RESPONSE SHEET INTEGRATION SCRIPT
 * =========================================================================================
 * 
 * Features:
 * 1. Resumable Batch Processing: Processes 20 rows per batch to avoid Google 6-min execution limits.
 * 2. Persisted Cursor: Automatically stores progress in Script Properties (SYNC_NEXT_ROW).
 * 3. Automatic Continuation: Automatically schedules the next batch after 30 seconds using time-based triggers.
 * 4. Photo Extraction & Idempotency: Column AC is parsed (1st = primary, 2nd+ = additional).
 * 5. Safe Duplicate Handling: Existing profiles are safely updated with missing photos.
 * 6. Future Submissions: Real-time `onFormSubmit(e)` trigger runs concurrently without interference.
 * =========================================================================================
 */

function getScriptConfig() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty('INTEGRATION_URL') || 'https://www.rishteclub.com/api/integrations/google-form';
  const integrationKey = props.getProperty('INTEGRATION_KEY');
  const sheetName = props.getProperty('SHEET_NAME');
  const sheetId = props.getProperty('SHEET_ID');
  const batchSize = parseInt(props.getProperty('BATCH_SIZE') || '20', 10);
  const syncNextRow = parseInt(props.getProperty('SYNC_NEXT_ROW') || '2', 10);

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
    batchSize: batchSize > 0 ? batchSize : 20,
    syncNextRow: syncNextRow >= 2 ? syncNextRow : 2,
  };
}

/**
 * Gets the designated responses sheet safely
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

  const defaultSheet = ss.getSheetByName('Form Responses 1') || 
                       ss.getSheetByName('Form responses 1') || 
                       ss.getSheets()[0];
  return defaultSheet;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('RishteClub Sync')
    .addItem('1. Test Connection', 'testConnection')
    .addItem('2. Resume / Start Batch Sync', 'startOrResumeSync')
    .addItem('3. Check Sync Progress & Status', 'checkSyncStatus')
    .addSeparator()
    .addItem('4. Reset Sync Cursor to Row 2', 'resetSyncCursor')
    .addItem('5. Cancel Ongoing Continuation Triggers', 'cancelContinuation')
    .addToUi();
}

/**
 * Test connectivity and API authentication
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
 * Removes any existing continuation triggers to prevent duplicate executions
 */
function deleteContinuationTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'processNextBatch') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

/**
 * User action to start or resume batch syncing
 */
function startOrResumeSync() {
  const config = getScriptConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getTargetSheet(config);
  const lastRow = sheet.getLastRow();

  if (config.syncNextRow > lastRow) {
    SpreadsheetApp.getUi().alert(
      'Sync Already Complete',
      `All ${lastRow} rows in the sheet have already been scanned (Cursor is at row ${config.syncNextRow}).\n\nTo re-scan, select '4. Reset Sync Cursor to Row 2'.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  SpreadsheetApp.getUi().alert(
    'Starting Resumable Sync',
    `Starting sync from row ${config.syncNextRow} of ${lastRow} in batches of ${config.batchSize} rows.\n\nThe script will automatically chain batches in the background until all rows are processed.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  processNextBatch();
}

/**
 * Main batch processor - processes 1 batch and schedules the next if rows remain
 */
function processNextBatch() {
  deleteContinuationTriggers(); // Clean up existing triggers

  const props = PropertiesService.getScriptProperties();
  const config = getScriptConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getTargetSheet(config);
  const spreadsheetId = ss.getId();
  const sheetId = sheet.getSheetId().toString();
  const lastRow = sheet.getLastRow();

  const startRow = config.syncNextRow;
  if (startRow > lastRow) {
    props.setProperty('SYNC_STATUS', 'COMPLETE');
    Logger.log('Sync complete! All rows scanned.');
    return;
  }

  const endRow = Math.min(startRow + config.batchSize - 1, lastRow);
  const numRowsToFetch = endRow - startRow + 1;

  Logger.log(`Processing batch: rows ${startRow} to ${endRow} (total ${numRowsToFetch} rows) of ${lastRow}...`);

  // Column AI / index 34 -> column 35 is Sync Status
  const statusColIndex = 35;
  sheet.getRange(1, statusColIndex).setValue('RishteClub Sync Status');

  const rangeValues = sheet.getRange(startRow, 1, numRowsToFetch, Math.max(34, sheet.getLastColumn())).getValues();
  const batchPayload = [];

  for (let i = 0; i < rangeValues.length; i++) {
    const rowValues = rangeValues[i];
    const currentRowNumber = startRow + i;
    const mapped = mapRowToPayload(rowValues, spreadsheetId, sheetId, currentRowNumber);
    if (mapped) {
      batchPayload.push(mapped);
    } else {
      sheet.getRange(currentRowNumber, statusColIndex).setValue('SKIPPED (Missing name/mobile)');
    }
  }

  if (batchPayload.length > 0) {
    const options = {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'x-integration-key': config.integrationKey,
        'Authorization': 'Bearer ' + config.integrationKey,
      },
      payload: JSON.stringify({ dryRun: false, batch: batchPayload }),
      muteHttpExceptions: true,
    };

    try {
      const res = UrlFetchApp.fetch(config.apiUrl, options);
      const json = JSON.parse(res.getContentText());

      if (json.results && Array.isArray(json.results)) {
        for (let k = 0; k < json.results.length; k++) {
          const item = json.results[k];
          const targetRow = item.row;
          let statusText = item.status;
          if (item.profileId) statusText += ' (' + item.profileId + ')';
          if (item.legacyProfileId) statusText += ' [Old: ' + item.legacyProfileId + ']';
          if (item.reason) statusText += ' - ' + item.reason;
          if (item.error) statusText += ' - ' + item.error;
          sheet.getRange(targetRow, statusColIndex).setValue(statusText);
        }
      }
      Logger.log(`Batch [${startRow}-${endRow}] complete: ${res.getContentText()}`);
    } catch (err) {
      Logger.log(`Batch [${startRow}-${endRow}] API error: ` + err.toString());
      for (let r = startRow; r <= endRow; r++) {
        sheet.getRange(r, statusColIndex).setValue('ERROR: ' + err.toString());
      }
    }
  }

  // Advance cursor
  const nextStartRow = endRow + 1;
  props.setProperty('SYNC_NEXT_ROW', nextStartRow.toString());

  if (nextStartRow <= lastRow) {
    props.setProperty('SYNC_STATUS', 'IN_PROGRESS');
    Logger.log(`Scheduling continuation trigger for next batch starting at row ${nextStartRow}...`);
    // Schedule continuation in 30 seconds
    ScriptApp.newTrigger('processNextBatch')
      .timeBased()
      .after(30 * 1000)
      .create();
  } else {
    props.setProperty('SYNC_STATUS', 'COMPLETE');
    Logger.log('ALL ROWS PROCESSED! SYNC COMPLETE.');
  }
}

/**
 * Checks current cursor position, sheet row totals, and progress status
 */
function checkSyncStatus() {
  const config = getScriptConfig();
  const props = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getTargetSheet(config);
  const lastRow = sheet.getLastRow();
  const nextRow = config.syncNextRow;
  const syncStatus = props.getProperty('SYNC_STATUS') || 'IDLE';

  const processedCount = Math.max(0, Math.min(nextRow - 2, lastRow - 1));
  const remainingCount = Math.max(0, lastRow - nextRow + 1);

  const triggers = ScriptApp.getProjectTriggers();
  let hasActiveTrigger = false;
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'processNextBatch') {
      hasActiveTrigger = true;
      break;
    }
  }

  const msg = [
    `📊 RishteClub Sync Progress:`,
    `----------------------------------------`,
    `• Total Sheet Rows : ${lastRow} (Header + ${lastRow - 1} Responses)`,
    `• Next Row to Sync : Row ${nextRow}`,
    `• Rows Processed   : ${processedCount}`,
    `• Rows Remaining   : ${remainingCount}`,
    `• Sync Status      : ${syncStatus}`,
    `• Active Trigger   : ${hasActiveTrigger ? 'Running in Background (Chained)' : 'Idle'}`,
    `----------------------------------------`,
    nextRow > lastRow ? '✅ All existing rows have been scanned.' : '👉 Select "2. Resume / Start Batch Sync" to continue.'
  ].join('\n');

  SpreadsheetApp.getUi().alert('Sync Progress & Status', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Resets the sync cursor back to Row 2
 */
function resetSyncCursor() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Reset Sync Cursor',
    'Are you sure you want to reset the sync cursor back to Row 2?\n\nThis will re-scan the sheet from the beginning. (Idempotency ensures existing profiles/photos are safely updated without duplication).',
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    deleteContinuationTriggers();
    PropertiesService.getScriptProperties().setProperty('SYNC_NEXT_ROW', '2');
    PropertiesService.getScriptProperties().setProperty('SYNC_STATUS', 'RESET');
    ui.alert('Sync cursor reset to Row 2.');
  }
}

/**
 * Cancels any active background continuation triggers
 */
function cancelContinuation() {
  deleteContinuationTriggers();
  PropertiesService.getScriptProperties().setProperty('SYNC_STATUS', 'PAUSED');
  SpreadsheetApp.getUi().alert('Background sync paused. Active triggers removed.');
}

/**
 * Real-time trigger for future form submissions
 */
function onFormSubmit(e) {
  const config = getScriptConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = e && e.range ? e.range.getSheet() : getTargetSheet(config);
  const spreadsheetId = ss.getId();
  const sheetId = sheet.getSheetId().toString();

  let rowNumber = e && e.range ? e.range.getRow() : sheet.getLastRow();
  let rowValues = sheet.getRange(rowNumber, 1, 1, Math.max(34, sheet.getLastColumn())).getValues()[0];

  const mapped = mapRowToPayload(rowValues, spreadsheetId, sheetId, rowNumber);
  if (!mapped) return;

  const statusColIndex = 35;

  try {
    const response = UrlFetchApp.fetch(config.apiUrl, {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'x-integration-key': config.integrationKey,
        'Authorization': 'Bearer ' + config.integrationKey,
      },
      payload: JSON.stringify({ dryRun: false, batch: [mapped] }),
      muteHttpExceptions: true,
    });

    const json = JSON.parse(response.getContentText());
    if (json.results && json.results.length > 0) {
      const res = json.results[0];
      let statusText = res.status;
      if (res.profileId) statusText += ' (' + res.profileId + ')';
      if (res.legacyProfileId) statusText += ' [Old: ' + res.legacyProfileId + ']';
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
 * Splits comma/semicolon/newline separated string into clean array of Drive URLs
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
 * Maps single spreadsheet row to backend API payload
 */
function mapRowToPayload(row, spreadsheetId, sheetId, rowNumber) {
  const getCol = function(idx) {
    return (row[idx] !== undefined && row[idx] !== null) ? String(row[idx]).trim() : '';
  };

  const name = getCol(3);       // Col D
  const mobile = getCol(25);    // Col Z (Primary registered mobile)
  
  // Skip empty spacer rows
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
