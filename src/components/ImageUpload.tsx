import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";
import { FiUpload, FiTrash2, FiRotateCw } from "react-icons/fi";
import { toast } from "react-toastify";

export interface ImageUploadProps {
  bucket: string;
  folder: string;
  value?: string[]; // existing images
  onUpload?: (urls: string[]) => void; // called after successful upload
  onChange?: (urls: string[]) => void; // called whenever images change
  autoUpload?: boolean; // if true, files upload immediately on selection
  allowRotate?: boolean; // if true, show rotate buttons
}

type LocalImage = {
  url: string;
  file?: File; // only present before upload
  rotation: number; // degrees
};

const brandColor = "#d6c47f";

export default function ImageUpload({
  bucket,
  folder,
  value = [],
  onUpload,
  onChange,
  autoUpload = true,
  allowRotate = false,
}: ImageUploadProps) {
  const [localImages, setLocalImages] = useState<LocalImage[]>(
    value.map((url) => ({ url, rotation: 0 })),
  );
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLocalImages(value.map((url) => ({ url, rotation: 0 })));
  }, [value]);

  // Upload a single image, handling rotation if needed
  const uploadFile = async (img: LocalImage): Promise<string> => {
    if (!img.file) return img.url;

    try {
      let fileToUpload = img.file;

      // Apply rotation if allowed
      if (allowRotate && img.rotation !== 0) {
        const imgEl = new Image();
        imgEl.src = URL.createObjectURL(img.file);
        await new Promise((res) => (imgEl.onload = res));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");

        const isVertical = img.rotation % 180 !== 0;
        canvas.width = isVertical ? imgEl.height : imgEl.width;
        canvas.height = isVertical ? imgEl.width : imgEl.height;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((img.rotation * Math.PI) / 180);
        ctx.drawImage(
          imgEl,
          -imgEl.width / 2,
          -imgEl.height / 2,
          imgEl.width,
          imgEl.height,
        );

        const type = img.file.type || "image/jpeg";
        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob(res, type, type === "image/jpeg" ? 1 : undefined),
        );
        if (!blob) throw new Error("Failed to convert canvas to blob");

        fileToUpload = new File([blob], img.file.name, { type: blob.type });
      }

      const fileName = `${crypto.randomUUID()}-${fileToUpload.name}`;
      const filePath = `${folder}/${fileName}`;

      const { data: uploadData, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, { upsert: true });

      if (error || !uploadData) throw error || new Error("Upload failed");

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);
      if (!data?.publicUrl) throw new Error("Failed to get public URL");

      return data.publicUrl;
    } catch (err: any) {
      toast.error(`Upload failed: ${img.file?.name} - ${err.message || err}`);
      return img.url;
    }
  };

  // Handle multiple file selection
  const handleFiles = (files: FileList) => {
    const newImages: LocalImage[] = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      file,
      rotation: 0,
    }));

    setLocalImages((prev) => [...prev, ...newImages]);
    onChange?.([
      ...localImages.map((i) => i.url),
      ...newImages.map((i) => i.url),
    ]);

    if (autoUpload) {
      newImages.forEach((img) => uploadSingle(img));
    }
  };

  // Upload a single image and update state
  const uploadSingle = async (img: LocalImage) => {
    setUploading(true);
    const url = await uploadFile(img);
    setLocalImages((prev) =>
      prev.map((i) => (i.url === img.url ? { ...i, url, file: undefined } : i)),
    );
    onUpload?.([...localImages.filter((i) => !i.file).map((i) => i.url), url]);
    setUploading(false);
  };

  // Upload all images (manual upload mode)
  const uploadAll = async () => {
    setUploading(true);
    const uploadedUrls = await Promise.all(localImages.map(uploadFile));
    setLocalImages(uploadedUrls.map((url) => ({ url, rotation: 0 })));
    onUpload?.(uploadedUrls);
    onChange?.(uploadedUrls);
    setUploading(false);
    toast.success("All images uploaded!");
  };

  const rotateImage = (url: string) => {
    setLocalImages((imgs) =>
      imgs.map((img) =>
        img.url === url ? { ...img, rotation: (img.rotation + 90) % 360 } : img,
      ),
    );
  };

  const removeImage = (url: string) => {
    const updated = localImages.filter((img) => img.url !== url);
    setLocalImages(updated);
    onChange?.(updated.map((img) => img.url));
    onUpload?.(updated.filter((i) => !i.file).map((i) => i.url));
  };

  return (
    <div className="flex flex-col gap-4">
      {localImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {localImages.map((img) => (
            <div key={img.url} className="relative group">
              <img
                src={img.url}
                alt="uploaded"
                className="w-full object-contain rounded-lg border"
                style={{
                  transform: `rotate(${img.rotation}deg)`,
                  maxHeight: "400px",
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {allowRotate && (
                  <button
                    type="button"
                    onClick={() => rotateImage(img.url)}
                    className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100"
                    title="Rotate 90°"
                  >
                    <FiRotateCw size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.url)}
                  className="bg-white text-red-600 p-2 rounded-full hover:bg-gray-100"
                  title="Remove"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
              {img.file && (
                <span className="absolute bottom-1 left-1 text-xs text-gray-600 bg-white px-1 rounded">
                  Preview
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Input */}
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
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </label>

      {/* Upload All Button for manual upload */}
      {!autoUpload && localImages.some((img) => img.file) && (
        <button
          type="button"
          onClick={uploadAll}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Upload All
        </button>
      )}

      {uploading && <span className="text-xs text-gray-600">Uploading...</span>}
    </div>
  );
}
