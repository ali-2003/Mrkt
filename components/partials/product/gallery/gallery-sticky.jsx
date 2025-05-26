"use client"
import React, { useState, useEffect, useRef } from "react";
import LightBox from "react-image-lightbox";
import urlFor from "@/sanity/lib/image";

function GallerySticky(props) {
  const { product, selectedColor } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef(null);
  const [isLightboxReady, setIsLightboxReady] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);

  // Get all images for display in carousel
  const getAllImages = () => {
    if (product?.productType === 'pod' && product?.podColors?.length > 0) {
      // For pod products, collect all images from all colors
      const allImages = [];
      product.podColors.forEach((color, colorIndex) => {
        if (color.pictures && color.pictures.length > 0) {
          color.pictures.forEach((picture, pictureIndex) => {
            allImages.push({
              ...picture,
              colorInfo: {
                colorName: color.colorName,
                colorCode: color.colorCode,
                colorIndex: colorIndex, // Add color index for reference
                pictureIndex: pictureIndex // Add picture index within color
              }
            });
          });
        }
      });
      return allImages;
    } else if (product?.pictures) {
      return product.pictures.map(picture => ({ ...picture, colorInfo: null }));
    }
    return [];
  };

  // Update current images based on product type and selected color
  useEffect(() => {
    const allImages = getAllImages();
    setCurrentImages(allImages);
  }, [product]);

  // Separate effect for handling color selection changes
  useEffect(() => {
    if (product?.productType === 'pod' && selectedColor && currentImages.length > 0) {
      const firstImageOfSelectedColor = currentImages.findIndex(img => 
        img.colorInfo?.colorName === selectedColor.colorName
      );
      if (firstImageOfSelectedColor !== -1 && firstImageOfSelectedColor !== photoIndex) {
        setPhotoIndex(firstImageOfSelectedColor);
      }
    }
  }, [selectedColor, currentImages]); // Only depend on selectedColor and currentImages

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
    if (carouselRef.current && currentImages.length > 0) {
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
  }, [photoIndex, currentImages]);

  function moveNextPhoto() {
    setPhotoIndex((photoIndex + 1) % currentImages.length);
    setIsLightboxReady(true);
  }

  function movePrevPhoto() {
    setPhotoIndex(
      (photoIndex + currentImages.length - 1) % currentImages.length
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
    
    // If this is a pod product and the clicked image has color info,
    // notify parent about the color change
    if (product?.productType === 'pod' && currentImages[index]?.colorInfo) {
      const imageColorInfo = currentImages[index].colorInfo;
      const correspondingColor = product.podColors[imageColorInfo.colorIndex];
      if (correspondingColor && props.onImageColorChange) {
        // Use setTimeout to ensure the color change happens after the image change
        setTimeout(() => {
          props.onImageColorChange(correspondingColor);
        }, 0);
      }
    }
  }

  function scrollPrev() {
    // Go to previous image
    const newIndex = (photoIndex + currentImages.length - 1) % currentImages.length;
    setPhotoIndex(newIndex);
    
    // No need to manually scroll as useEffect will center the active thumbnail
  }

  function scrollNext() {
    // Go to next image
    const newIndex = (photoIndex + 1) % currentImages.length;
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

  // Get current stock based on product type
  const getCurrentStock = () => {
    if (product?.productType === 'pod' && selectedColor) {
      return selectedColor.stock;
    }
    return product?.stock;
  };

  const currentStock = getCurrentStock();

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
        {currentStock == 0 ? (
          <span className="product-label label-out">Out of Stock</span>
        ) : (
          ""
        )}
        
        {/* Color indicator for pod products */}
        {product?.productType === 'pod' && (
          <div className="color-indicator">
            {currentImages[photoIndex]?.colorInfo ? (
              <>
                <div 
                  className="color-dot"
                  style={{ backgroundColor: currentImages[photoIndex].colorInfo.colorCode }}
                  title={currentImages[photoIndex].colorInfo.colorName}
                ></div>
                <span className="color-text">{currentImages[photoIndex].colorInfo.colorName}</span>
              </>
            ) : (
              <span className="color-text">All Colors</span>
            )}
          </div>
        )}
        
        {/* Main Image Container */}
        <figure 
          className="product-main-image" 
          style={{ backgroundColor: "#f4f4f4" }}
        >
          <div className="position-relative" style={{ paddingTop: '100%' }}>
            {currentImages?.[photoIndex] && (
              <img
                src={urlFor(currentImages?.[photoIndex])?.url()}
                alt={`product ${currentImages[photoIndex]?.colorInfo ? `- ${currentImages[photoIndex].colorInfo.colorName}` : ''}`}
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
            {/* Color indicator overlay for current image if it has color info */}
            {currentImages?.[photoIndex]?.colorInfo && (
              <div className="image-color-overlay">
                <div 
                  className="overlay-color-dot"
                  style={{ backgroundColor: currentImages[photoIndex].colorInfo.colorCode }}
                ></div>
                <span className="overlay-color-text">
                  {currentImages[photoIndex].colorInfo.colorName}
                </span>
              </div>
            )}
          </div>
          {currentImages.length > 0 && (
            <button
              id="btn-product-gallery"
              className="btn-product-gallery"
              onClick={(e) => openLightBox(e, photoIndex)}
            >
              <i className="icon-arrows"></i>
            </button>
          )}
        </figure>

        {/* Carousel in middle of the main image - only show if there are multiple images */}
        {currentImages.length > 1 && (
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
              .color-indicator {
                position: absolute;
                top: 10px;
                right: 10px;
                background-color: rgba(255, 255, 255, 0.9);
                padding: 8px 12px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                gap: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 10;
              }
              .color-dot {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              }
              .image-color-overlay {
                position: absolute;
                bottom: 20px;
                left: 20px;
                background-color: rgba(0, 0, 0, 0.7);
                padding: 6px 12px;
                border-radius: 15px;
                display: flex;
                align-items: center;
                gap: 6px;
                z-index: 5;
              }
              .overlay-color-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 1px solid #fff;
              }
              .overlay-color-text {
                font-size: 11px;
                color: #fff;
                font-weight: 500;
                text-transform: capitalize;
              }
              .thumbnail-color-indicator {
                position: absolute;
                top: 4px;
                right: 4px;
                z-index: 5;
              }
              .thumbnail-color-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 1px solid #fff;
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
              }
              @media (max-width: 767px) {
                .thumbnail-item {
                  width: calc(33.333% - 8px);
                }
                .carousel-wrapper {
                  margin: 0 35px; /* Smaller margin on mobile */
                }
                .color-indicator {
                  top: 8px;
                  right: 8px;
                  padding: 6px 10px;
                }
                .color-dot {
                  width: 14px;
                  height: 14px;
                }
                .color-text {
                  font-size: 11px;
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
                {currentImages?.map((item, index) => (
                  <div 
                    key={index} 
                    className={`thumbnail-item ${photoIndex === index ? 'active' : ''}`}
                    onClick={() => changeMainImage(index)}
                  >
                    <img
                      src={urlFor(item)?.url()}
                      alt={`Thumbnail ${index + 1}${item?.colorInfo ? ` - ${item.colorInfo.colorName}` : ''}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {/* Color indicator on thumbnail */}
                    {item?.colorInfo && (
                      <div className="thumbnail-color-indicator">
                        <div 
                          className="thumbnail-color-dot"
                          style={{ backgroundColor: item.colorInfo.colorCode }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              className="carousel-arrow carousel-arrow-next" 
              onClick={scrollNext}
              aria-label="Next image"
              style={{ visibility: photoIndex < currentImages.length - 1 ? 'visible' : 'hidden' }}
            >
              <i className="icon-angle-right"></i>
            </button>
          </div>
        )}
      </div>

      {isOpen && currentImages.length > 0 && (
        <LightBox
          mainSrc={urlFor(currentImages?.[photoIndex]).url()}
          nextSrc={
            currentImages.length > 1 
              ? urlFor(
                  currentImages?.[
                    (photoIndex + 1) % currentImages.length
                  ]
                ).url()
              : undefined
          }
          prevSrc={
            currentImages.length > 1
              ? urlFor(
                  currentImages?.[
                    (photoIndex + currentImages.length - 1) %
                      currentImages.length
                  ]
                ).url()
              : undefined
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