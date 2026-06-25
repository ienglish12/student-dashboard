import Image from "next/image";

type BrandLogoProps = {
  size?: "login" | "nav";
};

const sizes = {
  login: "w-52 sm:w-64 aspect-[1080/556]",
  nav: "h-12 aspect-[1080/556]",
};

export function BrandLogo({ size = "nav" }: BrandLogoProps) {
  const box = sizes[size];
  const priority = size === "login";

  return (
    <div className={`relative ${box}`} aria-label="iEnglish Language Institute">
      {/* Light mode → colored logo */}
      <Image
        src="/ienglish-logo-light.svg"
        alt="iEnglish Language Institute"
        fill
        unoptimized
        priority={priority}
        className="object-contain block dark:hidden"
      />
      {/* Dark mode → white logo */}
      <Image
        src="/ienglish-logo-dark.svg"
        alt="iEnglish Language Institute"
        fill
        unoptimized
        priority={priority}
        className="object-contain hidden dark:block"
      />
    </div>
  );
}
