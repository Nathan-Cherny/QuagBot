function Footer() {
  return (
    <footer className="footer">
      <span>&copy; {new Date().getFullYear()} QuagBot</span>
      <a href="https://github.com/Nathan-Cherny/QuagBot" target="_blank">
        <img className="w-10" src="\GitHub_Invertocat_Logo.svg.webp" />
      </a>
    </footer>
  );
}

export default Footer;
