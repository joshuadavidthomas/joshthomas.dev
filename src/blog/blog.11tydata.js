export default {
  "pagination": {
    data: "collections.posts",
    size: 10,  // Number of posts per page
    alias: "posts"  // This creates a variable called 'posts' that contains the current page's items
  },
  "layout": "blog.njk",
  "permalink": "{% if pagination.pageNumber > 0 %}/blog/page-{{ pagination.pageNumber + 1 }}/{% else %}/blog/{% endif %}"
};
