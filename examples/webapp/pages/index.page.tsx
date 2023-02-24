import Link from "next/link";

export default function Home() {
  return (
    <nav>
      <Link href="/about">About</Link>
      <Link href="/another">Another</Link>
    </nav>
  );
}

export {};
