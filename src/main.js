import { DragControls } from './three.js-master/examples/jsm/controls/DragControls.js';


const _ = require('lodash');
const { dialog } = require('electron').remote;
const fs = require('fs');




let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
document.getElementById('MainThreeJS').appendChild(renderer.domElement);

let scene = new THREE.Scene();

const centralPoint = new THREE.Vector3(0, 0, 0);


// GLOBAL ILLUMINATION

scene.add(new THREE.AmbientLight(0xD9D9D9));


// PALLET

let palletGroup = new THREE.Group();
scene.add(palletGroup);

let palletWidth;
let palletHeight;
let palletDepth;
let pallet;
const gridCellSize = 1;

function createPallet(width, height, depth) {
    
    palletWidth = width;
    palletHeight = height;
    palletDepth = depth;
    
    pallet = new THREE.Mesh(
        new THREE.BoxGeometry(palletWidth, palletHeight, palletDepth), 
        new THREE.MeshBasicMaterial({
            color: 0x888888
        })
    );
    
    // y = - palletHeight / 2, so that its upper surface is equal to y = 0
    pallet.position.set(0, - palletDepth / 2 - 0.1, 0);
    pallet.rotation.x = 90 * Math.PI / 180;
    palletGroup.add(pallet);
    
    let palletFrame = new THREE.LineSegments(
        new THREE.EdgesGeometry(pallet.geometry), 
        new THREE.LineBasicMaterial({
            color:     0x303030,
            linewidth: 1
        })
    );
    pallet.add(palletFrame);
    

    // GRID
    
    let gridGeo = new THREE.Geometry();
    
    for(let i = 1; - palletHeight / 2 + i * gridCellSize < palletHeight / 2; i++) {
    
        gridGeo.vertices.push(new THREE.Vector3(- palletWidth / 2, 0, - palletHeight / 2 + i * gridCellSize));
        gridGeo.vertices.push(new THREE.Vector3(palletWidth / 2, 0, - palletHeight / 2 + i * gridCellSize));
    
    }
    
    for(let i = 1; - palletWidth / 2 + i * gridCellSize < palletWidth / 2; i++) {
    
        gridGeo.vertices.push(new THREE.Vector3(- palletWidth / 2 + i * gridCellSize, 0.1, - palletHeight / 2));
        gridGeo.vertices.push(new THREE.Vector3(- palletWidth / 2 + i * gridCellSize, 0.1, palletHeight / 2));
    
    }
    
    let gridMat = new THREE.LineBasicMaterial({
        color: 0x404040
    });
    
    let grid = new THREE.LineSegments(gridGeo, gridMat);
    grid.rotation.x = 90 * Math.PI / 180;
    grid.position.z -= palletDepth / 2 + 0.2;
    pallet.add(grid);

}
        
        
// TEMPORARY

createPallet(100, 120, 2.5);
        
        
// USED FOR CHECKING WHETHER A PACK IS PLACED WITHIN THE PALLET'S BOUNDARIES

function isPackWithinPallet(packPos, packGeoParam) {
    
    let palletGeoParam = pallet.geometry.parameters;
    
    return (
        packPos.x - packGeoParam.width / 2 >= centralPoint.x - palletGeoParam.width / 2   && 
        packPos.x + packGeoParam.width / 2 <= centralPoint.x + palletGeoParam.width / 2   &&
        packPos.z - packGeoParam.height / 2 >= centralPoint.z - palletGeoParam.height / 2 && 
        packPos.z + packGeoParam.height / 2 <= centralPoint.z + palletGeoParam.height / 2
    );

}



// PACKAGES

let packs = []

class Pack extends THREE.Mesh {

    constructor(obj) {

        obj.posY += obj.depth / 2;
        
        let packGeo = new THREE.BoxGeometry(obj.width, obj.height, obj.depth)
        super(
            packGeo,
            new THREE.MeshLambertMaterial({
                color: obj.color
            })
        );
            
        let edgeGeo = new THREE.EdgesGeometry(packGeo);
        let edgeMat = new THREE.LineBasicMaterial({
          color: 0x000000
        });
        let edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
        this.add(edgeMesh);

        this.dimensions = new THREE.Vector3(obj.width, obj.height, obj.depth);

        this.weight = obj.weight;
        
        this.originalPos = new THREE.Vector3(obj.posX, obj.posY, obj.posZ);
        this.lastPos = this.originalPos;
        
        this.position.set(obj.posX, obj.posY, obj.posZ);
        this.rotation.x = 90 * Math.PI / 180;
        
        this.core = new THREE.Object3D({
            visible: false
        });
        this.core.position.copy(this.position);
        this.add(this.core);
        
        this.name = obj.name;

        // was the pack's last, "static" position on the sidebar?
        this.wasOnTheSidebar = false;

        palletGroup.add(this);
        packs.push(this);

    }

    updateLastPos() {

        this.lastPos.copy(this.position);

    }

    backToLastPos() {

        this.position.copy(this.lastPos);

    }

    sidebarOrNot() {

        this.wasOnTheSidebar = ! this.wasOnTheSidebar;

    }

    snapToGrid() {

        this.position.x = gridCellSize * Math.round(this.position.x / gridCellSize);
        this.position.z = gridCellSize * Math.round(this.position.z / gridCellSize);

    }

}


// TEMPORARY

let pack1 = new Pack({
    name:   "Woda",
    posX:   0,
    posY:   0,
    posZ:   0,
    weight: 20,
    width:  20,
    height: 20,
    depth:  20,
    color:  0xFF0000
});

let pack2 = new Pack({
    name:   "Woda",
    posX:   20,
    posY:   0,
    posZ:   20,
    weight: 20,
    width:  20,
    height: 20,
    depth:  20,
    color:  0xFF0000
});

let pack3 = new Pack({
    name:   "Kwiatki",
    posX:   -10,
    posY:   0,
    posZ:   35,
    weight: 2,
    width:  30,
    height: 20,
    depth:  15,
    color:  0x0000FF
});


// PERSPECTIVE (MAIN) CAMERA

let cameraPersp = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
scene.add(cameraPersp);

cameraPersp.position.set(0, 80, 240);
cameraPersp.lookAt(pallet.position);


// PALLETGROUP ROTATION CONTROLS

let lmbDown = false;

window.addEventListener('mousedown', function (e) {

    if (e.button == 0) {

        lmbDown = true;

    }

}, false);

window.addEventListener('mouseup', function (e) {

    if(e.button == 0) {

        lmbDown = false;

    }

}, false);


let rmbDown = false,
    mouseX = 0,
    mouseY = 0;

window.addEventListener('mousemove', function (e) {

    if (! rmbDown) {

        return;

    }

    e.preventDefault();

    let deltaX = e.clientX - mouseX,
        deltaY = e.clientY - mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    rotateScene(deltaX, deltaY);

}, false);

window.addEventListener('mouseup', function (e) {

    // if rmb is pressed and lmb is not pressed to prevent dragging and rotating at the same time
    if(e.button == 2 && ! lmbDown) {

        e.preventDefault();

        rmbDown = false;

    }

}, false);

window.addEventListener('mousedown', function (e) {

    // if rmb is pressed and lmb is not pressed to prevent dragging and rotating at the same time
    if(e.button == 2 && ! lmbDown) {

        e.preventDefault();

        rmbDown = true;

        mouseX = e.clientX;
        mouseY = e.clientY;

    }

}, false);



function rotateScene(deltaX, deltaY) {

    palletGroup.rotation.y += deltaX / 100;
    palletGroup.rotation.x += deltaY / 100;

} 


// SAVING CONFIGURATION (TO JSON)

window.addEventListener('keydown', function (e) {

    if (e.key == 'F6') {

        let isAnyPackOnSidebar = false;

        for(const pack of packs) {

            if(pack.wasOnTheSidebar) {

                isAnyPackOnSidebar = true;

            }

        }

        if(! isAnyPackOnSidebar) {

            let palletToJSON = {
                width:  pallet.geometry.parameters.width,
                height: pallet.geometry.parameters.height,
                depth:  pallet.geometry.parameters.depth
            };
    
            let packsGrouped = _.
                                chain(packs).
                                groupBy('name').
                                value();
    
            let packsToJSON = []
    
            for(const [name, packsWithName] of Object.entries(packsGrouped)) {
    
                let positions = [];
                for(const packWithName of packsWithName) {
    
                    positions.push({
                        x: packWithName.position.x,
                        y: packWithName.position.y - packsWithName[0].dimensions.z / 2,
                        z: packWithName.position.z
                    });
    
                }
    
                packsToJSON.push({
                    name:       name,
                    dimensions: {
                        width:  packsWithName[0].dimensions.x,
                        height: packsWithName[0].dimensions.y,
                        depth:  packsWithName[0].dimensions.z
                    },
                    weight:     packsWithName[0].weight,
                    positions:  positions
                 });
    
            }
    
            let toJSON = {
                pallet: palletToJSON,
                packs:  packsToJSON
            }
    
            let JSONed = JSON.stringify(toJSON, null, 4);
    
            let savePath = dialog.showSaveDialogSync({
                title:   'Save the pallet configuration',
                filters: [{
                    name:       'JSON file',
                    extensions: ['json']
                }]
            });
    
            if(savePath) {
    
                fs.writeFileSync(savePath, JSONed);
    
            }

        } else {

            // TEMPORARY
            console.log('ALL PACKS SHOULD BE PLACED ON THE PALLET BEFORE SAVING');

        }


    }

}, false);


// LOADING CONFIGURATION (FROM JSON)

window.addEventListener('keydown', function (e) {

    if (e.key == 'F8') {

        let loadPath = dialog.showOpenDialogSync({
            title:      'Open a pallet configuration',
            filters:    [{
                name:       'JSON file',
                extensions: ['json']
            }],
            properties: [
                'openFile'
            ]
        });

        if(loadPath) {
    
            let JSONed = fs.readFileSync(loadPath[0], 'utf8');
            let fromJSON = JSON.parse(JSONed);


            // removing currently loaded pallet and packs
            palletGroup.remove(pallet);
            for(const pack of packs) {
                palletGroup.remove(pack);
            }
            packs = []

            createPallet(fromJSON.pallet.width, fromJSON.pallet.height, fromJSON.pallet.depth);

            for(const packType of fromJSON.packs) {

                // TEMPORARY - colours shouldn't be similar to each other. maybe save them in the json? probably not a good idea
                let colour = Math.random() * 0xFFFFFF;
                
                for(const packPosition of packType.positions) {

                    let pack = new Pack({
                        name:   packType.name,
                        posX:   packPosition.x,
                        posY:   packPosition.y,
                        posZ:   packPosition.z,
                        weight: packType.weight,
                        width:  packType.dimensions.width,
                        height: packType.dimensions.height,
                        depth:  packType.dimensions.depth,
                        color:  colour
                    });

                }

            }

        }

    }

}, false);



// SIDEBAR

let sceneUI = new THREE.Scene();

let cameraOrth = new THREE.OrthographicCamera(-100, 100, 100, -100, -1, 0);
cameraOrth.position.set(0, 0, 0);

let sidebarPoints = [];
const sidebarX = 65;
sidebarPoints.push(new THREE.Vector3(sidebarX, 100, 0));
sidebarPoints.push(new THREE.Vector3(sidebarX, -100, 0));

let sidebar = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(sidebarPoints), 
    new THREE.LineDashedMaterial({

        color: 0x404040, 
        linewidth: 1,
        scale: 0.5,
        dashSize: 1.5,
        gapSize: 2

    })
);
sidebar.computeLineDistances();
sceneUI.add(sidebar);


// CURRENT MOUSE POSITION

let mouse = new THREE.Vector2();
window.addEventListener('mousemove', onMouseMove);

function onMouseMove(event) {

	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

}


// RAYCASTING FROM MOUSE CURSOR, CURRENTLY USED FOR DRAGGING

let raycaster = new THREE.Raycaster();
let lastPackMousedOn;
window.addEventListener('mousemove', raycast);

function raycast() {

    raycaster.setFromCamera(mouse, cameraPersp);
    let intersects = raycaster.intersectObjects(packs);

    if(! currentlyDragging) {

        draggableObjects.length = 0;

        if(intersects.length > 0) {
    
            if(lastPackMousedOn) {
    
                lastPackMousedOn.material.emissive.set(0x000000);
                
            }
    
            lastPackMousedOn = intersects[0].object;
            draggableObjects.push(lastPackMousedOn);
    
            lastPackMousedOn.material.emissive.set(0x252525);
    
        } else if(lastPackMousedOn) {
    
            lastPackMousedOn.material.emissive.set(0x000000);
    
        }

    }

}


// DRAG CONTROLS

let draggableObjects = [];

let currentlyDragging = false;

let dragControls = new DragControls(draggableObjects, cameraPersp, renderer.domElement);

dragControls.addEventListener('dragstart', function(event) {

    currentlyDragging = true;

});

dragControls.addEventListener('drag', function(event) {

    let pack = event.object;

    if(isPackWithinPallet(pack.position, pack.geometry.parameters)) {
        
        if(pack.position.y - pack.geometry.parameters.depth / 2 < 0) {

            pack.position.y = 0 + pack.geometry.parameters.depth / 2;

        }

    }

});

dragControls.addEventListener('dragend', function (event) {

    currentlyDragging = false;
    
    let pack = event.object;

    // moved onto the sidebar
    if(mouse.x * 100 >= sidebarX) {

        if(!pack.wasOnTheSidebar) {

            let worldPosition = pack.position;
            palletGroup.localToWorld(worldPosition);

            // to prevent it from flickering momentarily when adding to the scene
            pack.matrixAutoUpdate = false;

            // removing the pack from the pallet by adding it to the scene, so that it doesn't
            // start rotating around the pallet's center
            palletGroup.remove(pack);
            scene.add(pack);

            let palletGroupRotation = new THREE.Euler();
            palletGroupRotation.copy(palletGroup.rotation);

            // all of this because the pallet is on its side
            palletGroupRotation.x += 90 * Math.PI / 180;
            let y = - palletGroupRotation.y;
            palletGroupRotation.y = palletGroupRotation.z;
            palletGroupRotation.z = y;

            pack.rotation.copy(palletGroupRotation);

            pack.position.copy(worldPosition);
            pack.matrixAutoUpdate = true;

            // copying the pallet's rotation with every frame
            pack.onBeforeRender = () => {

                let palletGroupRotation = new THREE.Euler();
                palletGroupRotation.copy(palletGroup.rotation);

                palletGroupRotation.x += 90 * Math.PI / 180;
                let y = - palletGroupRotation.y;
                palletGroupRotation.y = palletGroupRotation.z;
                palletGroupRotation.z = y;

                pack.rotation.copy(palletGroupRotation);
                
            }

            pack.sidebarOrNot();

        }

        pack.updateLastPos();

    
    } 
    // moved onto the pallet / empty space
    else {

        if(pack.wasOnTheSidebar) {

            // if it was on the sidebar (not part of palletGroup), then we need to translate its world position
            // to palletGroup's local position to compare it to pallet's boundaries
            let packLocalPosition = pack.position;
            palletGroup.worldToLocal(packLocalPosition);

            if(isPackWithinPallet(packLocalPosition, pack.geometry.parameters)) {

                pack.updateLastPos();

                palletGroup.add(pack);
                
                pack.onBeforeRender = () => {
    
                }

                pack.rotation.copy(pallet.rotation);

                pack.sidebarOrNot();

                pack.snapToGrid();

            } else {

                pack.backToLastPos();

            }

        }
        else {

            if(isPackWithinPallet(pack.position, pack.geometry.parameters)) {

                pack.updateLastPos();

                pack.snapToGrid();

            } else {

                pack.backToLastPos();

            }

        }
    }

});


// RENDERING

render();

function render() {

    renderer.render(scene, cameraPersp);
    renderer.render(sceneUI, cameraOrth);

    window.requestAnimationFrame(render);

}