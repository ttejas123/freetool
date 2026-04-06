import { getStorage } from '@/services/storage';
import { generateShortLink } from '@/tools/tinyurl-generator/utils';

export type SharedFile = {
  id: string;
  url: string;
  size: number;
  expiresAt: Date;
};

const DEVICE_ID_KEY = 'ft_device_id';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Uploads a file using the underlying StorageService and logs the record in the database.
 */
export async function uploadFileAndLog(file: File, deviceId: string): Promise<SharedFile> {
  // 1. Upload the file to storage
  const storage = await getStorage();
  const result = await storage.upload(file, 'shares/');

  if (!result.url) {
    throw new Error('Failed to get public URL for upload.');
  }

  // 2. Log to Database
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // If not configured, we'll gracefully degrade and just return the storage URL
    try {
      const shortLink = await generateShortLink(result.url);
      return {
        id: result.key,
        url: shortLink.shortUrl,
        size: file.size,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      };
    } catch {
      return {
        id: result.key,
        url: result.url,
        size: file.size,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      };
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const id = crypto.randomUUID();

  // We rely on the Supabase SQL schema created earlier
  const { error } = await supabase.from('file_uploads').insert({
    id,
    device_id: deviceId,
    file_name: file.name,
    file_size: file.size,
    url: result.url,
  });

  if (error) {
    console.error('Failed to log upload in DB', error);
  }

  try {
    const shortLink = await generateShortLink(result.url);
    return {
      id,
      url: shortLink.shortUrl,
      size: file.size,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    };
  } catch {
    return {
      id,
      url: result.url,
      size: file.size,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    };
  }
}

/**
 * Returns sum of file sizes uploaded by this device today
 */
export async function getTodaysUploadSize(deviceId: string): Promise<number> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return 0;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get start of today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('file_uploads')
    .select('file_size')
    .eq('device_id', deviceId)
    .gte('created_at', startOfDay.toISOString());

  if (error || !data) {
    console.error('Failed to get today usage', error);
    return 0;
  }

  return data.reduce((acc, row) => acc + Number(row.file_size), 0);
}

/**
 * Returns the recent upload history for this device
 */
export async function getUploadHistory(deviceId: string): Promise<SharedFile[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('file_uploads')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) {
    console.error('Failed to get upload history', error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    url: row.url,
    size: Number(row.file_size),
    expiresAt: new Date(new Date(row.created_at).getTime() + 48 * 60 * 60 * 1000)
  }));
}
