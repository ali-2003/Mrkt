"use client";

import Reveal from "react-awesome-reveal";

// Import Custom Component
import OwlCarousel from "@/components/features/owl-carousel";
import NewCollection from "@/components/partials/home/new-collection";
import ProductThirteen from "@/components/features/products/product-thirteen";
import TopCollection from "@/components/partials/home/top-collection";
import ReferFriendModal from "@/components/features/modals/refer-friend";

// Import Utils
import {
  fadeIn,
  brandSlider,
  fadeInUpShorter,
  blurIn,
  zoomInShorter,
} from "@/utils/data";

import Link from "next/link";
import Image from "next/image";
import urlFor from "@/sanity/lib/image";

// Simple helper function to safely get image URL
const getSafeImageUrl = (imageSource, fallback = "/images/icon.png") => {
  if (!imageSource) return fallback;
  
  try {
    const url = urlFor(imageSource)?.url();
    return url || fallback;
  } catch (error) {
    console.warn('Error generating image URL:', error);
    return fallback;
  }
};

function HomePageComponent({
  homePageData,
  products,
  bestSellers,
  hotProducts,
}) {
  const loading = !!!products?.length;

  return (
    <div
      className={`main home-page skeleton-body skel-shop-products ${
        loading ? "" : "loaded"
      }`}
    >
      <section className="intro-section">
        <div className="intro-slider-container">
          <OwlCarousel
            adClass="intro-slider owl-nav-inside"
            options={{ nav: false, dots: true }}
          >
            {homePageData?.hero?.map((banner, index) => (
              <div
                key={`hero-${index}-${banner?.tagline || ''}`}
                className="intro-slide slide-image"
                style={{
                  background: `url(${getSafeImageUrl(banner?.photo, '/images/banner-placeholder.jpg')}) no-repeat center center / cover`,
                  backgroundColor: "#f0f2fa",
                }}
              >
                <div className="intro-content">
                  <Reveal
                    keyframes={fadeInUpShorter}
                    delay={100}
                    duration={1000}
                  >
                    <h5 className="banner-subtitle font-weight-normal text-primary">
                      {banner?.tagline || "Welcome"}
                    </h5>
                  </Reveal>

                  <Reveal
                    keyframes={fadeInUpShorter}
                    delay={200}
                    duration={1000}
                  >
                    <h3 className="banner-title font-weight-lighter text-primary w-full lg:max-w-[800px]">
                      {banner?.heading || "Featured Products"}
                    </h3>
                  </Reveal>

                  <Reveal
                    keyframes={fadeInUpShorter}
                    delay={300}
                    duration={1000}
                  >
                    <p className="banner-desc font-weight-normal text-primary mb-3">
                      {banner?.subText || "Discover our amazing collection"}
                    </p>
                  </Reveal>

                  <Reveal
                    keyframes={fadeInUpShorter}
                    delay={500}
                    duration={1000}
                  >
                    <Link href="/ejuice" className="btn btn-outline-secondary">
                      BELANJA SEKARANG<i className="icon-angle-right"></i>
                    </Link>
                  </Reveal>
                </div>
              </div>
            ))}
          </OwlCarousel>

          <span className="slider-loader"></span>
        </div>
      </section>

      <Reveal keyframes={fadeIn} delay={200} duration={1000} triggerOnce>
        {homePageData?.benefits?.length ? (
          <section className="brand-section">
            <div className="container">
              <div className="heading heading-center">
                <h2 className="title font-weigowht-normal text-secondary-dark mb-3">
                  Checkout Benefits
                </h2>
              </div>

              <OwlCarousel adClass="owl-brand" options={{ ...brandSlider, autoplay: true, loop: true }}>
                {homePageData?.benefits?.map((benefit, index) => (
                  <a
                    href="#"
                    className="brand"
                    key={`benefit-${index}`}
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <img 
                      src={getSafeImageUrl(benefit?.logo, '/images/icon.png')} 
                      alt="Brand Name"
                      onError={(e) => {
                        e.target.src = '/images/icon.png';
                      }}
                    />
                  </a>
                ))}
              </OwlCarousel>
            </div>
          </section>
        ) : null}
      </Reveal>

      <Reveal keyframes={fadeIn} delay={200} duration={1000} triggerOnce>
        <TopCollection products={bestSellers} />
      </Reveal>

      <section className="banner-section banner-2cols-with-gap">
        <div className="container">
          <div className="row">
            <div className="col-md-7">
              <Reveal
                keyframes={zoomInShorter}
                delay={200}
                duration={1000}
                triggerOnce
              >
                <div className="banner banner-1">
                  <figure className="mb-0 lazy-media">
                    <div className="lazy-overlay"></div>
                    <Image
                      alt="banner"
                      src={getSafeImageUrl(homePageData?.benefitImage1, '/images/banner-default.jpg')}
                      width="700"
                      height="680"
                      onError={(e) => {
                        e.target.src = '/images/banner-default.jpg';
                      }}
                    />
                  </figure>

                  <div className="banner-content content-top">
                    <h3 className="banner-title font-weight-normal text-white">
                      {homePageData?.benefitText1 || "Special Offer"}
                    </h3>
                    <p className="font-weight-normal text-white">
                      {homePageData?.benefitSubText1 || "Discover amazing deals"}
                    </p>
                  </div>
                  <div className="banner-content content-bottom">
                    <Link
                      href="https://www.tokopedia.com/agpremiumvapor"
                      className="btn btn-link btn-link-primary"
                    >
                      BELANJA SEKARANG<i className="icon-angle-right"></i>
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="col-md-5">
              <Reveal
                keyframes={zoomInShorter}
                delay={500}
                duration={1000}
                triggerOnce
              >
                <div className="banner banner-2 text-center">
                  <div className="banner-title font-weight-normal text-primary text-left">
                    {homePageData?.benefitText2 || "Premium Quality"}
                  </div>
                  <figure className="text-center lazy-media mb-0">
                    <div className="lazy-overlay"></div>
                    <Image
                      alt="banner"
                      src={getSafeImageUrl(homePageData?.benefitImage2, '/images/banner-default.jpg')}
                      width="570"
                      height="395"
                      onError={(e) => {
                        e.target.src = '/images/banner-default.jpg';
                      }}
                    />
                  </figure>

                  <Link
                    href="/devices"
                    className="btn btn-link d-inline-block btn-link-primary"
                  >
                    BELANJA SEKARANG<i className="icon-angle-right"></i>
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <Reveal keyframes={fadeIn} delay={200} duration={1000} triggerOnce>
        <NewCollection products={hotProducts} />
      </Reveal>

      <section className="banner-section banner-2cols">
        <div className="container">
          <div className="row no-gutters">
            <div className="col-md-6">
              <Reveal
                keyframes={fadeIn}
                delay={200}
                duration={1000}
                triggerOnce
              >
                <div className="banner lazy-media">
                  <figure className="mb-0">
                    <div className="lazy-overlay"></div>
                    <Image
                      alt="banner"
                      src="/images/home/banner/2-1.jpg"
                      width="700"
                      height="680"
                      onError={(e) => {
                        e.target.src = '/images/banner-default.jpg';
                      }}
                    />
                  </figure>

                  <div className="banner-content">
                    <h3 className="banner-title font-weight-normal text-primary">
                      {homePageData?.blogSectionHeading || "Sumber Daya"}
                    </h3>
                    <p className="font-weight-normal">
                      {homePageData?.blogSectionSubText || "Kebenaran tentang e-liquid dan industri vape"}
                    </p>
                    <Link
                      href="/informasi-penting"
                      className="btn btn-outline-primary-2"
                    >
                      BACA LAGI<i className="icon-angle-right"></i>
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="col-md-6">
              <Reveal
                keyframes={fadeIn}
                delay={300}
                duration={1000}
                triggerOnce
              >
                <div className="banner lazy-media">
                  <figure className="mb-0">
                    <div className="lazy-overlay"></div>
                    <Image
                      alt="banner"
                      src="/images/home/banner/2-2.png"
                      width="700"
                      height="680"
                      onError={(e) => {
                        e.target.src = '/images/banner-default.jpg';
                      }}
                    />
                  </figure>

                  {products?.length ? (
                    <>
                      {products.slice(0, 1).map((item, index) => (
                        <div
                          className={`hotspot-wrapper hotspot-1`}
                          key={`hotspot-1-${item?.id || index}`}
                        >
                          <Link href="/produk/mangga-murni" className="hotspot">
                            <i className="icon-plus"></i>
                          </Link>

                          <ProductThirteen product={item} />
                        </div>
                      ))}

                      {products?.slice(9, 10).map((item, index) => (
                        <div
                          className={`hotspot-wrapper hotspot-2`}
                          key={`hotspot-2-${item?.id || index}`}
                        >
                          <Link href="/produk/perpaduan-buah-beri" className="hotspot">
                            <i className="icon-plus"></i>
                          </Link>

                          <ProductThirteen product={item} />
                        </div>
                      ))}

                      {products?.slice(5, 6).map((item, index) => (
                        <div
                          className={`hotspot-wrapper hotspot-3`}
                          key={`hotspot-3-${item?.id || index}`}
                        >
                          <Link href="/produk/kue-keju-stroberi" className="hotspot">
                            <i className="icon-plus"></i>
                          </Link>

                          <ProductThirteen product={item} />
                        </div>
                      ))}

                      {products?.slice(4, 5).map((item, index) => (
                        <div
                          className={`hotspot-wrapper hotspot-4`}
                          key={`hotspot-4-${item?.id || index}`}
                        >
                          <Link href="/produk/tembakau-klasik" className="hotspot">
                            <i className="icon-plus"></i>
                          </Link>

                          <ProductThirteen product={item} />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="banner-content">
                      <Link
                        href="/ejuice"
                        className="btn btn-primary"
                      >
                        DAPATKAN SEGERA<i className="icon-angle-right"></i>
                      </Link>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
      

      <Reveal keyframes={fadeIn} delay={200} duration={1000} triggerOnce>
        <section className="account-signup-section py-5">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <Reveal
                  keyframes={fadeInUpShorter}
                  delay={200}
                  duration={1000}
                  triggerOnce
                >
                  <div className="card signup-card h-100">
                    <div className="card-body text-center p-5">
                      <div className="icon-box mb-4">
                        <i className="icon-user-circle" style={{ fontSize: '4rem' }}></i>
                      </div>
                      <h3 className="card-title  font-extrabold text-primary mb-3">
                        Akun Pribadi
                      </h3>
                      <p className="card-text mb-4">
                        Buat akun pribadi untuk menikmati layanan dan manfaat khusus pelanggan kami.
                      </p>
                      <Link href="/auth/daftar?type=personal" className="btn btn-outline-primary-2">
                        DAFTAR SEKARANG<i className="icon-angle-right"></i>
                      </Link>
                    </div>
                  </div>
                </Reveal>
              </div>
              <div className="col-md-6">
                <Reveal
                  keyframes={fadeInUpShorter}
                  delay={400}
                  duration={1000}
                  triggerOnce
                >
                  <div className="card signup-card h-100">
                    <div className="card-body text-center p-5">
                      <div className="icon-box mb-4">
                        <i className="icon-briefcase" style={{ fontSize: '3rem' }}></i>
                      </div>
                      <h3 className="card-title font-extrabold text-primary mb-3">
                        Akun Bisnis
                      </h3>
                      <p className="card-text mb-4">
                        Daftar untuk akun bisnis dan dapatkan akses ke harga grosir dan fitur khusus untuk pemilik bisnis.
                      </p>
                      <Link href="/auth/daftar?type=business" className="btn btn-outline-primary-2">
                        DAFTAR SEKARANG<i className="icon-angle-right"></i>
                      </Link>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="banner-section banner-3cols">
        <div className="container">
          <div className="row justify-content-center">
            {homePageData?.blogs?.map((blog, index) => (
              <div className="col-lg-4 col-sm-6" key={`blog-${blog?._id || index}`}>
                <Reveal
                  keyframes={blurIn}
                  delay={200}
                  duration={1000}
                  triggerOnce
                >
                  <div className="banner">
                    <figure className="lazy-media">
                      <div className="lazy-overlay"></div>
                      <Image
                        alt="blog banner"
                        src={getSafeImageUrl(blog?.mainImage, '/images/blog-default.jpg')}
                        width="700"
                        height="680"
                        onError={(e) => {
                          e.target.src = '/images/blog-default.jpg';
                        }}
                      />
                    </figure>

                    <div className="banner-content">
                      <h3 className="banner-title font-weight-normal !mix-blend-difference line-clamp-2">
                        {blog?.title || "Blog Post"}
                      </h3>
                      <p className="font-weight-normal line-clamp-1">
                        {blog?.summary || "Read more about this topic..."}
                      </p>
                      <Link
                        href={`/informasi-penting/${blog?.slug?.current || '#'}`}
                        className="btn btn-link btn-link-primary"
                      >
                        BACA LAGA<i className="icon-angle-right"></i>
                      </Link>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Reveal keyframes={fadeIn} delay={200} duration={1000} triggerOnce>
        <section className="testimonial-section">
          <h2 className="title text-center">Ulasan Pelanggan</h2>
          <OwlCarousel options={{ nav: false, dots: true }}>
            {homePageData?.reviews?.map((review, index) => (
              <blockquote className="testimonial text-center" key={`review-${index}`}>
                <div className="ratings-container justify-content-center">
                  <div className="ratings">
                    <div
                      className="ratings-val"
                      style={{ width: (review?.stars || 5) * 20 + "%" }}
                    ></div>
                    <span className="tooltip-text">
                      {(review?.stars || 5).toFixed(2)}
                    </span>
                  </div>
                </div>
                <h5 className="subtitle font-weight-lighter text-primary">
                  {review?.heading || "Great Product"}
                </h5>
                <p className="font-weight-normal text-dark">
                  &rsquo;{review?.text || "Excellent quality and service!"}&rsquo;
                </p>
                <cite className="font-weight-normal text-dark">
                  - {review?.reviewerName || "Anonymous Customer"}
                </cite>
                <p className="font-weight-normal text-dark">
                  {review?.country || "Indonesia"}
                </p>
              </blockquote>
            ))}
          </OwlCarousel>
        </section>
      </Reveal>

      {/* <ReferFriendModal /> */}
    </div>
  );
}

export default HomePageComponent;