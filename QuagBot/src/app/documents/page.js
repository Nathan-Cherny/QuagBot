"use client";

import { useState } from 'react';
import { UploadPDFDialog } from '../components/Chat/UploadPDF';
import EducationSources from '../components/Documents/EducationSources';
import DocumentList from '../components/Documents/DocumentList';
import PageWrapper from '../components/Layout/PageWrapper';

export default function Documents() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);

  return (
    <PageWrapper className="overflow-y-auto">
      <main className="mx-auto w-full max-w-4xl p-space-5">
        <div className="mb-space-4 flex flex-wrap items-center justify-between gap-space-2">
          <h1 className="text-xl font-semibold text-text">Documents</h1>
          <button type="button" onClick={() => setUploadOpen(true)}
            className="cursor-pointer rounded-card bg-accent px-space-3 py-space-2 text-sm text-accent-contrast">
            Upload PDF
          </button>
        </div>
        <DocumentList recentUploads={recentUploads} />
        <EducationSources />
        <UploadPDFDialog
          userPDFOpen={uploadOpen}
          setUserPDFOpen={setUploadOpen}
          onUploaded={(document) => {
            setRecentUploads((previous) => [document, ...previous.filter((item) => item.id !== document.id)]);
          }}
        />
      </main>
    </PageWrapper>
  );
}
