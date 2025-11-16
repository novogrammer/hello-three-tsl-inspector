import './style.scss';
import * as THREE from "three/webgpu";
import { color, convertToTexture, hue, pass, select, time, uv } from "three/tsl";
import { Inspector } from 'three/addons/inspector/Inspector.js';


async function mainAsync(){

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  const renderer = new THREE.WebGPURenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  const inspector = new Inspector();
  renderer.inspector = inspector;
  document.body.appendChild( renderer.domElement );
  // setAnimationLoopを使う場合init不要
  // await renderer.init();

  const postProcessing = new THREE.PostProcessing( renderer );
  const scenePass = pass( scene, camera ).toInspector( 'Color' );
  postProcessing.outputNode = scenePass;

  const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  const material = new THREE.MeshBasicNodeMaterial();
  const IS_DEBUG = true;
  const convertToTextureIf = (node:THREE.Node)=>{
    if(IS_DEBUG){
      return convertToTexture(node);
    }else{
      return node;
    }
  };
  {
    const whiteTexture = convertToTextureIf(color(0xffffff)).toInspector("whiteTexture");
    const fromCenter = uv().sub(0.5).length().toVar("fromCenter");
    const colorNode = hue(color(0x0000ff),time.mul(3).add(fromCenter.mul(10))).toVar("colorNode");
    const colorNodeWithAssert = select(fromCenter.greaterThan(0.5),color(0xff00ff),colorNode).toVar("colorNodeWithAssert");
    const colorTexture = convertToTextureIf(
      whiteTexture.mul(
        colorNodeWithAssert
      )
    ).toInspector("colorTexture");
    material.colorNode = colorTexture;
  }

  const cube = new THREE.Mesh( geometry, material );
  {
    const rawShader = await renderer.debug.getShaderAsync( scene, camera, cube );
    console.log(rawShader.fragmentShader);
  }
  scene.add( cube );

  camera.position.z = 5;

  function animate() {

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    postProcessing.render();

  }

  function onResize(){
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width,height);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize",()=>{
    onResize();
  });
  onResize();

}

mainAsync().catch(console.error);
