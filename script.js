document.addEventListener('DOMContentLoaded', () => {
    const colorSchemes = {
        ocean: {
            main: { r: 14, g: 165, b: 233 },
            light: { r: 125, g: 211, b: 252 },
            dark: { r: 3, g: 105, b: 161 },
            glow: { r: 56, g: 189, b: 248 }
        },
        emerald: {
            main: { r: 52, g: 211, b: 153 },
            light: { r: 167, g: 243, b: 208 },
            dark: { r: 16, g: 185, b: 129 },
            glow: { r: 110, g: 231, b: 183 }
        },
        sunset: {
            main: { r: 251, g: 191, b: 36 },
            light: { r: 253, g: 230, b: 138 },
            dark: { r: 245, g: 158, b: 11 },
            glow: { r: 252, g: 211, b: 77 }
        }
    };

    class LiquidButton {
        constructor(element) {
            this.element = element;
            this.canvas = element.querySelector('.liquid-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            this.canvas.width = 300;
            this.canvas.height = 300;
            
            this.colorName = element.dataset.color || 'ocean';
            this.colors = colorSchemes[this.colorName];
            
            this.centerX = 150;
            this.centerY = 150;
            this.baseRadius = 75;
            
            this.mouseX = this.centerX;
            this.mouseY = this.centerY;
            this.isHovering = false;
            this.isNearEdge = false;
            
            this.dropX = this.centerX;
            this.dropY = this.centerY;
            this.dropRadius = 0;
            this.dropTargetRadius = 0;
            
            this.wobblePhase = Math.random() * Math.PI * 2;
            
            this.bounceOffset = { x: 0, y: 0 };
            this.bounceVelocity = { x: 0, y: 0 };
            
            this.points = [];
            this.numPoints = 40;
            this.initPoints();
            
            this.time = 0;
            this.setupEvents();
            this.animate();
        }
        
        initPoints() {
            for (let i = 0; i < this.numPoints; i++) {
                const angle = (i / this.numPoints) * Math.PI * 2;
                this.points.push({
                    baseAngle: angle,
                    offset: 0,
                    velocity: 0
                });
            }
        }
        
        setupEvents() {
            this.element.addEventListener('mouseenter', () => {
                this.isHovering = true;
            });
            
            this.element.addEventListener('mousemove', (e) => {
                const rect = this.element.getBoundingClientRect();
                this.mouseX = (e.clientX - rect.left) + 60;
                this.mouseY = (e.clientY - rect.top) + 60;
            });
            
            this.element.addEventListener('mouseleave', (e) => {
                if (this.isNearEdge && this.dropRadius > 10) {
                    const rect = this.element.getBoundingClientRect();
                    const exitX = (e.clientX - rect.left) + 60;
                    const exitY = (e.clientY - rect.top) + 60;
                    
                    const dx = this.centerX - exitX;
                    const dy = this.centerY - exitY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    this.bounceVelocity.x = (dx / dist) * 30;
                    this.bounceVelocity.y = (dy / dist) * 30;
                    
                    const impactAngle = Math.atan2(exitY - this.centerY, exitX - this.centerX);
                    this.points.forEach((point) => {
                        const angleDiff = Math.abs(point.baseAngle - impactAngle);
                        const impact = Math.cos(angleDiff) * 20;
                        point.velocity += impact;
                    });
                }
                
                this.isHovering = false;
                this.isNearEdge = false;
                this.dropTargetRadius = 0;
            });
            
            this.element.addEventListener('click', (e) => {
                const rect = this.element.getBoundingClientRect();
                const clickX = (e.clientX - rect.left) + 60;
                const clickY = (e.clientY - rect.top) + 60;
                const impactAngle = Math.atan2(clickY - this.centerY, clickX - this.centerX);
                
                this.points.forEach((point) => {
                    const angleDiff = point.baseAngle - impactAngle;
                    const impact = Math.cos(angleDiff) * 25;
                    point.velocity += impact;
                });
                
                this.bounceVelocity.x += Math.cos(impactAngle) * -10;
                this.bounceVelocity.y += Math.sin(impactAngle) * -10;
            });
        }
        
        update() {
            this.time += 0.03;
            
            this.bounceVelocity.x += -this.bounceOffset.x * 0.12;
            this.bounceVelocity.y += -this.bounceOffset.y * 0.12;
            this.bounceVelocity.x *= 0.88;
            this.bounceVelocity.y *= 0.88;
            this.bounceOffset.x += this.bounceVelocity.x;
            this.bounceOffset.y += this.bounceVelocity.y;
            
            if (this.isHovering) {
                const dx = this.mouseX - this.centerX;
                const dy = this.mouseY - this.centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const edgeThreshold = this.baseRadius * 0.4;
                
                if (dist > edgeThreshold) {
                    this.isNearEdge = true;
                    
                    const pullStrength = Math.min((dist - edgeThreshold) / (this.baseRadius * 0.7), 1);
                    this.dropTargetRadius = 18 + pullStrength * 35;
                    
                    const targetDropX = this.centerX + dx * (0.9 + pullStrength * 0.5);
                    const targetDropY = this.centerY + dy * (0.9 + pullStrength * 0.5);
                    
                    this.dropX += (targetDropX - this.dropX) * 0.25;
                    this.dropY += (targetDropY - this.dropY) * 0.25;
                    
                } else {
                    this.isNearEdge = false;
                    this.dropTargetRadius = 0;
                    this.dropX += (this.centerX - this.dropX) * 0.15;
                    this.dropY += (this.centerY - this.dropY) * 0.15;
                }
            } else {
                this.dropX += (this.centerX - this.dropX) * 0.2;
                this.dropY += (this.centerY - this.dropY) * 0.2;
            }
            
            this.dropRadius += (this.dropTargetRadius - this.dropRadius) * 0.18;
            
            const stiffness = 0.06;
            const damping = 0.82;
            
            this.points.forEach((point) => {
                let targetOffset = 0;
                
                targetOffset += Math.sin(this.time * 1.5 + point.baseAngle * 2) * 2;
                targetOffset += Math.cos(this.time * 2 + point.baseAngle * 3) * 1.5;
                targetOffset += Math.sin(this.time * 0.8 + point.baseAngle * 4) * 1;
                
                if (this.isNearEdge) {
                    const dx = this.dropX - this.centerX;
                    const dy = this.dropY - this.centerY;
                    const dropAngle = Math.atan2(dy, dx);
                    const angleDiff = point.baseAngle - dropAngle;
                    const pull = Math.cos(angleDiff);
                    
                    if (pull > 0) {
                        const dropDist = Math.sqrt(dx * dx + dy * dy);
                        targetOffset += pull * pull * dropDist * 0.4;
                    }
                }
                
                const force = (targetOffset - point.offset) * stiffness;
                point.velocity += force;
                point.velocity *= damping;
                point.offset += point.velocity;
            });
        }
        
        draw() {
            this.ctx.clearRect(0, 0, 300, 300);
            
            const cx = this.centerX + this.bounceOffset.x;
            const cy = this.centerY + this.bounceOffset.y;
            
            this.ctx.save();
            
            this.ctx.shadowColor = `rgba(${this.colors.glow.r}, ${this.colors.glow.g}, ${this.colors.glow.b}, 0.6)`;
            this.ctx.shadowBlur = 40;
            this.ctx.shadowOffsetY = 15;
            
            this.drawShape(cx, cy);
            
            this.ctx.restore();
            
            this.drawHighlights(cx, cy);
            this.drawReflections(cx, cy);
        }
        
        drawShape(cx, cy) {
            this.ctx.beginPath();
            
            const smoothPoints = [];
            for (let i = 0; i < this.numPoints; i++) {
                const point = this.points[i];
                const r = this.baseRadius + point.offset;
                smoothPoints.push({
                    x: cx + Math.cos(point.baseAngle) * r,
                    y: cy + Math.sin(point.baseAngle) * r
                });
            }
            
            this.ctx.moveTo(smoothPoints[0].x, smoothPoints[0].y);
            
            for (let i = 0; i < this.numPoints; i++) {
                const p0 = smoothPoints[(i - 1 + this.numPoints) % this.numPoints];
                const p1 = smoothPoints[i];
                const p2 = smoothPoints[(i + 1) % this.numPoints];
                const p3 = smoothPoints[(i + 2) % this.numPoints];
                
                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;
                
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
            
            this.ctx.closePath();
            
            const gradient = this.ctx.createRadialGradient(
                cx - 20, cy - 25, 0,
                cx, cy, this.baseRadius + 20
            );
            gradient.addColorStop(0, `rgba(${this.colors.light.r}, ${this.colors.light.g}, ${this.colors.light.b}, 1)`);
            gradient.addColorStop(0.4, `rgba(${this.colors.main.r}, ${this.colors.main.g}, ${this.colors.main.b}, 1)`);
            gradient.addColorStop(1, `rgba(${this.colors.dark.r}, ${this.colors.dark.g}, ${this.colors.dark.b}, 1)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            if (this.dropRadius > 5) {
                this.drawBridge(cx, cy);
                this.drawDrop();
            }
        }
        
        drawDrop() {
            const gradient = this.ctx.createRadialGradient(
                this.dropX - this.dropRadius * 0.3, 
                this.dropY - this.dropRadius * 0.3, 
                0,
                this.dropX, this.dropY, this.dropRadius
            );
            gradient.addColorStop(0, `rgba(${this.colors.light.r}, ${this.colors.light.g}, ${this.colors.light.b}, 1)`);
            gradient.addColorStop(0.5, `rgba(${this.colors.main.r}, ${this.colors.main.g}, ${this.colors.main.b}, 1)`);
            gradient.addColorStop(1, `rgba(${this.colors.dark.r}, ${this.colors.dark.g}, ${this.colors.dark.b}, 1)`);
            
            this.ctx.beginPath();
            this.ctx.arc(this.dropX, this.dropY, this.dropRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
        
        drawBridge(cx, cy) {
            const dx = this.dropX - cx;
            const dy = this.dropY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            const baseWidth = Math.max(12, 35 - dist * 0.15);
            const neckWidth = baseWidth * (0.3 + Math.max(0, 1 - dist / 80) * 0.4);
            
            const startR = this.baseRadius;
            const startX = cx + Math.cos(angle) * startR;
            const startY = cy + Math.sin(angle) * startR;
            
            const endX = this.dropX - Math.cos(angle) * this.dropRadius * 0.9;
            const endY = this.dropY - Math.sin(angle) * this.dropRadius * 0.9;
            
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            const perpAngle = angle + Math.PI / 2;
            
            const gradient = this.ctx.createLinearGradient(
                midX + Math.cos(perpAngle) * 20,
                midY + Math.sin(perpAngle) * 20,
                midX - Math.cos(perpAngle) * 20,
                midY - Math.sin(perpAngle) * 20
            );
            gradient.addColorStop(0, `rgba(${this.colors.dark.r}, ${this.colors.dark.g}, ${this.colors.dark.b}, 1)`);
            gradient.addColorStop(0.5, `rgba(${this.colors.main.r}, ${this.colors.main.g}, ${this.colors.main.b}, 1)`);
            gradient.addColorStop(1, `rgba(${this.colors.dark.r}, ${this.colors.dark.g}, ${this.colors.dark.b}, 1)`);
            
            this.ctx.beginPath();
            
            this.ctx.moveTo(
                startX + Math.cos(perpAngle) * baseWidth,
                startY + Math.sin(perpAngle) * baseWidth
            );
            
            this.ctx.bezierCurveTo(
                startX + Math.cos(angle) * dist * 0.3 + Math.cos(perpAngle) * neckWidth,
                startY + Math.sin(angle) * dist * 0.3 + Math.sin(perpAngle) * neckWidth,
                endX - Math.cos(angle) * dist * 0.3 + Math.cos(perpAngle) * neckWidth,
                endY - Math.sin(angle) * dist * 0.3 + Math.sin(perpAngle) * neckWidth,
                endX + Math.cos(perpAngle) * this.dropRadius * 0.7,
                endY + Math.sin(perpAngle) * this.dropRadius * 0.7
            );
            
            this.ctx.lineTo(
                endX - Math.cos(perpAngle) * this.dropRadius * 0.7,
                endY - Math.sin(perpAngle) * this.dropRadius * 0.7
            );
            
            this.ctx.bezierCurveTo(
                endX - Math.cos(angle) * dist * 0.3 - Math.cos(perpAngle) * neckWidth,
                endY - Math.sin(angle) * dist * 0.3 - Math.sin(perpAngle) * neckWidth,
                startX + Math.cos(angle) * dist * 0.3 - Math.cos(perpAngle) * neckWidth,
                startY + Math.sin(angle) * dist * 0.3 - Math.sin(perpAngle) * neckWidth,
                startX - Math.cos(perpAngle) * baseWidth,
                startY - Math.sin(perpAngle) * baseWidth
            );
            
            this.ctx.closePath();
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
        
        drawHighlights(cx, cy) {
            const highlight = this.ctx.createRadialGradient(
                cx - 22, cy - 28, 0,
                cx - 22, cy - 28, 45
            );
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
            highlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
            highlight.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = highlight;
            this.ctx.beginPath();
            this.ctx.ellipse(cx - 18, cy - 22, 40, 28, -0.4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.ellipse(cx - 30, cy - 35, 8, 5, -0.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (this.dropRadius > 12) {
                const dropHighlight = this.ctx.createRadialGradient(
                    this.dropX - this.dropRadius * 0.35,
                    this.dropY - this.dropRadius * 0.35,
                    0,
                    this.dropX,
                    this.dropY,
                    this.dropRadius
                );
                dropHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                dropHighlight.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
                dropHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.fillStyle = dropHighlight;
                this.ctx.beginPath();
                this.ctx.arc(this.dropX, this.dropY, this.dropRadius * 0.9, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.beginPath();
                this.ctx.ellipse(
                    this.dropX - this.dropRadius * 0.3,
                    this.dropY - this.dropRadius * 0.3,
                    this.dropRadius * 0.2,
                    this.dropRadius * 0.12,
                    -0.5,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        }
        
        drawReflections(cx, cy) {
            const rimLight = this.ctx.createRadialGradient(
                cx + 25, cy + 30, 0,
                cx + 25, cy + 30, 35
            );
            rimLight.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            rimLight.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
            rimLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = rimLight;
            this.ctx.beginPath();
            this.ctx.ellipse(cx + 22, cy + 28, 25, 18, 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        animate() {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }
    
    const liquidButtons = document.querySelectorAll('.realistic-liquid');
    liquidButtons.forEach(btn => new LiquidButton(btn));
});
