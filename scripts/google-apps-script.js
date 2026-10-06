/* eslint-disable */
/**
 * =========================================================================================
 * RISHTECLUB MATRIMONY – GOOGLE FORM INTEGRATION, PHOTO REPAIR & DRIVE DIAGNOSTICS SCRIPT
 * =========================================================================================
 * 
 * Features:
 * 1. Resumable Normal Batch Sync: Processes rows in batches of 20 using SYNC_NEXT_ROW.
 * 2. Dedicated Photo-Only Repair: Completely separate operation using PHOTO_REPAIR_NEXT_ROW.
 *    - Does NOT reset, overwrite, or touch SYNC_NEXT_ROW.
 *    - Matches existing profiles by sourceId, legacyProfileId (Col A), or mobile (Col Z).
 *    - Reads Column AC Drive images, converts to base64, and uploads to Cloudinary.
 *    - Uses per-row transmission to guarantee no HTTP body size / payload limit overruns.
 *    - Never creates new users, profiles, or invoices.
 *    - Never alters profile IDs, legacy IDs, visibility, or payment status.
 * 3. Drive Diagnostics & Troubleshooting:
 *    - Menu 9: Test single Google Drive photo access with end-to-end report.
 *    - Menu 10: Check and categorize all photo repair errors across the sheet.
 * 4. Independent Status Tracking: Detailed counters & per-row status in Column AJ.
 * 5. Automatic Batch Continuation: Background triggers automatically chain execution.
 * 6. Real-Time Form Submissions: onFormSubmit(e) handles new submissions concurrently.
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

function getPhotoRepairConfig() {
  const props = PropertiesService.getScriptProperties();
  const baseConfig = getScriptConfig();
  const photoRepairNextRow = parseInt(props.getProperty('PHOTO_REPAIR_NEXT_ROW') || '2', 10);
  const photoRepairStatus = props.getProperty('PHOTO_REPAIR_STATUS') || 'NOT_STARTED';

  return Object.assign({}, baseConfig, {
    photoRepairNextRow: photoRepairNextRow >= 2 ? photoRepairNextRow : 2,
    photoRepairStatus: photoRepairStatus,
  });
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
    .addItem('⚡ Setup Realtime Automatic New Form Trigger', 'setupFormSubmitTrigger')
    .addSeparator()
    .addItem('1. Test Connection', 'testConnection')
    .addItem('2. Resume / Start Batch Sync', 'startOrResumeSync')
    .addItem('3. Check Sync Progress & Status', 'checkSyncStatus')
    .addSeparator()
    .addItem('4. Reset Sync Cursor to Row 2', 'resetSyncCursor')
    .addSeparator()
    .addItem('5. Repair Existing Profile Photos', 'startOrResumePhotoRepair')
    .addItem('6. Check Photo Repair Progress', 'checkPhotoRepairProgress')
    .addItem('7. Reset Photo Repair Cursor to Row 2', 'resetPhotoRepairCursor')
    .addSeparator()
    .addItem('8. Cancel All Ongoing Background Triggers', 'cancelAllTriggers')
    .addSeparator()
    .addItem('9. Test Google Drive Photo Access', 'testSinglePhotoAccess')
    .addItem('10. Check Photo Repair Errors', 'checkPhotoRepairErrors')
    .addToUi();
}

/**
 * Creates or updates the installable trigger for automatic real-time new form imports
 */
function setupFormSubmitTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    SpreadsheetApp.getUi().alert('Error: No active spreadsheet found.');
    return;
  }

  // Check and clean existing onFormSubmit triggers
  const triggers = ScriptApp.getProjectTriggers();
  let count = 0;
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(triggers[i]);
      count++;
    }
  }

  // Create new installable trigger for Form Submissions
  try {
    ScriptApp.newTrigger('onFormSubmit')
      .forSpreadsheet(ss)
      .onFormSubmit()
      .create();

    SpreadsheetApp.getUi().alert(
      '✅ Automatic Real-Time Import Enabled!',
      'Installable Trigger successfully installed for "onFormSubmit".\n\nWhenever a user submits a new Google Form, it will automatically sync and import into RishteClub immediately without needing manual intervention.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (err) {
    SpreadsheetApp.getUi().alert(
      'Trigger Setup Error',
      'Could not automatically install trigger: ' + err.toString() + '\n\nPlease grant authorization or create trigger manually under Triggers (Clock icon) > Add Trigger > onFormSubmit > On form submit.',
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
 * =========================================================================================
 * SECTION A: NORMAL PROFILE SYNC (MAINTAINS SYNC_NEXT_ROW)
 * =========================================================================================
 */

function deleteContinuationTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'processNextBatch') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function startOrResumeSync() {
  const config = getScriptConfig();
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

  Logger.log(`Processing batch: rows ${startRow} to ${endRow} (total ${numRowsToFetch} rows) of ${lastRow}...`);

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
    ScriptApp.newTrigger('processNextBatch')
      .timeBased()
      .after(30 * 1000)
      .create();
  } else {
    props.setProperty('SYNC_STATUS', 'COMPLETE');
    Logger.log('ALL ROWS PROCESSED! SYNC COMPLETE.');
  }
}

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
    `📊 RishteClub Main Sync Progress:`,
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

function resetSyncCursor() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Reset Sync Cursor',
    'Are you sure you want to reset the sync cursor back to Row 2?\n\nThis will re-scan the sheet from the beginning.',
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
 * =========================================================================================
 * SECTION B: SEPARATE PHOTO-ONLY REPAIR (MAINTAINS PHOTO_REPAIR_NEXT_ROW)
 * =========================================================================================
 */

function deletePhotoRepairTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'processNextPhotoRepairBatch') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function startOrResumePhotoRepair() {
  const config = getPhotoRepairConfig();
  const sheet = getTargetSheet(config);
  const lastRow = sheet.getLastRow();

  if (config.photoRepairNextRow > lastRow) {
    SpreadsheetApp.getUi().alert(
      'Photo Repair Already Complete',
      `All ${lastRow} rows in the sheet have already been scanned for photos (Photo Repair Cursor is at row ${config.photoRepairNextRow}).\n\nTo re-scan, select '7. Reset Photo Repair Cursor to Row 2'.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  SpreadsheetApp.getUi().alert(
    'Starting Photo-Only Repair',
    `Starting photo-only repair from row ${config.photoRepairNextRow} of ${lastRow} in batches of ${config.batchSize} rows.\n\nThis operation:\n- Matches existing profiles (sourceId, Column A legacy ID, Column Z mobile)\n- Reads Column AC Drive images\n- Uploads to Cloudinary\n- Attaches missing ProfilePhoto records\n- Will NOT modify profile data, IDs, approvals, payments, or invoices.\n\nBatches will automatically chain in the background.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  PropertiesService.getScriptProperties().setProperty('PHOTO_REPAIR_STATUS', 'IN_PROGRESS');
  processNextPhotoRepairBatch();
}

function processNextPhotoRepairBatch() {
  deletePhotoRepairTriggers();

  const props = PropertiesService.getScriptProperties();
  const config = getPhotoRepairConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getTargetSheet(config);
  const spreadsheetId = ss.getId();
  const sheetId = sheet.getSheetId().toString();
  const lastRow = sheet.getLastRow();

  const startRow = config.photoRepairNextRow;
  if (startRow > lastRow) {
    props.setProperty('PHOTO_REPAIR_STATUS', 'COMPLETE');
    Logger.log('Photo repair complete! All rows scanned.');
    return;
  }

  const endRow = Math.min(startRow + config.batchSize - 1, lastRow);
  const numRowsToFetch = endRow - startRow + 1;

  Logger.log(`Processing Photo Repair batch: rows ${startRow} to ${endRow} (total ${numRowsToFetch} rows) of ${lastRow}...`);

  // Column 36 (Column AJ) for Photo Repair Status
  const photoStatusColIndex = 36;
  try {
    sheet.getRange(1, photoStatusColIndex).setValue('Photo Repair Status');
  } catch (e) {}

  const maxCol = Math.max(30, sheet.getLastColumn());
  const rangeValues = sheet.getRange(startRow, 1, numRowsToFetch, maxCol).getValues();

  // Helper to increment persistent script stat counters
  const incrementStat = function(key, val) {
    const curr = parseInt(props.getProperty(key) || '0', 10);
    props.setProperty(key, (curr + (val || 0)).toString());
  };

  incrementStat('PHOTO_STATS_PROCESSED', numRowsToFetch);

  // Process rows one-by-one to avoid HTTP body payload size limits
  for (let i = 0; i < rangeValues.length; i++) {
    const rowValues = rangeValues[i];
    const currentRowNumber = startRow + i;

    const getCol = function(idx) {
      return (rowValues[idx] !== undefined && rowValues[idx] !== null) ? String(rowValues[idx]).trim() : '';
    };

    const legacyProfileId = getCol(0); // Col A
    const mobile = getCol(25);          // Col Z
    const photoColRaw = getCol(28);     // Col AC
    const sourceId = spreadsheetId + '_' + sheetId + '_row_' + currentRowNumber;

    if (!photoColRaw) {
      incrementStat('PHOTO_STATS_SKIPPED_BLANK', 1);
      sheet.getRange(currentRowNumber, photoStatusColIndex).setValue('NO PHOTO IN COLUMN AC');
      continue;
    }

    const allPhotoUrls = splitPhotoUrls(photoColRaw);
    if (allPhotoUrls.length === 0) {
      incrementStat('PHOTO_STATS_DRIVE_ERRORS', 1);
      sheet.getRange(currentRowNumber, photoStatusColIndex).setValue('INVALID DRIVE URL');
      continue;
    }

    // Attempt Drive file download
    const driveResult = getDriveFileBase64WithDiag(allPhotoUrls[0]);
    if (!driveResult.success) {
      incrementStat('PHOTO_STATS_DRIVE_ERRORS', 1);
      sheet.getRange(currentRowNumber, photoStatusColIndex).setValue(driveResult.status);
      continue;
    }

    const primaryPhotoBase64 = driveResult.base64;
    const additionalPhotosBase64 = [];

    if (allPhotoUrls.length > 1) {
      for (let p = 1; p < allPhotoUrls.length; p++) {
        const addResult = getDriveFileBase64WithDiag(allPhotoUrls[p]);
        if (addResult.success && addResult.base64) {
          additionalPhotosBase64.push(addResult.base64);
        }
      }
    }

    // Send single row to backend API
    const singlePayload = {
      sourceId: sourceId,
      rowNumber: currentRowNumber,
      legacyProfileId: legacyProfileId || null,
      mobile: mobile || null,
      primaryPhotoBase64: primaryPhotoBase64,
      primaryPhotoUrl: allPhotoUrls[0] || photoColRaw || null,
      additionalPhotosBase64: additionalPhotosBase64,
      additionalPhotoUrls: allPhotoUrls.slice(1),
      rawPhotoLink: photoColRaw || null,
    };

    const options = {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'x-integration-key': config.integrationKey,
        'Authorization': 'Bearer ' + config.integrationKey,
      },
      payload: JSON.stringify({
        action: 'repair_photos',
        batch: [singlePayload],
      }),
      muteHttpExceptions: true,
    };

    try {
      const res = UrlFetchApp.fetch(config.apiUrl, options);
      const json = JSON.parse(res.getContentText());

      if (json.results && json.results.length > 0) {
        const item = json.results[0];
        let statusText = item.status;
        if (item.profileId) statusText += ' (' + item.profileId + ')';
        if (item.legacyProfileId) statusText += ' [Old: ' + item.legacyProfileId + ']';
        if (item.attachedCount) statusText += ` - ${item.attachedCount} photo(s) uploaded`;
        if (item.reason) statusText += ' - ' + item.reason;
        sheet.getRange(currentRowNumber, photoStatusColIndex).setValue(statusText);

        if (item.status === 'PHOTO_ATTACHED') incrementStat('PHOTO_STATS_ATTACHED', 1);
        if (item.status === 'ALREADY_ATTACHED') incrementStat('PHOTO_STATS_SKIPPED_ALREADY', 1);
        if (item.status === 'PROFILE_NOT_FOUND') incrementStat('PHOTO_STATS_SKIPPED_NOT_FOUND', 1);
        if (item.status === 'CLOUDINARY_ERROR') incrementStat('PHOTO_STATS_CLOUDINARY_ERRORS', 1);
      } else {
        sheet.getRange(currentRowNumber, photoStatusColIndex).setValue('API RESPONSE EMPTY');
      }
    } catch (err) {
      Logger.log(`Photo Repair Row ${currentRowNumber} API error: ` + err.toString());
      sheet.getRange(currentRowNumber, photoStatusColIndex).setValue('API ERROR: ' + err.toString());
      incrementStat('PHOTO_STATS_CLOUDINARY_ERRORS', 1);
    }
  }

  // Advance photo repair cursor independently
  const nextStartRow = endRow + 1;
  props.setProperty('PHOTO_REPAIR_NEXT_ROW', nextStartRow.toString());

  if (nextStartRow <= lastRow) {
    props.setProperty('PHOTO_REPAIR_STATUS', 'IN_PROGRESS');
    Logger.log(`Scheduling continuation trigger for next Photo Repair batch starting at row ${nextStartRow}...`);
    ScriptApp.newTrigger('processNextPhotoRepairBatch')
      .timeBased()
      .after(30 * 1000)
      .create();
  } else {
    props.setProperty('PHOTO_REPAIR_STATUS', 'COMPLETE');
    Logger.log('ALL ROWS PROCESSED! PHOTO REPAIR COMPLETE.');
  }
}

function checkPhotoRepairProgress() {
  const config = getPhotoRepairConfig();
  const props = PropertiesService.getScriptProperties();
  const sheet = getTargetSheet(config);
  const lastRow = sheet.getLastRow();
  const nextRow = config.photoRepairNextRow;
  const status = props.getProperty('PHOTO_REPAIR_STATUS') || 'NOT_STARTED';

  const processedCount = parseInt(props.getProperty('PHOTO_STATS_PROCESSED') || '0', 10);
  const attachedCount = parseInt(props.getProperty('PHOTO_STATS_ATTACHED') || '0', 10);
  const skippedBlank = parseInt(props.getProperty('PHOTO_STATS_SKIPPED_BLANK') || '0', 10);
  const skippedNotFound = parseInt(props.getProperty('PHOTO_STATS_SKIPPED_NOT_FOUND') || '0', 10);
  const skippedAlready = parseInt(props.getProperty('PHOTO_STATS_SKIPPED_ALREADY') || '0', 10);
  const driveErrors = parseInt(props.getProperty('PHOTO_STATS_DRIVE_ERRORS') || '0', 10);
  const cloudinaryErrors = parseInt(props.getProperty('PHOTO_STATS_CLOUDINARY_ERRORS') || '0', 10);

  const remainingRows = Math.max(0, lastRow - nextRow + 1);

  // Scan Column AC for total photo rows found in sheet
  let photoRowsFound = 0;
  if (lastRow >= 2) {
    try {
      const colACValues = sheet.getRange(2, 29, lastRow - 1, 1).getValues();
      for (let i = 0; i < colACValues.length; i++) {
        if (colACValues[i][0] && String(colACValues[i][0]).trim()) {
          photoRowsFound++;
        }
      }
    } catch (e) {}
  }

  const triggers = ScriptApp.getProjectTriggers();
  let hasActiveTrigger = false;
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'processNextPhotoRepairBatch') {
      hasActiveTrigger = true;
      break;
    }
  }

  const msg = [
    `📸 RishteClub Photo Repair Progress:`,
    `----------------------------------------`,
    `• Status                     : ${status}`,
    `• Total Sheet Rows           : ${lastRow} (Header + ${lastRow - 1} Responses)`,
    `• Photo Rows Found (Col AC)  : ${photoRowsFound}`,
    `• Current Photo-Repair Row   : Row ${nextRow}`,
    `• Remaining Rows to Scan     : ${remainingRows}`,
    `• Background Trigger Active  : ${hasActiveTrigger ? 'YES (Auto-chaining every 30s)' : 'NO (Idle)'}`,
    `----------------------------------------`,
    `Detailed Counters:`,
    `• Photos Processed           : ${processedCount}`,
    `• Photos Successfully Attached: ${attachedCount}`,
    `• Skipped (Col AC is blank)  : ${skippedBlank}`,
    `• Skipped (Profile not found): ${skippedNotFound}`,
    `• Skipped (Already attached) : ${skippedAlready}`,
    `• Drive Access/Download Errs : ${driveErrors}`,
    `• Cloudinary/Upload Errors   : ${cloudinaryErrors}`,
    `----------------------------------------`,
    nextRow > lastRow ? '✅ All rows in the sheet have been scanned for photos.' : '👉 Select "5. Repair Existing Profile Photos" to continue.'
  ].join('\n');

  SpreadsheetApp.getUi().alert('Photo Repair Status & Progress', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

function resetPhotoRepairCursor() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Reset Photo Repair Cursor',
    'Are you sure you want to reset ONLY the Photo Repair cursor back to Row 2?\n\n(Note: This will NOT affect the main sync cursor SYNC_NEXT_ROW).',
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    deletePhotoRepairTriggers();
    const props = PropertiesService.getScriptProperties();
    props.setProperty('PHOTO_REPAIR_NEXT_ROW', '2');
    props.setProperty('PHOTO_REPAIR_STATUS', 'NOT_STARTED');
    props.setProperty('PHOTO_STATS_PROCESSED', '0');
    props.setProperty('PHOTO_STATS_ATTACHED', '0');
    props.setProperty('PHOTO_STATS_SKIPPED_BLANK', '0');
    props.setProperty('PHOTO_STATS_SKIPPED_NOT_FOUND', '0');
    props.setProperty('PHOTO_STATS_SKIPPED_ALREADY', '0');
    props.setProperty('PHOTO_STATS_DRIVE_ERRORS', '0');
    props.setProperty('PHOTO_STATS_CLOUDINARY_ERRORS', '0');
    ui.alert('Photo Repair cursor reset to Row 2.');
  }
}

/**
 * =========================================================================================
 * SECTION C: DRIVE DIAGNOSTICS & ERROR SUMMARY
 * =========================================================================================
 */

/**
 * Menu 9: Tests a real Google Drive photo from Column AC and displays diagnostic report
 */
function testSinglePhotoAccess() {
  const config = getScriptConfig();
  const sheet = getTargetSheet(config);
  const lastRow = sheet.getLastRow();
  const ui = SpreadsheetApp.getUi();

  // Find first row with non-empty Column AC (Col 29)
  let testRow = 2;
  let photoUrlRaw = '';
  const colACRange = sheet.getRange(2, 29, Math.max(1, lastRow - 1), 1).getValues();

  for (let i = 0; i < colACRange.length; i++) {
    if (colACRange[i][0] && String(colACRange[i][0]).trim() !== '') {
      testRow = i + 2;
      photoUrlRaw = String(colACRange[i][0]).trim();
      break;
    }
  }

  if (!photoUrlRaw) {
    ui.alert('No Photos Found', 'No rows in Column AC contain a photo URL to test.', ui.ButtonSet.OK);
    return;
  }

  const legacyProfileId = sheet.getRange(testRow, 1).getValue() || 'N/A';
  const candidateName = sheet.getRange(testRow, 4).getValue() || 'N/A';
  const mobile = sheet.getRange(testRow, 26).getValue() || 'N/A';

  // 1. URL & File ID Extraction
  const fileId = extractDriveFileId(photoUrlRaw);
  if (!fileId) {
    ui.alert(
      'Invalid Drive URL',
      `Row ${testRow} contains an unsupported URL format:\n\n${photoUrlRaw}`,
      ui.ButtonSet.OK
    );
    return;
  }

  let fileName = 'N/A';
  let mimeType = 'N/A';
  let fileSizeKb = '0 KB';
  let fileAccessible = 'NO';
  let blobRetrieved = 'NO';
  let apiResult = 'NOT ATTEMPTED';
  let cloudinaryResult = 'NOT ATTEMPTED';
  let base64Data = null;

  // 2. Test Google DriveApp Access
  try {
    const file = DriveApp.getFileById(fileId);
    fileName = file.getName();
    mimeType = file.getMimeType();
    const sizeBytes = file.getSize();
    fileSizeKb = (sizeBytes / 1024).toFixed(1) + ' KB';
    fileAccessible = 'YES';

    const blob = file.getBlob();
    const bytes = blob.getBytes();
    if (bytes && bytes.length > 0) {
      blobRetrieved = `YES (${(bytes.length / 1024).toFixed(1)} KB)`;
      base64Data = 'data:' + (mimeType || 'image/jpeg') + ';base64,' + Utilities.base64Encode(bytes);
    }
  } catch (driveErr) {
    const errMsg = driveErr.toString();
    if (errMsg.includes('permission') || errMsg.includes('Access denied')) {
      fileAccessible = 'NO (Permission Denied - Script account lacks read access)';
    } else if (errMsg.includes('not found') || errMsg.includes('Item not found')) {
      fileAccessible = 'NO (File Not Found - Invalid ID or deleted)';
    } else {
      fileAccessible = 'NO (' + errMsg + ')';
    }
  }

  // 3. Test API & Cloudinary Upload if blob was retrieved
  if (base64Data) {
    try {
      const sourceId = sheet.getParent().getId() + '_' + sheet.getSheetId() + '_row_' + testRow;
      const res = UrlFetchApp.fetch(config.apiUrl, {
        method: 'POST',
        contentType: 'application/json',
        headers: {
          'x-integration-key': config.integrationKey,
          'Authorization': 'Bearer ' + config.integrationKey,
        },
        payload: JSON.stringify({
          action: 'repair_photos',
          batch: [{
            sourceId: sourceId,
            rowNumber: testRow,
            legacyProfileId: legacyProfileId,
            mobile: mobile,
            primaryPhotoBase64: base64Data,
          }],
        }),
        muteHttpExceptions: true,
      });

      const json = JSON.parse(res.getContentText());
      apiResult = `HTTP ${res.getResponseCode()} (Success: ${json.success})`;
      if (json.results && json.results.length > 0) {
        const item = json.results[0];
        cloudinaryResult = `${item.status} (Profile: ${item.profileId || 'N/A'}) ${item.reason || ''}`;
      } else {
        cloudinaryResult = res.getContentText();
      }
    } catch (apiErr) {
      apiResult = 'FAILED: ' + apiErr.toString();
      cloudinaryResult = 'ERROR: ' + apiErr.toString();
    }
  }

  let activeUser = 'Unknown';
  let effectiveUser = 'Unknown';
  try {
    activeUser = Session.getActiveUser().getEmail() || 'N/A';
    effectiveUser = Session.getEffectiveUser().getEmail() || 'N/A';
  } catch (uErr) {}

  const report = [
    `🔬 Google Drive Photo Access Diagnostic Report:`,
    `--------------------------------------------------`,
    `• Executing Google Account: ${effectiveUser} (Active: ${activeUser})`,
    `• Test Sheet Row          : Row ${testRow}`,
    `• Candidate Name          : ${candidateName}`,
    `• Legacy Profile ID       : ${legacyProfileId}`,
    `• Drive URL Tested        : ${photoUrlRaw}`,
    `• File ID Detected        : ${fileId}`,
    `• File Name               : ${fileName}`,
    `• MIME Type               : ${mimeType}`,
    `• File Size               : ${fileSizeKb}`,
    `• DriveApp Access         : ${fileAccessible}`,
    `• Blob Retrieved          : ${blobRetrieved}`,
    `• API Upload Attempted    : ${base64Data ? 'YES' : 'NO'}`,
    `• API Upload Result       : ${apiResult}`,
    `• Cloudinary / DB Result  : ${cloudinaryResult}`,
    `--------------------------------------------------`,
    fileAccessible.startsWith('YES') && blobRetrieved.startsWith('YES')
      ? '✅ Google Drive access and single-photo upload are fully functional!'
      : '⚠️ DriveApp access failed. Please verify DriveApp authorization & ensure the executing account has read permission to the Form upload folder.'
  ].join('\n');

  ui.alert('Drive Photo Diagnostic', report, ui.ButtonSet.OK);
}

/**
 * Menu 10: Checks and categorizes all errors recorded in Column AJ (Photo Repair Status)
 */
function checkPhotoRepairErrors() {
  const config = getScriptConfig();
  const sheet = getTargetSheet(config);
  const lastRow = sheet.getLastRow();
  const ui = SpreadsheetApp.getUi();

  if (lastRow < 2) {
    ui.alert('No Data', 'No response rows in sheet.', ui.ButtonSet.OK);
    return;
  }

  const photoStatusCol = 36;
  const statuses = sheet.getRange(2, photoStatusCol, lastRow - 1, 1).getValues();

  let attachedCount = 0;
  let alreadyAttachedCount = 0;
  let blankCount = 0;
  let notFoundCount = 0;
  let driveErrCount = 0;
  let permDeniedCount = 0;
  let fileNotFoundCount = 0;
  let cloudinaryErrCount = 0;
  let notScannedCount = 0;
  let otherErrCount = 0;

  for (let i = 0; i < statuses.length; i++) {
    const val = String(statuses[i][0] || '').trim();
    if (!val) {
      notScannedCount++;
    } else if (val.includes('PHOTO_ATTACHED')) {
      attachedCount++;
    } else if (val.includes('ALREADY_ATTACHED')) {
      alreadyAttachedCount++;
    } else if (val.includes('NO PHOTO')) {
      blankCount++;
    } else if (val.includes('PROFILE_NOT_FOUND')) {
      notFoundCount++;
    } else if (val.includes('PERMISSION DENIED')) {
      permDeniedCount++;
    } else if (val.includes('DRIVE FILE NOT FOUND')) {
      fileNotFoundCount++;
    } else if (val.includes('DRIVE ACCESS ERROR') || val.includes('Drive Access')) {
      driveErrCount++;
    } else if (val.includes('CLOUDINARY')) {
      cloudinaryErrCount++;
    } else {
      otherErrCount++;
    }
  }

  const msg = [
    `📋 Photo Repair Error & Status Summary:`,
    `----------------------------------------`,
    `• Total Response Rows        : ${lastRow - 1}`,
    `• Photos Attached (Success)  : ${attachedCount}`,
    `• Already Attached (Skipped) : ${alreadyAttachedCount}`,
    `• Blank / No Photo in Col AC : ${blankCount}`,
    `• Profile Not Found in DB    : ${notFoundCount}`,
    `• Drive Permission Denied    : ${permDeniedCount}`,
    `• Drive File Not Found (404) : ${fileNotFoundCount}`,
    `• Drive Access Errors (Other): ${driveErrCount}`,
    `• Cloudinary Upload Errors   : ${cloudinaryErrCount}`,
    `• Unscanned Rows (Remaining) : ${notScannedCount}`,
    `• Other Statuses             : ${otherErrCount}`,
    `----------------------------------------`,
    `👉 To test individual Drive photo access, select Menu item '9. Test Google Drive Photo Access'.`
  ].join('\n');

  ui.alert('Photo Repair Errors Summary', msg, ui.ButtonSet.OK);
}

/**
 * =========================================================================================
 * SECTION D: SHARED CONTROLS & UTILITIES
 * =========================================================================================
 */

function cancelAllTriggers() {
  deleteContinuationTriggers();
  deletePhotoRepairTriggers();
  PropertiesService.getScriptProperties().setProperty('SYNC_STATUS', 'PAUSED');
  PropertiesService.getScriptProperties().setProperty('PHOTO_REPAIR_STATUS', 'PAUSED');
  SpreadsheetApp.getUi().alert('All background triggers cancelled and paused.');
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
 * Extracts Google Drive File ID from all supported URL patterns
 */
function extractDriveFileId(urlOrText) {
  if (!urlOrText || typeof urlOrText !== 'string') return null;
  const str = urlOrText.trim();
  
  // Patterns:
  // 1. ?id=FILE_ID or &id=FILE_ID
  const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (idMatch) return idMatch[1];
  
  // 2. /d/FILE_ID/ or /d/FILE_ID
  const dMatch = str.match(/\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (dMatch) return dMatch[1];

  // 3. /file/d/FILE_ID
  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (fileDMatch) return fileDMatch[1];

  // 4. Raw File ID
  const generalMatch = str.match(/^([a-zA-Z0-9_-]{25,})$/);
  if (generalMatch) return generalMatch[1];

  return null;
}

/**
 * Converts a Google Drive file into base64 Data URI with diagnostic status
 */
function getDriveFileBase64WithDiag(urlOrText) {
  try {
    const fileId = extractDriveFileId(urlOrText);
    if (!fileId) {
      return { success: false, status: 'INVALID DRIVE URL' };
    }

    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const contentType = blob.getContentType() || 'image/jpeg';
    const bytes = blob.getBytes();
    if (!bytes || bytes.length === 0) {
      return { success: false, status: 'DRIVE ACCESS ERROR (Empty Blob)' };
    }

    const base64 = Utilities.base64Encode(bytes);
    return {
      success: true,
      status: 'PHOTO FOUND',
      base64: 'data:' + contentType + ';base64,' + base64,
    };
  } catch (err) {
    const errMsg = err.toString();
    Logger.log('Drive Error for (' + urlOrText + '): ' + errMsg);

    if (errMsg.includes('permission') || errMsg.includes('Access denied')) {
      return { success: false, status: 'DRIVE PERMISSION DENIED (Account lacks read access)' };
    } else if (errMsg.includes('not found') || errMsg.includes('Item not found')) {
      return { success: false, status: 'DRIVE FILE NOT FOUND (Invalid ID / Deleted)' };
    }
    return { success: false, status: 'DRIVE ACCESS ERROR: ' + errMsg };
  }
}

function getDriveFileBase64(urlOrText) {
  const result = getDriveFileBase64WithDiag(urlOrText);
  return result.success ? result.base64 : null;
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
  let mobile = getCol(25);      // Col Z (Primary registered mobile)
  
  // Search other columns if mobile is missing in Col Z
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

  // If both name and mobile are completely missing, skip
  if (!name && !mobile && !getCol(0)) {
    return null;
  }

  // Column AC is the SOLE photo column (Col 29 in 1-based, index 28)
  const photoColRaw = getCol(28); // Col AC
  const allPhotoUrls = splitPhotoUrls(photoColRaw);

  let primaryPhotoBase64 = null;
  let additionalPhotosBase64 = [];

  if (allPhotoUrls.length > 0) {
    primaryPhotoBase64 = getDriveFileBase64(allPhotoUrls[0]);
    
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
    primaryPhotoBase64: primaryPhotoBase64, // Primary Photo base64 (if accessible via DriveApp)
    primaryPhotoUrl: allPhotoUrls[0] || photoColRaw || null, // Primary Google Drive / image URL
    consentGeneral: getCol(29),             // Col AD: Consent
    additionalPhotosBase64: additionalPhotosBase64, // Additional Photos base64
    additionalPhotoUrls: allPhotoUrls.slice(1),     // Additional Google Drive URLs
    rawPhotoLink: photoColRaw || null,      // Full raw link in Column AC
    otherMatrimonyInfo: getCol(30),         // Col AE: Other Matrimony Platform information (Text)
    notes: getCol(31),                      // Col AF: Column 30 / Notes
    paymentRemark: getCol(32) || getCol(33) // Col AG / Col AH: Payment (Remark only)
  };
}
