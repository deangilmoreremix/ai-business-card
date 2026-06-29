import { NextResponse } from "next/server";
import { CardService } from "@/lib/services/cards";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const card = await CardService.getCardById(id);
      if (!card) {
        return new NextResponse("Not Found", { status: 404 });
      }
      return NextResponse.json(card);
    }

    const cards = await CardService.listCards();
    return NextResponse.json(cards);
  } catch (error) {
    console.error("[CARDS_GET]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      title,
      company,
      address,
      phone,
      email,
      website,
      bio,
      avatar,
      backgroundImage,
      socialLinks,
      showAiAssistant,
      templateId,
      htmlContent,
      userPrompt,
    } = body;

    if (!name || !name.trim()) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!title || !title.trim()) {
      return new NextResponse("Title is required", { status: 400 });
    }
    if (!company || !company.trim()) {
      return new NextResponse("Company is required", { status: 400 });
    }

    const cleanData = {
      name: name.trim(),
      title: title.trim(),
      company: company.trim(),
      address: address ? address.trim() : null,
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      website: website ? website.trim() : null,
      bio: bio ? bio.trim() : null,
      avatar: avatar || null,
      backgroundImage: backgroundImage || null,
      socialLinks: typeof socialLinks === "string" ? socialLinks : JSON.stringify(socialLinks || {}),
      showAiAssistant: showAiAssistant !== false,
      templateId: templateId || "classic",
      htmlContent: htmlContent || null,
      userPrompt: userPrompt || null,
    };

    if (id) {
      // Update existing
      const existing = await CardService.getCardById(id);
      if (!existing) {
        return new NextResponse("Not Found", { status: 404 });
      }
      const updated = await CardService.updateCard(id, cleanData);
      return NextResponse.json(updated);
    } else {
      // Create new
      const created = await CardService.createCard(cleanData);
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("[CARDS_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing card ID", { status: 400 });
    }

    const card = await CardService.getCardById(id);
    if (!card) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await CardService.deleteCard(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CARDS_DELETE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}