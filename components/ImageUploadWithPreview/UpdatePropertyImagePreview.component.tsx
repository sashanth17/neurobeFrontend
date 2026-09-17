import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ImageUploadProps {
  existingImages?: string[];
  onImagesChange: (images: File[]) => void;
  onDeleteImage?: (imageUrl: string) => void;
  maxFiles?: number;
  acceptedFormats?: string[];
  minWidth?: number;
  minHeight?: number;
  title?: string;
  description?: string;
  validateDimensions?: boolean;
  isSingleImage?: boolean;
}

const UpdatePropertyImagePreview: React.FC<ImageUploadProps> = ({
  existingImages = [],
  onImagesChange,
  onDeleteImage,
  maxFiles = 10,
  acceptedFormats = ["image/jpeg", "image/png"],
  minWidth = 2048,
  minHeight = 768,
  title = "Upload/Drag photos",
  description,
  validateDimensions = true,
  isSingleImage = false,
}) => {
  const [images, setImages] = useState<{ file?: File; preview: string; isExisting: boolean }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existingImageItems = existingImages?.map((url) => ({
      preview: url,
      isExisting: true,
    }));
    setImages(existingImageItems);
  }, [existingImages]);

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const isValid = img.width >= minWidth && img.height >= minHeight;
        URL.revokeObjectURL(img.src);
        resolve(isValid);
      };
      img.onerror = () => resolve(false);
    });
  };

  const processFiles = async (files: FileList) => {
    const newImages: { file: File; preview: string; isExisting: boolean }[] = [];
    setError("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!acceptedFormats.includes(file.type)) {
        setError(
          `Invalid file format: ${file.name}. Please upload JPEG or PNG files.`
        );
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
        continue;
      }

      if (validateDimensions) {
        const isValidDimensions = await validateImage(file);
        if (!isValidDimensions) {
          setError(
            `Invalid dimensions for ${file.name}. Minimum required: ${minWidth}x${minHeight} pixels.`
          );
          continue;
        }
      }

      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview, isExisting: false });
    }

    if (newImages.length > 0) {
      const updatedImages = isSingleImage
        ? [...images.filter(img => img.isExisting), ...newImages].slice(0, maxFiles)
        : [...images, ...newImages].slice(0, maxFiles);
      setImages(updatedImages);
      onImagesChange(updatedImages.filter(img => img.file).map((img) => img.file!));
    }
  };

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (event.dataTransfer.files) {
        await processFiles(event.dataTransfer.files);
      }
    },
    [images]
  );

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];

    if (imageToRemove.isExisting && onDeleteImage) {
      onDeleteImage(imageToRemove.preview);
    }

    if (!imageToRemove.isExisting) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages.filter(img => img.file).map((img) => img.file!));
    setError("");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 120;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
          ${error ? "border-red-300" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={!isSingleImage}
          accept={acceptedFormats.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />

        <Upload className="mx-auto mb-4  w-12 text-blue-500" />

        <div className="space-y-2">
          <p className="text-lg font-semibold text-[#000]">{title}</p>
          {description ? (
            <p className="text-sm text-[#000]">{description}</p>
          ) : (
            validateDimensions && (
              <p className="text-sm text-[#000]">
                Photos must be JPEG or PNG format and at least {minWidth}x
                {minHeight}
              </p>
            )
          )}
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
          >
            Browse Files
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {images?.length > 0 && (
        <div className={`mt-6 ${isSingleImage ? '' : 'relative'}`}>
          {!isSingleImage && images?.length > 3 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scroll("left");
              }}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-[#000]" />
            </button>
          )}

          <div
            ref={scrollRef}
            className={`flex gap-4 overflow-x-auto scroll-smooth ${
              isSingleImage ? '' : 'px-8 py-5'
            }`}
          >
            {images?.map((image: any, index: number) => (
              <div key={index} className="group relative flex-shrink-0 p-2">
                <div
                  className={`overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-all hover:shadow-md  ${
                    isSingleImage ? 'h-32 w-32' : 'h-28 w-28'
                  }`}
                >
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute -right-2 -top-0 rounded-full bg-red-500 p-1.5 text-white shadow-md transition-all hover:bg-red-600 hover:scale-110"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {!isSingleImage && images.length > 3 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scroll("right");
              }}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5 text-[#000]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UpdatePropertyImagePreview;
