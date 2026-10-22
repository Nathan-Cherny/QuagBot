function Footer() {
  return (
    <footer className="flex items-center justify-around border-t-2 border-important-border bg-footer-bg px-space-5 py-space-3 text-center text-[0.8rem]">
      <span>&copy; {new Date().getFullYear()} QuagBot</span>
      <a href="https://github.com/Nathan-Cherny/QuagBot" target="_blank">
        <img className="w-7.5" src="\GitHub_Invertocat_Logo.svg.webp" />
      </a>
    </footer>
  );
}

export default Footer;
