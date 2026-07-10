import { ImageResponse } from "next/og";
import { getCandidate } from "@/lib/api";

export const runtime = "nodejs";

const LOGO_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#a996f9"/>
      <stop offset="1" stop-color="#8c71f6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M158 266 L226 334 L358 182" fill="none" stroke="#ffffff" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const LOGO_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString("base64")}`;

const MENTION_CARD_STYLES: Record<string, string> = {
  TB: "#92720c",
  BIEN: "#1a8a4a",
  ABIEN: "#6b4fd6",
  PASSABLE: "#525866",
};
const MENTION_CARD_FALLBACK = "#525866";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  if (isNaN(numId)) {
    return new Response("Invalid id", { status: 400 });
  }

  let candidate;
  try {
    candidate = await getCandidate(numId);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const mentionColor = candidate.mention
    ? MENTION_CARD_STYLES[candidate.mention] || MENTION_CARD_FALLBACK
    : null;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          backgroundImage: "linear-gradient(135deg, #a996f9 0%, #8c71f6 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URI} width={56} height={56} alt="" />
          <div
            style={{
              display: "flex",
              color: "rgba(255,255,255,0.85)",
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Résultat officiel — Baccalauréat {candidate.session}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            {candidate.nom_complet}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {mentionColor && (
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#ffffff",
                  color: mentionColor,
                  fontSize: "26px",
                  fontWeight: 700,
                  padding: "10px 28px",
                  borderRadius: "999px",
                }}
              >
                Mention {candidate.mention}
              </div>
            )}
            <div
              style={{
                display: "flex",
                color: "rgba(255,255,255,0.9)",
                fontSize: "26px",
                fontWeight: 500,
              }}
            >
              {candidate.profil}
              {candidate.origine ? ` · ${candidate.origine}` : ""}
              {" · PV "}
              {candidate.pv}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.3)",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", color: "#ffffff", fontSize: "24px", fontWeight: 700 }}>
            bac.afrovizion.com
          </div>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.8)", fontSize: "20px" }}>
            Vérifiez votre résultat gratuitement
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    }
  );

  return image;
}
