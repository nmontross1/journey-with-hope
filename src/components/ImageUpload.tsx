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
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);

  const uploadFile = async (file: File, previewUrl: string) => {
    try {
      setUploading(true);

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

      // Remove preview and add the real URL
      setPreviews((prev) => prev.filter((p) => p.url !== previewUrl));
      onUpload([...value, publicData.publicUrl]);
      toast.success(`Uploaded: ${file.name}`);
    } catch (err: any) {
      toast.error(`Upload failed: ${file.name} - ${err.message || err}`);
      setPreviews((prev) => prev.filter((p) => p.url !== previewUrl));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);

    const newPreviews = filesArray.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    // Add previews to state
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Start uploading all files in parallel
    newPreviews.forEach(({ file, url }) => uploadFile(file, url));

    // Reset the input so the same file can be selected again if needed
    e.target.value = "";
  };

  const removeImage = (index: number, isPreview = false) => {
    if (isPreview) {
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      const updated = [...value];
      updated.splice(index, 1);
      onUpload(updated);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {(value.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {/* Uploaded images */}
          {value.map((img, index) => (
            <div key={img} className="relative">
              <img
                src={img}
                className="w-full max-h-80 object-contain rounded-lg border cursor-pointer"
                style={{ maxHeight: "400px" }}
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

          {/* Preview images */}
          {previews.map((p, index) => (
            <div key={p.url} className="relative opacity-70">
              <img
                src={p.url}
                className="w-full max-h-80 object-contain rounded-lg border cursor-pointer"
                style={{ maxHeight: "400px" }}
              />
              <button
                type="button"
                onClick={() => removeImage(index, true)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
              >
                <FiTrash2 size={14} className="text-red-600" />
              </button>
              <span className="absolute bottom-1 left-1 text-xs text-gray-600 bg-white px-1 rounded">
                Uploading...
              </span>
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
          Click to upload images
        </span>
        <span className="text-xs text-gray-500">PNG, JPG up to ~10MB</span>

        <input
          type="file"
          hidden
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
      </label>

      {uploading && <span className="text-xs text-gray-600">Uploading...</span>}
    </div>
  );
}
