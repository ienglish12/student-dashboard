import Image from "next/image";

type BrandLogoProps = {
  size?: "login" | "nav";
};

const styles = {
  login: {
    wrap: "h-40 w-40 sm:h-48 sm:w-48 rounded-[2rem] bg-white p-3 shadow-sm ring-1 ring-line",
    image: "object-contain",
  },
  nav: {
    wrap: "h-12 w-12 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-line",
    image: "object-contain",
  },
};

export function BrandLogo({ size = "nav" }: BrandLogoProps) {
  const s = styles[size];

  return (
    <div className={s.wrap} aria-label="iEnglish Language Institute">
      <Image
        src="/ienglish-logo.png"
        alt="iEnglish Language Institute"
        width={1080}
        height={1080}
        priority={size === "login"}
        className={`h-full w-full ${s.image}`}
      />
    </div>
  );
}
