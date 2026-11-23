"use client";

import PageWrapper from "../components/Layout/PageWrapper";
import { pageTitle } from "../components/ui/styles";

function About() {
  return (
    <PageWrapper basic>
      <h1 className={pageTitle}>About QuagBot</h1>

      <hr className="my-space-5" />
      
      <div className="mb-space-5 flex flex-row items-center justify-around gap-space-5 text-xl">
        <div className="flex flex-col gap-space-1">
          <h2>
            <b className="text-xl">Q</b>uality
          </h2>
          <h2>
            <b className="text-xl">U</b>nderstanding of
          </h2>
          <h2>
            <b className="text-xl">A</b>merica
          </h2>
          <h2>
            <b className="text-xl">G</b>enerator
          </h2>
          <h2>Bot</h2>
        </div>

        <img
          className="h-auto w-auto max-w-35 shrink-0 self-center object-contain"
          src="/QuagBotLogo.png"
          alt="QuagBot logo"
        />
      </div>

      <h2 className="mb-space-4 text-lg">
        QuagBot is a chat bot designed to help students learn about the
        Revolutionary War.
      </h2>
      <p className="mb-space-3">
        To accomplish this, QuagBot allows users to do the following:
      </p>

      <hr className="my-space-5" />

      <ul className="mb-space-5 flex list-none flex-col gap-space-4 pl-space-5">
        <li>
          <b className="text-xl">FR-01: Student Dashboard Framework</b>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-2 pl-space-5">
            <li>
              Present students with a dashboard with all of their features
              available in one screen
            </li>
            <li>
              Limit students access to their dashboard until after they sign in
            </li>
          </ul>
        </li>

        <li>
          <b className="text-xl">FR-02: User Authentication</b>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-2 pl-space-5">
            <li>
              Allow students to sign up, log in and log out to retain their
              information with QuagBot
            </li>
            <li>
              Feature a profile page so students can see their account in one
              screen
            </li>
            <li>Include 2FA for students who are inclined to do so</li>
          </ul>
        </li>

        <li>
          <b className="text-xl">FR-03: Chat box Query & Response</b>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-2 pl-space-5">
            <li>
              Students can query QuagBot's internal RAG system to ask any
              question about the Revolutionary War
            </li>
            <li>
              QuagBot will respond ONLY to questions about the Revolutionary
              War, and will cite specific sources that the developers have
              uploaded as part of its response
            </li>
            <li>
              Users may also upload their own textbooks for QuagBot to analyze
              and include as a part of its results.
            </li>
          </ul>
        </li>

        <li>
          <b className="text-xl">FR-04: Chat History</b>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-2 pl-space-5">
            <li>
              You can create multiple conversations with QuagBot, which will be
              perserved across login/logout
            </li>
            <li>
              Students may name these chats, search and organize these chats by
              date/name, export these chats to a TXT or share them to a friend
              via a shareable, public link.
            </li>
          </ul>
        </li>

        <li>
          <b className="text-xl">FR-05: Practice Exam Generator</b>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-2 pl-space-5">
            <li>
              Students may request that QuagBot generate them a practice exam
              based on the topics in the conversation
            </li>
            <li>
              The student can choose the difficulty, # of questions and types of
              questions that QuagBot will generate
            </li>
            <li>
              QuagBot will return the exam, along with the answers, in the form
              of a downloadable PDF.
            </li>
          </ul>
        </li>

        <li>
          <b className="text-xl">FR-06: Chat Settings</b>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-2 pl-space-5">
            <li>
              Students may set practical and cosmetic settings for QuagBot
            </li>
            <li>
              Cosmetic settings include message size, color, or font family
            </li>
            <li>
              Practical settings include level of response complexity, ranging
              from elementary to college level
            </li>
            <li>
              Another practical setting is the ability to have QuagBot listen to
              you speak your prompt, rather than type, for accessibility reasons
            </li>
          </ul>
        </li>

        <li>
          <b className="text-xl">FR-07: Rate Limit Warning</b>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-2 pl-space-5">
            <li>
              QuagBot will set a 'warning limit' for the maximum amount of
              messages the user can send in a day before it warns them
            </li>
            <li>
              There will also be a 'hard limit' from the AI team on how many
              messages the user is permitted to send at all a day.
            </li>
            <li>
              Both numbers will be prominently displayed on the dashboard so the
              user knows how many messages they have left.
            </li>
          </ul>
        </li>

        <li>
          <b className="text-xl">FR-08: Teacher Dashboards</b>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-2 pl-space-5">
            <li>
              Teachers will be able to sign up as a teacher, and by doing so
              generate a code for the students
            </li>
            <li>Students use that code to connect to the teacher</li>
            <li>
              Once connected, teachers will see an abstractified view of the
              students chats with QuagBot
            </li>
            <li>
              Diagnostics include what types of questions the students are
              asking, how frequently they are asking them, how many are
              connected, etc
            </li>
            <li>
              Teachers will also be able to set the warning limit of the rate
              limit via their teacher dashboard for all students.
            </li>
          </ul>
        </li>
      </ul>

      <hr className="my-space-5" />

      <p>
        QuagBot is all about accessibility, efficiency, and the logging of Jira
        points. Thank you to our investors and consumers of our product for your
        help during development.
      </p>
    </PageWrapper>
  );
}

export default About;
