import Link from "next/link";
import Image from "next/image"
import { client } from "@/sanity/lib/client";
import urlFor from "@/sanity/lib/image";

import NotFound from "@/app/not-found";
import BlogMainSidebar from "./_components/blog-sidebar";
import BlogSocials from "./_components/blog-socials";
import BlogTags from "./_components/blog-tags";

import { PortableText } from "@portabletext/react";
import { RichTextComponents } from "@/components/features/rich-text-component";
import PageHeader from "@/components/features/page-header";
import RelatedPosts from "@/components/partials/blog/related/related-posts";

export async function generateMetadata({ params, searchParams }, parent) {
  const slug = params.slug;

  const res = await client.fetch(
    `*[_type == 'post' && slug.current == $slug] {
      ...
    }`,
    { slug }
  );

  return {
    title: res?.[0].title || "Blog",
    description: res?.[0]?.summary || res?.[0].title || "Blog Description",
  };
}

const fetchData = async (slug) => {
  try {
    const res = await client.fetch(
      `*[_type == 'post' && slug.current == $slug] {
        ...,
        author->,
        categories[]->,
        relatedBlogs[] {
          ...,
          categories[]->
        }->
      }`,
      { slug }
    );

    const popular = await client.fetch(
      `*[_type == 'post' && slug.current != $slug && popular == true] {
        ...,
        categories[]->,
        relatedBlogs[]->
      }`,
      { slug }
    );
    return [res, popular];
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const revalidate = 60;

const SingleBlogPage = async ({ params }) => {
  const { slug = "" } = params;
  const [post, popular] = await fetchData(slug);
  const related = post?.[0]?.relatedBlogs || [];

  const loading = false;
  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  };

  if (!post?.length || !slug) return <NotFound />;

  // return <SingleBlogPageComponent post={post[0]} popular={popular} />
  return (
    <div className="main">
      <PageHeader title="Informasi Penting" subTitle={post?.[0]?.title} />
      <nav className="breadcrumb-nav">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/informasi-penting">Informasi Penting</Link>
            </li>
            <li className="breadcrumb-item active">{post?.[0]?.slug?.current}</li>
          </ol>
        </div>
      </nav>
      <div className="page-content">
        <div className="container">
          <div className={`row skeleton-body ${!loading ? "loaded" : ""}`}>
            <div className="col-lg-9">
              {loading ? (
                <div className="skel-single-post"></div>
              ) : (
                <>
                  <article className="entry single-entry">
                    <figure
                      className={`entry-media`}
                      style={{
                        paddingTop: "100%",
                      }}
                    >
                      <Image alt="Post" src={urlFor(post[0]?.mainImage)?.url()} fill />
                    </figure>

                    <div className="entry-body">
                      <div className="entry-meta">
                        <span className="entry-author">
                          by <span className="hover:underline cursor-pointer">{post?.[0]?.author?.name}</span>
                        </span>
                        <span className="meta-separator">|</span>
                        <span className="hover:underline cursor-pointer">{new Date(post?.[0]?.publishedAt).toLocaleDateString("en-US", options)}</span>
                      </div>

                      <h2 className="entry-title">{post[0].title}</h2>

                      <div className="entry-content editor-content">
                        <PortableText value={post[0]?.body} components={RichTextComponents} />
                        <div className="pb-1" />
                      </div>

                      <div className="entry-footer row no-gutters flex-column flex-md-row">
                        <BlogTags />

                        <BlogSocials />
                      </div>
                    </div>
                  </article>
                </>
              )}

              {related?.length ? <RelatedPosts related={related} loading={loading} /> : null}
            </div>
            <div className="col-lg-3">
              <BlogMainSidebar post={post[0]} popular={popular} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBlogPage;
