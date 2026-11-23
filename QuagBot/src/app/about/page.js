"use client";

import PageWrapper from "../components/Layout/PageWrapper";
import { pageTitle } from "../components/ui/styles";

function About() {
  return (
    <PageWrapper basic>
      <h1 className={pageTitle}>About QuagBot</h1>

      <div className="flex flex-row">
        <div>
          <h2>
            <b>Q</b>uality
          </h2>
          <h2>
            <b>U</b>nderstanding of
          </h2>
          <h2>
            <b>A</b>merica
          </h2>
          <h2>
            <b>G</b>enerator
          </h2>
          <h2>Bot</h2>
        </div>

        <img className='max-w-22.5 h-auto' src='/QuagBotLogo.png'></img>
      </div>
      <p>
        QuagBot is a chat bot designed to help students learn about the
        Revolutionary War.
      </p>
      <p>To accomplish this, QuagBot allows users to do the following:</p>
      <ul>
        <li>FR-01: Student Dashboard Framework</li>
        <ul className="list-disc">
          <li>
            Present students with a dashboard with all of their features
            available in one screen
          </li>
          <li>
            Limit students access to their dashboard until after they sign in
          </li>
        </ul>

        <li>FR-02: User Authentication</li>
        <ul className="list-disc">
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

        <li>FR-03: Chat box Query & Response</li>
        <ul className="list-disc">
          <li>
            Students can query QuagBot's internal RAG system to ask any question
            about the Revolutionary War
          </li>
          <li>
            QuagBot will respond ONLY to questions about the Revolutionary War,
            and will cite specific sources that the developers have uploaded as
            part of its response
          </li>
          <li>
            Users may also upload their own textbooks for QuagBot to analyze and
            include as a part of its results.
          </li>
        </ul>

        <li>FR-04: Chat History</li>
        <ul className="list-disc">
          <li>
            You can create multiple conversations with QuagBot, which will be
            perserved across login/logout
          </li>
          <li>
            Students may name these chats, search and organize these chats by
            date/name, export these chats to a TXT or share them to a friend via
            a shareable, public link.
          </li>
        </ul>

        <li>FR-05: Practice Exam Generator</li>
        <ul className="list-disc">
          <li>
            Students may request that QuagBot generate them a practice exam
            based on the topics in the conversation
          </li>
          <li>
            The student can choose the difficulty, # of questions and types of
            questions that QuagBot will generate
          </li>
          <li>
            QuagBot will return the exam, along with the answers, in the form of
            a downloadable PDF.
          </li>
        </ul>

        <li>FR-06: Chat Settings</li>
        <ul className="list-disc">
          <li>Students may set practical and cosmetic settings for QuagBot</li>
          <li>Cosmetic settings include message size, color, or font family</li>
          <li>
            Practical settings include level of response complexity, ranging
            from elementary to college level
          </li>
          <li>
            Another practical setting is the ability to have QuagBot listen to
            you speak your prompt, rather than type, for accessibility reasons
          </li>
        </ul>

        <li>FR-07: Rate Limit Warning</li>
        <ul className="list-disc">
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

        <li>FR-08: Teacher Dashboards</li>
        <ul className="list-disc">
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
            Diagnostics include what types of questions the students are asking,
            how frequently they are asking them, how many are connected, etc
          </li>
          <li>
            Teachers will also be able to set the warning limit of the rate
            limit via their teacher dashboard for all students.
          </li>
        </ul>
      </ul>

      <hr />

      <p>
        QuagBot is all about accessibility, efficiency, and the logging of Jira
        points. Thank you to our sponsors, investors and the wonderful consumers
        of our product.
      </p>
    </PageWrapper>
  );
}

export default About;
