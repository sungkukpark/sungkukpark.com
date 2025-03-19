import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
// scene.background = new THREE.Color( 0x000000 );
scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

// GLTF Loader
const loader = new GLTFLoader();

const loadedData = await loader.loadAsync('paimon.glb');
// console.log(loadedData);

const model = loadedData.scene.children[0];
const material = new THREE.MeshPhongMaterial({ color: 0xffffff })
model.traverse(function(child){
    if (child instanceof THREE.Mesh){
        child.material = material
    }
});
scene.add(model);

// Object
const ball = new THREE.SphereGeometry(0.1, 16, 8)
const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff })
const mesh = new THREE.Mesh(ball, boxMaterial)
mesh.position.x = -0.2
mesh.position.y = 0.1
scene.add(mesh)

// Camera
const sizes = {
    width: 800,
    height: 600
};
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height);
camera.position.y = 0.5;
camera.position.z = 1.5;
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
// renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(sizes.width, sizes.height);
document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop( animate );

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents( window ); // optional

controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 1;
controls.minDistance = 1;
controls.maxDistance = 1.5;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set( 0, 0.4, 0 );
controls.update();

const dirLight1 = new THREE.DirectionalLight( 0xffffff, 3 );
dirLight1.position.set( 1, 1, 1 );
scene.add( dirLight1 );

const dirLight2 = new THREE.DirectionalLight( 0x002288, 3 );
dirLight2.position.set( - 1, - 1, - 1 );
scene.add( dirLight2 );

const ambientLight = new THREE.AmbientLight( 0x555555 );
scene.add( ambientLight );

function animate() {
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    render();
}

function render() {
    renderer.render( scene, camera );
}