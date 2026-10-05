function Sidebar({ side, title, children }) {
  return (
    <aside className={`sidebar sidebar--${side}`}>
      {title && <h2 className="sidebar-title">{title}</h2>}
      <div className="sidebar-content">{children}</div>
    </aside>
  );
}

export default Sidebar;
