import Component from '@ember/component';
import { computed } from '@ember/object';
import { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { pushObject } from 'ares-webportal/helpers/object-ext';

export default Component.extend({
  gameApi: service(),
  flashMessages: service(),
  showReport: false,
  selectedReportMessage: null,
  reportReason: '',
  showPageRename: false,
  showReport: false,
  showPageRename: false,
  newPageTitle: '',
  showChannelInfo: false,

  updatePoseControls: function () {
    if (this.channel && !this.get('channel.poseChar')) {
      this.set('channel.poseChar', this.get('channel.poseable_chars')[0]);
    }
  },

  didInsertElement: function () {
    this._super(...arguments);
    this.updatePoseControls();
  },
  
  channelObserver: observer('channel', function() {
    this.updatePoseControls();
  }),
  
  chatAlerts: computed('channel.muted', 'scrollPaused', function() {
    let alertList = [];
    if (this.scrollPaused) {
      alertList.push("Scrolling is paused!");
    }
    if (this.get('channel.muted')) {
      alertList.push("This channel is muted.  You will not see new messages until you unmute.");
    }
    return alertList;
  }),
  
  canTalk: computed('channel.{muted,can_talk}', function() {
    return this.channel.can_talk && !this.channel.muted;
  }),
  
  @action
  toggleChannelInfo() {
    this.set('showChannelInfo', !this.showChannelInfo);
  },
  
  @action
  leaveChannel() {
    let api = this.gameApi;
    let channelKey = this.get('channel.key');
                    
    api.requestOne('leaveChannel', { channel: channelKey, char: this.channel.poseChar.name }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      this.set('channel.enabled', response.enabled);
      this.set('channel.poseable_chars', response.poseable_chars);
      this.set('channel.who', response.who);
      this.updatePoseControls();
    });
  },
    
  @action
  muteChannel(mute) {
    let api = this.gameApi;
    let channelKey = this.get('channel.key');
                    
    api.requestOne('muteChannel', { channel: channelKey, mute: mute }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      if (mute) {
        this.set('channel.muted', true);
      }
      else {
        let existingIds = this.channel.messages.map(m => m.id);
        let newMessages = response.channel.messages.filter(m => !existingIds.includes(m.id));
        newMessages.forEach(m => pushObject(this.channel.messages.push, m, this.channel, messages));
        this.set('channel.who', response.channel.who);
        this.set('channel.muted', false);    
        this.onScrollDown();          
      }
    });
  },
    
  @action
  reportChat() {
    let api = this.gameApi;
    let channelKey = this.get('channel.key');
    let reason = this.reportReason;
    let message = this.selectedReportMessage;
    this.set('reportReason', '');
    this.set('showReport', false);
    this.set('selectedReportMessage', null);
      
      
    if (reason.length == 0 || !message) {
      this.flashMessages.danger('You must enter a reason for the report and select a message where the report begins.');
      return;
    }
      
    let command = this.get('channel.is_page') ? 'reportPage' : 'reportChat';
      
    api.requestOne(command, { key: channelKey, start_message: message, reason: reason }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      this.flashMessages.success('The messages have been reported to the game admin.');
    });
      
  },
    
  @action
  sendMessage() {
    let api = this.gameApi;
    let channelKey = this.get('channel.key');
    let message = this.get('channel.draftMessage') || "";
    
    if (message.length === 0) {
      this.flashMessages.danger("You haven't entered anything.");
      return;
    }
        
    this.set(`channel.draftMessage`, '');
                  
    if (this.get('channel.is_page'))  {
      api.requestOne('sendPage', { thread_id: channelKey, message: message, sender: this.get('channel.poseChar.name') }, null)
      .then( (response) => {
        if (response.error) {
          return;
        }
      }); 
    } else {
      api.requestOne('chatTalk', { channel: channelKey, message: message, sender: this.get('channel.poseChar.name') }, null)
      .then( (response) => {
        if (response.error) {
          return;
        }
      });
    }
  },
    
  @action
  hidePage(hidden) {
    let api = this.gameApi;
    let channelKey = this.get('channel.key');
                    
    api.requestOne('hidePageThread', { thread_id: channelKey, hidden: hidden }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      this.set('channel.is_hidden', hidden);
      this.set('channel.is_recent', !hidden);
      if (hidden) {
        this.flashMessages.success("Conversation will no longer appear on the recent list.");  
      } else {
        this.flashMessages.success("Conversation will appear again on the recent list.");  
      }
            
    });
  },
    
  @action
  renamePage() {
    let api = this.gameApi;
    let channelKey = this.get('channel.key');
    let title = this.newPageTitle;
    this.set('showPageRename', false);
                    
    api.requestOne('setPageThreadTitle', { thread_id: channelKey, title: title }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      this.set('channel.title', response.title);
      this.flashMessages.success("Conversation renamed.");  
    });
  },
    
  @action
  scrollDown() {
    this.onScrollDown();
  },
    
  @action
  pauseScroll() {
    this.onSetScroll(false);
  },
    
  @action
  unpauseScroll() {
    this.onSetScroll(true);
  },
    
  @action
  poseCharChanged(newChar) { 
    this.set('channel.poseChar', newChar);
  },
    
  @action
  download() {
      
    let api = this.gameApi;
    let channelKey = this.get('channel.key');
    let is_page = this.get('channel.is_page');
                  
    api.requestOne('downloadChat', { key: channelKey, is_page: is_page }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(response.log));
      element.setAttribute('download', this.get('channel.title'));

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    });
            
  },
  
  @action
  setSelectedReportMessage(value) {
    this.set('selectedReportMessage', value);
  },
  
  @action
  setShowReport(value) {
    this.set('showReport', value);
  },
  
  @action
  setShowPageRename(value) {
    this.set('showPageRename', value);
  },
  
  @action
  setNewPageTitle(value) {
    this.set('newPageTitle', value);
  },  
  
});
