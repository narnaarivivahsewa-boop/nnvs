"use client";

import React, { useRef } from "react";
import { ImagePlus, Trash2, Star, Sparkles, AlertCircle } from "lucide-react";

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 3) {
      alert(`You can only upload up to 3 photos in total. Currently you have ${photos.length}.`);
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          alert(`File "${file.name}" is not a valid image format.`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          alert(`Image "${file.name}" is too large. Max size allowed is 10MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          alert(data.message || `Failed to upload "${file.name}".`);
          continue;
        }

        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err: any) {
      console.error("Photo upload error:", err);
      alert("Unable to upload image. Please check your network and try again.");
    } finally {
      setUploading(false);
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

      {/* Upload Action Area */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
            <ImagePlus className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-gray-800">
            {uploading
              ? "Uploading image to secure storage..."
              : photos.length >= 3
              ? "Maximum 3 photos reached"
              : "Click to upload photos"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supports JPG, PNG, WEBP (Up to 10MB each &bull; Max 3 photos)
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
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50/80 p-4 border border-amber-200/80 text-amber-900 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-700" />
          <span>
            No photos uploaded yet. Uploading at least one portrait photo increases family match inquiries significantly.
          </span>
        </div>
      )}
    </div>
  );
}
