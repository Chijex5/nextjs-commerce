import { ImageResponse } from "next/og";
import LogoIcon from "./icons/logo";
import { canonicalHost, siteName, siteTagline } from "lib/seo";
import { readFile } from "fs/promises";
import { join } from "path";

export type Props = {
  title?: string;
};

export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const { title } = {
    ...{
      title: siteName,
    },
    ...props,
  };

  const file = await readFile(join(process.cwd(), "./fonts/Inter-Bold.ttf"));
  const font = Uint8Array.from(file).buffer;

  return new ImageResponse(
    (
      <div
        tw="relative flex h-full w-full flex-col overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #0B0B0B 0%, #121826 60%, #0B0B0B 100%)",
        }}
      >
        <div
          tw="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 10%, rgba(242,185,75,0.35), transparent 55%), radial-gradient(circle at 10% 90%, rgba(242,185,75,0.2), transparent 45%)",
          }}
        />
        <div
          tw="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            opacity: 0.25,
          }}
        />
        <div tw="relative flex h-full w-full flex-col px-[96px] py-[72px] text-white">
          <div tw="flex items-center">
            <div
              tw="flex h-[72px] w-[72px] items-center justify-center rounded-[20px]"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              <LogoIcon width="44" height="40" fill="white" />
            </div>
            <div
              tw="ml-6 text-[20px] uppercase"
              style={{ letterSpacing: "0.35em", opacity: 0.7 }}
            >
              {siteName}
            </div>
          </div>
          <div tw="mt-[86px] flex flex-1 flex-col">
            <div
              tw="text-[72px] font-bold"
              style={{
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                maxWidth: "920px",
              }}
            >
              {title}
            </div>
            <div tw="mt-6 text-[28px]" style={{ opacity: 0.7 }}>
              {siteTagline}
            </div>
          </div>
          <div tw="flex items-center justify-between">
            <div tw="text-[20px]" style={{ opacity: 0.6 }}>
              {canonicalHost()}
            </div>
            <div
              tw="h-[2px] w-[120px]"
              style={{ backgroundColor: "#F2B94B" }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: font,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
