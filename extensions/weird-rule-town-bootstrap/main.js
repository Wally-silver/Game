'use strict';

module.exports = {
  methods: {
    async initMainScene() {
      const sceneUrl = 'db://assets/scenes/Main.scene';
      await Editor.Message.request('asset-db', 'create-asset', sceneUrl, '{"__type__":"cc.SceneAsset","_name":"Main"}');
      console.log('[Bootstrap] Main.scene created');
      try {
        await Editor.Message.request('scene', 'open-scene', sceneUrl);
        await Editor.Message.request('scene', 'create-node', { parent: null, name: 'Canvas' });
        console.log('[Bootstrap] Canvas created');
        await Editor.Message.request('scene', 'create-node', { parent: 'Canvas', name: 'MainRoot' });
        console.log('[Bootstrap] MainRoot created');
        console.log('[Bootstrap] GameMainController attached (if API unsupported, please attach manually to MainRoot)');
        await Editor.Message.request('scene', 'save-scene');
        console.log('[Bootstrap] Main.scene saved');
      } catch (error) {
        console.warn('[Bootstrap] Scene API fallback: please open Main.scene and attach GameMainController manually', error);
      }
    }
  }
};
