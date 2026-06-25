import Controller from '@ember/controller';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { removeObject } from 'ares-webportal/helpers/object-ext';

export default Controller.extend({    
  gameApi: service(),
  flashMessages: service(),
  router: service(),
  newConfigKey: '',
  configErrors: null,  
  confirmDelete: false,
  showConfirmRestore: false,
    
  config: reads('model.config'),
    
  resetOnExit: function() {
    this.set('newConfigKey', '');
    this.set('configErrors', null);
    this.set('confirmDelete', null);
    this.set('showConfirmRestore', false);
  },
    
  @action
  addNew() {
    let key = this.newConfigKey;
    let modelConfig = this.get('model.config');
    if (modelConfig[key]) {
      return;
    }
    modelConfig[key] = { key: key, lines: 3, value: '', new_value: '' };
    this.set('model.config', modelConfig);
  },
        
  @action
  removeKey(key) {
    console.log(key);
    let modelConfig = this.get('model.config');
    console.log(modelConfig);
    delete modelConfig[key];
    console.log(modelConfig);
    this.set('model.config', modelConfig);
    this.set('confirmDelete', null);  
  },
        
  @action
  restoreDefaults() {
    let api = this.gameApi;
    api.requestOne('restoreConfig', { file: this.get('model.file') }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      
      this.flashMessages.success('Config restored!');
      this.send('reloadModel');
    });  
  },
  
  @action
  setConfirmDelete(value) {
    this.set('confirmDelete', value);
  },

  @action
  setShowConfirmRestore(value) {
    this.set('showConfirmRestore', value);
  },
        
  @action
  save() {
    let api = this.gameApi;
    let modelConfig = this.get('model.config');
    let config = {};
            
    Object.keys(modelConfig).forEach( function(k) {
      config[k] = modelConfig[k].new_value;
    });

    api.requestOne('saveConfig', { file: this.get('model.file'), config: config }, null)
    .then( (response) => {
      if (response.error) {
        return;
      }
      if (response.warnings) {
        this.set('configErrors', response.warnings);
        return;
      }
        
      this.flashMessages.success('Config saved!');
      this.router.transitionTo('setup');  
    });  
  }      
});