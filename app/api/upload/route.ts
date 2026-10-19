import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

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

    // Stream directly into Cloudinary without relying on potentially missing MIME types
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

    if (!uploadResult?.secure_url) {
      throw new Error("Cloudinary did not return a valid secure URL.");
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error("Cloudinary upload error =>", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to upload photo. Please try again.",
      },
      { status: 500 }
    );
  }
}