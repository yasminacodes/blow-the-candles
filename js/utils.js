import * as THREE from 'three'

const cakeRadius = 5
const candleSpeed = 0.1
const blowSpeed = 0.2

document.addEventListener('DOMContentLoaded', () => {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, cakeRadius * 1.5, cakeRadius * 2);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    function animateParticles() {
        scene.traverse(function (object) {
            if (object.isPoints) {
                const positions = object.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += (Math.random() - 0.5) * 0.01;
                    positions[i + 2] += (Math.random() - 0.5) * 0.01;
                    if (positions[i + 1] > 2) {
                        positions[i + 1] -= 0.03;
                    } else {
                        positions[i + 1] += Math.random() * 0.02 - 0.01;
                    }

                    if (positions[i + 1] < 0.75) {
                        positions[i + 1] = 0.75;
                    }
                }
                object.geometry.attributes.position.needsUpdate = true;
            }
        })
    }

    let candlesAnimated = []
    function animateCandle(candle, min) {
        if (candle.position.y > min) {
            candle.position.y -= candleSpeed
            return true
        }
        return false
    }

    let candlesBlown = []
    function blowCandle(candle) {
        const particles = candle.children.find(child => child instanceof THREE.Points);
        const dynamicFlameLight = candle.children.find(child => child instanceof THREE.PointLight);

        dynamicFlameLight.intensity -= blowSpeed
        particles.position.z -= blowSpeed
        particles.material.opacity -= blowSpeed
        if (dynamicFlameLight.intensity <= 0) {
            let disappear = setTimeout(()=>{
                scene.remove(candle);
            }, 2000)
            return false
        }
        return true
    }

    function animate() {
        requestAnimationFrame(animate);

        animateParticles()

        if (candlesAnimated.length > 0) {
            const toRemove = []
            for (let i = 0; i < candlesAnimated.length; i++) {
                const res = animateCandle(candlesAnimated[i][0], candlesAnimated[i][1])
                if (res === false) {
                    toRemove.push(i)
                }
            }

            if (toRemove.length > 0) {
                for (let i = 0; i < toRemove.length; i++) {
                    candlesAnimated.slice(toRemove[i], 1)
                }
            }
        }

        if (candlesBlown.length > 0) {
            const toRemove = []
            for (let i = 0; i < candlesBlown.length; i++) {
                const res = blowCandle(candlesBlown[i])
                if (res === false) {
                    toRemove.push(i)
                }
            }

            if (toRemove.length > 0) {
                for (let i = 0; i < toRemove.length; i++) {
                    candlesBlown.slice(toRemove[i], 1)
                }
            }
        }

        renderer.render(scene, camera);
    }

    function getPastelColor() {
        const base = 200;

        const r = Math.floor(base + Math.random() * (256 - base));
        const g = Math.floor(base + Math.random() * (256 - base));
        const b = Math.floor(base + Math.random() * (256 - base));

        const hexR = r.toString(16).padStart(2, '0');
        const hexG = g.toString(16).padStart(2, '0');
        const hexB = b.toString(16).padStart(2, '0');

        return `#${hexR}${hexG}${hexB}`;
    }

    function createFire(num = 10, size = 0.3) {
        const particleCount = num;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        const particleColors = [];

        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * 0.3 - 0.15;
            const y = 0.75 + Math.random() * 0.1;
            const z = Math.random() * 0.3 - 0.15;
            particlePositions.push(x, y, z);

            const color = new THREE.Color(0xffcc00).lerp(new THREE.Color(0xff2200), Math.random());
            particleColors.push(color.r, color.g, color.b);
        }

        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(particleColors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        return particles
    }

    function createCandle() {
        const candleGeometry = new THREE.CylinderGeometry(0.1, 0.08, 1.5, 12)
        const candleColor = new THREE.Color(getPastelColor())
        const candleMaterial = new THREE.MeshPhongMaterial({
            color: candleColor,
            shininess: 60
        })
        const candle = new THREE.Mesh(candleGeometry, candleMaterial)

        const particles = createFire(10, 0.3)
        candle.add(particles);

        const dynamicFlameLight = new THREE.PointLight(0xff8000, 1.5, 3);
        dynamicFlameLight.position.set(0, 0, 0);
        candle.add(dynamicFlameLight);
        particles.dynamicFlameLight = dynamicFlameLight;

        return candle
    }

    const cakeCont = document.getElementById('cake')
    const candlesCounterCont = document.getElementById('candles-counter')

    renderer.setSize(window.innerWidth, window.innerHeight);
    cakeCont.appendChild(renderer.domElement);

    var light = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(light);

    var spotLight = new THREE.SpotLight(0xffffff)
    spotLight.position.set(0, -5, 15)
    spotLight.angle = Math.PI / 6
    spotLight.distance = 30
    spotLight.penumbra = 0.5
    spotLight.decay = 2
    spotLight.castShadow = true
    spotLight.target.position.set(0, 0, 0)
    scene.add(spotLight.target)
    scene.add(spotLight)

    const cakeGeometry = new THREE.CylinderGeometry(cakeRadius, cakeRadius - 0.2, cakeRadius, 32);

    const textureLoader = new THREE.TextureLoader()

    const cakeTopTextureLoader = textureLoader.load('../public/cake-topper.png')
    const cakeTopMaterial = new THREE.MeshPhongMaterial({
        map: cakeTopTextureLoader
    })
    const cakeBodyTextureLoader = textureLoader.load('../public/cake-body.png')
    const cakeBodyMaterial = new THREE.MeshPhongMaterial({
        map: cakeBodyTextureLoader
    })
    const cakeBottomTextureLoader = textureLoader.load('../public/cake-body.png')
    const cakeBottomMaterial = new THREE.MeshPhongMaterial({
        map: cakeBottomTextureLoader
    })

    const cakeMaterials = [
        cakeBodyMaterial,
        cakeTopMaterial,
        cakeBottomMaterial
    ]

    const cake = new THREE.Mesh(cakeGeometry, cakeMaterials)
    scene.add(cake)

    let candlesCounter = 0
    let candles = []
    cakeCont.addEventListener('click', () => {
        const radLimit = cakeRadius - 0.5

        const ang = Math.random() * Math.PI * 2
        const pos = Math.random() * radLimit
        const x = pos * Math.cos(ang)
        const z = pos * Math.sin(ang)



        const newCandle = createCandle()
        newCandle.position.set(x, cakeRadius + 5, z)

        candles.push(newCandle)
        candlesCounter += 1
        candlesCounterCont.innerText = candlesCounter

        candlesAnimated.push([newCandle, cakeRadius - cakeRadius / 3])

        scene.add(newCandle)
    })

    function extinguishRandomCandles() {
        if (candles.length > 0) {
            for (let i = 0; i < Math.min(3, candles.length); i++) {
                const candleIdx = Math.floor(Math.random() * candles.length)
                const candle = candles[candleIdx]
                extinguishCandle(candle)
                candles.splice(candleIdx, 1)
            }
        }
    }

    function extinguishCandle(candle) {
        candlesCounter -= 1
        candlesCounterCont.innerText = candlesCounter
        candlesBlown.push(candle)
    }

    let blowing = null
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(function (stream) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const microphone = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            microphone.connect(analyser);
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function detectWindSound() {
                analyser.getByteFrequencyData(dataArray);

                const relevantFrequencies = [100, 200, 300];
                let totalAmplitude = 0;
                for (const freq of relevantFrequencies) {
                    const index = Math.floor(freq / (audioContext.sampleRate / bufferLength));
                    totalAmplitude += dataArray[index];
                }
                const averageAmplitude = totalAmplitude / relevantFrequencies.length;
                if (averageAmplitude > 200) {
                    if (blowing === null) {
                        const maxTime = Math.floor(Math.random() * 500)
                        blowing = setTimeout(() => {
                            extinguishRandomCandles()
                            blowing = null
                        }, maxTime)
                    }
                } else {
                    clearInterval(blowing)
                    blowing = null
                }

                requestAnimationFrame(detectWindSound);
            }
            detectWindSound();
        })
        .catch(function (err) {
            console.log('Error al obtener el acceso al micrófono: ' + err);
        });

    animate()
})