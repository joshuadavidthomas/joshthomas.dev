export default {
  posts: (collection) => {
    return [...collection.getFilteredByGlob('./src/posts/**/*.md')].reverse();
  }
};
