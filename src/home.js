const { dialog } = require('electron').remote;
const { ipcRenderer } = require('electron')

document.getElementById('btn_start').addEventListener('click', function(){
    
    let loadPath = dialog.showOpenDialogSync({
        title:      'Open a pallet configuration',
        filters:    [{
            name:       'All files',
            extensions: ['*']
        },
        {
            name:       'JSON file',
            extensions: ['json']
        },
        {
            name:       'CSV file',
            extensions: ['csv']
        }],
        properties: [
            'openFile'
        ]
    });

    if(loadPath) {
        ipcRenderer.invoke('load-file', loadPath).then((res) => {console.log(res)})
    }
})