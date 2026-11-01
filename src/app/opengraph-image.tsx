import { ImageResponse } from "next/og";

export const alt = "Lelam: every public auction in India, priced before you bid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0b1220", color: "#f6f5f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f6f5f0", display: "flex", position: "relative" }}>
            <div style={{ position: "absolute", left: 16, top: 13, width: 8, height: 30, borderRadius: 4, background: "#0b1220" }} />
            <div style={{ position: "absolute", left: 16, top: 35, width: 25, height: 8, borderRadius: 4, background: "#0b1220" }} />
            <div style={{ position: "absolute", left: 33, top: 14, width: 11, height: 11, borderRadius: 6, background: "#b4501a" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>lelam.co</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>Every public auction in India,</div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, color: "#34c3a0" }}>priced before you bid.</div>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 26, color: "#9aa5b8" }}>
          <span>MSTC e-auctions</span>
          <span>·</span>
          <span>Bank properties</span>
          <span>·</span>
          <span>Landed cost & ROI</span>
        </div>
      </div>
    ),
    size,
  );
}
