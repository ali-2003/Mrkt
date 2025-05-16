"use client";

import React, { useEffect, useState } from "react";
import StickyBox from "react-sticky-box";
import BlogSidebar from "@/components/partials/blog/sidebar/blog-sidebar";

const BlogMainSidebar = ({ post, popular }) => {
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    window.addEventListener("resize", resizeHandle);
    resizeHandle();

    return () => {
      window.removeEventListener("resize", resizeHandle);
    };
  }, []);

  function resizeHandle() {
    if (document.querySelector("body").offsetWidth < 992) setToggle(true);
    else setToggle(false);
  }

  function toggleSidebar() {
    if (document.querySelector("body").classList.contains("sidebar-filter-active")) {
      document.querySelector("body").classList.remove("sidebar-filter-active");
    } else {
      document.querySelector("body").classList.add("sidebar-filter-active");
    }
  }

  function hideSidebar() {
    document.querySelector("body").classList.remove("sidebar-filter-active");
  }

  return (
    <StickyBox className="sticky-content" offsetTop={70}>
      <BlogSidebar categories={post?.categories} summary={post?.summary || ""} tags={post?.tags} toggle={toggle} popular={popular} />
      {toggle ? (
        <button className="sidebar-fixed-toggler right" onClick={toggleSidebar}>
          <i className="icon-cog"></i>
        </button>
      ) : (
        ""
      )}
      <div className="sidebar-filter-overlay" onClick={hideSidebar}></div>
    </StickyBox>
  );
};

export default BlogMainSidebar;
