import React from "react";

const BlogTags = ({ post }) => {
  return (
    <div className="col-md">
      {post?.tags?.length ? (
        <div className="entry-tags">
          <span>Tags:</span>
          {post?.tags?.map((tag) => (
            <a href="#" key={tag}>
              {tag}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default BlogTags;
