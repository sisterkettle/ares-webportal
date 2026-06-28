import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { action, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';

class MarkdownEditorInfo {
  cursorStart = 0;
  cursorEnd = 0;
  selection = '';
  beforeCursor = '';
  afterCursor = '';

  constructor(editor, text) {
    this.cursorStart = editor.selectionStart;
    this.cursorEnd = editor.selectionEnd;
    this.selection = text.substring(this.cursorStart, this.cursorEnd) || '';
    this.beforeCursor = text.substring(0,this.cursorStart);
    this.afterCursor = text.substring(this.cursorEnd, text.length);
  }
};


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
    this.set('toolbarVisible', this.cookies.markdownToolbarVisible() === "true");
  },
  
  moveCursor(cursorPos) {
    this.editor.focus();
    setTimeout(() => this.editor.selectionEnd = cursorPos, 25);
  },    
  
  addFormatCodeBracket(beforeCode, afterCode) {
    
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);  
    var cursorPos;

    this.set('text', `${edInfo.beforeCursor}${beforeCode}${edInfo.selection}${afterCode}${edInfo.afterCursor}`);
    
    if (edInfo.selection.length > 0) {
      cursorPos = edInfo.cursorEnd + beforeCode.length + afterCode.length;
    }
    else {
      cursorPos = edInfo.cursorStart + beforeCode.length;     
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
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);  
    let separator = this.text.length > 0 ? "\n\n" : "";
    this.set('text', `${edInfo.beforeCursor}${separator}# ${edInfo.selection}${separator}${edInfo.afterCursor}`);
    this.moveCursor(edInfo.cursorStart + 4);
  },
  
  @action
  onOrderedList() {
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);
    let separator = this.text.length == 0 ? "" : "\n\n";
    let list = edInfo.selection.trim().split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n");
    this.set('text', `${edInfo.beforeCursor}${separator}${list}${separator}${edInfo.afterCursor}`);
    this.moveCursor(edInfo.cursorStart + 3 + separator.length);
  },
  
  @action
  onBulletList() {
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);  
    let separator = this.text.length == 0 ? "" : "\n\n";
    let list = edInfo.selection.trim().split("\n").map((line) => `* ${line}`).join("\n");
    this.set('text', `${edInfo.beforeCursor}${separator}${list}${separator}${edInfo.afterCursor}`);
    this.moveCursor(edInfo.cursorStart + 2 + separator.length);
  },
  
  @action
  onTable() {
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);      
    let separator = this.text.length > 0 ? "\n\n" : "";
    this.set('text', `${edInfo.beforeCursor}${edInfo.selection}${separator}|Heading|Heading|\n|----|----|\n|Data|Data|${separator}${edInfo.afterCursor}`);
    this.moveCursor(edInfo.cursorEnd+1);
  },
  
  @action
  onLine() {
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);    
    let separator = this.text.length > 0 ? "\n\n" : "";
    this.set('text', `${edInfo.beforeCursor}${edInfo.selection}${separator}----${separator}${edInfo.afterCursor}`);
    this.moveCursor(edInfo.cursorEnd+4+separator.length);
  },
  
  @action
  onCode() {
    this.addFormatCodeBracket("`", "`");
  },
  
  @action
  onCodeBlock() {
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);      
    let separator = this.text.length > 0 ? "\n\n" : "";
    let codeblock = "```";
    this.set('text', `${edInfo.beforeCursor}${separator}${codeblock}\n${edInfo.selection}\n\n${codeblock}${separator}${edInfo.afterCursor}`);
    this.moveCursor(edInfo.cursorEnd+4+separator.length);
  },
  
  @action
  onLink() {
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);      
    var linkText = "Link Text";
    var linkUrl = "https://example.com";
    if (edInfo.selection) {
      if (edInfo.selection.startsWith("http") || edInfo.selection.startsWith("/")) {
        linkUrl = edInfo.selection;
      } else {
        linkText = edInfo.selection;
      }
    } 
    this.set('text', `${edInfo.beforeCursor}[${linkText}](${linkUrl})${edInfo.afterCursor}`);
    this.setShowLinkSelector(false);
    this.moveCursor(edInfo.cursorStart);
  },
  
  @action
  onImage() {
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);      
    let image = "[[image /game/uploads/theme_images/jumbotron.png height=100px width=100px url=http://example.com center]]";
    this.set('text', `${edInfo.beforeCursor}${edInfo.selection} ${image} ${edInfo.afterCursor}`);
    this.setShowLinkSelector(false);
    this.moveCursor(edInfo.cursorStart);
  },
  
  @action
  onTabs() {
    let edInfo = new MarkdownEditorInfo(this.editor, this.text);      
    let separator = this.text.length > 0 ? "\n\n" : "";
    
    let tabs = "[[tabview]]" +
      "\n[[tab Title1]]" +
      "\nSome text." +
      "\n[[/tab]]" +
      "\n[[tab Title2]]" +
      "\nSome other text." +
      "\n[[/tab]]" +
      "\n[[/tabview]]";
    this.set('text', `${edInfo.beforeCursor}${edInfo.selection}${separator}${tabs}${separator}${edInfo.afterCursor}`);
    this.setShowLinkSelector(false);
    this.moveCursor(edInfo.cursorStart);
  }
  
});
