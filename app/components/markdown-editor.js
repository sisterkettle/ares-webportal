import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { action, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';

export default Component.extend({

  previewText: null,
  rows: 0,
  gameApi: service(),
  cookies: service(),
  text: '',
  editor: null,
  showLinkSelector: false,
  linkText: '',
  linkUrl: '',
  toolbarVisible: true,
  
  markdownText: computed('text', function() {
    return this.text || "";
  }),
  
  height: computed('rows', function() {
    return (this.rows < 10) ? "250px" : "500px";
  }),  
    
  didInsertElement() {
    this.set('editor', $('#editor-area')[0]);
    console.log(this.cookies.markdownToolbarVisible());
    this.set('toolbarVisible', this.cookies.markdownToolbarVisible() === "true");
  },
  
  moveCursor(cursorPos) {
    this.editor.focus();
    setTimeout(() => this.editor.selectionEnd = cursorPos, 25);
  },  
  
  addFormatCodeBracket(beforeCode, afterCode) {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end);
    var cursorPos = start;
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    this.set('text', `${before}${beforeCode}${selection}${afterCode}${after}`);
    
    if (selection.length > 0) {
      cursorPos = end + beforeCode.length + afterCode.length;
    }
    else {
      cursorPos = start + beforeCode.length;     
    }    
    this.moveCursor(cursorPos);
  },
  
  @action
  preview() {
    if (this.get('previewText.length') > 0) {
      this.set('previewText', null);
      return;
    }
    let api = this.gameApi;
      
    api.requestOne('markdownPreview', { text: this.text })
    .then( (response) => {
      if (response.error) {
        return;
      }
      this.set('previewText', response.text);
    });
  },
  
  @action
  onChange(value) {  
    this.set('text', value);
  },
  
  @action
  keyDown(event) {
    if (event.keyCode == 13) {
      if (event.ctrlKey || event.metaKey) {
        
        // Needed because onEnter is optional - we don't want to trigger it if it's not set.
        if (this.onEnter) {
          this.onEnter();
        }      
        
        event.preventDefault();
      }
    }
  },
  
  @action
  toggleToolbar() {
    let newValue = !this.toolbarVisible;
    this.set('toolbarVisible', newValue);
    this.cookies.setMarkdownToolbarVisible(newValue);
  },
  
  @action
  setShowLinkSelector(value) {
    this.set('showLinkSelector', value);
  },
  
  @action
  onBold() {
    this.addFormatCodeBracket("**", "**");
  },
  
  @action
  onItalic() {
    this.addFormatCodeBracket("_", "_");
  },
  
  @action
  onHeading() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end);
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    let separator = this.text.length > 0 ? "\n\n" : "";
    this.set('text', `${before}${separator}# ${selection}${separator}${after}`);
    this.moveCursor(start + 4);
  },
  
  @action
  onOrderedList() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end) || "";
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    let separator = this.text.length == 0 ? "" : "\n\n";
    let list = selection.trim().split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n");
    this.set('text', `${before}${separator}${list}${separator}${after}`);
    this.moveCursor(start + 3 + separator.length);
  },
  
  @action
  onBulletList() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end) || "";
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    let separator = this.text.length == 0 ? "" : "\n\n";
    let list = selection.trim().split("\n").map((line) => `* ${line}`).join("\n");
    this.set('text', `${before}${separator}${list}${separator}${after}`);
    this.moveCursor(start + 2 + separator.length);
  },
  
  @action
  onTable() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end);
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    let separator = this.text.length > 0 ? "\n\n" : "";
    this.set('text', `${before}${selection}${separator}|Heading|Heading|\n|----|----|\n|Data|Data|${separator}${after}`);
    this.moveCursor(end+1);
  },
  
  @action
  onLine() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end);
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    let separator = this.text.length > 0 ? "\n\n" : "";
    this.set('text', `${before}${selection}${separator}----${separator}${after}`);
    this.moveCursor(end+4+separator.length);
  },
  
  @action
  onCode() {
    this.addFormatCodeBracket("`", "`");
  },
  
  @action
  onCodeBlock() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end);
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    let separator = this.text.length > 0 ? "\n\n" : "";
    let codeblock = "```";
    this.set('text', `${before}${separator}${codeblock}\n${selection}\n\n${codeblock}${separator}${after}`);
    this.moveCursor(end+4+separator.length);
  },
  
  @action
  onLink() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end);
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    var linkText = "Link Text";
    var linkUrl = "https://example.com";
    if (selection) {
      if (selection.startsWith("http") || selection.startsWith("/")) {
        linkUrl = selection;
      } else {
        linkText = selection;
      }
    } 
    this.set('text', `${before}[${linkText}](${linkUrl})${after}`);
    this.setShowLinkSelector(false);
    this.moveCursor(start);
  },
  
  @action
  onImage() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end);
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    let image = "[[image /game/uploads/theme_images/jumbotron.png height=100px width=100px url=http://example.com center]]";
    this.set('text', `${before}${selection} ${image} ${after}`);
    this.setShowLinkSelector(false);
    this.moveCursor(start);
  },
  
  @action
  onTabs() {
    let start = this.editor.selectionStart;
    let end = this.editor.selectionEnd;
    let selection = this.text.substring(start, end);
    let before = this.text.substring(0,start);
    let after = this.text.substring(end,this.text.length);
    let separator = this.text.length > 0 ? "\n\n" : "";
    
    let tabs = "[[tabview]]" +
      "\n[[tab Title1]]" +
      "\nSome text." +
      "\n[[/tab]]" +
      "\n[[tab Title2]]" +
      "\nSome other text." +
      "\n[[/tab]]" +
      "\n[[/tabview]]";
    this.set('text', `${before}${selection}${separator}${tabs}${separator}${after}`);
    this.setShowLinkSelector(false);
    this.moveCursor(start);
  }
  
});
