import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";
import { toast } from "react-toastify";
import { FiRotateCw, FiTrash2 } from "react-icons/fi";

type LocalImage = {
  url: string;
  rotation: number;
  file?: File; // only present before upload
};

export interface ImageUploadWithRotateProps {
  bucket: string;
  folder: string;
  value?: string[];
  onChange?: (urls: string[]) => void;
  onUpload?: (urls: string[]) => void;
}

export default function ImageUploadWithRotate({
  bucket,
  folder,
  value = [],
  onChange,
}: ImageUploadWithRotateProps) {
  const [localImages, setLocalImages] = useState<LocalImage[]>(
    value.map((url) => ({ url, rotation: 0 })),
  );

  useEffect(() => {
    setLocalImages(value.map((url) => ({ url, rotation: 0 })));
  }, [value]);

  // Upload a single image (with rotation applied)
  const uploadRotatedImage = async (img: LocalImage): Promise<string> => {
    if (!img.file) return img.url;

    try {
      const imgEl = new Image();
      imgEl.src = URL.createObjectURL(img.file);
      await new Promise((res) => (imgEl.onload = res));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const rotation = img.rotation;
      const isVertical = rotation % 180 !== 0;
      canvas.width = isVertical ? imgEl.height : imgEl.width;
      canvas.height = isVertical ? imgEl.width : imgEl.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
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

      const file = new File([blob], img.file.name, { type: blob.type });

      const { data: uploadData, error } = await supabase.storage
        .from(bucket)
        .upload(`${folder}/${file.name}`, file, { upsert: true });

      if (error || !uploadData) throw error || new Error("Upload failed");

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);
      if (!data?.publicUrl) throw new Error("Failed to get public URL");

      return data.publicUrl;
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || err));
      return img.url;
    }
  };

  // Handle multiple file selection
  const handleFiles = (files: FileList) => {
    const newImages = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      rotation: 0,
      file,
    }));

    setLocalImages((prev) => [...prev, ...newImages]);
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
  };

  const uploadAll = async () => {
    const uploadedUrls = await Promise.all(localImages.map(uploadRotatedImage));
    setLocalImages((imgs) =>
      imgs.map((img, i) => ({ ...img, url: uploadedUrls[i], file: undefined })),
    );
    onChange?.(uploadedUrls);
    toast.success("All images uploaded!");
  };

  return (
    <div className="space-y-4">
      {/* Preview / Uploaded Images */}
      {localImages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Images</p>
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
                  <button
                    type="button"
                    onClick={() => rotateImage(img.url)}
                    className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100"
                    title="Rotate 90°"
                  >
                    <FiRotateCw size={16} />
                  </button>
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
        </div>
      )}

      {/* File Input */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">Add Images</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>

      {/* Upload Button */}
      {localImages.some((img) => img.file) && (
        <button
          type="button"
          onClick={uploadAll}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Upload All
        </button>
      )}
    </div>
  );
}
