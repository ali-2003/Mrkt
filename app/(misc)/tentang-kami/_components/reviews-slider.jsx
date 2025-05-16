"use client"

import React from "react";

import OwlCarousel from "@/components/features/owl-carousel";

const ReviewsSlider = ({ reviews }) => {
  return (
    <OwlCarousel options={{ nav: false, dots: true }}>
      {reviews?.map((review, index) => (
        <blockquote className="testimonial text-center">
          <div className="ratings-container justify-content-center">
            <div className="ratings">
              <div className="ratings-val" style={{ width: review?.stars * 20 + "%" }}></div>
              <span className="tooltip-text">{review?.stars?.toFixed(2)}</span>
            </div>
          </div>
          <h5 className="subtitle font-weight-lighter text-primary">{review?.heading}</h5>
          <p className="font-weight-normal text-dark">&rsquo;{review?.text}&rsquo;</p>
          <cite className="font-weight-normal text-dark">- {review?.reviewerName}</cite>
          <p className="font-weight-normal text-dark">{review?.country}</p>
        </blockquote>
      ))}
    </OwlCarousel>
  );
};

export default ReviewsSlider;
