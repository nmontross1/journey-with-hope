import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { FiRotateCw, FiTrash2 } from "react-icons/fi";

type Props = {
  bucket: string;
  folder: string;
  value?: string[];
  onUpload: (urls: string[]) => void;
  aspect?: number;
};

export default function ImageUploadWithRotate({
  bucket,
  folder,
  value = [],
  onUpload,
  aspect = 1,
}: Props) {
  const [rotations, setRotations] = useState<Record<string, number>>({});

  const rotateImage = (url: string) => {
    setRotations((prev) => ({
      ...prev,
      [url]: ((prev[url] || 0) + 90) % 360,
    }));
  };

  const removeImage = (urlToRemove: string) => {
    const updated = value.filter((url) => url !== urlToRemove);
    onUpload(updated);
    setRotations((prev) => {
      const newRotations = { ...prev };
      delete newRotations[urlToRemove];
      return newRotations;
    });
  };

  return (
    <div className="space-y-4">
      {/* Display images with rotation controls */}
      {value.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Uploaded Images</p>
          <div className="grid grid-cols-3 gap-3">
            {value.map((img) => {
              const rotation = rotations[img] || 0;
              return (
                <div key={img} className="relative group">
                  <img
                    src={img}
                    alt="uploaded"
                    className="w-full aspect-square object-cover rounded-lg border"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => rotateImage(img)}
                      className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100"
                      title="Rotate 90°"
                    >
                      <FiRotateCw size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="bg-white text-red-600 p-2 rounded-full hover:bg-gray-100"
                      title="Remove"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload new images */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">Add More Images</p>
        <ImageUpload
          bucket={bucket}
          folder={folder}
          value={[]}
          onUpload={(newUrls) => onUpload([...value, ...newUrls])}
          aspect={aspect}
        />
      </div>
    </div>
  );
}
