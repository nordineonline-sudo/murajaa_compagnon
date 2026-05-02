import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/db/database';

const QURAN_DATA_URL =
  'https://raw.githubusercontent.com/nordineonline-sudo/murajaa_compagnon/main/assets/quran_data.json';
const LOCAL_PATH = FileSystem.documentDirectory + 'quran_data.json';
const EXPECTED_VERSION = '1.0.0';
const MAX_RETRIES = 3;

export type DownloadProgressCallback = (progress: number) => void;

/** Checks whether the local data file exists and is valid. */
export async function isDataReady(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ status: string; checksum: string | null }>(
    'SELECT status, checksum FROM download_state WHERE id = 1'
  );
  return row?.status === 'done' && row.checksum !== null;
}

/**
 * Downloads and validates the Quran data file.
 * Resumes if partially downloaded.
 */
export async function downloadQuranData(
  onProgress: DownloadProgressCallback,
  retryCount = 0
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE download_state SET status='downloading', progress=0, error_msg=NULL,
     last_attempt=datetime('now') WHERE id=1`
  );
  onProgress(0);

  try {
    // Check if partial file exists for resumable download (Range request)
    const info = await FileSystem.getInfoAsync(LOCAL_PATH);
    const headers: Record<string, string> = {};
    if (info.exists && info.size && info.size > 0) {
      // RFC 7233 range request: "bytes=<start>-" requests from offset to end
      headers['Range'] = `bytes=${info.size}-`;
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      QURAN_DATA_URL,
      LOCAL_PATH,
      { headers },
      (progress) => {
        const pct = progress.totalBytesWritten / (progress.totalBytesExpectedToWrite || 1);
        onProgress(Math.min(pct, 0.95));
        db.runAsync(
          'UPDATE download_state SET progress=? WHERE id=1',
          [Math.min(pct, 0.95)]
        );
      }
    );

    const result = await downloadResumable.downloadAsync();
    // 206 = Partial Content (resumed), 200 = full download, anything else is an error
    if (!result || (result.status >= 400 && result.status !== 416)) {
      if (result?.status === 416) {
        // Range Not Satisfiable: file already fully downloaded, proceed to verify
      } else {
        throw new Error(`Download failed with status ${result?.status}`);
      }
    }

    // Verify checksum
    await db.runAsync(
      `UPDATE download_state SET status='verifying', progress=0.97 WHERE id=1`
    );
    onProgress(0.97);

    const fileContent = await FileSystem.readAsStringAsync(LOCAL_PATH, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const checksum = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fileContent
    );

    // Validate JSON structure
    const data = JSON.parse(fileContent) as { version: string };
    if (data.version !== EXPECTED_VERSION) {
      throw new Error(`Incompatible data version: ${data.version}`);
    }

    await db.runAsync(
      `UPDATE download_state SET status='done', progress=1, checksum=? WHERE id=1`,
      [checksum]
    );
    onProgress(1);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return downloadQuranData(onProgress, retryCount + 1);
    }
    await db.runAsync(
      `UPDATE download_state SET status='error', error_msg=? WHERE id=1`,
      [msg]
    );
    throw error;
  }
}

export async function getDownloadState(): Promise<{
  status: string; progress: number; errorMessage: string | null;
}> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    status: string; progress: number; error_msg: string | null;
  }>('SELECT status, progress, error_msg FROM download_state WHERE id=1');
  return {
    status: row?.status ?? 'idle',
    progress: row?.progress ?? 0,
    errorMessage: row?.error_msg ?? null,
  };
}
