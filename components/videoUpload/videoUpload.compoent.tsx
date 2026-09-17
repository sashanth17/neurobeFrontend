"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, X, Trash2 } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string | null;
  video: string;
  duration: number | null;
  order: number;
  created_at: string;
}
interface VideoUploadProps {
  onVideoChange: (video: File | null) => void;
  onVideoRemove?: any;
  onExistingVideoRemove?: () => void; 
  existingVideo?: Video | null;
  propertyId?: string;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  isLoading?: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoChange,
  onVideoRemove,
  onExistingVideoRemove,
  existingVideo,
  acceptedFormats = [
    "mp4",
    "webm",
    "ogg",
    // "mov",
    // "avi",
    // "mkv",
    // "mpeg",
    // "mpg",
    // "wmv",
    // "flv",
    // "3gp",
    // "m4v",
  ],
  maxSizeMB = 50,
  isLoading = false,
}) => {
  const [video, setVideo] = useState<{ file: File; preview: string } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileExtension = (filename: string): string => {
    return filename
      .slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
      .toLowerCase();
  };

  const processFile = (file: File) => {
    setError("");

    const fileExtension = getFileExtension(file.name);

    if (!acceptedFormats.includes(fileExtension)) {
      setError(
        `Invalid file format: ${
          file.name
        }. Please upload ${acceptedFormats.join(", ")} videos.`
      );
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large: ${file.name}. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    const preview = URL.createObjectURL(file);
    const newVideo = { file, preview };
    setVideo(newVideo);
    onVideoChange(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
      event.target.value = "";
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      processFile(event.dataTransfer.files[0]);
    }
  }, []);

  const removeExistingVideo = async () => {
    try {
      setIsRemoving(true);
      await onVideoRemove();

      if (onExistingVideoRemove) {
        onExistingVideoRemove();
      }

      setVideo(null);
    } catch (error) {
      console.error("Error removing video:", error);
      setError("Failed to remove video. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  const removeNewVideo = async () => {
    if (video) {
      URL.revokeObjectURL(video.preview);
    }
    setVideo(null);
    onVideoChange(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const acceptAttribute = acceptedFormats
    .map((format) => `.${format}`)
    .join(",");

  const showVideoPreview = existingVideo || video;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      {!showVideoPreview && (
        <div
          className={`
            cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }
            ${error ? "border-red-300" : ""}
            ${isLoading ? "cursor-not-allowed opacity-50" : ""}
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
          onClick={!isLoading ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttribute}
            onChange={handleFileInput}
            className="hidden"
            disabled={isLoading}
          />

          <Upload
            className={`mx-auto mb-4 h-12 w-12 ${
              isLoading ? "text-gray-300" : "text-[#000]"
            }`}
          />

          <div className="space-y-2">
            <p
              className={`text-lg font-semibold ${
                isLoading ? "text-[#000]" : "text-[#000]"
              }`}
            >
              {isLoading ? "Uploading..." : "Upload/Drag your video"}
            </p>
            <p
              className={`text-sm ${
                isLoading ? "text-[#000]" : "text-[#000]"
              }`}
            >
              Supported formats: {acceptedFormats.join(", ")} <br />
              <strong>Max size: {maxSizeMB}MB</strong>
            </p>
            {!isLoading && (
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-transparent bg-dblue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
              >
                Browse Files
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {showVideoPreview && (
        <div className="relative">
          <div className="relative w-full max-w-lg overflow-hidden rounded-lg border bg-black">
            <video
              src={existingVideo ? existingVideo.video : video?.preview}
              controls
              className="h-64 w-full object-contain"
            />

            <button
              type="button"
              onClick={removeExistingVideo}
              disabled={isRemoving || isLoading}
              className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
              title={existingVideo ? "Remove video" : "Remove new video"}
            >
              {isRemoving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>

          
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
