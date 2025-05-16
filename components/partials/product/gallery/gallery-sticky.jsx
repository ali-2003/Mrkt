"use client"
import React, { useState, useEffect, useRef } from "react";
import LightBox from "react-image-lightbox";
import urlFor from "@/sanity/lib/image";

function GallerySticky(props) {
  const { product } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef(null);
  const [isLightboxReady, setIsLightboxReady] = useState(false);

  useEffect(() => {
    if (product) {
      setIsOpen(false);
      setPhotoIndex(0);
      setScrollPosition(0);
      setIsLightboxReady(false);
    }
  }, [product]);

  useEffect(() => {
    // Center the active thumbnail in the carousel whenever photoIndex changes
    if (carouselRef.current && product?.pictures?.length > 0) {
      // We need to access the parent container of thumbnails for proper centering
      const container = carouselRef.current;
      const thumbnailItems = container.querySelectorAll('.thumbnail-item');
      
      if (thumbnailItems[photoIndex]) {
        const containerWidth = container.clientWidth;
        
        // Get the position of the active thumbnail
        const activeThumb = thumbnailItems[photoIndex];
        const thumbWidth = activeThumb.offsetWidth;
        const thumbLeftPosition = activeThumb.offsetLeft;
        
        // Calculate center position (center the active thumbnail)
        const newScrollPos = thumbLeftPosition - (containerWidth / 2) + (thumbWidth / 2);
        
        // Keep within bounds
        const maxScroll = container.scrollWidth - containerWidth;
        const boundedScrollPos = Math.max(0, Math.min(newScrollPos, maxScroll));
        
        // Update scroll position
        setScrollPosition(boundedScrollPos);
        container.scrollTo({
          left: boundedScrollPos,
          behavior: 'smooth'
        });
      }
    }
  }, [photoIndex, product?.pictures]);

  function moveNextPhoto() {
    setPhotoIndex((photoIndex + 1) % product?.pictures.length);
    setIsLightboxReady(true);
  }

  function movePrevPhoto() {
    setPhotoIndex(
      (photoIndex + product?.pictures.length - 1) % product?.pictures.length
    );
    setIsLightboxReady(true);
  }

  function openLightBox(e, index) {
    e.preventDefault();
    setPhotoIndex(index);
    setIsOpen(true);
    // Set a small timeout to ensure lightbox is ready
    setTimeout(() => {
      setIsLightboxReady(true);
    }, 300);
  }

  function closeLightBox() {
    setIsOpen(false);
    setIsLightboxReady(false);
  }

  function changeMainImage(index) {
    setPhotoIndex(index);
  }

  function scrollPrev() {
    // Go to previous image
    const newIndex = (photoIndex + product?.pictures.length - 1) % product?.pictures.length;
    setPhotoIndex(newIndex);
    
    // No need to manually scroll as useEffect will center the active thumbnail
  }

  function scrollNext() {
    // Go to next image
    const newIndex = (photoIndex + 1) % product?.pictures.length;
    setPhotoIndex(newIndex);
    
    // No need to manually scroll as useEffect will center the active thumbnail
  }

  function canScrollPrev() {
    return scrollPosition > 0;
  }

  function canScrollNext() {
    if (!carouselRef.current) return false;
    return scrollPosition < carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
  }

  if (!product) {
    return <div></div>;
  }

  return (
    <>
      <div className="product-gallery product-gallery-separated">
        {product?.hot ? (
          <span className="product-label label-new">Hot</span>
        ) : (
          ""
        )}
        {product?.sale_price ? (
          <span className="product-label label-sale">Promo</span>
        ) : (
          ""
        )}
        {product?.featured ? (
          <span className="product-label label-top">Viral</span>
        ) : (
          ""
        )}
        {product?.stock == 0 ? (
          <span className="product-label label-out">Out of Stock</span>
        ) : (
          ""
        )}
        
        {/* Main Image Container */}
        <figure 
          className="product-main-image" 
          style={{ backgroundColor: "#f4f4f4" }}
        >
          <div className="position-relative" style={{ paddingTop: '100%' }}>
            {product?.pictures?.[photoIndex] && (
              <img
                src={urlFor(product?.pictures?.[photoIndex])?.url()}
                alt="product"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            )}
          </div>
          <button
            id="btn-product-gallery"
            className="btn-product-gallery"
            onClick={(e) => openLightBox(e, photoIndex)}
          >
            <i className="icon-arrows"></i>
          </button>
        </figure>

        {/* Carousel in middle of the main image */}
        <div className="thumbnail-carousel position-relative" style={{ 
          position: 'absolute', 
          bottom: '10%', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: '90%',
          zIndex: 5
        }}>
          <style jsx>{`
            .thumbnail-carousel {
              background-color: rgba(255, 255, 255, 0.7);
              padding: 8px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .carousel-wrapper {
              flex: 1;
              position: relative;
              margin: 0 40px; /* Equal spacing for arrows on both sides */
            }
            .carousel-container {
              display: flex;
              overflow-x: hidden;
              scroll-behavior: smooth;
              scrollbar-width: none; /* Hide scrollbar Firefox */
              -ms-overflow-style: none; /* Hide scrollbar IE/Edge */
              justify-content: center; /* Center the thumbnails */
            }
            .carousel-container::-webkit-scrollbar {
              display: none; /* Hide scrollbar Chrome/Safari */
            }
            .thumbnail-item {
              flex: 0 0 auto;
              width: calc(25% - 8px);
              margin: 0 4px; /* Equal margin on both sides */
              cursor: pointer;
              border: 2px solid transparent;
              transition: all 0.2s ease;
              position: relative;
              aspect-ratio: 1;
            }
            .thumbnail-item.active {
              border-color: #0088cc;
            }
            .carousel-arrow {
              flex: 0 0 30px;
              width: 30px;
              height: 30px;
              background-color: rgba(0, 0, 0, 0.6);
              border: none;
              border-radius: 50%;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10;
              cursor: pointer;
              transition: all 0.3s ease;
              margin: 0 5px; /* Consistent margin */
            }
            .carousel-arrow:hover {
              background-color: rgba(0, 0, 0, 0.8);
            }
            @media (max-width: 767px) {
              .thumbnail-item {
                width: calc(33.333% - 8px);
              }
              .carousel-wrapper {
                margin: 0 35px; /* Smaller margin on mobile */
              }
            }
          `}</style>
          
          <button 
            className="carousel-arrow carousel-arrow-prev" 
            onClick={scrollPrev}
            aria-label="Previous image"
            style={{ visibility: photoIndex > 0 ? 'visible' : 'hidden' }}
          >
            <i className="icon-angle-left"></i>
          </button>
          
          <div className="carousel-wrapper">
            <div 
              ref={carouselRef}
              className="carousel-container"
            >
              {product?.pictures?.map((item, index) => (
                <div 
                  key={index} 
                  className={`thumbnail-item ${photoIndex === index ? 'active' : ''}`}
                  onClick={() => changeMainImage(index)}
                >
                  <img
                    src={urlFor(item)?.url()}
                    alt={`Thumbnail ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className="carousel-arrow carousel-arrow-next" 
            onClick={scrollNext}
            aria-label="Next image"
            style={{ visibility: photoIndex < product?.pictures.length - 1 ? 'visible' : 'hidden' }}
          >
            <i className="icon-angle-right"></i>
          </button>
        </div>
      </div>

      {isOpen && (
        <LightBox
          mainSrc={urlFor(product?.pictures?.[photoIndex]).url()}
          nextSrc={
            urlFor(
              product?.pictures?.[
                (photoIndex + 1) % product?.pictures.length
              ]
            ).url()
          }
          prevSrc={
            urlFor(
              product?.pictures?.[
                (photoIndex + product?.pictures.length - 1) %
                  product?.pictures.length
              ]
            ).url()
          }
          onCloseRequest={closeLightBox}
          onMovePrevRequest={movePrevPhoto}
          onMoveNextRequest={moveNextPhoto}
          reactModalStyle={{
            overlay: {
              zIndex: 1041,
            },
          }}
          wrapperClassName="lightbox-modal"
          enableZoom={isLightboxReady}
          animationDisabled={!isLightboxReady}  
          animationOnKeyInput={isLightboxReady}
        />
      )}
    </>
  );
}

export default GallerySticky;