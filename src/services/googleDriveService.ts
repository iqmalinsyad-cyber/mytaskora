import { GoogleDriveConfig, GambarSiasatan } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'GOOGLE_DRIVE_CONFIG_V1';

export const DEFAULT_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - AUTO UPLOAD GAMBAR SIASATAN KE GOOGLE DRIVE
 * =========================================================================
 * 
 * LANGKAH PENYEDIAAN (3 Minit):
 * 1. Buka https://script.google.com/home dan klik butang "+ New project"
 * 2. Namakan projek di bahagian atas: "Sistem Aduan - Drive Upload Handler"
 * 3. Padam semua kod asal dalam fail 'Code.gs' dan tampal KESELURUHAN kod ini.
 * 4. Klik butang "Deploy" (butang biru atas kanan) -> Pilih "New deployment".
 * 5. Klik ikon Gear (Select type) -> Pilih "Web app".
 * 6. Masukkan tetapan berikut:
 *    - Description: "Sistem Aduan Google Drive v1"
 *    - Execute as: "Me (akaun google anda)"
 *    - Who has access: "Anyone" (PENTING: Pilih 'Anyone' supaya webhook boleh diakses)
 * 7. Klik "Deploy". 
 * 8. Berikan kebenaran (Authorize access -> Pilih akaun Google anda -> Advanced -> Go to ... (unsafe) -> Allow).
 * 9. Salin "Web App URL" (bermula dengan https://script.google.com/macros/s/...)
 * 10. Tampal URL tersebut ke dalam Tetapan Google Drive Sistem Aduan.
 * =========================================================================
 */

function doPost(e) {
  try {
    var rawContents = e.postData.contents;
    var data = JSON.parse(rawContents);

    var base64Data = data.base64 || "";
    var filename = data.filename || ("gambar_siasatan_" + new Date().getTime() + ".jpg");
    var mimeType = data.mimeType || "image/jpeg";
    var parentFolderName = data.folderName || "Sistem Aduan - Bukti Siasatan";
    var customFolderId = data.folderId || "";
    var noRujukan = data.noRujukan || "";
    var namaPengadu = data.namaPengadu || "";

    if (!base64Data) {
      return createJsonResponse({
        status: "error",
        message: "Tiada data gambar dihantar (base64 is empty)."
      });
    }

    // Buang prefix data URL jika ada (e.g. data:image/jpeg;base64,...)
    if (base64Data.indexOf("base64,") !== -1) {
      base64Data = base64Data.split("base64,")[1];
    }

    // Decode base64
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);

    // 1. Dapatkan Folder Induk
    var targetFolder = null;
    if (customFolderId && customFolderId.trim() !== "") {
      try {
        targetFolder = DriveApp.getFolderById(customFolderId.trim());
      } catch (err) {
        targetFolder = null;
      }
    }

    if (!targetFolder) {
      var folders = DriveApp.getFoldersByName(parentFolderName);
      if (folders.hasNext()) {
        targetFolder = folders.next();
      } else {
        targetFolder = DriveApp.createFolder(parentFolderName);
      }
    }

    // 2. Cipta / Dapatkan Subfolder Khas bagi Kes Aduan (Contoh: [ADN-2026-001] Ahmad)
    var caseFolder = targetFolder;
    if (noRujukan && noRujukan.trim() !== "") {
      var safeName = namaPengadu ? (" - " + namaPengadu.trim().substring(0, 30)) : "";
      var subfolderName = "[" + noRujukan.trim() + "]" + safeName;
      var subFolders = targetFolder.getFoldersByName(subfolderName);
      if (subFolders.hasNext()) {
        caseFolder = subFolders.next();
      } else {
        caseFolder = targetFolder.createFolder(subfolderName);
      }
    }

    // 3. Simpan fail ke Google Drive
    var file = caseFolder.createFile(blob);
    
    // Set perkongsian supaya pautan gambar boleh dipaparkan
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (permErr) {
      // Abaikan jika domain korporat melarang public link
    }

    var fileId = file.getId();
    var webViewLink = file.getUrl();
    var downloadUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

    return createJsonResponse({
      status: "success",
      message: "Gambar berjaya dimuat naik ke Google Drive",
      fileId: fileId,
      webViewLink: webViewLink,
      downloadUrl: downloadUrl,
      fileName: filename,
      folderName: caseFolder.getName(),
      uploadedAt: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Ralat pemprosesan Apps Script: " + err.toString()
    });
  }
}

function doGet(e) {
  return createJsonResponse({
    status: "online",
    message: "Google Drive Upload Webhook Service is active and responding.",
    timestamp: new Date().toISOString()
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const DEFAULT_DRIVE_CONFIG: GoogleDriveConfig = {
  webhookUrl: '',
  folderId: '',
  folderName: 'Sistem Aduan - Bukti Siasatan',
  autoUpload: true,
  isEnabled: false,
};

class GoogleDriveService {
  private config: GoogleDriveConfig = DEFAULT_DRIVE_CONFIG;
  private listeners: ((config: GoogleDriveConfig) => void)[] = [];

  constructor() {
    this.loadInitialConfig();
    this.initFirestoreListener();
  }

  private loadInitialConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = { ...DEFAULT_DRIVE_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error loading initial Google Drive config from localStorage:', e);
    }
  }

  private initFirestoreListener() {
    if (!db) return;
    try {
      const configDoc = doc(db, 'system_config', 'google_drive');
      onSnapshot(configDoc, (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as GoogleDriveConfig;
          this.config = { ...DEFAULT_DRIVE_CONFIG, ...remoteData };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
          } catch (e) {
            // ignore
          }
          this.notify();
        }
      }, (err) => {
        console.warn('Firestore Google Drive config listener note:', err?.message || err);
      });
    } catch (e) {
      console.warn('Failed to init Firestore Google Drive listener:', e);
    }
  }

  public subscribe(callback: (config: GoogleDriveConfig) => void): () => void {
    this.listeners.push(callback);
    callback(this.config);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.config));
  }

  public getConfig(): GoogleDriveConfig {
    return { ...this.config };
  }

  public async saveConfig(newConfig: Partial<GoogleDriveConfig>): Promise<GoogleDriveConfig> {
    this.config = {
      ...this.config,
      ...newConfig,
      isEnabled: Boolean(newConfig.webhookUrl?.trim() || this.config.webhookUrl?.trim()),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    this.notify();

    // Sync to Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'system_config', 'google_drive'), this.config, { merge: true });
      } catch (e) {
        console.warn('Failed to sync Google Drive config to Firestore:', e);
      }
    }

    return this.config;
  }

  /**
   * Test Connection to Google Apps Script Web App
   */
  public async testConnection(urlToTest?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = (urlToTest || this.config.webhookUrl || '').trim();
    if (!targetUrl) {
      return { success: false, message: 'URL Webhook Google Apps Script tidak boleh kosong.' };
    }

    if (!targetUrl.startsWith('https://script.google.com/')) {
      return {
        success: false,
        message: 'URL tidak sah. Sila pastikan URL bermula dengan https://script.google.com/macros/s/...',
      };
    }

    try {
      // Test sending a lightweight GET or POST ping
      const res = await fetch(targetUrl, {
        method: 'GET',
        mode: 'cors',
      });

      if (res.ok) {
        const text = await res.text();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = null;
        }

        const msg = parsed?.message || 'Sambungan ke Google Apps Script berjaya disahkan!';
        await this.saveConfig({
          lastTestedAt: new Date().toISOString(),
          lastTestStatus: 'success',
          lastTestMessage: msg,
        });

        return { success: true, message: msg };
      } else {
        throw new Error(`Respons pelayan status HTTP ${res.status}`);
      }
    } catch (err: any) {
      // Even if CORS limits reading the full GET response in some environments, test POST with a small ping
      try {
        const postRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            testPing: true,
            folderName: this.config.folderName || 'Sistem Aduan - Bukti Siasatan',
          }),
        });

        if (postRes.ok) {
          const postText = await postRes.text();
          let parsed: any;
          try {
            parsed = JSON.parse(postText);
          } catch {
            parsed = null;
          }

          if (parsed && parsed.status === 'success') {
            await this.saveConfig({
              lastTestedAt: new Date().toISOString(),
              lastTestStatus: 'success',
              lastTestMessage: 'Sambungan webhook Google Drive disahkan aktif!',
            });
            return { success: true, message: 'Sambungan Webhook Google Drive aktif dan berfungsi!' };
          }
        }
      } catch (postErr) {
        // Continue to error return
      }

      const errorMsg = `Tidak dapat menghubungi Webhook: ${err?.message || 'Sila pastikan "Who has access" diset kepada "Anyone" semasa Deploy.'}`;
      await this.saveConfig({
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: 'error',
        lastTestMessage: errorMsg,
      });

      return {
        success: false,
        message: errorMsg,
      };
    }
  }

  /**
   * Upload an image (base64 DataURL or raw base64) to Google Drive via Apps Script Webhook
   */
  public async uploadImageToDrive(params: {
    base64Data: string;
    filename?: string;
    noRujukan?: string;
    namaPengadu?: string;
    mimeType?: string;
  }): Promise<{
    success: boolean;
    driveUrl?: string;
    driveFileId?: string;
    driveDownloadUrl?: string;
    driveFolderName?: string;
    error?: string;
  }> {
    const config = this.getConfig();
    if (!config.webhookUrl || !config.webhookUrl.trim()) {
      return {
        success: false,
        error: 'Google Drive Webhook belum dikonfigurasi dalam Tetapan Sistem.',
      };
    }

    try {
      const payload = {
        base64: params.base64Data,
        filename: params.filename || `bukti_${params.noRujukan || 'aduan'}_${Date.now()}.jpg`,
        noRujukan: params.noRujukan || '',
        namaPengadu: params.namaPengadu || '',
        folderName: config.folderName || 'Sistem Aduan - Bukti Siasatan',
        folderId: config.folderId || '',
        mimeType: params.mimeType || 'image/jpeg',
      };

      const response = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Ralat memuat naik ke Google Drive`);
      }

      const resText = await response.text();
      let result: any;
      try {
        result = JSON.parse(resText);
      } catch (e) {
        throw new Error('Respons daripada Google Apps Script bukan format JSON yang sah.');
      }

      if (result.status === 'success' && result.webViewLink) {
        return {
          success: true,
          driveUrl: result.webViewLink,
          driveFileId: result.fileId,
          driveDownloadUrl: result.downloadUrl,
          driveFolderName: result.folderName,
        };
      } else {
        throw new Error(result.message || 'Gagal memproses muat naik Google Drive.');
      }
    } catch (err: any) {
      console.error('Error uploading image to Google Drive:', err);
      return {
        success: false,
        error: err?.message || 'Ralat muat naik ke Google Drive',
      };
    }
  }
}

export const googleDriveService = new GoogleDriveService();
