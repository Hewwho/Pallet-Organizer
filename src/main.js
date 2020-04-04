import { DragControls } from './three.js-master/examples/jsm/controls/DragControls.js';
import { OrbitControls } from './three.js-master/examples/jsm/controls/OrbitControls.js';


var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.autoClear = false;
document.getElementById( 'MainThreeJS' ).appendChild( renderer.domElement );

var scene = new THREE.Scene();

const centralPoint = new THREE.Vector3( 0, 0, 0 );


// GLOBAL ILLUMINATION

scene.add( new THREE.AmbientLight( 0xD9D9D9 ) );


// PALLET

const palletWidth = 20;
const palletHeight = 40;
const palletDepth = 1;
var pallet = new THREE.Mesh(
    new THREE.BoxGeometry( palletWidth, palletHeight, palletDepth ), 
    new THREE.MeshBasicMaterial( { color: 0x888888 } )
);
pallet.position.set( 0, - palletDepth / 2, 0 );
pallet.rotation.x = 90 * Math.PI / 180;
scene.add( pallet );

var palletFrame = new THREE.LineSegments(

    new THREE.EdgesGeometry( pallet.geometry ), 
    new THREE.LineBasicMaterial( { color: 0x303030, linewidth: 1 } )

);
pallet.add( palletFrame );


//USED FOR CHECKING WHETHER A PACKAGE IS PLACED WITHIN THE PALLET'S BOUNDARIES

function isPackageWithinPallet( obj ) {

    if( obj.position.x - obj.geometry.parameters.width / 2 >= centralPoint.x - pallet.geometry.parameters.width / 2   && 
        obj.position.x + obj.geometry.parameters.width / 2 <= centralPoint.x + pallet.geometry.parameters.width / 2   &&
        obj.position.z - obj.geometry.parameters.height / 2 >= centralPoint.z - pallet.geometry.parameters.height / 2 && 
        obj.position.z + obj.geometry.parameters.height / 2 <= centralPoint.z + pallet.geometry.parameters.height / 2
    ) {

        return true;
        
    }
    else {

        return false;

    }
}


// PACKAGES

var draggableObjects = [];

class Package extends THREE.Mesh {
    constructor( obj ) {
        super(
            new THREE.BoxGeometry( obj.width, obj.height, obj.depth ),
            new THREE.MeshPhongMaterial( { color: obj.color } )
        );
        
        this.originalPos = new THREE.Vector3( obj.posX, obj.posY, obj.posZ );
        this.lastPos = this.originalPos;

        this.weight = obj.weight;

        this.position.set( obj.posX, obj.posY, obj. posZ );
        this.rotation.x = 90 * Math.PI / 180;

        this.wasOnTheSidebar = false;

        scene.add( this );
        draggableObjects.push( this );

    }

    updateLastPos() {

        this.lastPos.copy( this.position );

    }

    backToLastPos() {

        this.position.copy( this.lastPos );

    }

    sidebarOrNot() {

        this.wasOnTheSidebar = ! this.wasOnTheSidebar;

    }
}

var package1 = new Package( {

    posX:   0,
    posY:   2,
    posZ:   0,
    width:  4,
    height: 4,
    depth:  4,
    color:  0xff0000,
    weight: 0

} );

var package2 = new Package( {

    posX:   4,
    posY:   1.5,
    posZ:   15,
    width:  6,
    height: 4,
    depth:  3,
    color:  0x0000ff,
    weight: 0

} );


//PERSPECTIVE CAMERA AND ITS CONTROLS

var sceneUI = new THREE.Scene();

var cameraPerp = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
scene.add( cameraPerp );

cameraPerp.position.set( 0, 40, 80 );
cameraPerp.lookAt( pallet.position );

var cameraPerpControls = new OrbitControls( cameraPerp, renderer.domElement );
cameraPerpControls.mouseButtons = {
	RIGHT: THREE.MOUSE.ROTATE
}


//SIDEBAR

var cameraOrth = new THREE.OrthographicCamera( -100, 100, 100, -100, -1, 0 );
cameraOrth.position.set( 0, 0, 0 );

var sidebarPoints = [];
const sidebarX = 65;
sidebarPoints.push( new THREE.Vector3( sidebarX, 100, 0 ) );
sidebarPoints.push( new THREE.Vector3( sidebarX, -100, 0 ) );

var sidebar = new THREE.Line(

    new THREE.BufferGeometry().setFromPoints( sidebarPoints ), 
    new THREE.LineDashedMaterial( {
        color: 0x404040, 
        linewidth: 1,
        scale: 0.5,
        dashSize: 1.5,
        gapSize: 2
    } )

);
sidebar.computeLineDistances();
sceneUI.add( sidebar );


//CURRENT MOUSE POSITION

var mouse = new THREE.Vector2();

function onMouseMove( event ) {

	mouse.x = (event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight ) * 2 + 1;
}
window.addEventListener( 'mousemove', onMouseMove );


//DRAG CONTROLS

var dragControls = new DragControls( draggableObjects, cameraPerp, renderer.domElement );

dragControls.addEventListener( 'hoveron', function( event ) {

    let pack = event.object;

    pack.material.emissive.set( 0x222222 );

} );

dragControls.addEventListener( 'hoveroff', function( event ) {

    let pack = event.object;

    pack.material.emissive.set( 0x000000 );

} );

dragControls.addEventListener( 'dragstart', function( event ) {

    let pack = event.object;

    if( pack.wasOnTheSidebar ) {
        
        //

    }
    else {

        //

    }
    
    
} );

dragControls.addEventListener( 'dragend', function ( event ) {
    
    let pack = event.object;

    if( mouse.x * 100 >= sidebarX ) {

        if( !pack.wasOnTheSidebar ) {

            // TEMPORARY WORKDAROUND
            cameraPerp.attach( pack );
            //

            pack.sidebarOrNot();

        }

        pack.updateLastPos();

    } else {

        if( pack.wasOnTheSidebar ) {

            // TEMPORARY WORKAROUND
            scene.add( pack );
            pack.position.z += cameraPerp.position.length();
            //

            if( isPackageWithinPallet( pack ) ) {

                //

                pack.updateLastPos();
                pack.sidebarOrNot();
                pack.rotation.copy(pallet.rotation);

            } else {

                pack.backToLastPos();

            }

        }
        else {

            if( isPackageWithinPallet( pack ) ) {

                //

                pack.updateLastPos();

            } else {

                pack.backToLastPos();

            }

        }
    }

} );


//RENDERING

render();

function render() {

    renderer.render( scene, cameraPerp );
    renderer.render( sceneUI, cameraOrth );

    window.requestAnimationFrame( render );

}