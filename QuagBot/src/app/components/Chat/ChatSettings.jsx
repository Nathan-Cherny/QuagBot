import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { EXPLANATION_LEVELS, LEVEL_DESCRIPTIONS, loadExplanationLevel, saveExplanationLevel } from './chatPreferences';

export const PILL_BUTTON = 'cursor-pointer rounded-full border border-black bg-surface px-space-4 py-space-2 w-full hover:scale-105';
export const FIELD = 'my-space-4 flex flex-col gap-space-1 text-left text-black';
// color-scheme: light keeps the native dropdown light even if the OS is in dark mode.
export const SELECT = 'rounded-card border border-border bg-surface p-space-2 text-black [color-scheme:light] [font:inherit]';
export const INPUT =  'rounded-card border border-border bg-surface p-space-2 text-black [color-scheme:light] [font:inherit]';

function ChatSettings({ textSize, setTextSize, font, setFont, fontColor, setFontColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanationLevel, setExplanationLevel] = useState('medium');
  const [explanationKey, setExplanationKey] = useState(null);

  useEffect(() => {
    let disposed = false;
    function restore(user) {
      if (disposed) return;
      const key = 'quagbot:chats:v1:' + (user?.id ?? 'guest') + ':explanation-level';
      setExplanationLevel(loadExplanationLevel(key));
      setExplanationKey(key);
    }
    let unsubscribe = () => {};
    try {
      const client = createClient();
      const { data } = client.auth.onAuthStateChange((_event, session) => restore(session?.user));
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      Promise.resolve().then(() => restore(null));
    }
    return () => { disposed = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (explanationKey) saveExplanationLevel(explanationKey, explanationLevel);
  }, [explanationKey, explanationLevel]);

  function resetSettings() {
    setTextSize('18px');
    setFont('Arial, sans-serif');
    setFontColor('#000000');
    setExplanationLevel('medium');
  }

  return (
    <div className="w-full">
      <button type="button" className={PILL_BUTTON} onClick={() => setIsOpen(true)}>
        Chat Settings
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30">
          <div className="max-h-[90vh] w-[350px] max-w-[90%] overflow-y-auto rounded-[12px] bg-surface p-space-5">
            <h2 className="mb-space-2 text-[24px] leading-[118%] font-medium tracking-[-0.24px] text-black max-[1024px]:text-[20px]">Chat Settings</h2>
            <label className={FIELD}>
              Explanation level
              <select className={SELECT} value={explanationLevel} disabled={!explanationKey} aria-describedby="explanation-help" onChange={(event) => setExplanationLevel(event.target.value)}>
                {Object.entries(EXPLANATION_LEVELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <p id="explanation-help">{LEVEL_DESCRIPTIONS[explanationLevel]}</p>
            <label className={FIELD}>
              Text size
              <select className={SELECT} value={textSize} onChange={(event) => setTextSize(event.target.value)}>
                <option value="14px">Small</option>
                <option value="18px">Medium</option>
                <option value="22px">Large</option>
              </select>
            </label>
            <label className={FIELD}>
              Font
              <select className={SELECT} value={font} onChange={(event) => setFont(event.target.value)}>
                <FontSetting font={"Arial, sans-serif"} />
                <FontSetting font={"Verdana, sans-serif"} />
                <FontSetting font={"Georgia, serif"} />
                <FontSetting font={"Lucida Sans, serif"} />
                <FontSetting font={"Monaco, serif"} />
                <FontSetting font={"'Times New Roman', serif"} />
                <FontSetting font={"'Courier New', monospace"} />
                <FontSetting font={"Comic Sans MS, monospace"} />
                <FontSetting font={"Impact, monospace"} />
                <FontSetting font={"Papyrus, monospace"} />
                <FontSetting font={"Symbol, serif"} />
                <FontSetting font={"Webdings, serif"} />
              </select>
            </label>
            <label className={FIELD}>
              Font color
              <select className={SELECT} value={fontColor} onChange={(event) => setFontColor(event.target.value)}>
                <option value="#000000">Black (default)</option>
                <option value="#a61b1b">Red</option>
                <option value="#974000">Orange</option>
                <option value="#756000">Yellow (gold)</option>
                <option value="#20612e">Green</option>
                <option value="#164ca0">Blue</option>
                <option value="#4b3080">Indigo</option>
                <option value="#803080">Violet</option>
              </select>
            </label>
            <p className="my-space-4 rounded-card bg-main-chat-bg p-space-3 leading-[1.5] [overflow-wrap:anywhere]" style={{ fontSize: textSize, fontFamily: font, color: fontColor }}>
              Preview: How can QuagBot help you today?
            </p>
            <p>Settings are saved in this browser for your account.</p>
            <button type="button" className={PILL_BUTTON} disabled={!explanationKey} onClick={resetSettings}>Reset to defaults</button>
            <button type="button" className={PILL_BUTTON} onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FontSetting({font}){
  return <option style={{fontFamily: font}} value={font}>{font.split(",")[0].replaceAll("'", "")}</option>
}

export default ChatSettings;
