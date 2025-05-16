import Link from "next/link";
import Image from "next/image";

import urlFor from "@/sanity/lib/image";

function BlogSidebar(props) {
  const { categories = [], popular, tags, summary, toggle = false } = props;

  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  };

  return (
    <div
      className={`sidebar mt-0 ${
        toggle ? "sidebar-filter px-3 right pt-3" : ""
      }`}
    >
      <div className="widget widget-cats">
        <h3 className="widget-title">Kategori</h3>

        <ul>
          {categories?.map((category, index) => (
            <li key={category?._id || index}>
              <Link href="#" scroll={false}>
                {category?.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {popular?.length ? (
        <div className="widget">
          <h3 className="widget-title">Artikel Terkenal</h3>

          <ul className="posts-list">
            {popular?.map((post) => (
              <li key={post?._id}>
                <figure className="position-relative">
                  <Link href={`/informasi-penting/${post.slug.current}`} className="w-100">
                    {/* <div className="lazy-overlay"></div> */}

                    <Image
                      src={urlFor(post?.mainImage)?.url()}
                      alt="Post"
                      height={80}
                      width={120}
                    />
                  </Link>
                </figure>

                <div>
                  <span>
                    {new Date(post?.publishedAt)?.toLocaleDateString(
                      "en-US",
                      options
                    )}
                  </span>
                  <h4>
                    <Link
                      className="line-clamp-1"
                      href={`/informasi-penting/${post.slug.current}`}
                    >
                      {post?.title}
                    </Link>
                  </h4>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tags?.length ? (
        <div className="widget">
          <h3 className="widget-title">Cari Topik</h3>

          <div className="tagcloud">
            {tags?.map((tag) => (
              <Link href="#" key={tag}>
                {tag}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="widget widget-text">
        <h3 className="widget-title">Pusat Informasi</h3>

        <div className="widget-text-content">
          <p>{summary}</p>
        </div>
      </div>
    </div>
  );
}

export default BlogSidebar;
