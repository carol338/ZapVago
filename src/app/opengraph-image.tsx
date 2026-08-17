import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0B",
          backgroundImage: "radial-gradient(circle at 30% 20%, rgba(0,168,132,0.25), transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "#00A884",
              color: "#0A0A0B",
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            Z
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#FAFAFA" }}>ZapVago</div>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#A1A1A6" }}>
          Agendamento inteligente no WhatsApp
        </div>
      </div>
    ),
    { ...size }
  );
}
