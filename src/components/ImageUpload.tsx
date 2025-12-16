import { useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import { FiUpload, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";

type Props = {
  bucket: string;
  folder: string;
  value?: string;
  onUpload: (url: string) => void;
};

const brandColor = "#d6c47f";

export default function ImageUpload({
  bucket,
  folder,
  value,
  onUpload,
}: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);

      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      onUpload(data.publicUrl);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preview */}
      {value ? (
        <div className="relative w-full max-w-xs">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-40 rounded-lg object-cover border"
          />
          <button
            type="button"
            onClick={() => onUpload("")}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
          >
            <FiTrash2 className="text-red-600" />
          </button>
        </div>
      ) : (
        <label
          className="flex flex-col items-center justify-center gap-2
                     border-2 border-dashed rounded-lg p-6
                     cursor-pointer transition-colors
                     hover:bg-gray-50"
          style={{ borderColor: brandColor }}
        >
          <FiUpload size={22} style={{ color: brandColor }} />
          <span className="text-sm font-medium" style={{ color: brandColor }}>
            Click to upload image
          </span>
          <span className="text-xs text-gray-500">PNG, JPG up to ~5MB</span>

          <input
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
        </label>
      )}

      {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
    </div>
  );
}
