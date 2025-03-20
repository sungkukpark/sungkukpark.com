import * as THREE from 'three'

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x000000 );

// Object
const box = new THREE.BoxGeometry(1, 1, 1)
const mat = new THREE.MeshBasicMaterial({color: 0xff0000})
const mesh = new THREE.Mesh(box , mat)
scene.add(mesh)

// Camera
const sizes = {
    width: 800,
    height: 540
};
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 3;
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);