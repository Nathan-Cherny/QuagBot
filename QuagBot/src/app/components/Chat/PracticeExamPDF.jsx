import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PILL_BUTTON } from './ChatSettings';
import { Lightbulb } from 'lucide-react';
import PDFMarkdown from './PDFMarkdown';

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
const PDFDocument = ({ textContent, title }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>{title}</Text>
        <PDFMarkdown text={textContent} />
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

export function GeneratePracticeExam({ onSend, messages }) {
  return (
    <div className='w-full'>
      <button type="button" className={PILL_BUTTON} onClick={() => {
        let messageTotalText = ""
        messages.forEach(message => messageTotalText += `${message.text}\n\n`)
        
        const pdfprompt = "generate a short practice exam based on the content of the following conversation. return as a JSON format: title : String, text : String, isValid : Boolean. if you do not have sufficient information, leave all fields blank except for isValid, which should be false. "

        onSend(`${pdfprompt}\n${messageTotalText}`, true, "QuagBot, please create a practice exam for me!")
      }}>
        <h1 className='flex flex-row items-center gap-1'><Lightbulb />Generate Practice Exam</h1>
      </button>
    </div >
  )
}

export default PDFDocument;
