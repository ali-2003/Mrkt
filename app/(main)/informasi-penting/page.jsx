import Link from "next/link";
import Image from "next/image"
import { client } from "@/sanity/lib/client";

import urlFor from "@/sanity/lib/image";
import PageHeader from "@/components/features/page-header";

export const metadata = {
  title: "Temukan Variasi dan Informasi liquid",
  description: "Terkait informasi dan berita terbaru terkait tips penting dan varian liquid populer saat ini"
};

const fetchData = async () => {
  try {
    const res = await client.fetch(`*[_type == 'post'] {
      ...,
      author->,
      categories[]->,
    }`);
    return res;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const revalidate = 60;

const BlogPage = async () => {
  const posts = await fetchData();

  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  };

  let adClass = "text-center";
  let isContent = true;
  let isAuthor = true;

  return (
    <div className="main">
      <PageHeader title="Informasi Penting" subTitle="" />
      <nav className="breadcrumb-nav">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item active">Informasi Penting</li>
          </ol>
        </div>
      </nav>

      <div className="page-content">
        <div className={`container skeleton-body ${false ? "" : "loaded"}`}>
          {false || !posts ? (
            <div className="row">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div className="col-sm-6" key={item}>
                  <div className="skel-grid-post"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {posts?.length == 0 ? (
                <div className="row">
                  <p className="blogs-info">No posts were found matching your selection.</p>
                </div>
              ) : (
                <div className="row">
                  {posts?.map((post, index) => (
                    <div className={`col-sm-6 grid-item`} key={index}>
                      <article className={`entry ${adClass}`}>
                        <figure
                          className={`entry-media `}
                          style={{
                            paddingTop: "100%",
                          }}
                        >
                          <Link href={`/informasi-penting/${post?.slug?.current}`}>
                            <div className="lazy-overlay"></div>
                            <Image alt="Post" src={urlFor(post?.mainImage)?.url()} fill />
                          </Link>
                        </figure>
                        <div className="entry-body">
                          <div className="entry-meta">
                            {isAuthor ? (
                              <>
                                <span className="entry-author">
                                  by <Link href={`/informasi-penting/${post.slug.current}`}>{post?.author?.name}</Link>
                                </span>
                                <span className="meta-separator">|</span>
                              </>
                            ) : (
                              ""
                            )}
                            <Link href={`/informasi-penting/${post?.slug?.current}`}>
                              {(new Date(post?.publishedAt)).toLocaleDateString("en-US", options)}
                            </Link>
                            <span className="meta-separator">|</span>
                          </div>

                          <h2 className="entry-title">
                            <Link href={`/informasi-penting/${post?.slug?.current}`}>{post?.title}</Link>
                          </h2>

                          {isContent ? (
                            <div className="entry-content">
                              <p className="line-clamp-2">{post?.summary}</p>
                              <Link href={`/informasi-penting/${post?.slug?.current}`} className="read-more">
                                Selengkapnya
                              </Link>
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
