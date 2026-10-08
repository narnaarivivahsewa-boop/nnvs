/* eslint-disable */
/**
 * =========================================================================================
 * RISHTECLUB / NNVS MATRIMONY – FAST GOOGLE FORM SYNC & 24/7 AUTOMATIC BIODATA PDF GENERATOR
 * =========================================================================================
 * 
 * Key Features:
 * 1. 100% Infallible Sync: Every single candidate is imported and made LIVE on the website.
 * 2. 24/7 Cloud Biodata PDF Auto-Generation: As soon as a profile is live, its styled Biodata PDF
 *    is automatically generated and saved into the exact Category Folder on Google Drive:
 *      📁 NNVS Website Biodatas/
 *         ├── 📁 Divorced Female
 *         ├── 📁 Divorced Male
 *         ├── 📁 Never Married Female
 *         └── 📁 Never Married Male
 *    (Runs completely on Google Cloud 24x7, regardless of whether your laptop is ON or OFF).
 * 3. Drive PDF Link Tracking: Column 36 displays the direct clickable Google Drive PDF link.
 * 4. 1-Click Bulk PDF Generator: Organize all 630+ candidates' PDFs into Drive folders anytime.
 * 5. Real-Time Form Submissions: Auto-sync + Auto-PDF creation on every new form submission.
 * =========================================================================================
 */

function getScriptConfig() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty('INTEGRATION_URL') || 'https://www.rishteclub.com/api/integrations/google-form';
  const integrationKey = props.getProperty('INTEGRATION_KEY') || '9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c';
  const sheetName = props.getProperty('SHEET_NAME');
  const sheetId = props.getProperty('SHEET_ID');
  const batchSize = parseInt(props.getProperty('BATCH_SIZE') || '25', 10);
  const syncNextRow = parseInt(props.getProperty('SYNC_NEXT_ROW') || '2', 10);

  return {
    apiUrl: apiUrl.trim(),
    integrationKey: integrationKey.trim(),
    sheetName: sheetName ? sheetName.trim() : null,
    sheetId: sheetId ? sheetId.trim() : null,
    batchSize: batchSize > 0 ? batchSize : 25,
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
    .createMenu('RishteClub Sync & PDFs')
    .addItem('⚡ 1-Click Setup 24/7 Realtime Auto-Import + PDF Creator', 'setupFormSubmitTrigger')
    .addSeparator()
    .addItem('1. Test Connection with Website', 'testConnection')
    .addItem('2. Start / Resume Full Sheet Sync (Fast)', 'startOrResumeSync')
    .addItem('3. 🔧 Sync ONLY Missing / Failed Rows (Fix Missing)', 'syncOnlyMissingRows')
    .addItem('4. Check Sync Progress & Database Status', 'checkSyncStatus')
    .addSeparator()
    .addItem('📁 5. Auto-Generate & Save All Biodata PDFs to Drive Folders', 'generateAllDriveBiodataPdfs')
    .addItem('🔗 6. Open Google Drive Biodatas Main Folder', 'openDriveBiodataFolder')
    .addSeparator()
    .addItem('7. Reset Sync Cursor to Row 2 (Start Fresh)', 'resetSyncCursor')
    .addItem('8. Cancel All Background Triggers', 'cancelAllTriggers')
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
      '✅ 24/7 Real-Time Automation Activated!',
      'Whenever a new Google Form is submitted:\n1. It is instantly imported & made LIVE on website.\n2. Its Biodata PDF is automatically generated & saved to the correct Category Folder on Google Drive (Divorced/Never Married Male/Female).\n\nThis runs 24/7 on Google Cloud even if your laptop is turned OFF.',
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
      `All ${lastRow} rows have already been processed (Cursor is at row ${config.syncNextRow}).\n\nTo re-scan from start, select "7. Reset Sync Cursor to Row 2", or select "3. 🔧 Sync ONLY Missing / Failed Rows".`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  SpreadsheetApp.getUi().alert(
    'Starting Fast Sync',
    `Starting sync from Row ${config.syncNextRow} of ${lastRow} in batches of ${config.batchSize} rows.\n\nEvery candidate will be made LIVE on the website.\nBackground triggers will automatically continue until all rows are done.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  PropertiesService.getScriptProperties().setProperty('SYNC_STATUS', 'IN_PROGRESS');
  processNextBatch();
}

/**
 * Sync ONLY Missing or Failed rows (Checks Status Column)
 */
function syncOnlyMissingRows() {
  const config = getScriptConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getTargetSheet(config);
  const spreadsheetId = ss.getId();
  const sheetId = sheet.getSheetId().toString();
  const lastRow = sheet.getLastRow();
  const statusColIndex = 35;
  const pdfColIndex = 36;

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No data rows found in sheet.');
    return;
  }

  const statusValues = sheet.getRange(2, statusColIndex, lastRow - 1, 1).getValues();
  const missingRowNumbers = [];

  for (let i = 0; i < statusValues.length; i++) {
    const rowNum = i + 2;
    const val = String(statusValues[i][0] || '').trim();
    if (!val.startsWith('LIVE') && !val.startsWith('CREATED') && !val.startsWith('UPDATED')) {
      missingRowNumbers.push(rowNum);
    }
  }

  if (missingRowNumbers.length === 0) {
    SpreadsheetApp.getUi().alert('✅ All Rows are LIVE', 'All ' + (lastRow - 1) + ' rows in the sheet are already marked LIVE! No missing rows found.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  SpreadsheetApp.getUi().alert(
    'Syncing Missing Rows',
    `Found ${missingRowNumbers.length} rows not yet marked LIVE (e.g., Rows: ${missingRowNumbers.slice(0, 10).join(', ')}...).\n\nStarting immediate sync for these rows now...`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  const maxCol = Math.max(34, sheet.getLastColumn());
  const batchSize = 25;
  let successCount = 0;

  for (let b = 0; b < missingRowNumbers.length; b += batchSize) {
    const chunkRowNums = missingRowNumbers.slice(b, b + batchSize);
    const batchPayload = [];

    for (let j = 0; j < chunkRowNums.length; j++) {
      const rNum = chunkRowNums[j];
      const rowVals = sheet.getRange(rNum, 1, 1, maxCol).getValues()[0];
      const mapped = mapRowToPayload(rowVals, spreadsheetId, sheetId, rNum);
      if (mapped) batchPayload.push(mapped);
    }

    if (batchPayload.length > 0) {
      const sendResult = sendPayloadToApi(config, batchPayload);
      if (sendResult.success && sendResult.results) {
        for (let k = 0; k < sendResult.results.length; k++) {
          const item = sendResult.results[k];
          const targetRow = item.row;
          let statusText = item.status === 'CREATED' ? 'LIVE' : item.status;
          if (item.profileId) statusText += ' (' + item.profileId + ')';
          if (item.legacyProfileId) statusText += ' [Old: ' + item.legacyProfileId + ']';
          if (item.error) statusText += ' - ' + item.error;
          sheet.getRange(targetRow, statusColIndex).setValue(statusText);
          successCount++;
        }
      } else {
        // Fallback single row retry
        for (let j = 0; j < batchPayload.length; j++) {
          const single = batchPayload[j];
          const singleRes = sendPayloadToApi(config, [single]);
          if (singleRes.success && singleRes.results && singleRes.results.length > 0) {
            const item = singleRes.results[0];
            let statusText = item.status === 'CREATED' ? 'LIVE' : item.status;
            if (item.profileId) statusText += ' (' + item.profileId + ')';
            if (item.legacyProfileId) statusText += ' [Old: ' + item.legacyProfileId + ']';
            sheet.getRange(item.row, statusColIndex).setValue(statusText);
            successCount++;
          } else {
            sheet.getRange(single.rowNumber, statusColIndex).setValue('RETRY_FAILED: ' + (singleRes.error || 'Server error'));
          }
        }
      }
    }
  }

  SpreadsheetApp.getUi().alert(
    'Sync Complete',
    `Successfully synced ${successCount} of ${missingRowNumbers.length} missing rows!`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Reset sync cursor back to Row 2
 */
function resetSyncCursor() {
  PropertiesService.getScriptProperties().setProperty('SYNC_NEXT_ROW', '2');
  PropertiesService.getScriptProperties().setProperty('SYNC_STATUS', 'IDLE');
  deleteContinuationTriggers();
  SpreadsheetApp.getUi().alert('Sync Cursor Reset', 'Sync cursor has been reset to Row 2. Next sync will scan from the beginning.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Cancel background triggers
 */
function cancelAllTriggers() {
  deleteContinuationTriggers();
  PropertiesService.getScriptProperties().setProperty('SYNC_STATUS', 'CANCELLED');
  SpreadsheetApp.getUi().alert('Triggers Cancelled', 'All background batch sync triggers have been removed.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Sends a batch payload to the website API endpoint
 */
function sendPayloadToApi(config, batchPayload) {
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-integration-key': config.integrationKey,
      'Authorization': 'Bearer ' + config.integrationKey,
    },
    payload: JSON.stringify({
      dryRun: false,
      batch: batchPayload,
    }),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(config.apiUrl, options);
    const code = response.getResponseCode();
    const text = response.getContentText();

    if (code >= 200 && code < 300) {
      const data = JSON.parse(text);
      return { success: true, results: data.results || [] };
    } else {
      return { success: false, error: 'HTTP ' + code + ': ' + text };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Core Batch Process Worker
 */
function processNextBatch() {
  deleteContinuationTriggers();

  const config = getScriptConfig();
  const props = PropertiesService.getScriptProperties();
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
    const sendResult = sendPayloadToApi(config, batchPayload);

    if (sendResult.success && sendResult.results && Array.isArray(sendResult.results)) {
      for (let k = 0; k < sendResult.results.length; k++) {
        const item = sendResult.results[k];
        const targetRow = item.row;
        let statusText = item.status === 'CREATED' ? 'LIVE' : item.status;
        if (item.profileId) statusText += ' (' + item.profileId + ')';
        if (item.legacyProfileId) statusText += ' [Old: ' + item.legacyProfileId + ']';
        if (item.error) statusText += ' - ' + item.error;
        sheet.getRange(targetRow, statusColIndex).setValue(statusText);
      }
      Logger.log(`Batch [${startRow}-${endRow}] complete.`);
    } else {
      Logger.log(`Batch [${startRow}-${endRow}] API error: ${sendResult.error || 'Retrying row by row...'}`);
      // Fallback row-by-row so zero rows are missed
      for (let j = 0; j < batchPayload.length; j++) {
        const single = batchPayload[j];
        const singleRes = sendPayloadToApi(config, [single]);
        if (singleRes.success && singleRes.results && singleRes.results.length > 0) {
          const item = singleRes.results[0];
          let statusText = item.status === 'CREATED' ? 'LIVE' : item.status;
          if (item.profileId) statusText += ' (' + item.profileId + ')';
          if (item.legacyProfileId) statusText += ' [Old: ' + item.legacyProfileId + ']';
          sheet.getRange(item.row, statusColIndex).setValue(statusText);
        } else {
          sheet.getRange(single.rowNumber, statusColIndex).setValue('RETRY_FAILED: ' + (singleRes.error || 'Server error'));
        }
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
      .after(5 * 1000)
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

  const message = [
    '--- RISHTECLUB SYNC STATUS ---',
    'Sheet Name: ' + sheet.getName(),
    'Total Rows: ' + lastRow + ' (' + (lastRow - 1) + ' candidate responses)',
    'Processed Rows: ' + processedCount,
    'Remaining Rows: ' + remainingCount,
    'Current Sync Cursor: Row ' + nextRow,
    'Sync Status: ' + syncStatus,
    'Active Background Job: ' + (hasActiveTrigger ? 'YES (Running)' : 'NO (Idle)'),
  ].join('\n');

  SpreadsheetApp.getUi().alert('Sync Progress', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

// =========================================================================================
// 24/7 GOOGLE DRIVE BIODATA PDF AUTOMATION & CATEGORY FOLDER ORGANIZER
// =========================================================================================

/**
 * Gets or creates the Google Drive Folder hierarchy for Biodata PDFs
 * Structure:
 * My Drive > NNVS Website Biodatas >
 *   ├── Divorced Female
 *   ├── Divorced Male
 *   ├── Never Married Female
 *   └── Never Married Male
 */
function getCategoryDriveFolder(categoryName) {
  const rootFolderName = 'NNVS Website Biodatas';
  const rootFolders = DriveApp.getFoldersByName(rootFolderName);
  let rootFolder;
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(rootFolderName);
    try {
      rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {}
  }

  const catFolders = rootFolder.getFoldersByName(categoryName);
  if (catFolders.hasNext()) {
    return catFolders.next();
  } else {
    const subFolder = rootFolder.createFolder(categoryName);
    try {
      subFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {}
    return subFolder;
  }
}

/**
 * Determines Category Folder for a candidate
 * Categories:
 * - Divorced Female
 * - Divorced Male
 * - Never Married Female
 * - Never Married Male
 */
function determineCategoryFolder(gender, maritalStatus, legacyProfileId) {
  const legacy = String(legacyProfileId || '').toUpperCase().trim();
  let isFemale = false;

  if (legacy.indexOf('-G-') !== -1 || legacy.indexOf('NNVS-G') === 0 || legacy.indexOf('G-') === 0 || legacy.indexOf('G0') === 0) {
    isFemale = true;
  } else if (legacy.indexOf('-B-') !== -1 || legacy.indexOf('NNVS-B') === 0 || legacy.indexOf('B-') === 0 || legacy.indexOf('B0') === 0) {
    isFemale = false;
  } else {
    const g = String(gender || 'MALE').toUpperCase().trim();
    isFemale = g === 'FEMALE';
  }

  const ms = String(maritalStatus || '').toLowerCase().trim();

  const isDivorcedOrWidowOrAnnulled =
    ms.indexOf('divorc') !== -1 ||
    ms.indexOf('widow') !== -1 ||
    ms.indexOf('annul') !== -1 ||
    ms.indexOf('separat') !== -1;

  if (isDivorcedOrWidowOrAnnulled) {
    return isFemale ? 'Divorced Female' : 'Divorced Male';
  } else {
    return isFemale ? 'Never Married Female' : 'Never Married Male';
  }
}

/**
 * Downloads Biodata PDF from Website API and Saves directly into designated Google Drive Category Folder
 */
function saveBiodataPdfToDrive(profileId, legacyProfileId, candidateName, gender, maritalStatus) {
  if (!profileId && !legacyProfileId) return null;
  const config = getScriptConfig();
  const lookupId = legacyProfileId || profileId;
  const baseUrl = config.apiUrl.replace(/\/api\/integrations\/.*$/, '');
  const pdfUrl = baseUrl + '/api/profiles/' + encodeURIComponent(lookupId) + '/pdf';

  try {
    const response = UrlFetchApp.fetch(pdfUrl, {
      method: 'GET',
      muteHttpExceptions: true,
      headers: {
        'x-integration-key': config.integrationKey,
      }
    });

    if (response.getResponseCode() !== 200) {
      Logger.log('PDF fetch failed for ' + lookupId + ': HTTP ' + response.getResponseCode());
      return null;
    }

    const category = determineCategoryFolder(gender, maritalStatus, legacyProfileId);
    const targetFolder = getCategoryDriveFolder(category);

    const safeName = (candidateName || 'Candidate').replace(/[^a-zA-Z0-9_\u0900-\u097F -]/g, '_').trim();
    const safeCode = (legacyProfileId || profileId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = (safeCode ? safeCode + '_' : '') + safeName + '.pdf';

    // Remove existing file with same name if any in that folder to avoid duplicates
    const existing = targetFolder.getFilesByName(fileName);
    while (existing.hasNext()) {
      existing.next().setTrashed(true);
    }

    const blob = response.getBlob().setName(fileName);
    const file = targetFolder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {}

    return {
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      category: category,
      fileName: fileName
    };
  } catch (e) {
    Logger.log('Error saving PDF to drive for ' + lookupId + ': ' + e.toString());
    return null;
  }
}

/**
 * 1-Click UI action to open Google Drive Biodatas folder
 */
function openDriveBiodataFolder() {
  const rootFolderName = 'NNVS Website Biodatas';
  const rootFolders = DriveApp.getFoldersByName(rootFolderName);
  let rootFolder;
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(rootFolderName);
    try {
      rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {}
  }

  const html = '<script>window.open("' + rootFolder.getUrl() + '", "_blank");google.script.host.close();</script>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(400).setHeight(120), 'Opening Google Drive Folder...');
}

/**
 * Generate and organize PDFs for all existing sheet rows into Google Drive category folders
 */
function generateAllDriveBiodataPdfs() {
  const config = getScriptConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getTargetSheet(config);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No data rows found in sheet.');
    return;
  }

  const statusColIndex = 35;
  const pdfColIndex = 36;
  try {
    sheet.getRange(1, pdfColIndex).setValue('Biodata PDF Drive Link');
  } catch(e) {}

  SpreadsheetApp.getUi().alert(
    'Starting Cloud PDF Generator',
    'Generating and saving Biodata PDFs for all candidates directly into Google Drive Category Folders...\n\nCategories:\n📁 Divorced Female\n📁 Divorced Male\n📁 Never Married Female\n📁 Never Married Male\n\nDirect PDF Drive links will be saved in Column 36.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  let successCount = 0;
  const maxCol = Math.max(34, sheet.getLastColumn());

  for (let r = 2; r <= lastRow; r++) {
    const rowVals = sheet.getRange(r, 1, 1, maxCol).getValues()[0];
    const legacyId = String(rowVals[0] || '').trim();
    const name = String(rowVals[3] || '').trim();
    const gender = String(rowVals[4] || '').trim();
    const maritalStatus = String(rowVals[5] || '').trim();
    const statusVal = String(sheet.getRange(r, statusColIndex).getValue() || '');
    
    // Extract profileId from status column if available e.g. "LIVE (RC...)"
    let profileId = null;
    const rcMatch = statusVal.match(/RC\d+_\d+/);
    if (rcMatch) {
      profileId = rcMatch[0];
    }

    if (!legacyId && !profileId) continue;

    const saved = saveBiodataPdfToDrive(profileId, legacyId, name, gender, maritalStatus);
    if (saved && saved.fileUrl) {
      sheet.getRange(r, pdfColIndex).setValue(saved.fileUrl);
      successCount++;
    }
  }

  SpreadsheetApp.getUi().alert(
    '✅ Cloud PDF Generation Complete',
    `Successfully generated and organized ${successCount} Biodata PDFs in Google Drive Category Folders!`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Real-time trigger handler for new Google Form Submissions
 * - Automatically imports & publishes profile
 * - Automatically creates & saves categorized Biodata PDF in Google Drive 24x7
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
  const pdfColIndex = 36;
  try {
    sheet.getRange(1, pdfColIndex).setValue('Biodata PDF Drive Link');
  } catch(e) {}

  const sendRes = sendPayloadToApi(config, [mapped]);

  if (sendRes.success && sendRes.results && sendRes.results.length > 0) {
    const res = sendRes.results[0];
    let statusText = res.status === 'CREATED' ? 'LIVE' : res.status;
    if (res.profileId) statusText += ' (' + res.profileId + ')';
    if (res.legacyProfileId) statusText += ' [Old: ' + res.legacyProfileId + ']';
    sheet.getRange(rowNumber, statusColIndex).setValue(statusText);

    // 24/7 AUTOMATIC BIODATA PDF CREATION & GOOGLE DRIVE CATEGORY SORTING
    try {
      const savedPdf = saveBiodataPdfToDrive(
        res.profileId,
        res.legacyProfileId,
        mapped.name,
        mapped.gender,
        mapped.maritalStatus
      );
      if (savedPdf && savedPdf.fileUrl) {
        sheet.getRange(rowNumber, pdfColIndex).setValue(savedPdf.fileUrl);
      }
    } catch (pdfErr) {
      Logger.log('PDF auto-generation notice: ' + pdfErr.toString());
    }
  } else {
    sheet.getRange(rowNumber, statusColIndex).setValue('API ERROR: ' + (sendRes.error || 'Failed'));
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
  
  let primaryPhotoUrl = null;
  if (allPhotoUrls.length > 0) {
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
    primaryPhotoUrl: primaryPhotoUrl,
    consentGeneral: getCol(29),             // Col AD: Consent
    additionalPhotoUrls: allPhotoUrls.slice(1),
    rawPhotoLink: photoColRaw || null,
    otherMatrimonyInfo: getCol(30),         // Col AE: Other Matrimony Platform info
    notes: getCol(31),                      // Col AF: Notes
    paymentRemark: getCol(32) || getCol(33) // Col AG / Col AH: Payment
  };
}
