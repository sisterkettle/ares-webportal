import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default Controller.extend({
  gameApi: service(),
  flashMessages: service(),
  router: service(),
  queryParams: [ 'title', 'template', 'category', 'tags' ],

  setup: function() {
    this.set('model.text', this.get('model.template.text'));
  },
    
  resetOnExit: function() {
    // Reset query params.
    this.set('tags', '');
    this.set('title', '');
    this.set('category', '');
    this.set('template', '');
  },
    
  @action
  save() {
    let api = this.gameApi;
            
    api.requestOne('createWiki', 
    {
      title: this.get('model.title'), 
      text: this.get('model.text'),
      name: this.get('model.name'),
      tags: this.get('model.tags')
    }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      this.router.transitionTo('wiki-page',                          
      response.name);
      this.flashMessages.success('Page created!');
    });
  },
        
  @action
  templateChanged(template) {
    this.set('model.text', template.text);
    this.set('model.template', template);
  }
});