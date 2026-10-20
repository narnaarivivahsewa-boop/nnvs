import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No photo file provided.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "The uploaded file is empty.",
        },
        { status: 400 }
      );
    }

    // 1. Try Cloudinary if credentials are configured
    if (isCloudinaryConfigured) {
      try {
        const uploadResult: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "nnvs-matrimony/profile-photos",
              resource_type: "image",
              transformation: [
                { quality: "auto:good", fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          uploadStream.end(buffer);
        });

        if (uploadResult?.secure_url) {
          return NextResponse.json({
            success: true,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
          });
        }
      } catch (cloudinaryErr: any) {
        console.warn(
          "Cloudinary upload failed in production, executing graceful fallback storage:",
          cloudinaryErr?.message || cloudinaryErr
        );
        // Fall through to local / base64 fallback storage
      }
    } else {
      console.info("Cloudinary credentials not detected; using secure fallback storage.");
    }

    // 2. Fallback Storage Option A: Save to public uploads directory
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "profiles");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const mimeType = file.type || "image/jpeg";
      let extension = "jpg";
      if (mimeType.includes("png")) extension = "png";
      else if (mimeType.includes("webp")) extension = "webp";
      else if (mimeType.includes("gif")) extension = "gif";
      else if (file.name && file.name.includes(".")) {
        extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      }
      const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, "");

      const fileName = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${safeExtension || "jpg"}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/profiles/${fileName}`,
        publicId: fileName,
        storage: "local",
      });
    } catch (fsErr) {
      console.warn("Local disk write failed, falling back to base64 data URI:", fsErr);

      // 3. Fallback Storage Option B: Base64 Data URI (works even in read-only serverless runtimes)
      const mime = file.type || "image/jpeg";
      const base64 = buffer.toString("base64");
      const dataUri = `data:${mime};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUri,
        publicId: `data-${Date.now()}`,
        storage: "base64",
      });
    }
  } catch (error: any) {
    console.error("Photo upload error =>", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process photo upload at this time. Please try again or select another image.",
      },
      { status: 500 }
    );
  }
}