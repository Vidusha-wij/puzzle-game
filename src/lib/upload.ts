import { supabase, PHOTO_BUCKET } from "./supabase";

/** Upload a file to the public puzzle-photos bucket, return its public URL. */
export async function uploadPhoto(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw error;
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
