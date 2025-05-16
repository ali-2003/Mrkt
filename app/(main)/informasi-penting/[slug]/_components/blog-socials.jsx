import React from "react";

const BlogSocials = () => {
  return (
    <div className="col-md-auto mt-2 mt-md-0">
      <div className="social-icons social-icons-color">
        <span className="social-label">Bagikan artikel ini:</span>
        <a href="#" className="social-icon social-facebook" title="Facebook">
          <i className="icon-facebook-f"></i>
        </a>
        <a href="#" className="social-icon social-twitter" title="Twitter">
          <i className="icon-twitter"></i>
        </a>
        <a href="#" className="social-icon social-pinterest" title="Pinterest">
          <i className="icon-pinterest"></i>
        </a>
        <a href="#" className="social-icon social-linkedin" title="Linkedin">
          <i className="icon-linkedin"></i>
        </a>
      </div>
    </div>
  );
};

export default BlogSocials;
