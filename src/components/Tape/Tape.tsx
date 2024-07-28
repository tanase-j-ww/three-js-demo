import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { AnaglyphEffect } from "three/addons/effects/AnaglyphEffect.js";

export function Tape(): React.ReactElement {
  const tapeCanvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(new THREE.WebGLRenderer());
  useEffect(() => {
    if (!tapeCanvasRef.current) return;
    let container,
      camera: THREE.PerspectiveCamera,
      scene: THREE.Scene,
      effect: AnaglyphEffect;

    const spheres: THREE.Mesh[] = [];

    let mouseX = 0;
    let mouseY = 0;

    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    document.addEventListener("mousemove", onDocumentMouseMove);

    init();

    function init() {
      container = document.createElement("div");

      tapeCanvasRef.current!.appendChild(container);

      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.01,
        100,
      );
      camera.position.z = 3;

      const path = "textures/cube/pisa/";
      const format = ".png";
      const urls = [
        path + "px" + format,
        path + "nx" + format,
        path + "py" + format,
        path + "ny" + format,
        path + "pz" + format,
        path + "nz" + format,
      ];

      const textureCube = new THREE.CubeTextureLoader().load(urls);

      scene = new THREE.Scene();
      scene.background = textureCube;

      // Catmull-Romスプライン曲線の作成
      // 制御点の数
      const pointCount = 7;
      // 球面座標によりポイントを定義
      const points = new Array(pointCount).fill(0).map((_, index) => {
        // r: 半径, phi: 緯度角, theta: 経度角
        return new THREE.Vector3().setFromSphericalCoords(
          1,
          // Math.PI / 2,
          Math.random() * Math.PI * (2 / 3) + Math.PI / 6,
          (index / pointCount) * Math.PI * 2,
        );
      });

      const catmullRomCurve = new THREE.CatmullRomCurve3(points, false);

      // 曲線上の{segmentsCount}個の等間隔な点を取得し、ジオメトリに設定
      const segmentCount = 500;
      const linePoints = catmullRomCurve.getSpacedPoints(segmentCount);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMaterial = new THREE.LineBasicMaterial({ color: "yellow" });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      const frenetFrames = catmullRomCurve.computeFrenetFrames(
        segmentCount,
        true,
      );

      function buildRibbon(ribbonPoints: { x: number; y: number }[]) {
        const ribbonGeometry = new THREE.PlaneGeometry(1, 1, segmentCount, 1);
        // リボンの頂点
        const ribbonVertices: THREE.Vector3[] = [];
        let point = new THREE.Vector3();
        // 法線ベクトル
        const normal = new THREE.Vector3();
        // バイノーマルベクトル
        const binormal = new THREE.Vector3();
        ribbonPoints.forEach((ribbonPoint) => {
          for (let i = 0; i <= segmentCount; i++) {
            point = linePoints[i];
            // 指定されたxの値分法線ベクトルをスカラー倍
            normal.copy(frenetFrames.normals[i]).multiplyScalar(ribbonPoint.x);
            // 指定されたyの値分バイノーマルベクトルをスカラー倍
            binormal
              .copy(frenetFrames.binormals[i])
              .multiplyScalar(ribbonPoint.y);
            ribbonVertices.push(
              new THREE.Vector3().copy(point).add(normal).add(binormal),
            );
          }
        });
        ribbonGeometry.setFromPoints(ribbonVertices);
        return ribbonGeometry;
      }
      const ribbonGeometry = buildRibbon([
        { x: 0, y: 0.1 },
        { x: 0, y: -0.1 },
      ]);
      const ribbonMaterial = new THREE.MeshBasicMaterial({
        color: 0xf0f000,
        envMap: textureCube,
      });
      ribbonMaterial.userData.uniforms = { time: { value: 0 } };
      ribbonMaterial.defines = { USE_UV: "" };

      const mesh = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
      scene.add(mesh);
      spheres.push(mesh);
      // const clock = new THREE.Clock();

      // rendererRef.current.setAnimationLoop(() => {
      //   ribbonMaterial.userData.uniforms.time.value =
      //     clock.getElapsedTime() * 0.125;
      //   rendererRef.current.render(scene, camera);
      // });

      const geometry = new THREE.PlaneGeometry(0.1, 0.4);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        envMap: textureCube,
      });

      for (let i = 0; i < 500; i++) {
        const mesh = new THREE.Mesh(geometry, material);

        // mesh.position.x = Math.random() * 10 - 5;
        // mesh.position.y = Math.random() * 10 - 5;
        // mesh.position.z = Math.random() * 10 - 5;

        // mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;

        scene.add(mesh);

        spheres.push(mesh);
      }

      //

      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.setAnimationLoop(animate);
      container.appendChild(rendererRef.current.domElement);

      const width = window.innerWidth || 2;
      const height = window.innerHeight || 2;

      effect = new AnaglyphEffect(rendererRef.current);
      effect.setSize(width, height);

      //

      window.addEventListener("resize", onWindowResize);
    }

    function onWindowResize() {
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      effect.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event: MouseEvent) {
      mouseX = (event.clientX - windowHalfX) / 100;
      mouseY = (event.clientY - windowHalfY) / 100;
    }

    //

    function animate() {
      render();
    }

    function render() {
      const timer = 0.0001 * Date.now();

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;

      camera.lookAt(scene.position);

      for (let i = 0, il = spheres.length; i < il; i++) {
        const sphere = spheres[i];

        sphere.position.x = 5 * Math.cos(timer + i);
        sphere.position.y = 5 * Math.sin(timer + i * 1.1);
      }

      effect.render(scene, camera);
    }
  }, []);
  return (
    <>
      <div ref={tapeCanvasRef}></div>
    </>
  );
}
