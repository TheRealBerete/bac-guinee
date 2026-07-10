import { Illustration } from "@/components/Illustration";

export function HeroMarquee({ images }: { images: { src: string; alt: string }[] }) {
  const rowA = [...images, ...images];
  const rowB = [...images.slice().reverse(), ...images.slice().reverse()];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col justify-center gap-4">
        <div className="flex gap-4 w-max animate-marquee">
          {rowA.map((img, i) => (
            <div key={`a-${i}`} className="w-[220px] h-[160px] shrink-0">
              <Illustration src={img.src} alt={img.alt} className="w-full h-full" />
            </div>
          ))}
        </div>
        <div className="flex gap-4 w-max animate-marquee-reverse">
          {rowB.map((img, i) => (
            <div key={`b-${i}`} className="w-[220px] h-[160px] shrink-0">
              <Illustration src={img.src} alt={img.alt} className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-white/70" />
    </div>
  );
}
