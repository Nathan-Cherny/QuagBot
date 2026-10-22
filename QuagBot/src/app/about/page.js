"use client";

import PageWrapper from "../components/Layout/PageWrapper";
import { pageTitle } from "../components/ui/styles";

function About() {
  return (
    <PageWrapper basic>
        <h1 className={pageTitle}>About QuagBot</h1>
        <p className="text-center">quagbot is the best</p>
    </PageWrapper>
  );
}

export default About