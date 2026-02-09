import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { supabase } from "@/libs/supabaseClient";
import { FiUpload, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";

type Props = {
  bucket: string;
  folder: string;
  value?: string[]; // saved images from parent
  onUpload: (urls: string[]) => void; // ✅ call this when images change
  aspect?: number;
};

const brandColor = "#d6c47f";

export default function ImageUpload({
  bucket,
  folder,
  value = [],
  onUpload,
  aspect = 1,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // ✅ Pending uploads locally
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", reject);
      image.src = url;
    });

  const getCroppedImg = async () => {
    const image = await createImage(imageSrc!);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/png");
    });
  };

  const uploadCroppedImage = async () => {
    try {
      setUploading(true);

      const blob = await getCroppedImg();
      const fileName = `${crypto.randomUUID()}.png`;
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob);
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const url = data.publicUrl;

      // ✅ Add to pending images
      const updatedPending = [...pendingImages, url];
      setPendingImages(updatedPending);

      // ✅ Notify parent of all images (saved + pending)
      onUpload([...value, ...updatedPending]);

      setImageSrc(null);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    let updatedPending = [...pendingImages];
    let updatedValue = [...value];

    if (index >= value.length) {
      // remove from pending
      updatedPending.splice(index - value.length, 1);
      setPendingImages(updatedPending);
    } else {
      // remove from saved value
      updatedValue.splice(index, 1);
    }

    // Notify parent of updated list
    onUpload([...updatedValue, ...updatedPending]);
  };

  const allImages = [...value, ...pendingImages];

  return (
    <div className="flex flex-col gap-4">
      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {allImages.map((img, index) => (
            <div key={img} className="relative">
              <img
                src={img}
                className="w-full aspect-square object-cover rounded-lg border cursor-pointer"
                onClick={() => setPreviewImage(img)}
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

      {/* Upload Button */}
      <label
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer flex flex-col items-center gap-1"
        style={{ borderColor: brandColor }}
      >
        <FiUpload size={22} style={{ color: brandColor }} />
        <span className="text-sm font-medium" style={{ color: brandColor }}>
          Click to upload image
        </span>
        <span className="text-xs text-gray-500">PNG, JPG up to ~5MB</span>

        <input
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => setImageSrc(reader.result as string);
            reader.readAsDataURL(file);
          }}
        />
      </label>

      {/* Crop Modal */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative w-full max-w-lg h-[500px] bg-white rounded-xl overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={uploadCroppedImage}
                className="bg-black text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {uploading && <span className="text-xs">Uploading...</span>}
    </div>
  );
}
