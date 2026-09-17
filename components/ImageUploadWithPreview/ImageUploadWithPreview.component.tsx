import React, { useCallback, useState, useRef, useEffect } from "react";
import { Upload, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  acceptedFormats = ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  minWidth = 2048,
  minHeight = 768,
  title = "Upload/Drag photos",
  description,
  validateDimensions = false,
  isSingleImage = false,
}) => {
  const [images, setImages] = useState<
    { file?: File; preview: string; isExisting: boolean }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Track if we've initialized from existingImages
  const [initialized, setInitialized] = useState(false);

  /* ---------------------------------- */
  /* Load existing images - only once */
  /* ---------------------------------- */
  useEffect(() => {
    if (!initialized && existingImages.length > 0) {
      const existing = existingImages.map((url) => ({
        preview: url,
        isExisting: true,
      }));
      setImages(existing);
      setInitialized(true);
    }
  }, [existingImages, initialized]);

  /* ---------------------------------- */
  /* Validate Image Dimensions */
  /* ---------------------------------- */
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

  /* ---------------------------------- */
  /* Process Files */
  /* ---------------------------------- */
  const processFiles = async (files: FileList) => {
    setError("");
    
    // Process all files first
    const validNewImages: {
      file: File;
      preview: string;
      isExisting: boolean;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!acceptedFormats.includes(file.type)) {
        setError(`Invalid file format: ${file.name}`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name} (Max 10MB)`);
        continue;
      }

      if (validateDimensions) {
        const valid = await validateImage(file);
        if (!valid) {
          setError(
            `Invalid dimensions for ${file.name}. Min ${minWidth}x${minHeight}`
          );
          continue;
        }
      }

      const preview = URL.createObjectURL(file);
      validNewImages.push({ file, preview, isExisting: false });
    }

    if (validNewImages.length > 0) {
      // Use functional update to ensure we have the latest state
      setImages(prevImages => {
        let updatedImages;

        if (isSingleImage) {
          // For single image, keep existing images and add the new one (or replace if you want)
          const existingOnly = prevImages.filter(img => img.isExisting);
          updatedImages = [...existingOnly, validNewImages[0]];
        } else {
          // For multiple images, append new ones
          updatedImages = [...prevImages, ...validNewImages];
        }

        // Apply max files limit
        updatedImages = updatedImages.slice(0, maxFiles);

        // Extract files for callback
        const filesToSend = updatedImages
          .filter((img) => img.file)
          .map((img) => img.file!) as File[];

        // Call the callback with the updated files
        onImagesChange(filesToSend);

        return updatedImages;
      });
    }
  };

  /* ---------------------------------- */
  /* Drag & Drop */
  /* ---------------------------------- */
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      if (event.dataTransfer.files?.length) {
        await processFiles(event.dataTransfer.files);
      }
    },
    [processFiles] // Add processFiles to dependencies
  );

  /* ---------------------------------- */
  /* File Input */
  /* ---------------------------------- */
  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      await processFiles(event.target.files);
      event.target.value = "";
    }
  };

  /* ---------------------------------- */
  /* Remove Image */
  /* ---------------------------------- */
  const removeImage = (index: number) => {
    setImages(prevImages => {
      const imageToRemove = prevImages[index];

      if (imageToRemove.isExisting && onDeleteImage) {
        onDeleteImage(imageToRemove.preview);
      }

      if (!imageToRemove.isExisting) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      const updated = prevImages.filter((_, i) => i !== index);

      const filesToSend = updated
        .filter((img) => img.file)
        .map((img) => img.file!) as File[];

      onImagesChange(filesToSend);
      
      return updated;
    });
    
    setError("");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -150 : 150,
        behavior: "smooth",
      });
    }
  };

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */
  return (
    <div className="w-full ">
      <div
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:bg-gray-50"
        } ${error ? "border-red-300" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
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

        <Upload className="mx-auto mb-4 h-5 w-15 text-blue-500" />

        <p className="text-lg font-semibold text-[#000]">{title}</p>
        <p className="text-sm text-[#000]">
          {description ||
            `Allowed: JPEG, PNG, WEBP (Max 10MB each)`}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openFileDialog();
          }}
          className="mt-4 rounded-md bg-dblue px-6 py-2 text-white hover:bg-blue-700"
        >
          Browse Files
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {images?.length > 0 && (
        <div className="relative ">
          {!isSingleImage && images.length > 3 && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto py-3"
          >
            {images?.map((image, index) => (
              <div key={`${image.preview}-${index}`} className="relative flex-shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-lg border bg-white">
                  <img
                    src={image.preview}
                    alt="preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error("Image failed to load:", image.preview);
                      e.currentTarget.src = "https://via.placeholder.com/150?text=Error";
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {!isSingleImage && images.length > 3 && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UpdatePropertyImagePreview;