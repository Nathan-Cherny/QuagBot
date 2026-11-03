// This is a limited local practice responder, not an AI model.
// Replace requestReply with the infrastructure API, sending the full conversation.
const TOPICS = [
  {
    match: /\b(washington|continental army)\b/i,
    title: 'George Washington',
    summary: 'George Washington commanded the Continental Army during the American Revolution and later became the first U.S. president.',
    detail: 'His leadership helped the army survive shortages and setbacks. At Yorktown, he coordinated with French forces in the campaign that trapped Cornwallis’s army.',
    significance: 'Keeping the army together allowed the colonies to continue fighting even when victory was uncertain.',
  },
  {
    match: /\b(tea party|boston tea)\b/i,
    title: 'The Boston Tea Party',
    summary: 'In December 1773, protesters in Boston destroyed tea to oppose British tea policy and taxation without representation.',
    detail: 'Britain responded with punitive laws known in the colonies as the Intolerable Acts. These measures included closing Boston’s port and limiting Massachusetts self-government.',
    significance: 'The British response encouraged greater cooperation among colonies resisting British policies.',
  },
  {
    match: /\byorktown\b/i,
    title: 'The Battle of Yorktown',
    summary: 'In 1781, American and French forces surrounded Cornwallis’s British army at Yorktown, Virginia.',
    detail: 'French naval forces blocked escape by sea while allied land forces besieged the British positions. Cornwallis’s army surrendered in October 1781.',
    significance: 'The surrender helped lead to peace negotiations. The Treaty of Paris recognized American independence in 1783.',
  },
  {
    match: /\b(declaration|jefferson|july 4)\b/i,
    title: 'The Declaration of Independence',
    summary: 'The Continental Congress adopted the Declaration of Independence on July 4, 1776, announcing the colonies’ separation from Britain.',
    detail: 'Thomas Jefferson drafted most of the document, with revisions from a committee and Congress. It explained political principles and listed grievances against King George III.',
    significance: 'It stated the case for independence, although its ideals of equality were not extended equally to everyone at the time.',
  },
  {
    match: /\b(lexington|concord)\b/i,
    title: 'Lexington and Concord',
    summary: 'Fighting at Lexington and Concord in Massachusetts on April 19, 1775, marked the beginning of armed conflict in the Revolution.',
    detail: 'British troops marched toward Concord to seize military supplies. Colonial militia confronted them, and fighting continued as the British returned to Boston.',
    significance: 'The clashes turned a political dispute into an armed conflict.',
  },
  {
    match: /\b(saratoga)\b/i,
    title: 'The Battles of Saratoga',
    summary: 'American forces defeated a British army in the Saratoga campaign in 1777.',
    detail: 'British general John Burgoyne surrendered his army in October. The victory demonstrated that the Americans could defeat a major British force.',
    significance: 'The victory helped persuade France to enter a formal alliance with the United States in 1778.',
  },
  {
    match: /\b(france|french|lafayette)\b/i,
    title: 'French support',
    summary: 'France supported American independence with money, supplies, troops, and naval power.',
    detail: 'France formed a formal alliance with the United States in 1778. French troops and naval forces played a major role in the allied victory at Yorktown.',
    significance: 'French support increased the resources available to the Americans and made the war a wider international conflict.',
  },
  {
    match: /\b(treaty|paris|war end|ended)\b/i,
    title: 'The Treaty of Paris',
    summary: 'The Treaty of Paris in 1783 formally ended the war between Britain and the United States.',
    detail: 'Britain recognized U.S. independence. Major fighting had largely ended after Yorktown, but the peace agreement came two years later.',
    significance: 'Military victory and formal recognition of independence happened at different times.',
  },
  {
    match: /\b(patriots?|loyalists?)\b/i,
    title: 'Patriots and Loyalists',
    summary: 'Patriots supported independence, while Loyalists supported remaining part of the British Empire.',
    detail: 'Colonists had different political, economic, and personal reasons for their choices. Some tried to remain neutral, and families and communities could be divided.',
    significance: 'The Revolution involved conflict within colonial society as well as conflict with Britain.',
  },
  {
    match: /\b(slaver?y|enslaved|women|native americans?|indigenous)\b/i,
    title: 'Different experiences of the Revolution',
    summary: 'The Revolution affected women, enslaved people, free Black people, and Native nations in different ways.',
    detail: 'Women supported households, farms, and armies. Black people served on both sides, sometimes seeking freedom. Native nations made different choices based on their own interests and threats to their lands.',
    significance: 'Independence did not bring equal rights to everyone. Slavery continued, and Native nations faced increasing pressure on their lands.',
  },
  {
    match: /\b(causes?|independence|tax(es|ation)?|stamp act|american revolution|revolutionary war)\b/i,
    title: 'Causes of the American Revolution',
    summary: 'The Revolution grew from disputes over taxation, political representation, and colonial self-government.',
    detail: 'Many colonists opposed taxes imposed by Parliament without their elected representatives. The Stamp Act, resistance to tea policy, and punitive laws after the Boston Tea Party increased tensions.',
    significance: 'A series of disputes gradually led many colonists to support independence. Not all colonists agreed.',
  },
];

const HELP = 'You can ask about Washington, the causes of the Revolution, the Boston Tea Party, Lexington and Concord, Saratoga, Yorktown, the Declaration of Independence, French support, Patriots and Loyalists, or the Treaty of Paris.';

export function getPracticeReply(messages) {
  const turns = messages.filter((message) => message.role === 'user');
  const question = turns.at(-1)?.text.trim() ?? '';
  if (/^(hi|hello|hey)[!. ]*$/i.test(question)) return `Hello! I’m QuagBot, your Revolutionary War study companion. ${HELP}`;
  if (/^(thanks|thank you)[!. ]*$/i.test(question)) return 'You’re welcome! Ask another question whenever you’re ready.';
  if (/^(help|what can you do|what can i ask)[?!. ]*$/i.test(question)) return HELP;

  // Context is used only for explicit follow-ups, never for a new unrelated question.
  const followUp = /^(yes|why|why was (it|that) important|tell me more|explain( more)?|explain (it|that)|more details|simplify( it)?|make it simpler|summari[sz]e( it)?|give me a quiz|quiz me)[?!. ]*$/i.test(question);
  let topic = TOPICS.find((entry) => entry.match.test(question));
  if (!topic && followUp) {
    for (let index = turns.length - 2; index >= 0 && !topic; index--) {
      topic = TOPICS.find((entry) => entry.match.test(turns[index].text));
    }
  }
  if (topic) {
    if (/quiz/i.test(question)) return `Quick check: ${topic.title}\n\nIn your own words, explain what happened and why it mattered. Compare your answer with the explanation above. Open-ended answer grading will require the AI service.`;
    if (/simpl|summari[sz]/i.test(question)) return `${topic.title} — short explanation\n\n${topic.summary}`;
    if (/^why/i.test(question) && followUp) return `Why it mattered\n\n${topic.significance}`;
    return `${topic.title}\n\n${topic.summary}\n\n${topic.detail}\n\nWhy it matters: ${topic.significance}`;
  }
  if (/\b(revolution|war|battle|colon|british|america|history|king|177\d|178\d)\b/i.test(question)) {
    return `That is a history question beyond my current practice material. I don’t have a reliable prepared answer for it yet.\n\n${HELP}\n\nFull answers to new history questions will be available after the AI service is connected.`;
  }
  return `I focus on the American Revolutionary War. That question is outside my current practice material, so I can’t give a reliable answer to it here.\n\n${HELP}\n\nIf you meant a connection to the Revolution, include the person, event, or topic you want to explore.`;
}
// Return the reply text and pass signal to fetch so switching chats cancels it.
export function requestReply(messages, { signal }) {
  return new Promise((resolve, reject) => {
    function abort() {
      clearTimeout(timer);
      reject(new DOMException('Request cancelled', 'AbortError'));
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      try {
        resolve(getPracticeReply(messages));
      } catch (error) {
        reject(error);
      }
    }, 700);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}
