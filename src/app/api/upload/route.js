import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import config from "@/lib/config";

const BUCKET_NAME = "card-avatars";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return new NextResponse("Invalid file type. Use JPEG, PNG, GIF, WEBP, or SVG.", { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse("File too large (max 5MB).", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try Supabase Storage first
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${file.type.split("/")[1] || "png"}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      if (publicData?.publicUrl) {
        return NextResponse.json({ url: publicData.publicUrl });
      }
    } catch (storageErr) {
      console.warn("Supabase storage upload failed, trying MuAPI:", storageErr.message);
    }

    // Try MuAPI upload
    const apiKey = config.ai.apiKey;
    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const muapiFormData = new FormData();
        const blob = new Blob([buffer], { type: file.type });
        muapiFormData.append("file", blob, file.name);

        const response = await fetch("https://api.muapi.ai/api/v1/upload_file", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
          },
          body: muapiFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn("MuAPI upload failed, using base64 fallback:", e.message);
      }
    }

    // Final fallback: base64 data URL
    const base64Data = buffer.toString("base64");
    const base64Url = `data:${file.type};base64,${base64Data}`;
    return NextResponse.json({ url: base64Url });
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}