import { useState } from 'react';

function ChatSettings({ textSize, setTextSize, font, setFont, fontColor, setFontColor }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="chat-settings">
      <button type="button" className="chat-settings-button" onClick={() => setIsOpen(true)}>
        Chat Settings
      </button>
      {isOpen && (
        <div className="settings-overlay">
          <div className="settings-window">
            <h2>Chat Settings</h2>
            <label className="settings-field">
              Text size
              <select value={textSize} onChange={(event) => setTextSize(event.target.value)}>
                <option value="14px">Small</option>
                <option value="18px">Medium</option>
                <option value="22px">Large</option>
              </select>
            </label>
            <label className="settings-field">
              Font
              <select value={font} onChange={(event) => setFont(event.target.value)}>
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
            <label className="settings-field">
              Font color
              <select value={fontColor} onChange={(event) => setFontColor(event.target.value)}>
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
            <p className="settings-preview" style={{ fontSize: textSize, fontFamily: font, color: fontColor }}>
              Preview: How can QuagBot help you today?
            </p>
            <button type="button" className = "chat-settings-button" onClick={() => setIsOpen(false)}>Close</button>
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
