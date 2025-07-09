"use client"

import Card from "@/components/features/accordion/card";
import Accordion from "@/components/features/accordion/accordion";
import Link from "next/link";
import Image from "next/image";

import { PortableText } from "@portabletext/react";
import { RichTextComponents } from "@/components/features/rich-text-component";
import { calculateDaysAgo } from "@/utils/daysAgo";
import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { sanityAdminClient } from "@/sanity/lib/client";
import { useRouter } from "next/navigation";

function InfoThree({ product }) {
  const [review, setReview] = useState({
    title: '',
    comment: '',
    name: '',
    email: '',
  });
  const [reviewImages, setReviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const fileInputRef = useRef(null);

  const router = useRouter();

  const setRating = (e) => {
    e.preventDefault();

    if (e.currentTarget.parentNode.querySelector(".active")) {
      e.currentTarget.parentNode
        .querySelector(".active")
        .classList.remove("active");
    }

    e.currentTarget.classList.add("active");
  };

  function generateUniqueKey() {
    // Generate a random string of characters
    const randomString = Math.random().toString(36).substring(2, 10);
    
    // Append a timestamp to ensure uniqueness
    const timestamp = Date.now();
  
    // Combine the random string and timestamp to create a unique key
    const uniqueKey = `${randomString}_${timestamp}`;
  
    return uniqueKey;
  }
  
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setLoading(true);
    const uploadedImages = [];
    
    try {
      for (const file of files) {
        const asset = await uploadImageToSanity(file);
        uploadedImages.push(asset);
      }
      
      setReviewImages([...reviewImages, ...uploadedImages]);
      toast.success(`${uploadedImages.length} image(s) uploaded`);
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setLoading(false);
    }
  };
  
  const uploadImageToSanity = async (file) => {
    // Create a new FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload to Sanity's CDN
    const response = await sanityAdminClient.assets.upload('image', file);
    
    // Return the asset reference
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: response._id
      }
    };
  };
  
  const removeImage = (index) => {
    const newImages = [...reviewImages];
    newImages.splice(index, 1);
    setReviewImages(newImages);
  };
  
  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
  };
  
  const closeImageModal = () => {
    setModalImage(null);
  };

  const addReview = async () => {
    try {
      const stars = document.querySelectorAll('.star.active')?.[0]?.classList?.[0] * 1

      if (!stars) {
        toast.error('Please select a rating')
        return
      }

      setLoading(true);
      
      const tempReview = {
        _key: generateUniqueKey(),
        stars,
        title: review.title,
        description: review.comment,
        name: review.name,
        createdAt: new Date(),
        reviewImages: reviewImages.length > 0 ? reviewImages : undefined
      }
      
      const updatedProduct = {
        _type: 'product',
        ...product,
        reviews: [...product.reviews, tempReview],
        relatedProducts: product?.relatedProducts?.map((prod) => ({
          ...prod,
          _type: 'product',
          _key: prod._id,
        })),
      };

      const updatedReviews = [...product.reviews, tempReview]
      const res = await sanityAdminClient.patch(product._id).set({ reviews: updatedReviews }).commit();

      toast.success('Review added!')
      setReview({
        title: '',
        comment: '',
        name: '',
        email: '',
      });
      setReviewImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      router.refresh();
    }
    catch (err) {
      console.log("🚀 ~ addReview ~ err:", err)
      toast.error(err.message || "Failed to add review")
    }
    finally {
      setLoading(false);
    }
  }

  if (!product) {
    return <div></div>;
  }

  return (
    <>
      <Accordion adClass="accordion-plus product-details-accordion pb-2 mb-0">
        {product?.description && <Card title="Deskripsi" adClass="card-box card-sm">
          <div className="product-desc-content">
            <PortableText
              value={product?.description}
              components={RichTextComponents}
            />
          </div>
        </Card>}
        {product?.additionalInfo && <Card title="Tambahan Informasi" adClass="card-box card-sm">
          <div className="product-desc-content">
            <PortableText
              value={product?.additionalInfo}
              components={RichTextComponents}
            />
          </div>
        </Card>}
        {product?.shippingDetails && <Card
          title="Pengiriman dan Pengembalian"
          adClass="card-box card-sm"
        >
          <div className="product-desc-content">
            <PortableText
              value={product?.shippingDetails}
              components={RichTextComponents}
            />
          </div>
        </Card>}
        <Card title={`Ulasan (${product?.reviews?.length || 0})`} adClass="card-box card-sm">
          <div className="reviews">
            {product?.reviews?.length > 0 ? (
              product.reviews.map((review, index) => (
                <div className={`review ${index === product?.reviews?.length-1 ? 'border-0' : ''}`} key={`review-${index}`}>
                  <div className="row no-gutters">
                    <div className="col-auto" style={{ minWidth: '120px' }}>
                      <h4 className="mb-1">
                        <Link href="#">{review?.name}</Link>
                      </h4>
                      <div className="ratings-container mb-1">
                        <div className="ratings">
                          <div
                            className="ratings-val"
                            style={{ width: review?.stars * 20 + "%" }}
                          ></div>
                          <span className="tooltip-text">
                            {review?.stars?.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <span className="review-date mb-1 text-muted small">
                        {calculateDaysAgo(review?.createdAt)}
                      </span>
                    </div>
                    <div className="col">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {/* Verified Purchase Badge */}
                          
                            <span 
                              className="badge"
                              style={{ 
                                fontSize: '11px', 
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                border: '1px solid #bbf7d0',
                                fontWeight: '500',
                                padding: '4px 8px'
                              }}
                            >
                              Verified Purchase
                            </span>
                         
                        </div>
                        {/* Recommends Badge */}
                        <div>

                            <span 
                              className="badge"
                              style={{ 
                                fontSize: '11px',
                                backgroundColor: review.wouldRecommend ? '#dcfce7' : '#fecaca',
                                color: review.wouldRecommend ? '#166534' : '#dc2626',
                                border: review.wouldRecommend ? '1px solid #bbf7d0' : '1px solid #fca5a5',
                                fontWeight: '500',
                                padding: '4px 8px'
                              }}
                            >
                              👍 Recommends
                            </span>
                        </div>
                      </div>

                      <h4 className="mb-3" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                        {review.title}
                      </h4>

                      <div className="review-content">
                        <p className="mb-3">{review.description}</p>
                      </div>
                      
                      {/* Review Images Display */}
                      {review.reviewImages && review.reviewImages.length > 0 && (
                        <div className="review-images mt-2">
                          <div className="row">
                            {review.reviewImages.map((img, imgIndex) => (
                              <div className="col-4 col-sm-3 col-lg-2 mb-2" key={`review-img-${index}-${imgIndex}`}>
                                <div 
                                  className="review-image-container" 
                                  style={{ cursor: 'pointer', position: 'relative', paddingBottom: '100%', overflow: 'hidden', borderRadius: '4px' }}
                                  onClick={() => openImageModal(img?.asset?._ref)}
                                >
                                  <img 
                                    src={`https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${img?.asset?._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}`}
                                    alt={`Review ${index+1} image ${imgIndex+1}`}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>Belum ada ulasan untuk produk ini.</p>
            )}
          </div>
        </Card>
        
        {/* New "Tulis Ulasan" tab */}
        <Card title="Tulis Ulasan" adClass="card-box card-sm">
          <div className="write-review">
            <div className="title-wrapper text-left">
              <h3 className="title title-simple text-left text-normal">
                Tambahkan Ulasan
              </h3>
              <p>
                Email Anda tidak akan dipublikasikan. Kolom yang wajib diisi ditandai dengan *
              </p>
            </div>
            <div className="rating-form">
              <label htmlFor="rating" className="text-dark">
                Rating Anda *{" "}
              </label>
              <span className="rating-stars selected">
                {[1, 2, 3, 4, 5].map((num, index) => (
                  <a
                    className={`${num} star star-${num}`}
                    href="#"
                    onClick={setRating}
                    key={"star-" + index}
                  >
                    {num}
                  </a>
                ))}
              </span>
            </div>
            <form>
              <div className="">
                <input
                  type="text"
                  className="form-control"
                  id="reply-title"
                  name="reply-title"
                  placeholder="Judul *"
                  required
                  value={review.title}
                  onChange={(e) => setReview({...review, title: e.target.value})}
                />
              </div>
              <textarea
                id="reply-message"
                cols="30"
                rows="6"
                className="form-control mb-2"
                placeholder="Komentar *"
                required
                value={review.comment}
                onChange={(e) => setReview({...review, comment: e.target.value})}
              ></textarea>
              <div className="row">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    id="reply-name"
                    name="reply-name"
                    placeholder="Nama *"
                    required
                    value={review.name}
                    onChange={(e) => setReview({...review, name: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="email"
                    className="form-control"
                    id="reply-email"
                    name="reply-email"
                    placeholder="Email *"
                    required
                    value={review.email}
                    onChange={(e) => setReview({...review, email: e.target.value})}
                  />
                </div>
              </div>
              
              {/* Image Upload Section */}
              <div className="form-group mt-3">
                <label htmlFor="review-images" className="text-dark">Upload Gambar (Opsional)</label>
                <input
                  type="file"
                  className="form-control-file"
                  id="review-images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
                
                {/* Preview uploaded images */}
                {reviewImages.length > 0 && (
                  <div className="uploaded-images mt-2">
                    <div className="row">
                      {reviewImages.map((img, index) => (
                        <div className="col-4 col-sm-3 col-lg-2 mb-2" key={`upload-preview-${index}`}>
                          <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden', borderRadius: '4px' }}>
                            <img 
                              src={`https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${img?.asset?._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}`}
                              alt={`Upload preview ${index+1}`}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button 
                              type="button" 
                              className="btn btn-sm btn-danger" 
                              style={{ position: 'absolute', top: 0, right: 0, padding: '2px 6px', borderRadius: '0 4px 0 4px' }}
                              onClick={() => removeImage(index)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={addReview} 
                type="button" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Kirim Ulasan'}
              </button>
            </form>
          </div>
        </Card>
      </Accordion>
      
      {/* Image Modal/Lightbox */}
      {modalImage && (
        <div 
          className="image-modal" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.9)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 9999 
          }}
          onClick={closeImageModal}
        >
          <button 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              fontSize: '30px', 
              cursor: 'pointer' 
            }}
          >
            ×
          </button>
          <img 
            src={`https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${modalImage.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}`}
            alt="Enlarged review image" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} 
          />
        </div>
      )}
    </>
  );
}

export default InfoThree;