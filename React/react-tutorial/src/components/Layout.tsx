import { useLayoutEffect } from "react";

export default function Layout() {
  const scrollHandler = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    window.history.replaceState(null, "", `#${Math.floor(top)}`);
  };

  useLayoutEffect(() => {
    const container = document.getElementById("container") as HTMLDivElement;
    const hash = window.location.hash;
    if (hash) {
      console.log("read top");

      container.scrollTop = Number(hash.replace("#", ""));
    }
  }, []);

  return (
    <div
      onScroll={scrollHandler}
      id="container"
      style={{ height: "500px", overflow: "auto" }}
    >
      {Array.from({ length: 500 }, (_, i) => (
        <p key={i}>This is {i + 1} line of the layout component.</p>
      ))}
    </div>
  );
}
