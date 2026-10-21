import { sidebarTitle } from "../ui/styles";

// Sidebars are hidden on narrow screens.
function Sidebar({ side, title, children }) {
  const border = side === "left" ? "border-r" : "border-l";

  return (
    <aside className={`overflow-y-auto border-border px-space-2 py-space-4 max-[900px]:hidden ${border}`}>
      {title && <h2 className={sidebarTitle}>{title}</h2>}
      <div>{children}</div>
    </aside>
  );
}

export default Sidebar;
