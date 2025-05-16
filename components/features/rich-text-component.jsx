//? further customization for rich text from Sanity

import Image from "next/image";
import Link from "next/link";

import urlFor from "@/sanity/lib/image";

export const RichTextComponents = {
  types: {
    image: ({ value }) => {
      return (
        <div className="relative w-full m-10 mx-auto">
          <Image
            className="object-contain"
            src={urlFor(value).url()}
            alt="Blog Post Image"
            fill
          />
        </div>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="ml-10 py-5 list-disc space-y-5">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-lg list-decimal">{children}</ol>
    ),
  },
  block: {
    h1: ({ children }) => <h1 className="text-6xl pt-8 font-extrabold">{children}</h1>,
    h2: ({ children }) => <h2 className="text-5xl pt-6 font-bold">{children}</h2>,
    h3: ({ children }) => <h3 className="text-4xl pt-4 font-semibold">{children}</h3>,
    h4: ({ children }) => <h4 className="text-3xl pt-2 font-medium">{children}</h4>,

    blockquote: ({ children }) => (
      <blockquote className="border-l-[#054088] border-l-2 pl-3">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const rel = !value.href?.startsWith("/")
        ? "noreferrer noopener"
        : undefined;

      if (!value?.href) return children;

      return (
        <Link
          href={value.href}
          rel={rel}
          className="underline decoration-[#054088] hover:decoration-black"
        >
          {children}
        </Link>
      )
    },
  },
};
