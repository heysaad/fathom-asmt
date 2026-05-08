import Image from "next/image";

export default function ShipImg({
  id,
  width,
  height,
  ...props
}: { id: string; width: number; height: number } & React.ImgHTMLAttributes<HTMLImageElement>) {
  // I have 3 different img of ships, id = uuid
  // if id starts with some value, assign it to ship1.png,ship2.png,ship3.png

  const firstChar = id[0].toLowerCase();
  const map = {
    'ship1.png': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'],
    'ship2.png': ['m', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w'],
    'ship3.png': ['x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  } as Record<string, string[]>

  const imgName = Object.keys(map).find(x=>map[x].includes(firstChar));
  const src = `/imgs/${imgName}`;

  return (
    <Image
      width={width}
      height={height}
      src={src}
      alt="Ship"
      className="rounded-lg size-32 border border-gray-100"
      {...props}
    />
  );
}
