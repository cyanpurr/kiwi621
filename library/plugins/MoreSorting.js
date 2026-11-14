const sorts = [
  ["random", "Random", "order:random"],
  ["oldest", "Oldest", "order:id"],
  ["most-score", "Most Score", "order:score"],
  ["most-favorited", "Most Favorited", "order:favcount"],
  ["most-comments", "Most Comments", "order:comment_count"],
  ["longest", "Longest", "order:duration"],
  ["newest-comments", "Newest Comments", "order:comment"],
  ["most-tags", "Most Tags", "order:tagcount"],
  ["invalid-tags", "Invalid Tags", "order:invalid_tags"],
  ["mod-queue", "Mod Queue", "status:modqueue"],
  ["pending", "Pending", "status:pending"],
  ["deleted", "Deleted", "status:deleted"]
];

const path = location.pathname.replace(/\/+$/, "");
if (path === "/posts" || path.startsWith("/posts/")) {
  let after = "#subnav-favorites";

  for (const [id, label, order] of sorts) {
    kiwi621.addSubnavLink({
      id, label,
      href: `/posts?tags=${encodeURIComponent(order)}`,
      location: ["/posts", "/posts/*"],
      after
    });
    after = `#subnav-${id}`;
  }
}