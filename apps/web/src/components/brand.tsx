import Image from "next/image";
import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="CampusFlow, inicio">
      <strong>
        Campus<span>Flow</span>
      </strong>
      <span className="brand-parent">
        para{" "}
        <Image
          src="/brand/campuslands.svg"
          alt="Campuslands"
          width={100}
          height={18}
        />
      </span>
    </Link>
  );
}
