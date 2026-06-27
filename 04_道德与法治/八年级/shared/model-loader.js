/**
 * TeachAny 3D Model Loader
 * 基于 Three.js 的通用 3D 模型加载器
 * 用于生物细胞、地理地球仪等 3D 可视化
 */
class ModelLoader {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.width = options.width || this.container.clientWidth || 400;
        this.height = options.height || this.container.clientHeight || 400;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = options.background || new THREE.Color(0xf5f5f5);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 0, 10);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(5, 5, 5);
        this.scene.add(directional);
        
        // Controls (simple drag rotation)
        this.isDragging = false;
        this.prevX = 0;
        this.prevY = 0;
        this.rotationY = 0;
        this.rotationX = 0;
        
        const dom = this.renderer.domElement;
        dom.addEventListener('mousedown', (e) => { this.isDragging = true; this.prevX = e.clientX; this.prevY = e.clientY; });
        dom.addEventListener('mouseup', () => { this.isDragging = false; });
        dom.addEventListener('mouseleave', () => { this.isDragging = false; });
        dom.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            this.rotationY += (e.clientX - this.prevX) * 0.01;
            this.rotationX += (e.clientY - this.prevY) * 0.01;
            this.prevX = e.clientX;
            this.prevY = e.clientY;
        });
        
        // Touch support
        dom.addEventListener('touchstart', (e) => { this.isDragging = true; this.prevX = e.touches[0].clientX; this.prevY = e.touches[0].clientY; });
        dom.addEventListener('touchend', () => { this.isDragging = false; });
        dom.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            this.rotationY += (e.touches[0].clientX - this.prevX) * 0.01;
            this.rotationX += (e.touches[0].clientY - this.prevY) * 0.01;
            this.prevX = e.touches[0].clientX;
            this.prevY = e.touches[0].clientY;
            e.preventDefault();
        });
        
        // Zoom support
        dom.addEventListener('wheel', (e) => {
            this.camera.position.z = Math.max(3, Math.min(20, this.camera.position.z + e.deltaY * 0.01));
            e.preventDefault();
        });
        
        this.models = [];
        this.animate();
    }
    
    addMesh(mesh) {
        this.scene.add(mesh);
        this.models.push(mesh);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        for (const model of this.models) {
            if (!this.isDragging) {
                model.rotation.y += 0.005;
            } else {
                model.rotation.y = this.rotationY;
                model.rotation.x = this.rotationX;
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        this.renderer.dispose();
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModelLoader };
}
