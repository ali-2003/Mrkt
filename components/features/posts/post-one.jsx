import Link from "next/link";
import Image from "next/image";

import urlFor from "@/sanity/lib/image";

function PostOne(props) {
  const { post, adClass = "", isContent = true, isAuthor = true } = props;
  

  const date = new Date(post?.publishedAt);
  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  };

  return (
    <article className={`entry ${adClass}`}>
      <figure
        className={`entry-media `}
        style={{
          paddingTop: "100%",
        }}
      >
        <Link href={`/informasi-penting/${post.slug.current}`}>
          <div className="lazy-overlay"></div>

          <Image alt="Post" src={urlFor(post?.mainImage)?.url()} fill />
        </Link>
      </figure>
      <div className="entry-body">
        <div className="entry-meta">
          {isAuthor ? (
            <>
              <span className="entry-author">
                by{" "}
                <Link href={`/informasi-penting/${post.slug.current}`}>
                  {post?.author?.name}
                </Link>
              </span>
              <span className="meta-separator">|</span>
            </>
          ) : (
            ""
          )}
          <Link href={`/informasi-penting/${post.slug.current}`}>
            {date.toLocaleDateString("en-US", options)}
          </Link>
          <span className="meta-separator">|</span>
        </div>

        <h2 className="entry-title">
          <Link href={`/informasi-penting/${post.slug.current}`}>{post.title}</Link>
        </h2>

        {isContent ? (
          <div className="entry-content">
            <p className="line-clamp-2">{post?.summary}</p>
            <Link href={`/informasi-penting/${post.slug.current}`} className="read-more">
            Selengkapnya
            </Link>
          </div>
        ) : (
          ""
        )}
      </div>
    </article>
  );
}

export default PostOne;
