import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PILL_BUTTON, FIELD, SELECT, INPUT } from './ChatSettings';
import PDFMarkdown from './PDFMarkdown';

export const MAKE_EXAM_MSG = "QuagBot, please generate a practice exam for me!"

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
  const [isOpen, setIsOpen] = useState(false)

  const [difficulty, setDifficulty] = useState(2)
  const [questions, setQuestions] = useState(5)
  const [questionTypes, setQuestionTypes] = useState(["multiple choice"])

  return (
    <div className='w-full'>
      {
        isOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30">
            <div className="max-h-[90vh] w-87.5 max-w-[90%] overflow-y-auto rounded-xl bg-surface p-space-5 flex flex-col gap-5">
              <h2 className="mb-space-2 text-[24px] leading-[118%] font-medium tracking-[-0.24px] text-black max-[1024px]:text-[20px]">Create a Practice Exam</h2>

              <label className={FIELD}>
                Question Types
                <select defaultChecked={questionTypes} className={SELECT} onChange={(event) => setQuestionTypes(Array.from(event.target.selectedOptions).map(option => option.value))} multiple>
                  <option value="multiple choice">Multiple Choice</option>
                  <option value="short answer">Short Answer</option>
                  <option value="true/false">True/False</option>
                </select>
              </label>

              <label className={FIELD}>
                Difficulty of Quiz
                <input defaultValue={difficulty} className={INPUT} onChange={(event) => setDifficulty(event.target.value)} type='range' min={1} max={5} />
              </label>

              <label className={FIELD}>
                # Questions
                <input defaultValue={questions} className={INPUT} onChange={(event) => setQuestions(event.target.value)} type='number' min={1} max={20} />
              </label>

              <button type="button" className={`${PILL_BUTTON} bg-blue-200!`} onClick={() => {
                let messageTotalText = ""
                messages.forEach(message => {
                  if (message.role == "user" && message.text != MAKE_EXAM_MSG) messageTotalText += `${message.text}\n\n`
                })

                const settingsprompt = `The quiz should be, on a scale from 1-5, a ${difficulty} in difficulty. It should have ${questions} questions. Accepted types of questions are: ${questionTypes.join(",")}.`
                const basicPrompt = `Generate a short practice exam based on the content of the following conversation. ${settingsprompt} Return as a JSON format - title : String, text : String, isValid : Boolean. If you do not have sufficient information, leave all fields blank except for isValid, which should be false. The questions should not be about the conversation itself; more about the topics discussed in the conversation. Make sure to include an answer key at the end.\n`
                const finalprompt = `${basicPrompt}\n${messageTotalText}`

                console.log(finalprompt)

                onSend(finalprompt, false, true)
                setIsOpen(false)
              }}>Create</button>
              <button type="button" className={PILL_BUTTON} onClick={() => setIsOpen(false)}>Cancel</button>
            </div>
          </div>
        )
      }
      <button type="button" className={PILL_BUTTON} onClick={() => { setIsOpen(true) }}>
        <h1 className='flex flex-row items-center gap-1'>Create Practice Exam</h1>
      </button>
    </div >
  )
}

export default PDFDocument;
