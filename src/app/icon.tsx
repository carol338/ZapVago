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
          background: "#0A0A0B",
          borderRadius: 7,
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#00A884" strokeWidth="2" fill="none" />
          <path d="M13 3L4.5 13.5H11L10 21L18.5 10H12L13 3Z" fill="#00A884" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
