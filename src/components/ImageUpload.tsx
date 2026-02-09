import { useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import { FiUpload, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";

type Props = {
  bucket: string;
  folder: string;
  value?: string[]; // existing images
  onUpload: (urls: string[]) => void;
};

const brandColor = "#d6c47f";

export default function ImageUpload({
  bucket,
  folder,
  value = [],
  onUpload,
}: Props) {
  const [uploading, setUploading] = useState(false);

  // Upload the full image directly to Supabase
  const uploadFullImage = async (file: File) => {
    try {
      setUploading(true);

      // Ensure high quality by uploading the file directly
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (error || !data) throw error || new Error("Upload failed");

      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!publicData?.publicUrl) throw new Error("Failed to get public URL");

      // Notify parent
      onUpload([...value, publicData.publicUrl]);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFullImage(file);
  };

  const removeImage = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onUpload(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((img, index) => (
            <div key={img} className="relative">
              <img
                src={img}
                className="w-full aspect-square object-contain rounded-lg border cursor-pointer"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
              >
                <FiTrash2 size={14} className="text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer flex flex-col items-center gap-1"
        style={{ borderColor: brandColor }}
      >
        <FiUpload size={22} style={{ color: brandColor }} />
        <span className="text-sm font-medium" style={{ color: brandColor }}>
          Click to upload image
        </span>
        <span className="text-xs text-gray-500">PNG, JPG up to ~10MB</span>

        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>

      {uploading && <span className="text-xs text-gray-600">Uploading...</span>}
    </div>
  );
}
