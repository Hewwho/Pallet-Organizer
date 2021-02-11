import { DragControls } from './three.js-master/examples/jsm/controls/DragControls.js';
import { OBJLoader } from './three.js-master/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from './three.js-master/examples/jsm/loaders/MTLLoader.js';
import { truncate } from 'fs';


const _ = require('lodash');
const { dialog } = require('electron').remote;
const fs = require('fs');
const electron = require('electron');
const { ipcRenderer } = electron;

electron.ipcRenderer.send('filepath-request');

ipcRenderer.on('filepath-reply', function (event, loadPath) {
    packs = []
    let colors = [0xEF4538, 0x913E98, 0x4153A3, 0x33A4DC, 0x139586, 0x8BC44A, 0xF9ED37, 0xF7981D,
        0x7A5648, 0xE81B64, 0x5C3A97, 0x2780C3, 0x17B9CF, 0x48B04F, 0xCDDD36, 0xFDC110, 0xF1582D]

    if (loadPath.substr(loadPath.length - 4, 4) == "json") {

        let JSONed = fs.readFileSync(loadPath, 'utf8');
        let fromJSON = JSON.parse(JSONed);

        for (const palletGroup of fromJSON.data) {

            createPallet(palletGroup.pallet.width, palletGroup.pallet.height, palletGroup.pallet.depth, palletGroup.pallet.id);

            for (const packType of palletGroup.packs) {

                let colour = colors[palletGroup.packs.indexOf(packType)]

                for (const packPosition of packType.positions) {

                    let pack = new Pack({
                        name: packType.name,
                        posX: packPosition.x,
                        posY: packPosition.y,
                        posZ: packPosition.z,
                        weight: packType.weight,
                        width: packType.dimensions.width,
                        height: packType.dimensions.height,
                        depth: packType.dimensions.depth,
                        color: colour,
                        palletId: palletGroup.pallet.id
                    });

                }

            }
        }



    } else if (loadPath.substr(loadPath.length - 3, 3) == "csv") {

        let fileContent = fs.readFileSync(loadPath, 'utf8');
        var allLines = fileContent.split(/\r\n|\n/);
        var delimiter = allLines[0].indexOf(',') > -1 ? ',' : ';';

        // type;name;id;layer;pos_x;pos_y;pos_z;width;height;depth;weight;max_loading
        for (var i = 0; i < allLines.length; i++) {
            let data = allLines[i].split(delimiter);
            if (data[0] == 'pallet') {
                createPallet(data[7], data[8], data[9], data[12]);

            } else if (data[0] == 'pack') {
                let pack = new Pack({
                    name: data[1],
                    // productId: data[2],
                    // layerId: Number(data[3]),
                    posX: Number(data[4]),
                    posY: Number(data[5]),
                    posZ: Number(data[6]),
                    width: Number(data[7]),
                    height: Number(data[8]),
                    depth: Number(data[9]),
                    weight: Number(data[10]),
                    color: colors[i % colors.length],
                    palletId: Number(data[12])
                });

            }
        }

    }
    updateTable();
    scene.add(palletGroups[0]);

    var stackTab = document.createElement('li');
    stackTab.setAttribute("class", "nav-item");
    var link = document.createElement('a');
    link.setAttribute("id", "tab-link-1");
    currentPalletId == -1 ? link.setAttribute("class", "nav-link active") : link.setAttribute("class", "nav-link");
    link.setAttribute("href", "#");
    link.addEventListener("click", function (event) {
        document.getElementById("tab-link" + currentPalletId).setAttribute("class", "nav-link");
        scene.remove(palletGroups[currentPalletId]);

        var palletId = -1;

        stackGroup = new THREE.Group();
        var prevPosY = 0;
        for (let i = 0; i < palletGroups.length; i++) {
            palletGroups[i].rotation.x = 0;
            palletGroups[i].rotation.y = 0;
            palletGroups[i].rotation.z = 0;
            palletGroups[i].position.y = prevPosY;
            prevPosY += getTotalHeight(palletGroups[i]) + pallets[i].parameters.height;
            stackGroup.add(palletGroups[i])
        }
        scene.add(stackGroup);
        currentPalletId = palletId;
        event.target.setAttribute("class", "nav-link active");
        updateTable();
    });
    link.innerHTML = "Stack"
    stackTab.appendChild(link);
    document.getElementById("tabs").appendChild(stackTab);



    const axesHelper = new THREE.AxesHelper(45);
    //palletGroups[currentPalletId].add(axesHelper);
});

function getTotalHeight(palletGroup) {
    var maxHeight = 0;
    for (let i = 0; i < palletGroup.children.length; i++) {
        var h = palletGroup.children[i].position.y

        if (palletGroup.children[i].geometry && palletGroup.children[i].geometry.parameters)
            h += palletGroup.children[i].geometry.parameters.height / 2;
        if (h > maxHeight)
            maxHeight = h;
    }
    return maxHeight;
}

let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
document.getElementById('MainThreeJS').appendChild(renderer.domElement);

let scene = new THREE.Scene();

const centralPoint = new THREE.Vector3(0, 0, 0);


// GLOBAL ILLUMINATION

scene.add(new THREE.AmbientLight(0xD9D9D9));


// PALLET

///// let palletGroup = new THREE.Group();
////// scene.add(palletGroup);
let currentPalletId = 0;
let palletGroups = [];
let stackGroup;

const gridCellSize = 1;
////// let pallet;
let pallets = [];

function createPallet(palletWidth, palletHeight, palletDepth, palletId) { //////palletid

    let pallet = new THREE.Group() /////let

    pallet.parameters = { width: Number(palletWidth), height: Number(palletHeight), depth: Number(palletDepth) }
    // pallet.position.set(0, - palletHeight - 0.2, 0);

    ////// palletGroup.add(pallet);
    palletGroups[palletId] = pallet;//////
    pallets[palletId] = pallet;///////

    let palletObject = new THREE.Group();
    palletObject.position.set(0, - palletHeight - 0.2, 0); /////
    pallet.add(palletObject)

    var loader = new OBJLoader();
    var mtlLoader = new MTLLoader();
    mtlLoader.load('./pallet/pallet_1200x800.mtl', materials => {
        materials.preload();
        loader.setMaterials(materials);
        loader.load('./pallet/pallet_1200x800.obj', function (obj) {

            var frame = new THREE.LineSegments(
                new THREE.EdgesGeometry(obj.children[0].geometry),
                new THREE.LineBasicMaterial({ color: 0x303030, linewidth: 1 }));
            palletObject.scale.set(0.1 * palletWidth / 80, 0.1 * palletHeight / 14.4, 0.1 * palletDepth / 120)


            palletObject.add(obj);
            palletObject.add(frame);

        }, undefined, function (error) {
            console.error(error);
        });

    })

    // GRID

    let gridGeo = new THREE.Geometry();

    for (let i = 1; - palletDepth / 2 + i * gridCellSize < palletDepth / 2; i++) {
        gridGeo.vertices.push(new THREE.Vector3(- palletWidth / 2, 0, - palletDepth / 2 + i * gridCellSize));
        gridGeo.vertices.push(new THREE.Vector3(palletWidth / 2, 0, - palletDepth / 2 + i * gridCellSize));
    }

    for (let i = 1; - palletWidth / 2 + i * gridCellSize < palletWidth / 2; i++) {
        gridGeo.vertices.push(new THREE.Vector3(- palletWidth / 2 + i * gridCellSize, 0.1, - palletDepth / 2));
        gridGeo.vertices.push(new THREE.Vector3(- palletWidth / 2 + i * gridCellSize, 0.1, palletDepth / 2));
    }

    let gridMat = new THREE.LineBasicMaterial({
        color: 0x404040
    });

    let grid = new THREE.LineSegments(gridGeo, gridMat);
    // grid.position.set(0, 0, 0);
    // grid.position.y += palletHeight + 0.2;

    pallet.add(grid);

    // CREATE NEW TAB

    var tab = document.createElement('li');
    tab.setAttribute("class", "nav-item");
    var link = document.createElement('a');
    link.setAttribute("id", "tab-link" + palletId);
    currentPalletId == palletId ? link.setAttribute("class", "nav-link active") : link.setAttribute("class", "nav-link");
    link.setAttribute("data-palletid", palletId);
    link.setAttribute("href", "#");
    link.addEventListener("click", function (event) {
        document.getElementById("tab-link" + currentPalletId).setAttribute("class", "nav-link");
        if (currentPalletId == -1) {

            for (let i = 0; i < scene.children.length; i++) {
                if (scene.children[i].type == "Group") {
                    scene.remove(scene.children[i]);
                }
            }
            for (let i = 0; i < palletGroups.length; i++)
                palletGroups[i].position.y = 0
        } else {
            scene.remove(palletGroups[currentPalletId]);
        }
        var palletId = event.target.dataset.palletid;
        scene.add(palletGroups[palletId]);
        currentPalletId = palletId;
        event.target.setAttribute("class", "nav-link active");
        updateTable();
    });
    link.innerHTML = "Pallet" + palletId
    tab.appendChild(link);
    document.getElementById("tabs").appendChild(tab);
}



// TEMPORARY

// const axesHelper = new THREE.AxesHelper(45);
// palletGroups[currentPalletId.add(axesHelper);


// USED FOR CHECKING WHETHER A PACK IS PLACED WITHIN THE PALLET'S BOUNDARIES

function isPackWithinPallet(pack) {
    ////// let palletGeoParam = pallet.parameters;
    let palletGeoParam = pallets[currentPalletId].parameters;
    let packPos = pack.position;
    let packGeoParam = pack.geometry.parameters;

    return (
        packPos.x - packGeoParam.width / 2 >= centralPoint.x - palletGeoParam.width / 2 &&
        packPos.x + packGeoParam.width / 2 <= centralPoint.x + palletGeoParam.width / 2 &&
        packPos.z - packGeoParam.depth / 2 >= centralPoint.z - palletGeoParam.depth / 2 &&
        packPos.z + packGeoParam.depth / 2 <= centralPoint.z + palletGeoParam.depth / 2
    );

}

function isColliding(pack, packList) {
    let elements = [...packList]
    elements.splice(elements.indexOf(pack), 1);
    elements = elements.filter((elem) => { return elem.onPallet; })

    for (let i = 0; i < elements.length; i++) {
        let element = elements[i]
        if (!(element.getCornerX() - pack.getCornerX() >= pack.geometry.parameters.width ||
            (pack.getCornerX() - element.getCornerX() >= element.geometry.parameters.width) ||
            (element.getCornerY() - pack.getCornerY() >= pack.geometry.parameters.height) ||
            (pack.getCornerY() - element.getCornerY() >= element.geometry.parameters.height) ||
            (element.getCornerZ() - pack.getCornerZ() >= pack.geometry.parameters.depth) ||
            (pack.getCornerZ() - element.getCornerZ() >= element.geometry.parameters.depth))) {
            return true;
        }
    }
    return false;
}

// PACKAGES

let packs = [];
let layers = [];
let layerLevels = [0];
let current = null;

class Pack extends THREE.Mesh {

    constructor(obj) {
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
        this.initialColor = obj.color;

        this.originalPos = new THREE.Vector3(obj.posX, obj.posY, obj.posZ);
        this.lastPos = this.originalPos;

        this.position.set(obj.posX, obj.posY, obj.posZ);

        this.core = new THREE.Object3D({
            visible: false
        });
        this.core.position.copy(this.position);
        this.add(this.core);

        this.name = obj.name;

        this.palletId = obj.palletId;
        palletGroups[this.palletId].add(this);
        if (!packs[obj.palletId])
            packs[obj.palletId] = []
        packs[obj.palletId].push(this);

        this.onPallet = true;

        this.layerBottom = this.position.y - this.geometry.parameters.height / 2;
        this.layerTop = this.position.y + this.geometry.parameters.height / 2
        if (layerLevels.indexOf(this.layerTop) < 0) {
            layerLevels.push(this.layerTop)
        }
        addPackToLayers(this);
    }

    updateLastPos() {
        this.lastPos.copy(this.position);
    }

    backToLastPos() {
        this.position.copy(this.lastPos);
    }

    snapToGrid() {
        this.position.x = gridCellSize * Math.round(this.position.x / gridCellSize);
        this.position.z = gridCellSize * Math.round(this.position.z / gridCellSize);
    }

    getCornerX() {
        return this.position.x - this.geometry.parameters.width / 2;
    }

    getCornerY() {
        return this.position.y - this.geometry.parameters.height / 2;
    }

    getCornerZ() {
        return this.position.z - this.geometry.parameters.depth / 2;
    }

    setColorActive() {
        this.material.emissive.set(0x222222);
    }
    setColorInactive() {
        this.material.emissive.set(0x000000);
    }
    setColorInvalid() {
        this.material.transparent = true;
        this.material.opacity = 0.7;
        this.material.color.set(0xff0000);
    }
    setColorValid() {
        this.material.opacity = 1.0;
        this.material.color.set(this.initialColor);
    }

}


class Layer {
    constructor(obj) {
        this.bottom = obj.bottom;
        this.top = obj.top;
        this.packs = [];
    }
    addPack(pack) {
        this.packs.push(pack);
    }
    removePack(pack) {
        this.packs.splice(this.packs.indexOf(pack), 1);
    }
}

function findLayerId(layers, bottom, top) {
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].top == top && layers[i].bottom == bottom) {
            return i;
        }
    }
    return -1;
}

function getLayerId(packLayers, pack) {
    for (let i = 0; i < packLayers.length; i++) {
        if (packLayers[i].packs.indexOf(pack) > -1) {
            return i;
        }
    }
    return -1;
}

function addPackToLayers(pack) {
    let layerId = findLayerId(layers, pack.position.y - pack.geometry.parameters.height / 2, pack.position.y + pack.geometry.parameters.height / 2)
    if (layerId < 0) {
        layers.push(new Layer({ bottom: pack.position.y - pack.geometry.parameters.height / 2, top: pack.position.y + pack.geometry.parameters.height / 2 }))
        layerId = findLayerId(layers, pack.position.y - pack.geometry.parameters.height / 2, pack.position.y + pack.geometry.parameters.height / 2)
    }
    layers[layerId].addPack(pack);
}


// PERSPECTIVE (MAIN) CAMERA

let cameraPersp = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
cameraPersp.aspect = (window.innerWidth) / window.innerHeight;
cameraPersp.updateProjectionMatrix();
scene.add(cameraPersp);

cameraPersp.position.set(0, 80, 240);
// cameraPersp.lookAt(pallet.position);
cameraPersp.lookAt(0, 20, 0)

// ZOOM IN / ZOOM OUT
var zoomInButton = document.getElementById('zoom-in');
var zoomOutButton = document.getElementById('zoom-out');

let scene2 = new THREE.Scene();
function onZoomIn() {
    cameraPersp.position.set(cameraPersp.position.x * 0.9, cameraPersp.position.y * 0.9, cameraPersp.position.z * 0.9);

}

function onZoomOut() {
    cameraPersp.position.set(cameraPersp.position.x * 1.1, cameraPersp.position.y * 1.1, cameraPersp.position.z * 1.1);
}

zoomInButton.addEventListener('click', onZoomIn, false);
zoomOutButton.addEventListener('click', onZoomOut, false);

// MOVE UP / MOVE DOWN BUTTONS

var moveUpButton = document.getElementById('move-up');
var moveDownButton = document.getElementById('move-down');

function moveItem(direction) {
    let currentBottom = current.layerBottom;
    let currentTop = current.layerTop;
    layerLevels.sort(function compareNumbers(a, b) { return a - b; })
    let index = layerLevels.indexOf(currentBottom);

    // add new top layer if neccessary
    if (direction == 1 && index == layerLevels.length - 1) {
        layerLevels.push(currentBottom + current.geometry.parameters.height)
    }

    let newLevel = layerLevels[index + direction]
    current.position.y = newLevel + current.geometry.parameters.height / 2;
    current.layerBottom = newLevel;
    current.layerTop = newLevel + current.geometry.parameters.height;
    current.updateLastPos();

}
function onMoveUp() {
    moveItem(1);
    moveDownButton.disabled = false;
}

function onMoveDown() {
    moveItem(-1);
    if (current.layerBottom == 0)
        moveDownButton.disabled = true;
}

moveUpButton.addEventListener('click', onMoveUp, false);
moveDownButton.addEventListener('click', onMoveDown, false);


// PALLETGROUP ROTATION CONTROLS

let lmbDown = false;

window.addEventListener('mousedown', function (e) {
    if (e.button == 0) {
        lmbDown = true;
    }
}, false);

window.addEventListener('mouseup', function (e) {
    if (e.button == 0) {
        lmbDown = false;
    }
}, false);


let rmbDown = false,
    mouseX = 0,
    mouseY = 0;

window.addEventListener('mousemove', function (e) {
    if (!rmbDown) {
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
    if (e.button == 2 && !lmbDown) {
        e.preventDefault();
        rmbDown = false;
    }

}, false);

window.addEventListener('mousedown', function (e) {
    // if rmb is pressed and lmb is not pressed to prevent dragging and rotating at the same time
    if (e.button == 2 && !lmbDown) {
        e.preventDefault();
        rmbDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
}, false);



function rotateScene(deltaX, deltaY) {
    if (currentPalletId == -1) {
        stackGroup.rotation.y += deltaX / 100;
        stackGroup.rotation.x += deltaY / 100;
    } else {
        palletGroups[currentPalletId].rotation.y += deltaX / 100;
        palletGroups[currentPalletId].rotation.x += deltaY / 100;
    }

}


// SAVING CONFIGURATION (TO JSON)

window.addEventListener('keydown', function (e) {

    if (e.key == 'F6') {

        //TODO : check if all packs are on pallet
        if (true) {

            let palletToJSON = {
                width: pallet.parameters.width,
                height: pallet.parameters.height,
                depth: pallet.parameters.depth
            };

            let packsGrouped = _.
                chain(packs).
                groupBy('name').
                value();

            let packsToJSON = []

            for (const [name, packsWithName] of Object.entries(packsGrouped)) {

                let positions = [];
                for (const packWithName of packsWithName) {

                    positions.push({
                        x: packWithName.position.x,
                        y: packWithName.position.y - packsWithName[0].dimensions.z / 2,
                        z: packWithName.position.z
                    });

                }

                packsToJSON.push({
                    name: name,
                    dimensions: {
                        width: packsWithName[0].dimensions.x,
                        height: packsWithName[0].dimensions.y,
                        depth: packsWithName[0].dimensions.z
                    },
                    weight: packsWithName[0].weight,
                    positions: positions
                });

            }

            let toJSON = {
                pallet: palletToJSON,
                packs: packsToJSON
            }

            let JSONed = JSON.stringify(toJSON, null, 4);

            let savePath = dialog.showSaveDialogSync({
                title: 'Save the pallet configuration',
                filters: [{
                    name: 'JSON file',
                    extensions: ['json']
                },
                {
                    name: 'CSV file',
                    extensions: ['csv']
                }]
            });

            if (savePath) {

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
            title: 'Open a pallet configuration',
            filters: [{
                name: 'All files',
                extensions: ['*']
            },
            {
                name: 'JSON file',
                extensions: ['json']
            },
            {
                name: 'CSV file',
                extensions: ['csv']
            }],
            properties: [
                'openFile'
            ]
        });

        if (loadPath) {

            // removing currently loaded pallet and packs
            palletGroup.remove(pallet);
            for (const pack of packs) {
                palletGroup.remove(pack);
            }
            packs = []
            let colors = [0xEF4538, 0x913E98, 0x4153A3, 0x33A4DC, 0x139586, 0x8BC44A, 0xF9ED37, 0xF7981D,
                0x7A5648, 0xE81B64, 0x5C3A97, 0x2780C3, 0x17B9CF, 0x48B04F, 0xCDDD36, 0xFDC110, 0xF1582D]

            if (loadPath[0].substr(loadPath.length - 5, 4) == "json") {

                let JSONed = fs.readFileSync(loadPath[0], 'utf8');
                let fromJSON = JSON.parse(JSONed);

                createPallet(fromJSON.pallet.width, fromJSON.pallet.height, fromJSON.pallet.length);

                for (const packType of fromJSON.packs) {

                    // TEMPORARY - colours shouldn't be similar to each other. maybe save them in the json? probably not a good idea
                    let colour = Math.random() * 0xFFFFFF;

                    for (const packPosition of packType.positions) {

                        let pack = new Pack({
                            name: packType.name,
                            posX: packPosition.x,
                            posY: packPosition.y,
                            posZ: packPosition.z,
                            weight: packType.weight,
                            width: packType.dimensions.width,
                            height: packType.dimensions.height,
                            depth: packType.dimensions.depth,
                            color: colour
                        });

                    }

                }

            } else if (loadPath[0].substr(loadPath.length - 4, 3) == "csv") {

                let fileContent = fs.readFileSync(loadPath[0], 'utf8');
                var allLines = fileContent.split(/\r\n|\n/);
                var delimiter = allLines[0].indexOf(',') > -1 ? ',' : ';';

                // type;name;id;layer;pos_x;pos_y;pos_z;width;height;depth;weight;max_loading
                for (var i = 0; i < allLines.length; i++) {
                    let data = allLines[i].split(delimiter);
                    if (data[0] == 'pallet') {
                        createPallet(data[7], data[8], data[9]);

                    } else if (data[0] == 'pack') {
                        let pack = new Pack({
                            name: data[1],
                            // productId: data[2],
                            // layerId: Number(data[3]),
                            posX: Number(data[4]),
                            posY: Number(data[5]),
                            posZ: Number(data[6]),
                            width: Number(data[7]),
                            height: Number(data[8]),
                            depth: Number(data[9]),
                            weight: Number(data[10]),
                            color: colors[i % colors.length]
                        });

                    }
                }

            }
        }
    }

}, false);



// CURRENT MOUSE POSITION

let mouse = new THREE.Vector2();
window.addEventListener('mousemove', onMouseMove);

function onMouseMove(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    // mouse.x = ((event.clientX - window.innerWidth/2) / window.innerWidth) * 4 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

}


// RAYCASTING FROM MOUSE CURSOR, CURRENTLY USED FOR DRAGGING

let raycaster = new THREE.Raycaster();
let lastPackMousedOn;
window.addEventListener('mousemove', raycast);

function raycast() {
    if (currentPalletId == -1) return;

    raycaster.setFromCamera(mouse, cameraPersp);
    let intersects = raycaster.intersectObjects(packs[currentPalletId]); ///////

    if (!currentlyDragging) {

        draggableObjects.length = 0;

        if (intersects.length > 0) {

            // if(lastPackMousedOn) {

            //     lastPackMousedOn.material.emissive.set(0x000000);

            // }

            lastPackMousedOn = intersects[0].object;
            draggableObjects.push(lastPackMousedOn);

            // lastPackMousedOn.material.emissive.set(0x252525);

        } else if (lastPackMousedOn) {

            // lastPackMousedOn.material.emissive.set(0x000000);

        }

    }

}


// DRAG CONTROLS

let draggableObjects = [];

let currentlyDragging = false;

let dragControls = new DragControls(draggableObjects, cameraPersp, renderer.domElement);

dragControls.addEventListener('dragstart', function (event) {
    currentlyDragging = true;

});

dragControls.addEventListener('drag', function (event) {

    let pack = event.object;

    if (isPackWithinPallet(pack)) {

        pack.position.y = pack.layerBottom + pack.geometry.parameters.height / 2;

        if (isColliding(pack, packs[currentPalletId])) { //////
            pack.setColorInvalid();

        } else {
            pack.setColorValid();
        }

    }

});

dragControls.addEventListener('dragend', function (event) {

    currentlyDragging = false;

    let pack = event.object;

    let packPosition = pack.position;
    if (isPackWithinPallet(pack) && !isColliding(pack, packs[currentPalletId])) { /////

        pack.updateLastPos();
        palletGroups[currentPalletId].add(pack); /////
        pack.snapToGrid();
        updateTable();

    } else {
        pack.backToLastPos();
        pack.setColorValid();
    }
});



renderer.domElement.addEventListener("click", onclick);
var raycaster1 = new THREE.Raycaster();

function onclick(event) {
    if (currentPalletId == -1) return;
    if (current != null) {
        current.setColorInactive();
        if (document.getElementById("row-" + packs[currentPalletId].indexOf(current)))
            document.getElementById("row-" + packs[currentPalletId].indexOf(current)).className == '';
    }
    var selected;
    raycaster.setFromCamera(mouse, cameraPersp);
    raycaster1.setFromCamera(mouse, cameraPersp);
    var intersects = raycaster1.intersectObjects(packs[currentPalletId]); //array ///////
    if (intersects.length > 0) {
        selected = intersects[0];
        current = selected.object;
        current.setColorActive();

        document.getElementById("row-" + packs[currentPalletId].indexOf(current)).setAttribute('class', 'selected-row');

        moveUpButton.disabled = false;
        if (current.layerBottom != 0)
            moveDownButton.disabled = false;
        else
            moveDownButton.disabled = true;
    } else {
        current = null;
        moveUpButton.disabled = true;
        moveDownButton.disabled = true;
    }
}

// DATA TABLE
function getButton(pack, i) {
    var button = document.createElement('button');
    if (pack.onPallet) {
        button.id = "removeButton" + i;
        button.className = "btn btn-danger remove-button";
        button.innerHTML = "Remove";
        button.onclick = () => {
            pack.onPallet = false;
            palletGroups[currentPalletId].remove(pack); ////////////
            updateTable();
        };

    } else {
        button.id = "addButton" + i;
        button.className = "btn btn-success add-button";
        button.innerHTML = "Add";
        button.onclick = () => {
            pack.onPallet = true;
            palletGroups[currentPalletId].add(pack); //////
            while (isColliding(pack, packs[currentPalletId])) { ///////
                current = pack;
                moveItem(1);
            }
            updateTable();
        };
    }
    return button;
}

function getEditButton(pack, i) {
    var button = document.createElement('button');
    button.id = "editButton" + i;
    button.className = "btn btn-primary remove-button";
    button.innerHTML = "Edit";
    button.onclick = () => {
        current = pack;
        document.getElementById('edit-dialog').style.display = 'block';
        document.getElementById('pallet-id').innerHTML = '';
        for (let j = 0; j < palletGroups.length; j++) {
            var opt = document.createElement('option');
            opt.setAttribute("value", j);
            opt.innerHTML = j;
            opt.selected = (j == pack.palletId ? true : false);
            document.getElementById('pallet-id').appendChild(opt);
        }

    };

    return button;
}

document.getElementById('save-pack-button').addEventListener('click', function () {
    savePackChanges();
});

function savePackChanges() {
    if (current.palletId.toString() != document.getElementById('pallet-id').value) {
        movePackToPallet(document.getElementById('pallet-id').value)
    }
    document.getElementById('edit-dialog').style.display = 'none';
}


function movePackToPallet(palletId) {
    var previousPallet = current.palletId;
    current.palletId = palletId;
    palletGroups[previousPallet].remove(current);
    palletGroups[palletId].add(current);
    packs[previousPallet].splice(packs[previousPallet].indexOf(current), 1);
    packs[palletId].push(current);
    while (isColliding(current, packs[palletId])) {
        moveItem(1);
    }
    updateTable();
}

function updateTable() {
    var table = document.getElementById("table");
    table.innerHTML = ''
    var div = document.getElementById("stack-div");
    div.innerHTML = '';

    if (currentPalletId == -1) {

        var firstRow = document.createElement('thead');
        firstRow.innerHTML = '<tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">X</th><th scope="col">Y</th><th scope="col">Z</th>' +
            '<th scope="col">Width</th><th scope="col">Height</th><th scope="col">Depth</th><th scope="col">Weight</th></tr>';
        table.appendChild(firstRow);

        var tableBody = document.createElement('tbody');
        table.appendChild(tableBody);
        var counter = 1;
        for (let n = 0; n < packs.length; n++) {
            var p = packs[n];
            if (!p) return;
            for (let i = 0; i < p.length; i++) {
                var row = document.createElement('tr');
                row.setAttribute("id", "row-" + i);
                row.innerHTML = "<th>" + counter + "</th><td>" + p[i].name + "</td><td>"
                    + Math.round(p[i].position.x) + "</td><td>"
                    + Math.round(p[i].position.y) + "</td><td>"
                    + Math.round(p[i].position.z) + "</td><td>"
                    + p[i].geometry.parameters.width + "</td><td>"
                    + p[i].geometry.parameters.height + "</td><td>"
                    + p[i].geometry.parameters.depth + "</td><td>"
                    + p[i].weight + "</td>";

                tableBody.appendChild(row);
                counter++;
            }
        }
        var validateButton = document.createElement("button");
        validateButton.innerHTML = "Validate solution";
        validateButton.className = "btn btn-primary"
        validateButton.style = "margin: 10px"

        validateButton.onclick = () => {
            validateSolution();
        }
        div.appendChild(validateButton)
    } else {

        var firstRow = document.createElement('thead');
        firstRow.innerHTML = '<tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">X</th><th scope="col">Y</th><th scope="col">Z</th>' +
            '<th scope="col">Width</th><th scope="col">Height</th><th scope="col">Depth</th><th scope="col">Action</th><th>Edit</th></th></tr>';
        table.appendChild(firstRow);

        var tableBody = document.createElement('tbody');
        table.appendChild(tableBody);
        var p = packs[currentPalletId];
        if (!p) return;
        for (let i = 0; i < p.length; i++) {
            var row = document.createElement('tr');
            row.setAttribute("id", "row-" + i);
            row.innerHTML = "<th>" + (i + 1) + "</th><td>" + p[i].name + "</td><td>"
                + Math.round(p[i].position.x) + "</td><td>"
                + Math.round(p[i].position.y) + "</td><td>"
                + Math.round(p[i].position.z) + "</td><td>"
                + p[i].geometry.parameters.width + "</td><td>"
                + p[i].geometry.parameters.height + "</td><td>"
                + p[i].geometry.parameters.depth + "</td>"
                + "<td id='th-button" + i + "'></td>"
                + "<td id='edit-button" + i + "'></td>";

            row.addEventListener("mouseover", () => {
                p[i].setColorActive();
            });

            row.addEventListener("mouseout", () => {
                p[i].setColorInactive();
            });

            tableBody.appendChild(row);
            document.getElementById("th-button" + i).appendChild(getButton(p[i], i));
            document.getElementById("edit-button" + i).appendChild(getEditButton(p[i], i));

        }
    }
}

document.getElementById("gridCheckbox").addEventListener('input', function (event) {
    pallets[currentPalletId].children[1].visible = document.getElementById("gridCheckbox").checked; //////
});

//checkLoadBalancing(packs);

// CHECKING SOLUTION

function validateSolution() {

    var table = document.getElementById("table");
    table.innerHTML = ''
    var div = document.getElementById("stack-div");
    div.innerHTML = '';

    var firstRow = document.createElement('thead');
    firstRow.innerHTML = '<tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">X</th><th scope="col">Y</th><th scope="col">Z</th>' +
        '<th scope="col">Width</th><th scope="col">Height</th><th scope="col">Depth</th><th scope="col">Weight</th><th>Validation</th></tr>';
    table.appendChild(firstRow);

    var tableBody = document.createElement('tbody');
    table.appendChild(tableBody);

    var counter = 1;
    for (let i = 0; i < packs.length; i++) {
        var p = packs[i];
        for (let j = 0; j < packs[i].length; j++) {

            var result = checkVerticalSupport(packs[i][j]);
            var isVerticallySupported = result.answer;
            var percent = result.percent;

            var row = document.createElement('tr');
            row.setAttribute("id", "row-" + counter);
            row.innerHTML = "<th>" + counter + "</th><td>" + p[j].name + "</td><td>"
                + Math.round(p[j].position.x) + "</td><td>"
                + Math.round(p[j].position.y) + "</td><td>"
                + Math.round(p[j].position.z) + "</td><td>"
                + p[j].geometry.parameters.width + "</td><td>"
                + p[j].geometry.parameters.height + "</td><td>"
                + p[j].geometry.parameters.depth + "</td><td>"
                + p[j].weight + "</td><td>"
                + (isVerticallySupported ? "<img src='./files/check-circle-fill.svg''></img>" :
                    "<div class='tooltip'><img src='./files/exclamation-square-fill.svg'><span class='tooltiptext'>"
                    + percent + "% vertical support </span></img></div>")
                + "</td>";

            tableBody.appendChild(row);
            counter++;
            row.addEventListener("mouseover", () => {
                packs[i][j].setColorActive();
            });

            row.addEventListener("mouseout", () => {
                packs[i][j].setColorInactive();
            });

        }
        checkLoadBalancing(packs[i])
    }

}

// VERTICAL SUPPORT
// each pack should have at least 70% of its bottom surface covered by the layer underneath

function checkVerticalSupport(currentItem) {
    if (currentItem.layerBottom != 0) {
        var bottomItems = [];
        for (let i = 0; i < packs[currentItem.palletId].length; i++) {
            if (packs[currentItem.palletId][i].layerTop == currentItem.layerBottom) {
                var element = packs[currentItem.palletId][i];
                if (!(element.getCornerX() - currentItem.getCornerX() >= currentItem.geometry.parameters.width ||
                    (currentItem.getCornerX() - element.getCornerX() >= element.geometry.parameters.width) ||
                    (element.getCornerZ() - currentItem.getCornerZ() >= currentItem.geometry.parameters.depth) ||
                    (currentItem.getCornerZ() - element.getCornerZ() >= element.geometry.parameters.depth))) {
                    bottomItems.push(packs[currentItem.palletId][i]);
                }
            }
        }
        var areaSum = 0;
        for (let i = 0; i < bottomItems.length; i++) {
            var element = bottomItems[i];
            var l1x = currentItem.getCornerX();
            var r1x = currentItem.getCornerX() + currentItem.geometry.parameters.width;
            var l2x = element.getCornerX();
            var r2x = element.getCornerX() + element.geometry.parameters.width;
            var l1z = currentItem.getCornerZ();
            var r1z = currentItem.getCornerZ() - currentItem.geometry.parameters.depth;
            var l2z = element.getCornerZ();
            var r2z = element.getCornerZ() - element.geometry.parameters.depth;

            var xDist = Math.min(r1x, r2x) - Math.max(l1x, l2x);
            var zDist = Math.min(l1z, l2z) - Math.max(r1z, r2z);

            areaSum += xDist * zDist;
        }

        if (areaSum < 0.7 * currentItem.geometry.parameters.width * currentItem.geometry.parameters.depth) {
            return { answer: false, percent: areaSum / (currentItem.geometry.parameters.width * currentItem.geometry.parameters.depth) * 100 };
        } else {
            return { answer: true, percent: areaSum / (currentItem.geometry.parameters.width * currentItem.geometry.parameters.depth) * 100 };
        }
    }
    return { answer: true, percent: 100 };

}

//LOAD BALANCING

function checkLoadBalancing(packs) {
    var layers = {}
    for (let i = 0; i < packs.length; i++) {
        let pack = packs[i];
        let id = pack.layerBottom + "-" + pack.layerTop;
        if (layers[id] == undefined) {
            layers[id] = [];
        }
        layers[id].push(pack);
    }
    var keys = Object.keys(layers);
    var layerArray = [];
    for (let i = 0; i < keys.length; i++) {
        layerArray.push({ bottom: layers[keys[i]][0].layerBottom, top: layers[keys[i]][0].layerTop, packs: layers[keys[i]] })
    }

    for (let i = 0; i < layerArray.length; i++) {
        var totalVolume = 0;
        var totalWeight = 0;
        var minDensity = 10000;
        var maxDensity = 0;
        for (let j = 0; j < layerArray[i].packs.length; j++) {
            var currentPack = layerArray[i].packs[j];
            var currentVolume = currentPack.geometry.parameters.width * currentPack.geometry.parameters.depth * currentPack.geometry.parameters.height;
            var currentWeight = currentPack.weight;
            var currentDensity = currentWeight / currentVolume;
            totalVolume += currentVolume;
            totalWeight += currentWeight;
            if (minDensity > currentDensity)
                minDensity = currentDensity;
            if (maxDensity < currentDensity)
                maxDensity = currentDensity;
        }
        var totalDensity = totalWeight / totalVolume;
        if (minDensity < totalDensity * 0.7 || maxDensity > totalDensity * 1.3) {
            console.log("Incoherent density in layer: " + i)
        }
        layerArray[i].density = totalDensity;
    }

    layerArray.sort((a, b) => (a.bottom > b.bottom) ? 1 : (a.bottom === b.bottom) ? ((a.top > b.top) ? 1 : -1) : -1)
    console.log(layerArray)

    var currentLevel = 0;
    var currentDensity = 10000;
    for (let i = 0; i < layerArray.length; i++) {
        if (layerArray[i].density > currentDensity && layerArray[i].bottom > currentLevel) {
            console.log("Density in layer " + i + " is higher than in bottom layers");
        } else {
            currentDensity = layerArray[i].density;
        }
        currentLevel = layerArray[i].bottom;
    }
}

// RENDERING

render();


function render() {

    renderer.render(scene, cameraPersp);

    window.requestAnimationFrame(render);

}