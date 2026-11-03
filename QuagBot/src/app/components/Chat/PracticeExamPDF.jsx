import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles similar to React Native StyleSheet
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333333',
  },
});

// The actual PDF Structure
const MyPdfDocument = ({ textContent, title }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{textContent}</Text>
      </View>
    </Page>
  </Document>
);

export function parseMarkdownJson(markdownString) {
  // Regex to capture everything between ```json and ``` (or just ``` and ```)
  const regex = /```(?:json)?\s*([\s\(\S\)]*?)\s*```/i;
  const match = markdownString.match(regex);

  // If a markdown block is found, use the captured group; otherwise, try parsing the whole string
  const jsonString = match ? match[1] : markdownString;

  try {
    return JSON.parse(jsonString.trim());
  } catch (error) {
    throw new Error("Failed to parse JSON: " + error.message);
  }
}

export function GeneratePracticeExam(){
  return (
    <div className='fixed inset-0 z-100 flex items-center justify-center bg-black/30'>
      <h1>Test</h1>
    </div>
  )
}

export default MyPdfDocument;
