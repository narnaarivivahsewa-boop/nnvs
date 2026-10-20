"use client";

import React, { useRef, useState } from "react";
import { ImagePlus, Trash2, Star, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/image-compressor";

interface PhotosFormProps {
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  uploading: boolean;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PhotosForm({
  photos,
  setPhotos,
  uploading,
  setUploading,
}: PhotosFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [toast, setToast] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);

  const showToast = (message: string, type: "error" | "success" | "info" = "error") => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 6000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 3) {
      showToast(`You can only upload up to 3 photos in total. Currently you have ${photos.length}.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setStatusMessage("Processing photos...");

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Max raw upload limit 25MB before compression
        if (file.size > 25 * 1024 * 1024) {
          showToast(`Image "${file.name}" is over 25MB. Please choose a smaller photo.`);
          continue;
        }

        setStatusMessage(`Compressing photo ${i + 1} of ${files.length}...`);
        const optimizedFile = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
        });

        setStatusMessage(`Uploading photo ${i + 1} of ${files.length}...`);
        const formData = new FormData();
        formData.append("file", optimizedFile);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          console.error("Upload failure:", data);
          showToast(data.message || `Failed to upload "${file.name}".`);
          continue;
        }

        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedUrls]);
        showToast("Photos uploaded successfully!", "success");
      }
    } catch (err: any) {
      console.error("Photo upload error:", err);
      showToast("Unable to upload image. Please check your network and try again.");
    } finally {
      setUploading(false);
      setStatusMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const makePrimary = (indexToPrimary: number) => {
    setPhotos((prev) => {
      const chosen = prev[indexToPrimary];
      const remaining = prev.filter((_, idx) => idx !== indexToPrimary);
      return [chosen, ...remaining];
    });
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-900 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-red-700" />
            <span>Visual Biodata</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Photos</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload clear, recent portrait or full-length photos. The first photo will be your main display photo.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
            {photos.length} / 3 Photos
          </span>
        </div>
      </div>

      {/* Clean UI Toast Alert */}
      {toast && (
        <div
          role="alert"
          className={`mb-5 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all shadow-xs ${
            toast.type === "error"
              ? "bg-rose-50 text-red-800 border border-red-200"
              : toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-700 text-lg font-bold ml-2 leading-none cursor-pointer"
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        </div>
      )}

      {/* Upload Action Area */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleFileChange}
          disabled={uploading || photos.length >= 3}
          className="hidden"
          id="profile-photos-input"
        />

        <label
          htmlFor="profile-photos-input"
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition text-center cursor-pointer ${
            photos.length >= 3 || uploading
              ? "border-gray-200 bg-gray-50/60 cursor-not-allowed opacity-75"
              : "border-red-200 bg-rose-50/30 hover:border-red-500 hover:bg-rose-50/60"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-800 shadow-sm mb-3">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-red-700" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
          </div>
          <p className="text-base font-bold text-gray-800">
            {uploading
              ? statusMessage || "Optimizing & uploading image..."
              : photos.length >= 3
              ? "Maximum 3 photos reached"
              : "Click to upload photos (Camera or Gallery)"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supports JPG, PNG, WEBP, HEIC from iPhone & Android cameras &bull; Max 3 photos
          </p>
        </label>
      </div>

      {/* Photo Gallery Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((url, idx) => (
            <div
              key={url + idx}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100">
                <img
                  src={url}
                  alt={`Profile photo ${idx + 1}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>

              {/* Primary Badge */}
              {idx === 0 ? (
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-white shadow">
                  <Star className="h-3 w-3 fill-current" />
                  <span>Main Display</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => makePrimary(idx)}
                  className="absolute top-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                >
                  Make Main
                </button>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow transition hover:bg-red-600 hover:text-white"
                title="Remove Photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>
            At least 1 photo is mandatory to create/update profile. Please upload between 1 to 3 photos.
          </span>
        </div>
      )}
    </div>
  );
}
