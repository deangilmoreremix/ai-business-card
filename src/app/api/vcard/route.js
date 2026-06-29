import { NextResponse } from "next/server";
import { CardService } from "@/lib/services/cards";

function escapeVCard(value) {
  if (!value) return "";
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get("hash");
    if (!hash) {
      return new NextResponse("Hash required", { status: 400 });
    }
    const card = await CardService.getCardByHash(hash);
    if (!card) {
      return new NextResponse("Not Found", { status: 404 });
    }

    let socials = {};
    try {
      socials = typeof card.socialLinks === "string"
        ? JSON.parse(card.socialLinks)
        : card.socialLinks || {};
    } catch (e) {}

    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${escapeVCard(card.name)}`,
      `N:${escapeVCard(card.name)};;;`,
      `ORG:${escapeVCard(card.company)}`,
      `TITLE:${escapeVCard(card.title)}`,
      card.email ? `EMAIL;TYPE=INTERNET:${escapeVCard(card.email)}` : "",
      card.phone ? `TEL;TYPE=CELL:${escapeVCard(card.phone)}` : "",
      card.website ? `URL:${escapeVCard(card.website)}` : "",
      card.address ? `ADR;TYPE=WORK:;;${escapeVCard(card.address)};;;` : "",
      card.bio ? `NOTE:${escapeVCard(card.bio)}` : "",
      card.avatar ? `PHOTO;VALUE=URI:${escapeVCard(card.avatar)}` : "",
      socials.linkedin ? `URL;TYPE=LinkedIn:${escapeVCard(socials.linkedin)}` : "",
      socials.twitter ? `URL;TYPE=Twitter:${escapeVCard(socials.twitter)}` : "",
      socials.github ? `URL;TYPE=GitHub:${escapeVCard(socials.github)}` : "",
      "END:VCARD",
    ].filter(Boolean);

    const body = lines.join("\r\n");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${(card.name || "card").replace(/[^a-z0-9]/gi, "_")}.vcf"`,
      },
    });
  } catch (error) {
    console.error("[VCARD_EXPORT]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}