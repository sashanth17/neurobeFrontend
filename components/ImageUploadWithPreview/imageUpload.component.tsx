"use client";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  existingImages?: string[];
  onImagesChange: (images: File[]) => void;
  onDeleteImage?: (imageUrl: string) => void;
  acceptedFormats?: string[];
  minWidth?: number;
  minHeight?: number;
  validateDimensions?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  existingImages = [],
  onImagesChange,
  onDeleteImage,
  acceptedFormats = ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  minWidth = 2048,
  minHeight = 768,
  validateDimensions = false,
}) => {
  const [images, setImages] = useState<
    { file?: File; preview: string; isExisting: boolean }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [initialized, setInitialized] = useState(false);

  /* ---------------- Load existing image ---------------- */
  useEffect(() => {
    if (!initialized && existingImages.length > 0) {
      setImages([
        {
          preview: existingImages[0],
          isExisting: true,
        },
      ]);
      setInitialized(true);
    }
  }, [existingImages, initialized]);

  /* ---------------- Validate Image ---------------- */
  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const valid = img.width >= minWidth && img.height >= minHeight;
        URL.revokeObjectURL(objectUrl);
        resolve(valid);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      };

      img.src = objectUrl;
    });
  };

  /* ---------------- Process File ---------------- */
  const processFiles = async (files: FileList) => {
    setError("");

    const file = files[0]; // ✅ only first file

    if (!file) return;

    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file format`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(`File too large (Max 10MB)`);
      return;
    }

    if (validateDimensions) {
      const valid = await validateImage(file);
      if (!valid) {
        setError(`Min size ${minWidth}x${minHeight}`);
        return;
      }
    }

    const preview = URL.createObjectURL(file);

    setImages([{ file, preview, isExisting: false }]);
    onImagesChange([file]);
  };

  /* ---------------- Drag & Drop ---------------- */
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (event.dataTransfer.files?.length) {
        await processFiles(event.dataTransfer.files);
      }
    },
    []
  );

  /* ---------------- File Input ---------------- */
  const handleFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files?.length) {
      await processFiles(event.target.files);
      event.target.value = "";
    }
  };

  /* ---------------- Remove Image ---------------- */
  const removeImage = () => {
    const image = images[0];

    if (image?.isExisting && onDeleteImage) {
      onDeleteImage(image.preview);
    }

    if (image?.file) {
      URL.revokeObjectURL(image.preview);
    }

    setImages([]);
    onImagesChange([]);
    setError("");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="w-full">
      
      {/* ✅ Upload Box */}
      {images.length === 0 && (
        <div
          className={`cursor-pointer rounded-xl border border-dashed p-10 text-center transition ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          } ${error ? "border-red-400" : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(",")}
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>

          <p className="text-base font-semibold text-[#000]">
            Upload college logo
          </p>

          <p className="mt-1 text-sm text-[#000]">
            JPEG, PNG, WEBP (Max 10MB)
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
            className="mt-4 rounded-md bg-dblue px-5 py-2 text-sm text-white"
          >
            Browse Files
          </button>
        </div>
      )}

      {/* ✅ Image Preview */}
      {images.length === 1 && (
        <div className="relative w-fit">
          <div className="h-32 w-32 overflow-hidden rounded-xl border bg-white">
            <img
              src={images[0].preview}
              className="h-full w-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={removeImage}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;