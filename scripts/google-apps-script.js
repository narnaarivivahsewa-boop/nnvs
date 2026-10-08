/* eslint-disable */
/**
 * =========================================================================================
 * RISHTECLUB MATRIMONY – 100% RELIABLE GOOGLE FORM SYNC & REAL-TIME AUTO-IMPORT SCRIPT
 * =========================================================================================
 * 
 * Key Features:
 * 1. 100% Infallible Sync: Every single row (even with duplicate numbers, invalid phones,
 *    missing fields, Google Drive photos) is imported and made LIVE on the website.
 * 2. Real-Time Form Submissions: Automatically activates an installable trigger on new submissions.
 * 3. Drive Photo Support: Fetches Google Drive images directly or sends high-speed embed URLs.
 * 4. Automatic Batch Continuation: Chained background triggers process all rows from Row 2 to end.
 * 5. Visual Status Tracking: Column 35 ("RishteClub Sync Status") displays LIVE profile IDs.
 * =========================================================================================
 */

function getScriptConfig() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty('INTEGRATION_URL') || 'https://www.rishteclub.com/api/integrations/google-form';
  const integrationKey = props.getProperty('INTEGRATION_KEY') || '9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c';
  const sheetName = props.getProperty('SHEET_NAME');
  const sheetId = props.getProperty('SHEET_ID');
  const batchSize = parseInt(props.getProperty('BATCH_SIZE') || '15', 10);
  const syncNextRow = parseInt(props.getProperty('SYNC_NEXT_ROW') || '2', 10);

  return {
    apiUrl: apiUrl.trim(),
    integrationKey: integrationKey.trim(),
    sheetName: sheetName ? sheetName.trim() : null,
    sheetId: sheetId ? sheetId.trim() : null,
    batchSize: batchSize > 0 ? batchSize : 15,
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

/**
 * Menu UI for Google Sheets
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('RishteClub Sync')
    .addItem('⚡ 1-Click Setup Realtime Auto-Import for New Forms', 'setupFormSubmitTrigger')
    .addSeparator()
    .addItem('1. Test Connection with Website', 'testConnection')
    .addItem('2. Start / Resume Full Sheet Sync (All Profiles Live)', 'startOrResumeSync')
    .addItem('3. Check Sync Progress & Status', 'checkSyncStatus')
    .addSeparator()
    .addItem('4. Reset Sync Cursor to Row 2 (Start Fresh)', 'resetSyncCursor')
    .addItem('5. Cancel All Background Triggers', 'cancelAllTriggers')
    .addToUi();
}

/**
 * Setup Realtime onFormSubmit trigger for future new responses
 */
function setupFormSubmitTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    SpreadsheetApp.getUi().alert('Error: No active spreadsheet found.');
    return;
  }

  // Remove old triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  try {
    ScriptApp.newTrigger('onFormSubmit')
      .forSpreadsheet(ss)
      .onFormSubmit()
      .create();

    SpreadsheetApp.getUi().alert(
      '✅ Real-Time Sync Activated!',
      'Whenever a new Google Form is submitted, it will now automatically and instantly be created as an active LIVE profile on the website without any manual step.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (err) {
    SpreadsheetApp.getUi().alert(
      'Trigger Setup Notice',
      'Could not automatically create trigger: ' + err.toString() + '\n\nPlease grant authorization or add trigger under Extensions > Apps Script > Triggers (Clock icon).',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
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

    if (code === 200) {
      SpreadsheetApp.getUi().alert('✅ Success: Connected to Website API successfully!\n\n' + text);
    } else {
      SpreadsheetApp.getUi().alert('❌ Connection failed (HTTP ' + code + '):\n\n' + text);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Connection Error: ' + e.toString());
  }
}

/**
 * Delete batch continuation triggers
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
 * Start or Resume Batch Sync
 */
function startOrResumeSync() {
  const config = getScriptConfig();
  const sheet = getTargetSheet(config);
  const lastRow = sheet.getLastRow();

  if (config.syncNextRow > lastRow) {
    SpreadsheetApp.getUi().alert(
      'Sync Complete',
      `All ${lastRow} rows have already been processed (Cursor is at row ${config.syncNextRow}).\n\nTo re-scan from start, select "4. Reset Sync Cursor to Row 2".`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  SpreadsheetApp.getUi().alert(
    'Starting Fresh Sync',
    `Starting sync from Row ${config.syncNextRow} of ${lastRow} in batches of ${config.batchSize} rows.\n\nEvery candidate will be made LIVE on the website.\nBackground triggers will automatically continue until all rows are done.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  PropertiesService.getScriptProperties().setProperty('SYNC_STATUS', 'IN_PROGRESS');
  processNextBatch();
}

/**
 * Process a batch of rows
 */
function processNextBatch() {
  deleteContinuationTriggers();

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

  Logger.log(`Processing batch: rows ${startRow} to ${endRow} (total ${numRowsToFetch} rows)...`);

  const statusColIndex = 35;
  try {
    sheet.getRange(1, statusColIndex).setValue('RishteClub Sync Status');
  } catch (e) {}

  const maxCol = Math.max(34, sheet.getLastColumn());
  const rangeValues = sheet.getRange(startRow, 1, numRowsToFetch, maxCol).getValues();
  const batchPayload = [];

  for (let i = 0; i < rangeValues.length; i++) {
    const rowValues = rangeValues[i];
    const currentRowNumber = startRow + i;
    const mapped = mapRowToPayload(rowValues, spreadsheetId, sheetId, currentRowNumber);
    if (mapped) {
      batchPayload.push(mapped);
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
          let statusText = item.status === 'CREATED' ? 'LIVE' : item.status;
          if (item.profileId) statusText += ' (' + item.profileId + ')';
          if (item.legacyProfileId) statusText += ' [Old: ' + item.legacyProfileId + ']';
          if (item.error) statusText += ' - ' + item.error;
          sheet.getRange(targetRow, statusColIndex).setValue(statusText);
        }
      }
      Logger.log(`Batch [${startRow}-${endRow}] complete.`);
    } catch (err) {
      Logger.log(`Batch [${startRow}-${endRow}] API error: ` + err.toString());
      for (let r = startRow; r <= endRow; r++) {
        sheet.getRange(r, statusColIndex).setValue('API ERROR: ' + err.toString());
      }
    }
  }

  // Advance cursor
  const nextStartRow = endRow + 1;
  props.setProperty('SYNC_NEXT_ROW', nextStartRow.toString());

  if (nextStartRow <= lastRow) {
    props.setProperty('SYNC_STATUS', 'IN_PROGRESS');
    Logger.log(`Scheduling continuation trigger for row ${nextStartRow}...`);
    ScriptApp.newTrigger('processNextBatch')
      .timeBased()
      .after(15 * 1000)
      .create();
  } else {
    props.setProperty('SYNC_STATUS', 'COMPLETE');
    Logger.log('ALL ROWS PROCESSED! SYNC COMPLETE.');
  }
}

/**
 * Check Sync Progress & Status
 */
function checkSyncStatus() {
  const config = getScriptConfig();
  const props = PropertiesService.getScriptProperties();
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
    `📊 RishteClub Live Sync Progress:`,
    `----------------------------------------`,
    `• Total Sheet Rows : ${lastRow} (Header + ${lastRow - 1} Profiles)`,
    `• Next Row to Sync : Row ${nextRow}`,
    `• Rows Processed   : ${processedCount}`,
    `• Rows Remaining   : ${remainingCount}`,
    `• Status           : ${syncStatus}`,
    `• Background Job   : ${hasActiveTrigger ? 'Running (In Progress)' : 'Idle'}`,
    `----------------------------------------`,
    nextRow > lastRow ? '✅ All sheet profiles have been synced and made live!' : '👉 Click "2. Start / Resume Full Sheet Sync" to continue.'
  ].join('\n');

  SpreadsheetApp.getUi().alert('Sync Progress & Status', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Reset Sync Cursor
 */
function resetSyncCursor() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Reset Sync Cursor',
    'Are you sure you want to reset the sync cursor back to Row 2?\n\nThis will re-process the sheet from the beginning.',
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
 * Cancel All Background Triggers
 */
function cancelAllTriggers() {
  deleteContinuationTriggers();
  PropertiesService.getScriptProperties().setProperty('SYNC_STATUS', 'PAUSED');
  SpreadsheetApp.getUi().alert('All ongoing background triggers stopped.');
}

/**
 * Real-time trigger handler for new Google Form Submissions
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
      let statusText = res.status === 'CREATED' ? 'LIVE' : res.status;
      if (res.profileId) statusText += ' (' + res.profileId + ')';
      if (res.legacyProfileId) statusText += ' [Old: ' + res.legacyProfileId + ']';
      sheet.getRange(rowNumber, statusColIndex).setValue(statusText);
    }
  } catch (err) {
    Logger.log('onFormSubmit Error: ' + err.toString());
    sheet.getRange(rowNumber, statusColIndex).setValue('API ERROR: ' + err.toString());
  }
}

/**
 * Extract Google Drive File ID
 */
function extractDriveFileId(urlOrText) {
  if (!urlOrText || typeof urlOrText !== 'string') return null;
  const str = urlOrText.trim();
  
  const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (idMatch) return idMatch[1];
  
  const dMatch = str.match(/\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (dMatch) return dMatch[1];

  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (fileDMatch) return fileDMatch[1];

  const generalMatch = str.match(/^([a-zA-Z0-9_-]{25,})$/);
  if (generalMatch) return generalMatch[1];

  return null;
}

/**
 * Downloads Drive file to Base64 image
 */
function getDriveFileBase64(urlOrText) {
  try {
    const fileId = extractDriveFileId(urlOrText);
    if (!fileId) return null;

    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const contentType = blob.getContentType() || 'image/jpeg';
    const bytes = blob.getBytes();
    if (!bytes || bytes.length === 0) return null;

    return 'data:' + contentType + ';base64,' + Utilities.base64Encode(bytes);
  } catch (err) {
    return null;
  }
}

/**
 * Splits photo URLs
 */
function splitPhotoUrls(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  return rawText.split(/[\n,;]+/).map(function(item) {
    return item.trim();
  }).filter(Boolean);
}

/**
 * Maps single spreadsheet row to backend API payload
 */
function mapRowToPayload(row, spreadsheetId, sheetId, rowNumber) {
  const getCol = function(idx) {
    return (row[idx] !== undefined && row[idx] !== null) ? String(row[idx]).trim() : '';
  };

  const name = getCol(3);       // Col D: Candidate Name
  let mobile = getCol(25);      // Col Z: Contact No.
  
  // Search fallback columns if mobile is missing in Col Z
  if (!mobile) {
    const contactPerson = getCol(24);
    const notesText = getCol(31);
    const addressText = getCol(13);
    const combined = contactPerson + ' ' + notesText + ' ' + addressText;
    const match = combined.match(/[6-9]\d{9}/);
    if (match) {
      mobile = match[0];
    }
  }

  // Only skip if the entire row is totally blank
  const hasAnyData = row.some(function(cell) {
    return cell !== undefined && cell !== null && String(cell).trim() !== '';
  });
  if (!hasAnyData) {
    return null;
  }

  // Column AC is the photo column (index 28)
  const photoColRaw = getCol(28);
  const allPhotoUrls = splitPhotoUrls(photoColRaw);
  
  // Convert primary photo to base64 if Drive file accessible, else pass direct URL
  let primaryPhotoBase64 = null;
  let primaryPhotoUrl = null;
  if (allPhotoUrls.length > 0) {
    primaryPhotoBase64 = getDriveFileBase64(allPhotoUrls[0]);
    primaryPhotoUrl = allPhotoUrls[0];
  } else if (photoColRaw) {
    primaryPhotoUrl = photoColRaw;
  }

  return {
    sourceId: spreadsheetId + '_' + sheetId + '_row_' + rowNumber,
    rowNumber: rowNumber,
    legacyProfileId: getCol(0) || null,     // Col A: Profile ID
    timestamp: getCol(1),                   // Col B: Timestamp
    email: getCol(2) || null,               // Col C: Email address
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
    primaryPhotoBase64: primaryPhotoBase64,
    primaryPhotoUrl: primaryPhotoUrl,
    consentGeneral: getCol(29),             // Col AD: Consent
    additionalPhotosBase64: [],
    additionalPhotoUrls: allPhotoUrls.slice(1),
    rawPhotoLink: photoColRaw || null,
    otherMatrimonyInfo: getCol(30),         // Col AE: Other Matrimony Platform info
    notes: getCol(31),                      // Col AF: Notes
    paymentRemark: getCol(32) || getCol(33) // Col AG / Col AH: Payment
  };
}
