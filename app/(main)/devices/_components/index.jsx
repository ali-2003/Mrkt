"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronLeft, ChevronRight, Star, Check, Info } from "lucide-react";
import { PortableText } from '@portabletext/react';
import { useSession } from "next-auth/react";

function ProductShowcasePage({ device, title = "Device", subTitle = "Vape Device" }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // ADD SESSION HANDLING FOR BUSINESS PRICING
  const { data: session } = useSession();
  const isBusinessUser = session?.user?.accountType === 'business';

  // BUSINESS PRICING FUNCTIONS
  const getDisplayPrice = () => {
    if (isBusinessUser && deviceData?.business_price) {
      return deviceData.business_price;
    }
    if (deviceData?.sale_price && !isBusinessUser) {
      return deviceData.sale_price;
    }
    return deviceData?.price || 299000;
  };

  const getOriginalPrice = () => {
    return deviceData?.price || deviceData?.originalPrice || 399000;
  };

  const shouldShowSalePrice = () => {
    return deviceData?.sale_price && !isBusinessUser && deviceData.sale_price < deviceData.price;
  };

  const shouldShowBusinessPrice = () => {
    return isBusinessUser && deviceData?.business_price && deviceData.business_price !== deviceData.price;
  };

  const formatPrice = (price) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  // Helper function to format review date
  const formatReviewDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  // Calculate average rating from reviews
  const calculateAverageRating = (reviews) => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return deviceData.rating || 4.5;
    }
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  // Get total review count
  const getTotalReviews = () => {
    if (deviceData.reviews && Array.isArray(deviceData.reviews) && deviceData.reviews.length > 0) {
      return deviceData.reviews.length;
    }
    return deviceData.totalReviews || 1247;
  };

  // Ensure reviews is always an array
  const getReviewsArray = () => {
    if (!deviceData.reviews) return [];
    if (Array.isArray(deviceData.reviews)) return deviceData.reviews;
    // If reviews is a single object, wrap it in an array
    if (typeof deviceData.reviews === 'object') return [deviceData.reviews];
    return [];
  };

  // Use device data from Sanity or fallback
  const deviceData = device || {
    name: "XLIM Pro 2",
    tagline: "Next Generation Vaping Experience",
    mainImage: "/api/placeholder/600/600",
    gallery: [
      "/api/placeholder/600/600",
      "/api/placeholder/600/600",
      "/api/placeholder/600/600",
      "/api/placeholder/600/600"
    ],
    videos: [
      {
        thumbnail: "/api/placeholder/400/300",
        videoUrl: "https://example.com/video1.mp4",
        title: "Product Overview"
      },
      {
        thumbnail: "/api/placeholder/400/300",
        videoUrl: "https://example.com/video2.mp4",
        title: "How to Use"
      }
    ],
    features: [
      {
        icon: "🔋",
        title: "Long Battery Life",
        description: "Up to 2 days of continuous use with fast charging technology"
      },
      {
        icon: "💨",
        title: "Premium Vapor Quality",
        description: "Advanced coil technology for consistent flavor delivery"
      },
      {
        icon: "🎨",
        title: "Sleek Design",
        description: "Premium materials with ergonomic grip and modern aesthetics"
      },
      {
        icon: "🔧",
        title: "Easy Maintenance",
        description: "Simple pod replacement and cleaning process"
      }
    ],
    specifications: [
      { label: "Battery Capacity", value: "1000mAh" },
      { label: "Pod Capacity", value: "2ml" },
      { label: "Charging", value: "USB-C Fast Charge" },
      { label: "Material", value: "Aluminum Alloy" },
      { label: "Dimensions", value: "110 × 25 × 15mm" },
      { label: "Weight", value: "65g" }
    ],
    colors: [
      { name: "Midnight Black", color: "#000000", image: "/api/placeholder/100/100" },
      { name: "Silver Grey", color: "#C0C0C0", image: "/api/placeholder/100/100" },
      { name: "Rose Gold", color: "#E8B4CB", image: "/api/placeholder/100/100" },
      { name: "Ocean Blue", color: "#006994", image: "/api/placeholder/100/100" }
    ],
    price: 299000,
    sale_price: null,
    business_price: null,
    originalPrice: 399000,
    rating: 4.8,
    reviews: [],
    totalReviews: 1247,
    inStock: true,
    description: "Experience the future of vaping with our premium device featuring cutting-edge technology and unmatched performance.",
    detailedDescription: "This premium vaping device combines innovative technology with elegant design to deliver an exceptional experience. Featuring advanced temperature control, long-lasting battery life, and premium build quality."
  };

  const averageRating = calculateAverageRating(getReviewsArray());
  const totalReviewCount = getTotalReviews();
  const reviewsArray = getReviewsArray();

  const nextImage = () => {
    setActiveImageIndex((prev) =>
      prev === (deviceData.gallery?.length - 1 || 0) ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0 ? (deviceData.gallery?.length - 1 || 0) : prev - 1
    );
  };

  // Helper function to render rich text or fallback to string
  const renderDescription = (description) => {
    if (!description) return null;
    // If it's an array (rich text from Sanity), render with PortableText
    if (Array.isArray(description)) {
      return <PortableText value={description} />;
    }
    // If it's a string, render normally
    return <p className="text-gray-700">{description}</p>;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <main className="main product-showcase">
      {/* Breadcrumb */}
      <nav className="breadcrumb-nav mb-2">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/products">Products</Link>
            </li>
            <li className="breadcrumb-item active">{deviceData.name}</li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section bg-gradient-to-r from-slate-900 to-slate-700 text-white py-20">
        <div className="container">
          <div className="row items-center">
            <div className="col-lg-6">
              <h1 className="text-5xl font-bold mb-4 text-white">{deviceData.name}</h1>
              <p className="text-xl mb-6 text-gray-300">{deviceData.tagline}</p>
              
              {/* BUSINESS USER INDICATOR */}
              {isBusinessUser && deviceData?.business_price && (
                <div className="business-pricing-banner mb-4">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    💼 Business Pricing Applied
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(averageRating)}</div>
                  <span className="text-sm">({totalReviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* UPDATED PRICE DISPLAY WITH BUSINESS PRICING */}
                  {shouldShowSalePrice() || shouldShowBusinessPrice() ? (
                    <>
                      <span className="text-2xl font-bold text-green-400">
                        {formatPrice(getDisplayPrice())}
                      </span>
                      <span className="text-lg line-through text-gray-400">
                        {formatPrice(getOriginalPrice())}
                      </span>
                      {isBusinessUser && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                          Business
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-green-400">
                      {formatPrice(getDisplayPrice())}
                      {isBusinessUser && deviceData?.business_price && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full ml-2">
                          Business
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/produk/${deviceData.slug?.current || deviceData.slug}`}>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  See Product Details
                </button>
              </Link>
            </div>
            <div className="col-lg-6">
              <div className="relative group">
                <Image
                  src={deviceData.gallery?.[activeImageIndex] || deviceData.mainImage || "/api/placeholder/600/600"}
                  alt={deviceData.name}
                  width={600}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
                {deviceData.gallery && deviceData.gallery.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
              {/* Image Thumbnails */}
              {deviceData.gallery && deviceData.gallery.length > 1 && (
                <div className="flex gap-2 mt-4 justify-center">
                  {deviceData.gallery.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`border-2 rounded-lg overflow-hidden transition-colors ${
                        activeImageIndex === index ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`View ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      {deviceData.videos && deviceData.videos.length > 0 && (
        <section className="video-section py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Lihat Dalam Aksi</h2>
            <div className="flex justify-center">
              <div className={`grid gap-6 ${deviceData.videos.length === 1 ? 'grid-cols-1 max-w-2xl' : deviceData.videos.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {deviceData.videos.map((video, index) => (
                  <div key={index} className="mb-6">
                    <div className="relative group rounded-lg overflow-hidden shadow-lg">
                      {video.videoUrl || video.videoFile ? (
                        <video
                          className="w-full h-80 object-cover"
                          controls
                          poster={video.thumbnail}
                          preload="metadata"
                        >
                          <source src={video.videoUrl || video.videoFile} type="video/mp4" />
                          <source src={video.videoUrl || video.videoFile} type="video/webm" />
                          <source src={video.videoUrl || video.videoFile} type="video/ogg" />
                          Browser Anda tidak mendukung pemutar video.
                        </video>
                      ) : video.thumbnail ? (
                        <div className="relative">
                          <Image
                            src={video.thumbnail}
                            alt={video.title}
                            width={500}
                            height={400}
                            className="w-full h-80 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                              <span className="text-white text-sm">Video tidak tersedia</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-80 bg-gray-800 flex items-center justify-center">
                          <span className="text-white text-lg">Video tidak tersedia</span>
                        </div>
                      )}
                      {video.title && (
                        <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded">
                          <h3 className="text-lg font-semibold">{video.title}</h3>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {deviceData.features && deviceData.features.length > 0 && (
        <section className="features-section py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Fitur Utama</h2>
            <div className="flex justify-center">
              <div className={`grid gap-8 ${
                deviceData.features.length === 1 ? 'grid-cols-1 max-w-sm' :
                deviceData.features.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl' :
                deviceData.features.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              }`}>
                {deviceData.features.map((feature, index) => (
                  <div key={index} className="mb-8">
                    <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-4xl mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Color Options */}
      {deviceData.colors && deviceData.colors.length > 0 && (
        <section className="color-section py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Warna yang Tersedia</h2>
            <div className="flex justify-center">
              <div className={`flex gap-6 flex-wrap justify-center ${
                deviceData.colors.length === 1 ? 'max-w-xs' :
                deviceData.colors.length === 2 ? 'max-w-md' :
                deviceData.colors.length === 3 ? 'max-w-lg' :
                'max-w-2xl'
              }`}>
                {deviceData.colors.map((color, index) => (
                  <div key={index} className="text-center group cursor-pointer">
                    <div className="relative mb-3">
                      <Image
                        src={color.image || "/api/placeholder/100/100"}
                        alt={color.name}
                        width={100}
                        height={100}
                        className="w-24 h-24 rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                      />
                      <div
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: color.color }}
                      ></div>
                    </div>
                    <p className="font-medium text-sm">{color.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Detailed Information Tabs */}
      <section className="details-section py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-8">
              {[
                { key: 'overview', label: 'Gambaran' },
                { key: 'specifications', label: 'Spesifikasi' },
                { key: 'reviews', label: 'Ulasan' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-bold mb-4">Product Overview</h3>
                  <p className="text-lg mb-6">{deviceData.description}</p>
                  {renderDescription(deviceData.detailedDescription)}
                  <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <div>
                      <h4 className="text-xl font-semibold mb-4">What's Included</h4>
                      <ul className="space-y-2">
                        {deviceData.whatsIncluded && deviceData.whatsIncluded.length > 0 ? deviceData.whatsIncluded.map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            <span>{item}</span>
                          </li>
                        )) : (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="w-5 h-5 text-green-500" />
                              <span>1x Vape Device</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-5 h-5 text-green-500" />
                              <span>2x Replacement Pods</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-5 h-5 text-green-500" />
                              <span>1x USB-C Charging Cable</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-5 h-5 text-green-500" />
                              <span>User Manual & Warranty Card</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-4">Safety Information</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Important Notice</p>
                            {deviceData.safetyInfo ? (
                              renderDescription(deviceData.safetyInfo)
                            ) : (
                              <p>This product contains nicotine. Keep away from children and pets. Not for use by minors, pregnant or breastfeeding women.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'specifications' && (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Technical Specifications</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      {deviceData.specifications && deviceData.specifications.length > 0 ? deviceData.specifications.map((spec, index) => (
                        <div key={index} className="flex justify-between py-2 border-b border-gray-200">
                          <span className="font-medium text-gray-700">{spec.label}:</span>
                          <span className="text-gray-900">{spec.value}</span>
                        </div>
                      )) : (
                        <>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-medium text-gray-700">Battery Capacity:</span>
                            <span className="text-gray-900">1000mAh</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-medium text-gray-700">Pod Capacity:</span>
                            <span className="text-gray-900">2ml</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="font-medium text-gray-700">Charging:</span>
                            <span className="text-gray-900">USB-C Fast Charge</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">Compatibility</h4>
                      <ul className="space-y-2 text-gray-700">
                        {deviceData.compatibility && deviceData.compatibility.length > 0 ? deviceData.compatibility.map((item, index) => (
                          <li key={index}>• {item}</li>
                        )) : (
                          <>
                            <li>• Compatible with all standard pods</li>
                            <li>• Works with various e-liquid viscosities</li>
                            <li>• Universal USB-C charging</li>
                            <li>• Temperature range: -10°C to 60°C</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Customer Reviews</h3>
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl font-bold">{averageRating}</div>
                      <div>
                        <div className="flex">{renderStars(averageRating)}</div>
                        <p className="text-gray-600">Based on {totalReviewCount} reviews</p>
                      </div>
                    </div>
                    {/* Rating Breakdown */}
                    {reviewsArray.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Rating breakdown:</h4>
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = reviewsArray.filter(review => review.rating === star).length;
                          const percentage = reviewsArray.length > 0 ? (count / reviewsArray.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 mb-1">
                              <span className="text-sm w-8">{star}★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {reviewsArray.length > 0 ? (
                      reviewsArray.map((review, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {review.customerName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{review.customerName || 'Anonymous'}</span>
                                  {review.verified && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                      Verified Purchase
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex">{renderStars(review.rating || 0)}</div>
                                  <span className="text-gray-500 text-sm">
                                    {review.reviewDate ? formatReviewDate(review.reviewDate) : 'Recently'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {review.wouldRecommend !== undefined && (
                              <div className="text-right">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  review.wouldRecommend
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {review.wouldRecommend ? '👍 Recommends' : '👎 Doesn\'t recommend'}
                                </span>
                              </div>
                            )}
                          </div>
                          {review.title && (
                            <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                          )}
                          <p className="text-gray-700 mb-4">{review.comment || 'No comment provided'}</p>
                          {/* Pros and Cons */}
                          {(review.pros?.length > 0 || review.cons?.length > 0) && (
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              {review.pros?.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-green-700 mb-2">👍 Pros:</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {review.pros.map((pro, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        <span>{pro}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {review.cons?.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-red-700 mb-2">👎 Cons:</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {review.cons.map((con, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span>{con}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Review Images */}
                          {review.reviewImages?.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Customer Photos:</h5>
                              <div className="flex gap-2">
                                {review.reviewImages.map((image, imgIdx) => (
                                  <Image
                                    key={imgIdx}
                                    src={image}
                                    alt={`Review image ${imgIdx + 1}`}
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 object-cover rounded-lg border"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Helpful Counter */}
                          {review.helpful > 0 && (
                            <div className="text-sm text-gray-500">
                              {review.helpful} people found this review helpful
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      // Fallback to sample reviews if no real reviews exist
                      [
                        { customerName: "John D.", rating: 5, comment: "Excellent build quality and amazing battery life. Highly recommend!", reviewDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
                        { customerName: "Sarah M.", rating: 4, comment: "Great device overall. The flavor is outstanding and it's very easy to use.", reviewDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
                        { customerName: "Mike R.", rating: 5, comment: "Best vape I've owned. The design is sleek and performance is top-notch.", reviewDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
                      ].map((review, index) => (
                        <div key={index} className="border-b border-gray-200 pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{review.customerName}</span>
                            <div className="flex">{renderStars(review.rating)}</div>
                            <span className="text-gray-500 text-sm">{formatReviewDate(review.reviewDate)}</span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience Premium Vaping?</h2>
          <p className="text-2xl mb-8 opacity-90 text-white">Join thousands of satisfied customers</p>
          
          {/* BUSINESS PRICING INDICATOR IN CTA */}
          {isBusinessUser && deviceData?.business_price && (
            <div className="mb-6">
              <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                💼 Special Business Pricing Available
              </span>
            </div>
          )}

          <div className="flex justify-center gap-4 flex-wrap">
            <Link href={`/produk/${deviceData.slug?.current || deviceData.slug}`}>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {/* UPDATED CTA PRICE WITH BUSINESS PRICING */}
                See Product Details - {formatPrice(getDisplayPrice())}
                {isBusinessUser && deviceData?.business_price && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full ml-2">
                    Business
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .business-pricing-banner {
          animation: fadeInUp 0.5s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

export default ProductShowcasePage;