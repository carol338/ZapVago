import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#00A884",
          borderRadius: 7,
          color: "#0A0A0B",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        Z
      </div>
    ),
    { ...size }
  );
}
